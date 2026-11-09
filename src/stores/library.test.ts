import { beforeEach, describe, expect, it } from 'vitest';
import { BUILTIN_EXERCISES, FBW_A_ID } from '../domain/builtins';
import type { Exercise, Workout } from '../domain/types';
import { makeT } from '../i18n/core';
import {
  duplicateName,
  duplicateNameWithin,
  getAllExercises,
  getAllWorkouts,
  getWorkout,
  isBuiltinOverridden,
  isExerciseNameTaken,
  isWorkoutNameTaken,
  itemFromExercise,
  useLibrary,
  workoutsUsingExercise,
} from './library';

const pl = makeT('pl');
const lib = () => useLibrary.getState();

const custom = (over: Partial<Exercise> = {}): Exercise => ({
  id: 'ex-1',
  builtIn: false,
  name: 'Wiosłowanie',
  category: 'pull',
  unilateral: false,
  defaultSets: 3,
  defaultTarget: { type: 'reps', min: 8, max: 12 },
  ...over,
});

const customWorkout = (items: Workout['items'], over: Partial<Workout> = {}): Workout => ({
  id: 'w-1',
  builtIn: false,
  name: 'Mój trening',
  mode: 'straight',
  rest: getWorkout(FBW_A_ID)!.rest,
  items,
  ...over,
});

beforeEach(() => {
  useLibrary.setState({ exercises: [], workouts: [], plans: [], planLast: {} });
});

describe('library selectors', () => {
  it('starts with 11 built-in workouts (weighted, express, bodyweight) (AC2)', () => {
    expect(getAllWorkouts().map((w) => w.id)).toEqual(['builtin:fbw-a-weights', 'builtin:fbw-b-weights', 'builtin:split-a', 'builtin:split-b', 'builtin:ppl-a', 'builtin:ppl-b', 'builtin:ppl-c', 'builtin:fbw-a-express', 'builtin:fbw-b-express', 'builtin:fbw-a', 'builtin:fbw-b']);
    expect(getAllExercises()).toHaveLength(BUILTIN_EXERCISES.length);
    expect(getWorkout(FBW_A_ID)!.mode).toBe('straight');
  });

  it('selectors return stable references while data is unchanged', () => {
    expect(getAllWorkouts()).toBe(getAllWorkouts());
    expect(getAllExercises()).toBe(getAllExercises());
  });
});

describe('updateWorkout / restoreBuiltin (FR8, FR26, BR11)', () => {
  it('stores an override of a built-in with the same id', () => {
    lib().updateWorkout(FBW_A_ID, { mode: 'circuit' });
    const w = getWorkout(FBW_A_ID)!;
    expect(w.mode).toBe('circuit');
    expect(w.builtIn).toBe(true);
    expect(w.nameKey).toBe('common.workout.fbw-a');
    expect(isBuiltinOverridden(FBW_A_ID)).toBe(true);
    expect(getAllWorkouts().map((x) => x.id)).toEqual(['builtin:fbw-a-weights', 'builtin:fbw-b-weights', 'builtin:split-a', 'builtin:split-b', 'builtin:ppl-a', 'builtin:ppl-b', 'builtin:ppl-c', 'builtin:fbw-a-express', 'builtin:fbw-b-express', 'builtin:fbw-a', 'builtin:fbw-b']);
  });

  it('restoreBuiltin removes the override', () => {
    lib().updateWorkout(FBW_A_ID, { name: 'Ręczny A', items: [] });
    lib().restoreBuiltin(FBW_A_ID);
    const w = getWorkout(FBW_A_ID)!;
    expect(w.name).toBeUndefined();
    expect(w.items).toHaveLength(5);
  });

  it('does not mutate built-in defaults', () => {
    lib().updateWorkout(FBW_A_ID, { rest: { ...getWorkout(FBW_A_ID)!.rest, betweenSidesSec: 15 } });
    lib().restoreBuiltin(FBW_A_ID);
    expect(getWorkout(FBW_A_ID)!.rest.betweenSidesSec).toBe(0);
  });

  it('built-in workouts cannot be deleted', () => {
    lib().deleteWorkout(FBW_A_ID);
    expect(getWorkout(FBW_A_ID)).toBeDefined();
  });
});

describe('custom workouts', () => {
  it('saveWorkout upserts and deleteWorkout removes', () => {
    const ex = custom();
    lib().saveExercise(ex);
    lib().saveWorkout(customWorkout([itemFromExercise(ex)]));
    expect(getAllWorkouts().map((w) => w.id)).toEqual(['builtin:fbw-a-weights', 'builtin:fbw-b-weights', 'builtin:split-a', 'builtin:split-b', 'builtin:ppl-a', 'builtin:ppl-b', 'builtin:ppl-c', 'builtin:fbw-a-express', 'builtin:fbw-b-express', 'builtin:fbw-a', 'builtin:fbw-b', 'w-1']);
    lib().saveWorkout(customWorkout([itemFromExercise(ex)], { name: 'Nowa nazwa' }));
    expect(getAllWorkouts()).toHaveLength(12);
    expect(getWorkout('w-1')!.name).toBe('Nowa nazwa');
    lib().deleteWorkout('w-1');
    expect(getWorkout('w-1')).toBeUndefined();
  });

  it('name uniqueness is case-insensitive among custom workouts (D45)', () => {
    lib().saveWorkout(customWorkout([], { name: 'Push Day' }));
    expect(isWorkoutNameTaken(' push day ')).toBe(true);
    expect(isWorkoutNameTaken('push day', 'w-1')).toBe(false);
    expect(isWorkoutNameTaken('FBW A')).toBe(false);
  });

  it('duplicateWorkout names copies "(kopia)", "(kopia 2)" (BR10, EC21)', () => {
    const id1 = lib().duplicateWorkout(FBW_A_ID, pl)!;
    const id2 = lib().duplicateWorkout(FBW_A_ID, pl)!;
    expect(getWorkout(id1)!.name).toBe('FBW A · masa ciała (kopia)');
    expect(getWorkout(id2)!.name).toBe('FBW A · masa ciała (kopia 2)');
    expect(getWorkout(id1)!.builtIn).toBe(false);
    expect(getWorkout(id1)!.nameKey).toBeUndefined();
    expect(getWorkout(id1)!.items).toHaveLength(5);
  });
});

describe('custom exercises (FR22, FR23)', () => {
  it('built-in exercises are read-only', () => {
    lib().saveExercise({ ...custom(), id: 'builtin:plank' });
    lib().deleteExercise('builtin:plank');
    expect(lib().exercises).toHaveLength(0);
    expect(getAllExercises().some((e) => e.id === 'builtin:plank')).toBe(true);
  });

  it('name uniqueness is case-insensitive among custom exercises', () => {
    lib().saveExercise(custom());
    expect(isExerciseNameTaken('WIOSŁOWANIE')).toBe(true);
    expect(isExerciseNameTaken('wiosłowanie', 'ex-1')).toBe(false);
  });

  it('deleteExercise removes it from all workouts, incl. FBW overrides (D33, AC17)', () => {
    const ex = custom();
    lib().saveExercise(ex);
    lib().saveWorkout(customWorkout([itemFromExercise(ex)]));
    lib().updateWorkout(FBW_A_ID, { items: [...getWorkout(FBW_A_ID)!.items, itemFromExercise(ex)] });
    expect(workoutsUsingExercise('ex-1').map((w) => w.id)).toEqual([FBW_A_ID, 'w-1']);

    lib().deleteExercise('ex-1');
    expect(lib().exercises).toHaveLength(0);
    expect(getWorkout('w-1')!.items).toEqual([]); // stays, "Brak ćwiczeń"
    expect(getWorkout(FBW_A_ID)!.items).toHaveLength(5);
  });

  it('changeExerciseType replaces item targets, keeps sets (D34, AC18)', () => {
    const ex = custom();
    lib().saveExercise(ex);
    lib().saveWorkout(customWorkout([{ ...itemFromExercise(ex), sets: 5 }]));
    const time = { type: 'time', minSec: 30, maxSec: 60, targetSec: 30 } as const;
    lib().changeExerciseType('ex-1', time);
    expect(lib().exercises[0]!.defaultTarget).toEqual(time);
    expect(getWorkout('w-1')!.items[0]).toEqual({ exerciseId: 'ex-1', sets: 5, target: time });
  });

  it('saveExercise with a type change also replaces item targets', () => {
    const ex = custom();
    lib().saveExercise(ex);
    lib().saveWorkout(customWorkout([{ exerciseId: 'ex-1', sets: 2, target: { type: 'reps', min: 3, max: 4 } }]));
    // same type: items untouched (FR23: default changes don't affect items)
    lib().saveExercise({ ...ex, defaultTarget: { type: 'reps', min: 10, max: 10 } });
    expect(getWorkout('w-1')!.items[0]!.target).toEqual({ type: 'reps', min: 3, max: 4 });
    const time = { type: 'time', minSec: 20, maxSec: 20, targetSec: 20 } as const;
    lib().saveExercise({ ...ex, defaultTarget: time });
    expect(getWorkout('w-1')!.items[0]).toEqual({ exerciseId: 'ex-1', sets: 2, target: time });
  });

  it('duplicateExercise copies a built-in with translated name', () => {
    const id = lib().duplicateExercise('builtin:plank', pl)!;
    const copy = lib().exercises.find((e) => e.id === id)!;
    expect(copy).toMatchObject({ builtIn: false, name: 'Plank (deska) (kopia)', category: 'core' });
    expect(copy.nameKey).toBeUndefined();
  });
});

describe('duplicateName', () => {
  it('increments the suffix case-insensitively', () => {
    expect(duplicateName('X', [])).toBe('X (kopia)');
    expect(duplicateName('X', ['x (KOPIA)'])).toBe('X (kopia 2)');
    expect(duplicateName('X', ['X (kopia)', 'X (kopia 2)'])).toBe('X (kopia 3)');
    expect(duplicateName('X', ['X (copy)'], 'copy')).toBe('X (copy 2)');
  });

  it('shortens the base so the copy fits the name limit', () => {
    const long = 'A'.repeat(40);
    const first = duplicateNameWithin(long, [], 'kopia', 40);
    expect(first).toBe(`${'A'.repeat(32)} (kopia)`);
    expect(first).toHaveLength(40);
    const second = duplicateNameWithin(long, [first], 'kopia', 40);
    expect(second).toBe(`${'A'.repeat(30)} (kopia 2)`);
    expect(duplicateNameWithin('Short', [], 'kopia', 40)).toBe('Short (kopia)');
  });

  it('duplicateWorkout of a max-length name stays within 40 chars', () => {
    lib().saveWorkout(customWorkout([], { name: 'B'.repeat(40) }));
    const id = lib().duplicateWorkout('w-1', pl)!;
    expect(getWorkout(id)!.name).toHaveLength(40);
    expect(getWorkout(id)!.name!.endsWith('(kopia)')).toBe(true);
  });
});
