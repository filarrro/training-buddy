import type { Category, Exercise, Plan, RestSettings, Workout, WorkoutItem } from './types';

export interface CategoryMeta {
  id: Category;
  /** i18n key of the label */
  labelKey: string;
  /** solid colour (hex) — same value as CSS var --c-cat-<id> */
  color: string;
  /** CSS variable name for the colour */
  cssVar: string;
  /** 24×24 stroke glyph (SVG path data, stroke="currentColor", fill="none") */
  iconPath: string;
  /**
   * Colour world of the exercise screen for this category: gradient start/end and a lighter
   * variant for small text on the dark background (WCAG AA); `textLight` is the same for the
   * light theme. Rest screens stay neutral.
   */
  work: { from: string; to: string; text: string; textLight: string };
  /** side label used for unilateral exercises: legs/posterior → "leg", arms → "arm", others → "side" (FR11) */
  sideUnit: 'leg' | 'side' | 'arm';
}

export const CATEGORIES: Readonly<Record<Category, CategoryMeta>> = {
  pull: {
    id: 'pull',
    labelKey: 'common.category.pull',
    color: '#4F8CFF',
    cssVar: '--c-cat-pull',
    work: { from: '#4F8CFF', to: '#7DAAFF', text: '#8DB4FF', textLight: '#1D4ED8' },
    iconPath: 'M4 4h16M12 20V8M7.5 12.5 12 8l4.5 4.5',
    sideUnit: 'side',
  },
  push: {
    id: 'push',
    labelKey: 'common.category.push',
    color: '#FF6B4A',
    cssVar: '--c-cat-push',
    work: { from: '#FF5A1F', to: '#FF8A3D', text: '#FF8A5C', textLight: '#C2410C' },
    iconPath: 'M4 20h16M12 4v12M7.5 11.5 12 16l4.5-4.5',
    sideUnit: 'side',
  },
  legs: {
    id: 'legs',
    labelKey: 'common.category.legs',
    color: '#A06BFF',
    cssVar: '--c-cat-legs',
    work: { from: '#A06BFF', to: '#C29BFF', text: '#C3A1FF', textLight: '#7C3AED' },
    iconPath: 'M9 3v6l-3 5 3 7M15 3v6l3 5-3 7',
    sideUnit: 'leg',
  },
  posterior: {
    id: 'posterior',
    labelKey: 'common.category.posterior',
    color: '#F5B83D',
    cssVar: '--c-cat-posterior',
    work: { from: '#F5B83D', to: '#FFD27A', text: '#F8C766', textLight: '#B45309' },
    iconPath: 'M3 19h18M5.5 19a6.5 6.5 0 0 1 13 0M12 6v3',
    sideUnit: 'leg',
  },
  core: {
    id: 'core',
    labelKey: 'common.category.core',
    color: '#2DD4BF',
    cssVar: '--c-cat-core',
    work: { from: '#2DD4BF', to: '#5EEAD4', text: '#5EEAD4', textLight: '#0F766E' },
    iconPath: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Zm0 5a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z',
    sideUnit: 'side',
  },
  shoulders: {
    id: 'shoulders',
    labelKey: 'common.category.shoulders',
    color: '#F472B6',
    cssVar: '--c-cat-shoulders',
    work: { from: '#F472B6', to: '#F9A8D4', text: '#F9A0CF', textLight: '#BE185D' },
    iconPath: 'M4 15a8 8 0 0 1 16 0M12 7V4M4 15v4M20 15v4',
    sideUnit: 'arm',
  },
  biceps: {
    id: 'biceps',
    labelKey: 'common.category.biceps',
    color: '#84CC16',
    cssVar: '--c-cat-biceps',
    work: { from: '#84CC16', to: '#A3E635', text: '#A3E635', textLight: '#4D7C0F' },
    iconPath: 'M5 19V9l4-4M5 19h9a5 5 0 0 0 0-10h-2l-3 3',
    sideUnit: 'arm',
  },
  triceps: {
    id: 'triceps',
    labelKey: 'common.category.triceps',
    color: '#FACC15',
    cssVar: '--c-cat-triceps',
    work: { from: '#FACC15', to: '#FDE047', text: '#FDE047', textLight: '#A16207' },
    iconPath: 'M5 5v14M5 5h6l4 4v10M15 19h4',
    sideUnit: 'arm',
  },
};

export const DEFAULT_REST: RestSettings = {
  straight: { betweenSetsSec: 90, betweenExercisesSec: 120 },
  circuit: { betweenExercisesSec: 30, betweenRoundsSec: 120 },
  betweenSidesSec: 0,
};

export function defaultRest(): RestSettings {
  return {
    straight: { ...DEFAULT_REST.straight },
    circuit: { ...DEFAULT_REST.circuit },
    betweenSidesSec: DEFAULT_REST.betweenSidesSec,
  };
}

function reps(min: number, max: number) {
  return { type: 'reps', min, max } as const;
}

function builtinExercise(
  slug: string,
  category: Category,
  defaultSets: number,
  defaultTarget: Exercise['defaultTarget'],
  unilateral = false,
): Exercise {
  return {
    id: `builtin:${slug}`,
    builtIn: true,
    nameKey: `common.exercise.${slug}`,
    category,
    unilateral,
    defaultSets,
    defaultTarget,
  };
}

/** Built-in exercises (FR2). Ids are stable forever. */
export const BUILTIN_EXERCISES: readonly Exercise[] = [
  // FBW A
  builtinExercise('pullup-overhand', 'pull', 4, reps(5, 7)),
  builtinExercise('dips', 'push', 4, reps(5, 7)),
  builtinExercise('bulgarian-split-squat', 'legs', 3, reps(6, 8), true),
  builtinExercise('nordic-curl', 'posterior', 3, reps(5, 7)),
  builtinExercise('plank', 'core', 3, { type: 'time', minSec: 45, maxSec: 60, targetSec: 45 }),
  // FBW B
  builtinExercise('pullup-wide', 'pull', 3, reps(8, 12)),
  builtinExercise('deficit-pushup', 'push', 3, reps(10, 15)),
  builtinExercise('skater-squat', 'legs', 3, reps(6, 10), true),
  builtinExercise('hip-thrust', 'posterior', 3, reps(10, 15)),
  builtinExercise('hanging-leg-raise', 'core', 3, reps(10, 15)),
  // FBW A/B with external load (+ express variants)
  builtinExercise('back-squat', 'legs', 5, reps(4, 6)),
  builtinExercise('overhead-press', 'shoulders', 5, reps(4, 6)),
  builtinExercise('bent-over-row', 'pull', 5, reps(4, 6)),
  builtinExercise('barbell-curl', 'biceps', 3, reps(8, 12)),
  builtinExercise('barbell-french-press', 'triceps', 3, reps(8, 12)),
  builtinExercise('lateral-raise', 'shoulders', 3, reps(8, 12)),
  builtinExercise('face-pull', 'shoulders', 3, reps(8, 12)),
  builtinExercise('hanging-knee-raise', 'core', 3, reps(12, 15)),
  builtinExercise('deadlift', 'posterior', 5, reps(4, 6)),
  builtinExercise('pullup', 'pull', 5, reps(4, 6)),
  builtinExercise('bench-press', 'push', 5, reps(4, 6)),
  builtinExercise('db-supinated-curl', 'biceps', 3, reps(8, 12), true),
  builtinExercise('db-french-press-standing', 'triceps', 3, reps(8, 12)),
  builtinExercise('rear-delt-raise', 'shoulders', 3, reps(8, 12)),
  builtinExercise('side-plank', 'core', 3, { type: 'time', minSec: 45, maxSec: 45, targetSec: 45 }, true),
  builtinExercise('romanian-deadlift-slow', 'posterior', 5, reps(4, 6)),
  builtinExercise('pushup-or-dips', 'push', 3, reps(8, 12)),
  builtinExercise('barbell-curl-wide', 'biceps', 3, reps(8, 12)),
  // Split upper/lower (A: pull + legs, B: push + legs)
  builtinExercise('lat-pulldown', 'pull', 5, reps(4, 6)),
  builtinExercise('romanian-deadlift', 'posterior', 3, reps(8, 12)),
  builtinExercise('lunge', 'legs', 3, reps(8, 12), true),
  builtinExercise('preacher-curl', 'biceps', 3, reps(8, 12)),
  builtinExercise('mountain-climber', 'core', 3, reps(20, 20)),
  builtinExercise('db-bench-press', 'push', 5, reps(4, 6)),
  builtinExercise('db-fly', 'push', 3, reps(8, 12)),
  builtinExercise('db-shoulder-press-seated', 'shoulders', 3, reps(8, 12)),
  builtinExercise('alternating-leg-crunch', 'core', 4, reps(20, 20)),
  // Push / Pull / Legs
  builtinExercise('chest-press-machine', 'push', 3, reps(8, 12)),
  builtinExercise('cable-triceps-pushdown', 'triceps', 3, reps(8, 12)),
  builtinExercise('horizontal-row', 'pull', 3, reps(8, 12)),
  builtinExercise('db-lunge', 'legs', 3, reps(8, 12), true),
  builtinExercise('leg-curl', 'posterior', 3, reps(8, 12)),
  builtinExercise('jackknife', 'core', 3, reps(10, 10)),
];

export const BUILTIN_EXERCISES_BY_ID: Readonly<Record<string, Exercise>> = Object.fromEntries(
  BUILTIN_EXERCISES.map((e) => [e.id, e]),
);

function itemsFor(ids: string[]): WorkoutItem[] {
  return ids.map((slug) => item(slug));
}

interface ItemOpts {
  sets?: number;
  target?: Exercise['defaultTarget'];
  restSec?: number;
  linkNext?: boolean;
  note?: string;
}

/** One workout item from a built-in exercise; defaults from the exercise. */
function item(slug: string, opts: ItemOpts = {}): WorkoutItem {
  const ex = BUILTIN_EXERCISES_BY_ID[`builtin:${slug}`]!;
  return {
    exerciseId: ex.id,
    sets: opts.sets ?? ex.defaultSets,
    target: { ...(opts.target ?? ex.defaultTarget) },
    ...(opts.restSec !== undefined ? { restSec: opts.restSec } : {}),
    ...(opts.linkNext ? { linkNext: true } : {}),
    ...(opts.note ? { noteKey: `common.note.${opts.note}` } : {}),
  };
}

/** Bodyweight FBW A/B (the original MVP plans). Ids kept so stored user overrides still apply. */
export const FBW_A_ID = 'builtin:fbw-a';
export const FBW_B_ID = 'builtin:fbw-b';
/** FBW A/B with external load and their express (two-circuit) variants. */
export const FBW_A_WEIGHTS_ID = 'builtin:fbw-a-weights';
export const FBW_B_WEIGHTS_ID = 'builtin:fbw-b-weights';
export const FBW_A_EXPRESS_ID = 'builtin:fbw-a-express';
export const FBW_B_EXPRESS_ID = 'builtin:fbw-b-express';

export const SPLIT_A_ID = 'builtin:split-a';
export const SPLIT_B_ID = 'builtin:split-b';
export const PPL_A_ID = 'builtin:ppl-a';
export const PPL_B_ID = 'builtin:ppl-b';
export const PPL_C_ID = 'builtin:ppl-c';

const WARMUP_NOTE = 'common.note.warmup';

/** Fresh copies of the built-in workouts (FR2): weighted plans first, then bodyweight. */
export function builtinWorkoutDefaults(): Workout[] {
  return [
    {
      id: FBW_A_WEIGHTS_ID,
      builtIn: true,
      nameKey: 'common.workout.fbw-a-weights',
      noteKey: WARMUP_NOTE,
      mode: 'straight',
      rest: defaultRest(),
      items: [
        item('back-squat', { restSec: 180 }),
        item('overhead-press', { restSec: 180 }),
        item('bent-over-row', { restSec: 180 }),
        item('barbell-curl', { linkNext: true }),
        item('barbell-french-press', { restSec: 120 }),
        item('lateral-raise', { linkNext: true }),
        item('face-pull', { restSec: 120 }),
        item('hanging-knee-raise', { restSec: 120, note: 'barOrParallels' }),
      ],
    },
    {
      id: FBW_B_WEIGHTS_ID,
      builtIn: true,
      nameKey: 'common.workout.fbw-b-weights',
      noteKey: WARMUP_NOTE,
      mode: 'straight',
      rest: defaultRest(),
      items: [
        item('deadlift', { restSec: 210 }),
        item('pullup', { restSec: 210, note: 'weightedPullup' }),
        item('bench-press', { restSec: 210 }),
        item('db-supinated-curl', { linkNext: true }),
        item('db-french-press-standing', { restSec: 120 }),
        item('rear-delt-raise', { restSec: 120 }),
        item('side-plank', { restSec: 120 }),
      ],
    },
    {
      id: SPLIT_A_ID,
      builtIn: true,
      nameKey: 'common.workout.split-a',
      noteKey: WARMUP_NOTE,
      mode: 'straight',
      rest: defaultRest(),
      items: [
        item('pullup', { restSec: 180, note: 'weightedPullup' }),
        item('bent-over-row', { restSec: 180 }),
        item('lat-pulldown', { restSec: 180 }),
        item('romanian-deadlift', { restSec: 120 }),
        item('lunge', { restSec: 120 }),
        item('barbell-curl', { restSec: 120 }),
        item('preacher-curl', { restSec: 120 }),
        item('mountain-climber', { restSec: 120 }),
      ],
    },
    {
      id: SPLIT_B_ID,
      builtIn: true,
      nameKey: 'common.workout.split-b',
      noteKey: WARMUP_NOTE,
      mode: 'straight',
      rest: defaultRest(),
      items: [
        item('db-bench-press', { restSec: 180 }),
        item('db-fly', { restSec: 120 }),
        item('overhead-press', { restSec: 180 }),
        item('db-shoulder-press-seated', { restSec: 120 }),
        item('back-squat', { restSec: 180 }),
        item('dips', { sets: 5, target: reps(4, 6), restSec: 180, note: 'weightedPullup' }),
        item('barbell-french-press', { restSec: 120 }),
        item('rear-delt-raise', { restSec: 120 }),
        item('alternating-leg-crunch', { restSec: 120, note: 'tenPerSide' }),
      ],
    },
    {
      id: PPL_A_ID,
      builtIn: true,
      nameKey: 'common.workout.ppl-a',
      noteKey: WARMUP_NOTE,
      mode: 'straight',
      rest: defaultRest(),
      items: [
        item('bench-press', { restSec: 180 }),
        item('chest-press-machine', { restSec: 120 }),
        item('db-shoulder-press-seated', { target: reps(4, 6), sets: 5, restSec: 180 }),
        item('rear-delt-raise', { restSec: 120 }),
        item('barbell-french-press', { target: reps(4, 6), sets: 5, restSec: 180, note: 'lyingOnBench' }),
        item('cable-triceps-pushdown', { restSec: 120 }),
      ],
    },
    {
      id: PPL_B_ID,
      builtIn: true,
      nameKey: 'common.workout.ppl-b',
      noteKey: WARMUP_NOTE,
      mode: 'straight',
      rest: defaultRest(),
      items: [
        item('bent-over-row', { restSec: 180 }),
        item('lat-pulldown', { restSec: 180 }),
        item('horizontal-row', { restSec: 120 }),
        item('db-supinated-curl', { target: reps(4, 6), sets: 5, restSec: 180 }),
        item('barbell-curl-wide', { restSec: 120 }),
        item('face-pull', { restSec: 120 }),
      ],
    },
    {
      id: PPL_C_ID,
      builtIn: true,
      nameKey: 'common.workout.ppl-c',
      noteKey: WARMUP_NOTE,
      mode: 'straight',
      rest: defaultRest(),
      items: [
        item('back-squat', { restSec: 180 }),
        item('db-lunge', { restSec: 120 }),
        item('romanian-deadlift', { target: reps(4, 6), sets: 5, restSec: 180, note: 'slowNegative' }),
        item('leg-curl', { restSec: 120 }),
        item('hanging-knee-raise', { target: reps(10, 10), linkNext: true }),
        item('jackknife', { linkNext: true }),
        item('side-plank', { target: { type: 'time', minSec: 30, maxSec: 30, targetSec: 30 }, restSec: 150 }),
      ],
    },
    {
      id: FBW_A_EXPRESS_ID,
      builtIn: true,
      nameKey: 'common.workout.fbw-a-express',
      noteKey: WARMUP_NOTE,
      mode: 'straight',
      rest: defaultRest(),
      items: [
        item('bench-press', { linkNext: true }),
        item('bent-over-row', { linkNext: true }),
        item('romanian-deadlift-slow', { restSec: 210, note: 'slowEccentric' }),
        item('db-supinated-curl', { linkNext: true }),
        item('pushup-or-dips', { linkNext: true }),
        item('hanging-knee-raise', { target: reps(8, 12), restSec: 150 }),
      ],
    },
    {
      id: FBW_B_EXPRESS_ID,
      builtIn: true,
      nameKey: 'common.workout.fbw-b-express',
      noteKey: WARMUP_NOTE,
      mode: 'straight',
      rest: defaultRest(),
      items: [
        item('overhead-press', { linkNext: true }),
        item('back-squat', { linkNext: true }),
        item('pullup', { restSec: 210, note: 'weightedPullup' }),
        item('lateral-raise', { linkNext: true }),
        item('barbell-curl-wide', { linkNext: true }),
        item('face-pull', { restSec: 150 }),
      ],
    },
    {
      id: FBW_A_ID,
      builtIn: true,
      nameKey: 'common.workout.fbw-a',
      mode: 'straight',
      rest: defaultRest(),
      items: itemsFor(['pullup-overhand', 'dips', 'bulgarian-split-squat', 'nordic-curl', 'plank']),
    },
    {
      id: FBW_B_ID,
      builtIn: true,
      nameKey: 'common.workout.fbw-b',
      mode: 'straight',
      rest: defaultRest(),
      items: itemsFor(['pullup-wide', 'deficit-pushup', 'skater-squat', 'hip-thrust', 'hanging-leg-raise']),
    },
  ];
}

export const PLAN_FBW_BODYWEIGHT_ID = 'builtin:plan-fbw-bodyweight';
export const PLAN_FBW_WEIGHTS_ID = 'builtin:plan-fbw-weights';
export const PLAN_FBW_EXPRESS_ID = 'builtin:plan-fbw-express';
export const PLAN_SPLIT_ID = 'builtin:plan-split-upper-lower';
export const PLAN_PPL_ID = 'builtin:plan-ppl';

/** Fresh copies of the built-in plans (A/B rotations). */
export function builtinPlanDefaults(): Plan[] {
  return [
    {
      id: PLAN_FBW_WEIGHTS_ID,
      builtIn: true,
      nameKey: 'common.plan.fbw-weights',
      workoutIds: [FBW_A_WEIGHTS_ID, FBW_B_WEIGHTS_ID],
    },
    {
      id: PLAN_FBW_EXPRESS_ID,
      builtIn: true,
      nameKey: 'common.plan.fbw-express',
      workoutIds: [FBW_A_EXPRESS_ID, FBW_B_EXPRESS_ID],
    },
    {
      id: PLAN_SPLIT_ID,
      builtIn: true,
      nameKey: 'common.plan.split-upper-lower',
      noteKey: 'common.note.splitSchedule',
      workoutIds: [SPLIT_A_ID, SPLIT_B_ID],
    },
    {
      id: PLAN_PPL_ID,
      builtIn: true,
      nameKey: 'common.plan.ppl',
      noteKey: 'common.note.pplSchedule',
      workoutIds: [PPL_A_ID, PPL_B_ID, PPL_C_ID],
    },
    {
      id: PLAN_FBW_BODYWEIGHT_ID,
      builtIn: true,
      nameKey: 'common.plan.fbw-bodyweight',
      workoutIds: [FBW_A_ID, FBW_B_ID],
    },
  ];
}

export const BUILTIN_PLANS: readonly Plan[] = builtinPlanDefaults();
export const BUILTIN_PLAN_IDS: readonly string[] = BUILTIN_PLANS.map((p) => p.id);

export function isBuiltinPlanId(id: string): boolean {
  return BUILTIN_PLAN_IDS.includes(id);
}

/** Frozen built-in workouts (do not mutate; use builtinWorkoutDefaults() for copies). */
export const BUILTIN_WORKOUTS: readonly Workout[] = builtinWorkoutDefaults();

export const BUILTIN_WORKOUT_IDS: readonly string[] = BUILTIN_WORKOUTS.map((w) => w.id);

export function isBuiltinId(id: string): boolean {
  return id.startsWith('builtin:');
}

export function isBuiltinWorkoutId(id: string): boolean {
  return BUILTIN_WORKOUT_IDS.includes(id);
}
