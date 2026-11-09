/**
 * Library: custom exercises, custom workouts and stored overrides of FBW A/B (same id, BR11).
 * Persisted under IndexedDB key "library" (exercises + workouts together, so cascading changes
 * such as deleting an exercise from all workouts are saved in one write).
 *
 * Built-in exercises/workouts live in code (domain/builtins.ts) and are merged in by selectors.
 */
import { create } from 'zustand';
import { removeItems } from '../domain/items';
import { persist } from 'zustand/middleware';
import { persistOptions } from '../data/db';
import {
  BUILTIN_EXERCISES,
  BUILTIN_EXERCISES_BY_ID,
  BUILTIN_PLANS,
  BUILTIN_WORKOUTS,
  builtinPlanDefaults,
  builtinWorkoutDefaults,
  isBuiltinId,
  isBuiltinPlanId,
  isBuiltinWorkoutId,
} from '../domain/builtins';
import { exerciseName, workoutName } from '../domain/format';
import type { Exercise, Plan, Target, Workout, WorkoutItem } from '../domain/types';
import { LIMITS, sanitizeLibrary } from '../domain/validation';
import type { LibraryData } from '../domain/validation';
import type { TFunction } from '../i18n/core';

export type { LibraryData };

/** Fields of a workout that can be patched (id/builtIn are fixed). */
export type WorkoutPatch = Partial<Omit<Workout, 'id' | 'builtIn'>>;

export interface LibraryState extends LibraryData {
  /** Upsert a CUSTOM exercise. Built-in ids are ignored (read-only, D18).
   *  If the target type changes (reps ↔ time), items using it get the new default target (D34). */
  saveExercise: (exercise: Exercise) => void;
  /** Delete a custom exercise and remove it from every workout in the same update (D33). */
  deleteExercise: (id: string) => void;
  /** Set a new default target of a custom exercise; all workout items using it get that target, sets unchanged (D34). */
  changeExerciseType: (id: string, newDefaultTarget: Target) => void;
  /** Duplicate any exercise as a custom one ("X (kopia)", BR10). Returns the new id. */
  duplicateExercise: (id: string, t: TFunction) => string | null;
  /** Upsert a workout. For FBW A/B ids this stores an override (builtIn stays true). */
  saveWorkout: (workout: Workout) => void;
  /** Patch a workout; for FBW A/B creates/updates the stored override (FR8, FR26). */
  updateWorkout: (id: string, patch: WorkoutPatch) => void;
  /** Delete a custom workout. Built-ins cannot be deleted (no-op). */
  deleteWorkout: (id: string) => void;
  /** Remove the stored override of FBW A/B ("Przywróć domyślne", BR11). */
  restoreBuiltin: (id: string) => void;
  /** Duplicate any workout as a custom one ("X (kopia)", BR10). Returns the new id. */
  duplicateWorkout: (id: string, t: TFunction) => string | null;
  /** Upsert a plan. For built-in plan ids this stores an override (builtIn stays true). */
  savePlan: (plan: Plan) => void;
  /** Delete a custom plan (built-ins: no-op). Its workouts stay. */
  deletePlan: (id: string) => void;
  /** Remove the stored override of a built-in plan. */
  restoreBuiltinPlan: (id: string) => void;
  /** Duplicate any plan as a custom one ("X (kopia)"). Returns the new id. */
  duplicatePlan: (id: string, t: TFunction) => string | null;
  /** A workout was finished: remember it as the last one in every plan that contains it. */
  recordWorkoutDone: (workoutId: string, at: number) => void;
}

// ---------- helpers ----------

export function newId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  return `id-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export function normalizeName(name: string): string {
  return name.trim().toLocaleLowerCase();
}

/**
 * Name for a duplicate (BR10): "X (kopia)", then "X (kopia 2)", "X (kopia 3)"…
 * Comparison is case-insensitive against `existingNames`.
 */
export function duplicateName(baseName: string, existingNames: readonly string[], suffixWord = 'kopia'): string {
  return duplicateNameWithin(baseName, existingNames, suffixWord, Number.POSITIVE_INFINITY);
}

/**
 * Like `duplicateName`, but the result never exceeds `maxLength`: the base name is shortened
 * so the "(kopia N)" suffix always fits (names are limited to 40/50 chars, FR22/D45).
 */
export function duplicateNameWithin(
  baseName: string,
  existingNames: readonly string[],
  suffixWord: string,
  maxLength: number,
): string {
  const taken = new Set(existingNames.map(normalizeName));
  const base = baseName.trim();
  for (let n = 1; ; n++) {
    const suffix = n === 1 ? ` (${suffixWord})` : ` (${suffixWord} ${n})`;
    const room = maxLength - suffix.length;
    const head = base.length > room ? base.slice(0, Math.max(0, room)).trimEnd() : base;
    const candidate = `${head}${suffix}`.trim();
    if (!taken.has(normalizeName(candidate))) return candidate;
  }
}

/** New workout item using the exercise defaults. */
export function itemFromExercise(ex: Exercise): WorkoutItem {
  return {
    exerciseId: ex.id,
    sets: ex.defaultSets,
    target: { ...ex.defaultTarget },
  };
}

function cloneTarget(t: Target): Target {
  return { ...t };
}

function cloneWorkout(w: Workout): Workout {
  return {
    ...w,
    rest: {
      straight: { ...w.rest.straight },
      circuit: { ...w.rest.circuit },
      betweenSidesSec: w.rest.betweenSidesSec,
    },
    items: w.items.map((i) => ({ ...i, target: cloneTarget(i.target) })),
  };
}

function replaceItemTargets(workouts: Workout[], exerciseId: string, target: Target): Workout[] {
  return workouts.map((w) =>
    w.items.some((i) => i.exerciseId === exerciseId)
      ? {
          ...w,
          items: w.items.map((i) => (i.exerciseId === exerciseId ? { ...i, target: cloneTarget(target) } : i)),
        }
      : w,
  );
}

function upsert<T extends { id: string }>(list: T[], value: T): T[] {
  const idx = list.findIndex((x) => x.id === value.id);
  if (idx === -1) return [...list, value];
  const copy = list.slice();
  copy[idx] = value;
  return copy;
}

// ---------- store ----------

const EMPTY: LibraryData = {
  exercises: [],
  workouts: [],
  plans: [],
  planLast: {},
};

export const useLibrary = create<LibraryState>()(
  persist(
    (set, get) => ({
      ...EMPTY,

      saveExercise: (exercise) => {
        if (isBuiltinId(exercise.id)) return;
        set((s) => {
          const prev = s.exercises.find((e) => e.id === exercise.id);
          const next: Exercise = {
            ...exercise,
            builtIn: false,
            defaultTarget: cloneTarget(exercise.defaultTarget),
          };
          const typeChanged = prev !== undefined && prev.defaultTarget.type !== next.defaultTarget.type;
          return {
            exercises: upsert(s.exercises, next),
            workouts: typeChanged ? replaceItemTargets(s.workouts, next.id, next.defaultTarget) : s.workouts,
          };
        });
      },

      deleteExercise: (id) => {
        if (isBuiltinId(id)) return;
        set((s) => ({
          exercises: s.exercises.filter((e) => e.id !== id),
          workouts: s.workouts.map((w) =>
            w.items.some((i) => i.exerciseId === id)
              ? {
                  ...w,
                  items: removeItems(w.items, (i) => i.exerciseId === id),
                }
              : w,
          ),
        }));
      },

      changeExerciseType: (id, newDefaultTarget) => {
        if (isBuiltinId(id)) return;
        set((s) => {
          const prev = s.exercises.find((e) => e.id === id);
          if (!prev) return s;
          return {
            exercises: upsert(s.exercises, {
              ...prev,
              defaultTarget: cloneTarget(newDefaultTarget),
            }),
            workouts: replaceItemTargets(s.workouts, id, newDefaultTarget),
          };
        });
      },

      duplicateExercise: (id, t) => {
        const src = getExercise(id, get());
        if (!src) return null;
        const names = get().exercises.map((e) => e.name ?? '');
        const copy: Exercise = {
          id: newId(),
          builtIn: false,
          name: duplicateNameWithin(exerciseName(src, t), names, t('common.copySuffix'), LIMITS.exerciseNameMax),
          category: src.category,
          unilateral: src.unilateral,
          defaultSets: src.defaultSets,
          defaultTarget: cloneTarget(src.defaultTarget),
        };
        set((s) => ({ exercises: [...s.exercises, copy] }));
        return copy.id;
      },

      saveWorkout: (workout) => {
        const builtIn = isBuiltinWorkoutId(workout.id);
        const next = cloneWorkout({ ...workout, builtIn });
        if (!builtIn) delete next.nameKey;
        set((s) => ({ workouts: upsert(s.workouts, next) }));
      },

      updateWorkout: (id, patch) => {
        const base = getWorkout(id, get());
        if (!base) return;
        const builtIn = isBuiltinWorkoutId(id);
        const next = cloneWorkout({ ...base, ...patch, id, builtIn });
        set((s) => ({ workouts: upsert(s.workouts, next) }));
      },

      deleteWorkout: (id) => {
        if (isBuiltinWorkoutId(id)) return;
        set((s) => {
          // Plans only reference workouts: drop the id from every plan that has it. A built-in plan
          // gets an override only if it actually referenced the workout (i.e. it was edited before).
          const plans = getAllPlans(s)
            .filter((pl) => pl.workoutIds.includes(id))
            .reduce(
              (acc, pl) =>
                upsert(acc, {
                  ...pl,
                  workoutIds: pl.workoutIds.filter((w) => w !== id),
                }),
              s.plans,
            );
          return { workouts: s.workouts.filter((w) => w.id !== id), plans };
        });
      },

      restoreBuiltin: (id) => {
        if (!isBuiltinWorkoutId(id)) return;
        set((s) => ({ workouts: s.workouts.filter((w) => w.id !== id) }));
      },

      duplicateWorkout: (id, t) => {
        const src = getWorkout(id, get());
        if (!src) return null;
        const names = getAllWorkouts(get())
          .filter((w) => !w.builtIn)
          .map((w) => w.name ?? '');
        const copy = cloneWorkout({
          ...src,
          id: newId(),
          builtIn: false,
          name: duplicateNameWithin(workoutName(src, t), names, t('common.copySuffix'), LIMITS.workoutNameMax),
        });
        delete copy.nameKey;
        set((s) => ({ workouts: [...s.workouts, copy] }));
        return copy.id;
      },

      savePlan: (plan) => {
        const builtIn = isBuiltinPlanId(plan.id);
        const next: Plan = {
          ...plan,
          builtIn,
          workoutIds: [...plan.workoutIds],
        };
        if (!builtIn) delete next.nameKey;
        set((s) => ({ plans: upsert(s.plans, next) }));
      },

      deletePlan: (id) => {
        if (isBuiltinPlanId(id)) return;
        set((s) => {
          const { [id]: _drop, ...planLast } = s.planLast;
          return { plans: s.plans.filter((p) => p.id !== id), planLast };
        });
      },

      restoreBuiltinPlan: (id) => {
        if (!isBuiltinPlanId(id)) return;
        set((s) => ({ plans: s.plans.filter((p) => p.id !== id) }));
      },

      duplicatePlan: (id, t) => {
        const src = getPlan(id, get());
        if (!src) return null;
        const names = get()
          .plans.filter((p) => !isBuiltinPlanId(p.id))
          .map((p) => p.name ?? '');
        const copy: Plan = {
          id: newId(),
          builtIn: false,
          name: duplicateNameWithin(planName(src, t), names, t('common.copySuffix'), LIMITS.planNameMax),
          workoutIds: [...src.workoutIds],
        };
        set((s) => ({ plans: [...s.plans, copy] }));
        return copy.id;
      },

      recordWorkoutDone: (workoutId, at) => {
        set((s) => {
          const planLast = { ...s.planLast };
          for (const pl of getAllPlans(s)) if (pl.workoutIds.includes(workoutId)) planLast[pl.id] = { workoutId, at };
          return { planLast };
        });
      },
    }),
    persistOptions<LibraryState, LibraryData>('library', {
      partialize: (s) => ({
        exercises: s.exercises,
        workouts: s.workouts,
        plans: s.plans,
        planLast: s.planLast,
      }),
      sanitize: sanitizeLibrary,
    }),
  ),
);

// ---------- selectors (memoised, safe to use directly with useLibrary(selector)) ----------

type LibSlice = Pick<LibraryData, 'exercises' | 'workouts' | 'plans' | 'planLast'>;
const current = (): LibSlice => useLibrary.getState();

let exCache: {
  src: Exercise[];
  all: Exercise[];
  byId: Record<string, Exercise>;
} | null = null;
function exerciseCache(s: LibSlice) {
  if (!exCache || exCache.src !== s.exercises) {
    const all = [...BUILTIN_EXERCISES, ...s.exercises];
    exCache = {
      src: s.exercises,
      all,
      byId: Object.fromEntries(all.map((e) => [e.id, e])),
    };
  }
  return exCache;
}

let wCache: { src: Workout[]; all: Workout[] } | null = null;

/** Built-in exercises followed by custom ones. Stable reference while data is unchanged. */
export function getAllExercises(s: LibSlice = current()): Exercise[] {
  return exerciseCache(s).all;
}

export function getExercisesById(s: LibSlice = current()): Record<string, Exercise> {
  return exerciseCache(s).byId;
}

export function getExercise(id: string, s: LibSlice = current()): Exercise | undefined {
  return BUILTIN_EXERCISES_BY_ID[id] ?? s.exercises.find((e) => e.id === id);
}

/** FBW A/B (override if stored) followed by custom workouts. Stable reference while data is unchanged. */
export function getAllWorkouts(s: LibSlice = current()): Workout[] {
  if (!wCache || wCache.src !== s.workouts) {
    const overrides = new Map(s.workouts.filter((w) => isBuiltinWorkoutId(w.id)).map((w) => [w.id, w]));
    const builtins = BUILTIN_WORKOUTS.map((b) => overrides.get(b.id) ?? b);
    const custom = s.workouts.filter((w) => !isBuiltinWorkoutId(w.id));
    wCache = { src: s.workouts, all: [...builtins, ...custom] };
  }
  return wCache.all;
}

export function getWorkout(id: string, s: LibSlice = current()): Workout | undefined {
  return getAllWorkouts(s).find((w) => w.id === id);
}

/** True when FBW A/B has a stored (modified) version. */
export function isBuiltinOverridden(id: string, s: LibSlice = current()): boolean {
  return isBuiltinWorkoutId(id) && s.workouts.some((w) => w.id === id);
}

/** Exercises referenced by the workout (unique, in item order; unknown ids skipped). */
export function getWorkoutExercises(workout: Workout, s: LibSlice = current()): Exercise[] {
  const byId = getExercisesById(s);
  const seen = new Set<string>();
  const out: Exercise[] = [];
  for (const item of workout.items) {
    const ex = byId[item.exerciseId];
    if (ex && !seen.has(ex.id)) {
      seen.add(ex.id);
      out.push(ex);
    }
  }
  return out;
}

/** Workouts (incl. FBW A/B overrides) that contain the exercise — for confirm dialogs (FR23). */
export function workoutsUsingExercise(exerciseId: string, s: LibSlice = current()): Workout[] {
  return getAllWorkouts(s).filter((w) => w.items.some((i) => i.exerciseId === exerciseId));
}

/** Case-insensitive uniqueness among CUSTOM exercises (FR22). */
export function isExerciseNameTaken(name: string, exceptId?: string, s: LibSlice = current()): boolean {
  const n = normalizeName(name);
  return s.exercises.some((e) => e.id !== exceptId && normalizeName(e.name ?? '') === n);
}

/** Case-insensitive uniqueness among CUSTOM workouts (D45). */
export function isWorkoutNameTaken(name: string, exceptId?: string, s: LibSlice = current()): boolean {
  const n = normalizeName(name);
  return s.workouts.some((w) => !isBuiltinWorkoutId(w.id) && w.id !== exceptId && normalizeName(w.name ?? '') === n);
}

/** Fresh default copy of FBW A/B (for "restore defaults" previews). */
export function getBuiltinDefault(id: string): Workout | undefined {
  return builtinWorkoutDefaults().find((w) => w.id === id);
}

// ---------- plans ----------

let pCache: { src: Plan[]; all: Plan[] } | null = null;

/** Built-in plans (override if stored) followed by custom plans. Stable reference while data is unchanged. */
export function getAllPlans(s: Pick<LibSlice, 'plans'> = current()): Plan[] {
  if (!pCache || pCache.src !== s.plans) {
    const overrides = new Map(s.plans.filter((p) => isBuiltinPlanId(p.id)).map((p) => [p.id, p]));
    const builtins = BUILTIN_PLANS.map((b) => overrides.get(b.id) ?? b);
    const custom = s.plans.filter((p) => !isBuiltinPlanId(p.id));
    pCache = { src: s.plans, all: [...builtins, ...custom] };
  }
  return pCache.all;
}

export function getPlan(id: string, s: Pick<LibSlice, 'plans'> = current()): Plan | undefined {
  return getAllPlans(s).find((p) => p.id === id);
}

export function isBuiltinPlanOverridden(id: string, s: LibSlice = current()): boolean {
  return isBuiltinPlanId(id) && s.plans.some((p) => p.id === id);
}

export function getBuiltinPlanDefault(id: string): Plan | undefined {
  return builtinPlanDefaults().find((p) => p.id === id);
}

/** Display name: user-changed name wins, then translated built-in name. */
export function planName(p: Pick<Plan, 'name' | 'nameKey' | 'id'>, t: TFunction): string {
  if (p.name) return p.name;
  return p.nameKey ? t(p.nameKey) : p.id;
}

/** Existing workouts of a plan, in plan order (deleted / unknown ids skipped). */
export function getPlanWorkouts(plan: Plan, s: LibSlice = current()): Workout[] {
  return plan.workoutIds.map((id) => getWorkout(id, s)).filter((w): w is Workout => w !== undefined);
}

/**
 * Suggested next workout of a plan: the one after the last finished workout (wrapping around);
 * the first one when nothing was finished yet or the last one is no longer in the plan.
 * Workouts without exercises are skipped. Undefined when the plan has no startable workout.
 */
export function nextPlanWorkoutId(plan: Plan, s: LibSlice = current()): string | undefined {
  const ids = getPlanWorkouts(plan, s)
    .filter((w) => w.items.length > 0)
    .map((w) => w.id);
  if (ids.length === 0) return undefined;
  const last = s.planLast[plan.id]?.workoutId;
  const i = last ? ids.indexOf(last) : -1;
  return ids[(i + 1) % ids.length];
}

/** Workouts that are not part of any plan ("single workouts" on the start screen). */
export function getLooseWorkouts(s: LibSlice = current()): Workout[] {
  const inPlans = new Set(getAllPlans(s).flatMap((p) => p.workoutIds));
  return getAllWorkouts(s).filter((w) => !inPlans.has(w.id));
}

/** Case-insensitive uniqueness among CUSTOM plans. */
export function isPlanNameTaken(name: string, exceptId?: string, s: LibSlice = current()): boolean {
  const n = normalizeName(name);
  return s.plans.some((p) => !isBuiltinPlanId(p.id) && p.id !== exceptId && normalizeName(p.name ?? '') === n);
}

/** Plans (incl. built-ins) that contain the workout — for confirm dialogs. */
export function plansUsingWorkout(workoutId: string, s: LibSlice = current()): Plan[] {
  return getAllPlans(s).filter((p) => p.workoutIds.includes(workoutId));
}

// ---------- hooks ----------

export const useAllPlans = (): Plan[] => useLibrary(getAllPlans);
export const usePlan = (id: string | undefined): Plan | undefined =>
  useLibrary((s) => (id ? getPlan(id, s) : undefined));

export const useAllWorkouts = (): Workout[] => useLibrary(getAllWorkouts);
export const useWorkout = (id: string | undefined): Workout | undefined =>
  useLibrary((s) => (id ? getWorkout(id, s) : undefined));
export const useAllExercises = (): Exercise[] => useLibrary(getAllExercises);
export const useExercisesById = (): Record<string, Exercise> => useLibrary(getExercisesById);
export const useExercise = (id: string | undefined): Exercise | undefined =>
  useLibrary((s) => (id ? getExercise(id, s) : undefined));
