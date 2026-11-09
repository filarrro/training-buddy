/**
 * Pure form logic of the configurator (no React): drafts hold raw input strings so the user can
 * clear a field and type freely; parsing + validation turn drafts into domain objects.
 */
import { defaultRest, isBuiltinWorkoutId } from '../../domain/builtins';
import type { Category, Exercise, Target, TargetType, Workout, WorkoutItem, WorkoutMode } from '../../domain/types';
import { LIMITS, normalizeLinks, validateTarget } from '../../domain/validation';
import type { TargetError } from '../../domain/validation';

// ---------- target ----------

export interface TargetDraft {
  type: TargetType;
  /** reps */
  min: string;
  max: string;
  /** time */
  minSec: string;
  maxSec: string;
  targetSec: string;
}

/** Defaults used when switching an exercise to a type it never had. */
export const DEFAULT_REPS = { min: 8, max: 12 } as const;
export const DEFAULT_TIME = { minSec: 30, maxSec: 60 } as const;

export function draftFromTarget(target: Target): TargetDraft {
  if (target.type === 'reps') {
    return {
      type: 'reps',
      min: String(target.min),
      max: String(target.max),
      minSec: String(DEFAULT_TIME.minSec),
      maxSec: String(DEFAULT_TIME.maxSec),
      targetSec: String(DEFAULT_TIME.minSec),
    };
  }
  return {
    type: 'time',
    min: String(DEFAULT_REPS.min),
    max: String(DEFAULT_REPS.max),
    minSec: String(target.minSec),
    maxSec: String(target.maxSec),
    targetSec: String(target.targetSec),
  };
}

/** Whole non-negative integer from an input string; NaN when empty/invalid. */
export function parseIntField(raw: string): number {
  const s = raw.trim();
  return /^\d{1,4}$/.test(s) ? Number(s) : NaN;
}

/** Keep only digits (max 4) — used on input change so the numeric keypad can't inject junk. */
export function digitsOnly(raw: string): string {
  return raw.replace(/\D+/g, '').slice(0, 4);
}

export function targetFromDraft(d: TargetDraft): Target {
  if (d.type === 'reps') return { type: 'reps', min: parseIntField(d.min), max: parseIntField(d.max) };
  return {
    type: 'time',
    minSec: parseIntField(d.minSec),
    maxSec: parseIntField(d.maxSec),
    targetSec: parseIntField(d.targetSec),
  };
}

export function targetDraftErrors(d: TargetDraft): TargetError[] {
  return validateTarget(targetFromDraft(d));
}

/**
 * Update one field of a target draft. FR22: the time target defaults to the range minimum, so
 * while the target still equals the old minimum it follows the minimum.
 */
export function patchTargetDraft(d: TargetDraft, field: keyof Omit<TargetDraft, 'type'>, raw: string): TargetDraft {
  const value = digitsOnly(raw);
  const next: TargetDraft = { ...d, [field]: value };
  if (field === 'minSec' && d.targetSec === d.minSec) next.targetSec = value;
  return next;
}

// ---------- names ----------

export type NameError = 'nameRequired' | 'nameTooLong' | 'nameTaken';

export function nameError(
  name: string,
  max: number,
  isTaken: (name: string) => boolean,
  { allowEmpty = false }: { allowEmpty?: boolean } = {},
): NameError | null {
  const n = name.trim();
  if (n.length === 0) return allowEmpty ? null : 'nameRequired';
  if (n.length > max) return 'nameTooLong';
  if (isTaken(n)) return 'nameTaken';
  return null;
}

// ---------- exercise ----------

export interface ExerciseDraft {
  name: string;
  category: Category;
  unilateral: boolean;
  sets: number;
  target: TargetDraft;
}

export function exerciseDraft(ex?: Exercise): ExerciseDraft {
  if (!ex) {
    return {
      name: '',
      category: 'pull',
      unilateral: false,
      sets: 3,
      target: draftFromTarget({ type: 'reps', ...DEFAULT_REPS }),
    };
  }
  return {
    name: ex.name ?? '',
    category: ex.category,
    unilateral: ex.unilateral,
    sets: ex.defaultSets,
    target: draftFromTarget(ex.defaultTarget),
  };
}

export interface ExerciseErrors {
  name: NameError | null;
  target: TargetError[];
}

export function exerciseErrors(d: ExerciseDraft, isTaken: (name: string) => boolean): ExerciseErrors {
  return { name: nameError(d.name, LIMITS.exerciseNameMax, isTaken), target: targetDraftErrors(d.target) };
}

export function hasExerciseErrors(e: ExerciseErrors): boolean {
  return e.name !== null || e.target.length > 0;
}

export function buildExercise(id: string, d: ExerciseDraft): Exercise {
  return {
    id,
    builtIn: false,
    name: d.name.trim(),
    category: d.category,
    unilateral: d.unilateral,
    defaultSets: d.sets,
    defaultTarget: targetFromDraft(d.target),
  };
}

// ---------- workout ----------

export interface ItemDraft {
  /** local React key (items of the same exercise may repeat) */
  key: string;
  exerciseId: string;
  sets: number;
  target: TargetDraft;
  /** straight mode: own rest after each set / round (undefined = workout default) */
  restSec?: number;
  /** straight mode: done back-to-back with the next item (superset / circuit block) */
  linkNext?: boolean;
  /** built-in coaching note, kept as is */
  noteKey?: string;
}

export interface WorkoutDraft {
  name: string;
  mode: WorkoutMode;
  items: ItemDraft[];
}

let itemSeq = 0;
export function itemKey(): string {
  return `item-${++itemSeq}`;
}

export function itemDraft(item: WorkoutItem): ItemDraft {
  return {
    key: itemKey(),
    exerciseId: item.exerciseId,
    sets: item.sets,
    target: draftFromTarget(item.target),
    ...(item.restSec !== undefined ? { restSec: item.restSec } : {}),
    ...(item.linkNext ? { linkNext: true } : {}),
    ...(item.noteKey ? { noteKey: item.noteKey } : {}),
  };
}

/**
 * Draft for the editor. For FBW A/B without a user name the field is prefilled with the
 * translated name (`displayName`); saving it unchanged keeps the name translated (BR11).
 */
export function workoutDraft(w: Workout | undefined, displayName = ''): WorkoutDraft {
  if (!w) return { name: '', mode: 'straight', items: [] };
  return { name: w.name ?? displayName, mode: w.mode, items: w.items.map(itemDraft) };
}

export interface WorkoutErrors {
  name: NameError | null;
  /** by item key */
  items: Record<string, TargetError[]>;
  noItems: boolean;
}

/**
 * `translatedName`: for FBW A/B without a name override — the field still holding the translated
 * name is not a user name (buildWorkout stores no override), so it is not checked for uniqueness.
 */
export function workoutErrors(
  d: WorkoutDraft,
  isTaken: (name: string) => boolean,
  { builtIn = false, translatedName }: { builtIn?: boolean; translatedName?: string } = {},
): WorkoutErrors {
  const keepsTranslated = builtIn && translatedName !== undefined && d.name.trim() === translatedName;
  const items: Record<string, TargetError[]> = {};
  for (const it of d.items) {
    const errs = targetDraftErrors(it.target);
    if (errs.length) items[it.key] = errs;
  }
  return {
    name: nameError(d.name, LIMITS.workoutNameMax, keepsTranslated ? () => false : isTaken, { allowEmpty: builtIn }),
    items,
    noItems: d.items.length === 0,
  };
}

export function hasWorkoutErrors(e: WorkoutErrors): boolean {
  return e.name !== null || e.noItems || Object.keys(e.items).length > 0;
}

/**
 * Domain workout from a draft. `base` = the stored workout (keeps rest settings / nameKey);
 * undefined for a new workout (default rests). For FBW A/B an empty name — or the untouched
 * translated name — clears the override so the name stays translated (BR11).
 */
export function buildWorkout(
  id: string,
  d: WorkoutDraft,
  base: Workout | undefined,
  translatedName?: string,
): Workout {
  const builtIn = isBuiltinWorkoutId(id);
  const name = d.name.trim();
  const keepTranslated = builtIn && (name === '' || (!base?.name && name === translatedName));
  const w: Workout = {
    id,
    builtIn,
    ...(builtIn && base?.nameKey ? { nameKey: base.nameKey } : {}),
    mode: d.mode,
    rest: base ? base.rest : defaultRest(),
    items: normalizeLinks(
      d.items.map((it) => ({
        exerciseId: it.exerciseId,
        sets: it.sets,
        target: targetFromDraft(it.target),
        ...(it.restSec !== undefined ? { restSec: it.restSec } : {}),
        ...(it.linkNext ? { linkNext: true } : {}),
        ...(it.noteKey ? { noteKey: it.noteKey } : {}),
      })),
    ),
    ...(base?.noteKey ? { noteKey: base.noteKey } : {}),
  };
  if (!keepTranslated) w.name = name;
  return w;
}

// ---------- items ----------

export function moveItem<T>(list: readonly T[], from: number, to: number): T[] {
  if (to < 0 || to >= list.length || from === to) return list.slice();
  const copy = list.slice();
  const [x] = copy.splice(from, 1);
  copy.splice(to, 0, x!);
  return copy;
}

/** Stable JSON fingerprint for dirty checks (ignores local item keys). */
export function workoutFingerprint(d: WorkoutDraft): string {
  return JSON.stringify({ n: d.name.trim(), m: d.mode, i: d.items.map(({ key: _k, ...rest }) => rest) });
}

export function exerciseFingerprint(d: ExerciseDraft): string {
  return JSON.stringify({ ...d, name: d.name.trim() });
}
