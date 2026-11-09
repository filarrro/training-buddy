/**
 * Hand-written validation (no zod — bundle budget). Used when reading persisted data
 * (corrupt data → dropped / defaults, never a crash) and by forms (limits + error codes).
 */
import { CATEGORY_IDS } from './types';
import type { Category, Exercise, Lang, RestSettings, Settings, Target, Workout, WorkoutItem, WorkoutMode, Plan, PlanLast } from './types';
import { DEFAULT_REST } from './builtins';

export const LIMITS = {
  repsMin: 1,
  repsMax: 100,
  timeMinSec: 5,
  timeMaxSec: 600,
  setsMin: 1,
  setsMax: 10,
  restMinSec: 0,
  restMaxSec: 600,
  exerciseNameMax: 50,
  workoutNameMax: 40,
  planNameMax: 40,
} as const;

type Obj = Record<string, unknown>;

const isObj = (x: unknown): x is Obj => typeof x === 'object' && x !== null && !Array.isArray(x);
const isInt = (x: unknown): x is number => typeof x === 'number' && Number.isInteger(x);
const inRange = (x: unknown, min: number, max: number): x is number => isInt(x) && x >= min && x <= max;
const isNonEmptyString = (x: unknown): x is string => typeof x === 'string' && x.trim().length > 0;

export function isCategory(x: unknown): x is Category {
  return typeof x === 'string' && (CATEGORY_IDS as readonly string[]).includes(x);
}

export function isLang(x: unknown): x is Lang {
  return x === 'pl' || x === 'en';
}

export type TargetError = 'repsMin' | 'repsMax' | 'repsOrder' | 'timeMin' | 'timeMax' | 'timeOrder' | 'timeTarget';

/** Form-level validation of a target (FR22, D41). Empty array = valid. */
export function validateTarget(target: Target): TargetError[] {
  const errors: TargetError[] = [];
  if (target.type === 'reps') {
    if (!inRange(target.min, LIMITS.repsMin, LIMITS.repsMax)) errors.push('repsMin');
    if (!inRange(target.max, LIMITS.repsMin, LIMITS.repsMax)) errors.push('repsMax');
    if (isInt(target.min) && isInt(target.max) && target.max < target.min) errors.push('repsOrder');
  } else {
    if (!inRange(target.minSec, LIMITS.timeMinSec, LIMITS.timeMaxSec)) errors.push('timeMin');
    if (!inRange(target.maxSec, LIMITS.timeMinSec, LIMITS.timeMaxSec)) errors.push('timeMax');
    if (isInt(target.minSec) && isInt(target.maxSec) && target.maxSec < target.minSec) errors.push('timeOrder');
    if (!isInt(target.targetSec) || target.targetSec < target.minSec || target.targetSec > target.maxSec)
      errors.push('timeTarget');
  }
  return errors;
}

export function sanitizeTarget(x: unknown): Target | null {
  if (!isObj(x)) return null;
  let t: Target;
  if (x.type === 'reps') t = { type: 'reps', min: x.min as number, max: x.max as number };
  else if (x.type === 'time')
    t = {
      type: 'time',
      minSec: x.minSec as number,
      maxSec: x.maxSec as number,
      targetSec: x.targetSec as number,
    };
  else return null;
  return validateTarget(t).length === 0 ? t : null;
}

export function sanitizeExercise(x: unknown): Exercise | null {
  if (!isObj(x)) return null;
  if (!isNonEmptyString(x.id) || !isCategory(x.category)) return null;
  const defaultTarget = sanitizeTarget(x.defaultTarget);
  if (!defaultTarget) return null;
  if (!inRange(x.defaultSets, LIMITS.setsMin, LIMITS.setsMax)) return null;
  const name = isNonEmptyString(x.name) ? x.name : undefined;
  const nameKey = isNonEmptyString(x.nameKey) ? x.nameKey : undefined;
  if (!name && !nameKey) return null;
  return {
    id: x.id,
    builtIn: x.builtIn === true,
    ...(nameKey ? { nameKey } : {}),
    ...(name ? { name } : {}),
    category: x.category,
    unilateral: x.unilateral === true,
    defaultSets: x.defaultSets,
    defaultTarget,
  };
}

function restValue(x: unknown, fallback: number): number {
  return inRange(x, LIMITS.restMinSec, LIMITS.restMaxSec) ? x : fallback;
}

export function sanitizeRest(x: unknown): RestSettings {
  const o = isObj(x) ? x : {};
  const s = isObj(o.straight) ? o.straight : {};
  const c = isObj(o.circuit) ? o.circuit : {};
  return {
    straight: {
      betweenSetsSec: restValue(s.betweenSetsSec, DEFAULT_REST.straight.betweenSetsSec),
      betweenExercisesSec: restValue(s.betweenExercisesSec, DEFAULT_REST.straight.betweenExercisesSec),
    },
    circuit: {
      betweenExercisesSec: restValue(c.betweenExercisesSec, DEFAULT_REST.circuit.betweenExercisesSec),
      betweenRoundsSec: restValue(c.betweenRoundsSec, DEFAULT_REST.circuit.betweenRoundsSec),
    },
    betweenSidesSec: restValue(o.betweenSidesSec, DEFAULT_REST.betweenSidesSec),
  };
}

export function sanitizeWorkoutItem(x: unknown): WorkoutItem | null {
  if (!isObj(x) || !isNonEmptyString(x.exerciseId)) return null;
  if (!inRange(x.sets, LIMITS.setsMin, LIMITS.setsMax)) return null;
  const target = sanitizeTarget(x.target);
  if (!target) return null;
  const restSec = inRange(x.restSec, LIMITS.restMinSec, LIMITS.restMaxSec) ? x.restSec : undefined;
  const noteKey = isNoteKey(x.noteKey) ? x.noteKey : undefined;
  return {
    exerciseId: x.exerciseId,
    sets: x.sets,
    target,
    ...(restSec !== undefined ? { restSec } : {}),
    ...(x.linkNext === true ? { linkNext: true } : {}),
    ...(noteKey ? { noteKey } : {}),
  };
}

/** Notes are i18n keys of built-in coaching notes only. */
function isNoteKey(x: unknown): x is string {
  return typeof x === 'string' && x.startsWith('common.note.');
}

/** A link on the last item has no partner: drop it. */
export function normalizeLinks<T extends { linkNext?: boolean }>(items: T[]): T[] {
  const last = items[items.length - 1];
  if (!last?.linkNext) return items;
  const { linkNext: _drop, ...rest } = last;
  return [...items.slice(0, -1), rest as T];
}

export function sanitizeWorkout(x: unknown): Workout | null {
  if (!isObj(x) || !isNonEmptyString(x.id)) return null;
  const name = isNonEmptyString(x.name) ? x.name : undefined;
  const nameKey = isNonEmptyString(x.nameKey) ? x.nameKey : undefined;
  if (!name && !nameKey) return null;
  const mode: WorkoutMode = x.mode === 'circuit' ? 'circuit' : 'straight';
  const items = Array.isArray(x.items)
    ? x.items.map(sanitizeWorkoutItem).filter((i): i is WorkoutItem => i !== null)
    : [];
  return {
    id: x.id,
    builtIn: x.builtIn === true,
    ...(nameKey ? { nameKey } : {}),
    ...(name ? { name } : {}),
    mode,
    rest: sanitizeRest(x.rest),
    items: normalizeLinks(items),
    ...(isNoteKey(x.noteKey) ? { noteKey: x.noteKey } : {}),
  };
}

function uniqueById<T extends { id: string }>(xs: T[]): T[] {
  const seen = new Set<string>();
  return xs.filter((x) => (seen.has(x.id) ? false : (seen.add(x.id), true)));
}

export interface LibraryData {
  /** custom exercises only (built-ins live in code) */
  exercises: Exercise[];
  /** custom workouts + stored overrides of built-in workouts (same id) */
  workouts: Workout[];
  /** custom plans + stored overrides of built-in plans (same id) */
  plans: Plan[];
  /** last workout finished from each plan ("next" hint) */
  planLast: PlanLast;
}

export function sanitizePlan(x: unknown): Plan | null {
  if (!isObj(x) || !isNonEmptyString(x.id)) return null;
  const name = isNonEmptyString(x.name) ? x.name : undefined;
  const nameKey = isNonEmptyString(x.nameKey) ? x.nameKey : undefined;
  if (!name && !nameKey) return null;
  const workoutIds = Array.isArray(x.workoutIds) ? x.workoutIds.filter(isNonEmptyString) : [];
  return {
    id: x.id,
    builtIn: x.builtIn === true,
    ...(nameKey ? { nameKey } : {}),
    ...(name ? { name } : {}),
    workoutIds,
    ...(isNoteKey(x.noteKey) ? { noteKey: x.noteKey } : {}),
  };
}

function sanitizePlanLast(x: unknown): PlanLast {
  const out: PlanLast = {};
  if (!isObj(x)) return out;
  for (const [planId, v] of Object.entries(x)) {
    if (isObj(v) && isNonEmptyString(v.workoutId) && typeof v.at === 'number' && Number.isFinite(v.at)) {
      out[planId] = { workoutId: v.workoutId, at: v.at };
    }
  }
  return out;
}

/** Drops invalid entries; never throws. */
export function sanitizeLibrary(x: unknown): LibraryData {
  const o = isObj(x) ? x : {};
  const exercises = Array.isArray(o.exercises)
    ? uniqueById(
        o.exercises
          .map(sanitizeExercise)
          .filter((e): e is Exercise => e !== null && !e.id.startsWith('builtin:'))
          .map((e) => ({ ...e, builtIn: false })),
      )
    : [];
  const workouts = Array.isArray(o.workouts)
    ? uniqueById(o.workouts.map(sanitizeWorkout).filter((w): w is Workout => w !== null))
    : [];
  const plans = Array.isArray(o.plans)
    ? uniqueById(o.plans.map(sanitizePlan).filter((pl): pl is Plan => pl !== null))
    : [];
  return { exercises, workouts, plans, planLast: sanitizePlanLast(o.planLast) };
}

/** Per-field fallback to defaults. */
export function sanitizeSettings(x: unknown, defaults: Settings): Settings {
  const o = isObj(x) ? x : {};
  const bool = (v: unknown, d: boolean) => (typeof v === 'boolean' ? v : d);
  return {
    lang: isLang(o.lang) ? o.lang : defaults.lang,
    theme: o.theme === 'light' || o.theme === 'dark' || o.theme === 'system' ? o.theme : defaults.theme,
    sound: bool(o.sound, defaults.sound),
    countdownBeeps: bool(o.countdownBeeps, defaults.countdownBeeps),
    vibration: bool(o.vibration, defaults.vibration),
    keepScreenOn: bool(o.keepScreenOn, defaults.keepScreenOn),
  };
}

/** Pick only boolean fields listed in defaults. */
export function sanitizeFlags<T extends { [K in keyof T]: boolean }>(x: unknown, defaults: T): T {
  const o = isObj(x) ? x : {};
  const out = { ...defaults };
  for (const k of Object.keys(defaults) as (keyof T)[]) {
    const v = o[k as string];
    if (typeof v === 'boolean') out[k] = v as T[keyof T];
  }
  return out;
}

/** Trimmed name length check for forms. */
export function isValidName(name: string, max: number): boolean {
  const n = name.trim();
  return n.length >= 1 && n.length <= max;
}
