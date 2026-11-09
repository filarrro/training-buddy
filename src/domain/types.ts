/** Core domain model. Pure data, JSON-serialisable (stored in IndexedDB). */

export type Category =
  | 'pull'
  | 'push'
  | 'legs'
  | 'posterior'
  | 'core'
  | 'shoulders'
  | 'biceps'
  | 'triceps';
export const CATEGORY_IDS: readonly Category[] = [
  'pull',
  'push',
  'legs',
  'posterior',
  'core',
  'shoulders',
  'biceps',
  'triceps',
];

export interface RepsTarget {
  type: 'reps';
  /** 1–100 */
  min: number;
  /** >= min, <= 100 */
  max: number;
}

export interface TimeTarget {
  type: 'time';
  /** 5–600 s */
  minSec: number;
  /** >= minSec, <= 600 s */
  maxSec: number;
  /** within [minSec, maxSec]; the countdown starts from this value */
  targetSec: number;
}

export type Target = RepsTarget | TimeTarget;
export type TargetType = Target['type'];

export interface Exercise {
  /** Built-in: stable forever, e.g. "builtin:pullup-overhand". Custom: UUID. */
  id: string;
  builtIn: boolean;
  /** i18n key (built-ins), e.g. "common.exercise.pullupOverhand" */
  nameKey?: string;
  /** User-entered name (custom exercises) */
  name?: string;
  category: Category;
  /** per leg / per side */
  unilateral: boolean;
  /** 1–10 */
  defaultSets: number;
  defaultTarget: Target;
}

export interface WorkoutItem {
  exerciseId: string;
  /** 1–10 */
  sets: number;
  target: Target;
  /**
   * Straight mode only. Rest (s) after each set of this item and after its last set,
   * overriding workout.rest.straight. For a linked group, the group's LAST item carries the
   * rest used after every round. Undefined = workout default.
   */
  restSec?: number;
  /**
   * Straight mode only. true = performed back-to-back with the next item (superset for 2 items,
   * circuit block for 3+): one set of each, then the group rest. Ignored on the last item.
   */
  linkNext?: boolean;
  /** i18n key of a coaching note shown in preview and session (built-ins), e.g. "common.note.weightedPullup" */
  noteKey?: string;
}

export type WorkoutMode = 'straight' | 'circuit';

export interface RestSettings {
  straight: { betweenSetsSec: number; betweenExercisesSec: number };
  circuit: { betweenExercisesSec: number; betweenRoundsSec: number };
  /** 0 = no timer when switching sides */
  betweenSidesSec: number;
}

export interface Workout {
  /** Built-in: "builtin:fbw-a" / "builtin:fbw-b"; custom: UUID. */
  id: string;
  /** true also for a user-modified (stored override) FBW A/B */
  builtIn: boolean;
  nameKey?: string;
  /** set = name typed or changed by the user (takes precedence over nameKey) */
  name?: string;
  mode: WorkoutMode;
  rest: RestSettings;
  items: WorkoutItem[];
  /** i18n key of a workout-level note (e.g. warm-up reminder) */
  noteKey?: string;
}

/**
 * Plan: a named group of workouts the user rotates through (e.g. "FBW · bodyweight" with A and B,
 * or a 5-day split). A workout may belong to several plans; plans only reference workouts.
 */
export interface Plan {
  /** Built-in: "builtin:plan-…"; custom: UUID. */
  id: string;
  /** true also for a user-modified (stored override) built-in plan */
  builtIn: boolean;
  nameKey?: string;
  /** set = name typed or changed by the user (takes precedence over nameKey) */
  name?: string;
  /** workout ids in rotation order (unknown ids are ignored by the UI) */
  workoutIds: string[];
  /** i18n key of a plan note (e.g. the weekly schedule), built-ins only */
  noteKey?: string;
}

/** Last workout finished from each plan (planId → workout and time) — drives the "next" hint. */
export type PlanLast = Record<string, { workoutId: string; at: number }>;

export type Lang = 'pl' | 'en';

/** Colour theme choice: follow the system (prefers-color-scheme) or a fixed one. */
export type ThemeChoice = 'system' | 'light' | 'dark';
export type ResolvedTheme = 'light' | 'dark';

export interface Settings {
  lang: Lang;
  theme: ThemeChoice;
  sound: boolean;
  countdownBeeps: boolean;
  vibration: boolean;
  keepScreenOn: boolean;
}

export type Side = 'left' | 'right';
export type RestReason = 'sets' | 'exercises' | 'rounds' | 'sides';

export interface WorkStep {
  kind: 'work';
  /** index into workout.items */
  itemIndex: number;
  exerciseId: string;
  /** 1-based set number of this item */
  set: number;
  /** total sets of this item */
  setsTotal: number;
  /**
   * 1-based exercise position for the "Exercise x/y" label.
   * Straight mode: position among workout exercises. Circuit: position within the round.
   */
  exerciseNo: number;
  /** Straight: number of exercises in workout. Circuit: number of exercises in this round. */
  exerciseTotal: number;
  /**
   * Set when the step belongs to a linked group in straight mode (superset = 2 items,
   * circuit = 3+). round/roundsTotal then count the group's rounds and
   * exerciseNo/exerciseTotal count items in the whole workout.
   */
  group?: 'superset' | 'circuit';
  /** circuit mode or linked group: 1-based round */
  round?: number;
  /** circuit only: total rounds */
  roundsTotal?: number;
  /** unilateral only */
  side?: Side;
  /** 0-based ordinal among work steps (0..workCount-1) */
  workIndex: number;
}

export interface RestStep {
  kind: 'rest';
  reason: RestReason;
  /** always > 0 (0 s rests are omitted by the generator) */
  durationSec: number;
}

export type Step = WorkStep | RestStep;

/** Status of a WORK step in a session (BR4). Rest steps have no meaningful status. */
export type SessionStepStatus = 'todo' | 'done' | 'skipped';

/**
 * Phase of the session UI. Owned by the session module; listed here so the shape is shared.
 * - work: showing a work step (reps → "Done"; time → waiting for "Start")
 * - prepare: 3 s "Get ready" before a time countdown (endsAt set)
 * - countdown: time exercise counting down (endsAt set)
 * - countdownDone: countdown reached 0, pulsing, waiting for "Done"
 * - rest: rest timer running (endsAt set; index points at the rest step)
 * - restDone: rest finished, pulsing, waiting for "Next" (overtime counted from endsAt)
 */
export type SessionPhase = 'work' | 'prepare' | 'countdown' | 'countdownDone' | 'rest' | 'restDone';

export interface ActiveSession {
  id: string;
  /** snapshot (BR3) */
  workout: Workout;
  /** snapshot of exercises used by the workout */
  exercises: Exercise[];
  steps: Step[];
  /** aligned with steps; only entries of work steps are meaningful */
  statuses: SessionStepStatus[];
  /** index into steps of the current step (work or rest) */
  index: number;
  phase: SessionPhase;
  /** epoch ms */
  startedAt: number;
  /** epoch ms: end of rest / prepare / countdown */
  endsAt?: number;
  /** set while paused (T9) */
  pausedRemainingMs?: number;
  /** epoch ms when finished or ended early */
  finishedAt?: number;
  /** true when ended early via "End workout" (no confetti) */
  endedEarly?: boolean;
}

export type ExercisesById = Readonly<Record<string, Exercise>>;
