import { beforeEach, describe, expect, it } from 'vitest';
import {
  FBW_A_ID,
  FBW_A_WEIGHTS_ID,
  FBW_B_ID,
  FBW_B_WEIGHTS_ID,
  PLAN_FBW_BODYWEIGHT_ID,
  PLAN_FBW_WEIGHTS_ID,
} from '../domain/builtins';
import { makeT } from '../i18n/core';
import { getAllPlans, getLooseWorkouts, getPlan, getWorkout, nextPlanWorkoutId, useLibrary } from './library';

const lib = () => useLibrary.getState();
const pl = makeT('pl');

beforeEach(() => {
  useLibrary.setState({ exercises: [], workouts: [], plans: [], planLast: {} });
});

describe('plans', () => {
  it('ships 5 built-in plans; every built-in workout is in a plan', () => {
    expect(getAllPlans().map((p) => p.id)).toEqual([
      PLAN_FBW_WEIGHTS_ID,
      'builtin:plan-fbw-express',
      'builtin:plan-split-upper-lower',
      'builtin:plan-ppl',
      PLAN_FBW_BODYWEIGHT_ID,
    ]);
    expect(getLooseWorkouts()).toEqual([]);
  });

  it('suggests the next workout after the last finished one, wrapping around', () => {
    const plan = getPlan(PLAN_FBW_WEIGHTS_ID)!;
    expect(nextPlanWorkoutId(plan)).toBe(FBW_A_WEIGHTS_ID);
    lib().recordWorkoutDone(FBW_A_WEIGHTS_ID, 1);
    expect(nextPlanWorkoutId(plan)).toBe(FBW_B_WEIGHTS_ID);
    lib().recordWorkoutDone(FBW_B_WEIGHTS_ID, 2);
    expect(nextPlanWorkoutId(plan)).toBe(FBW_A_WEIGHTS_ID);
  });

  it('records a finished workout in every plan containing it', () => {
    lib().savePlan({
      id: 'p1',
      builtIn: false,
      name: 'Mix',
      workoutIds: [FBW_B_ID, FBW_A_ID],
    });
    lib().recordWorkoutDone(FBW_A_ID, 5);
    expect(lib().planLast[PLAN_FBW_BODYWEIGHT_ID]).toEqual({
      workoutId: FBW_A_ID,
      at: 5,
    });
    expect(lib().planLast.p1).toEqual({ workoutId: FBW_A_ID, at: 5 });
    expect(nextPlanWorkoutId(getPlan('p1')!)).toBe(FBW_B_ID);
  });

  it('a custom workout not in any plan is a loose workout; deleting it removes it from plans', () => {
    lib().saveWorkout({
      ...getWorkout(FBW_A_ID)!,
      id: 'w1',
      builtIn: false,
      name: 'Mój',
    });
    expect(getLooseWorkouts().map((w) => w.id)).toEqual(['w1']);
    lib().savePlan({
      ...getPlan(PLAN_FBW_BODYWEIGHT_ID)!,
      workoutIds: [FBW_A_ID, FBW_B_ID, 'w1'],
    });
    expect(getLooseWorkouts()).toEqual([]);
    lib().deleteWorkout('w1');
    expect(getPlan(PLAN_FBW_BODYWEIGHT_ID)!.workoutIds).toEqual([FBW_A_ID, FBW_B_ID]);
  });

  it('built-in plans can be edited and restored, not deleted', () => {
    lib().savePlan({
      ...getPlan(PLAN_FBW_BODYWEIGHT_ID)!,
      name: 'Kalistenika',
      workoutIds: [FBW_B_ID],
    });
    expect(getPlan(PLAN_FBW_BODYWEIGHT_ID)!.name).toBe('Kalistenika');
    lib().deletePlan(PLAN_FBW_BODYWEIGHT_ID);
    expect(getPlan(PLAN_FBW_BODYWEIGHT_ID)).toBeDefined();
    lib().restoreBuiltinPlan(PLAN_FBW_BODYWEIGHT_ID);
    expect(getPlan(PLAN_FBW_BODYWEIGHT_ID)!.workoutIds).toEqual([FBW_A_ID, FBW_B_ID]);
    expect(getPlan(PLAN_FBW_BODYWEIGHT_ID)!.name).toBeUndefined();
  });

  it('duplicates a plan as a custom one with a "(kopia)" name', () => {
    const id = lib().duplicatePlan(PLAN_FBW_BODYWEIGHT_ID, pl)!;
    expect(getPlan(id)).toMatchObject({
      builtIn: false,
      name: 'FBW · masa ciała (kopia)',
      workoutIds: [FBW_A_ID, FBW_B_ID],
    });
  });

  it('skips workouts without exercises when suggesting', () => {
    lib().updateWorkout(FBW_A_ID, { items: [] });
    expect(nextPlanWorkoutId(getPlan(PLAN_FBW_BODYWEIGHT_ID)!)).toBe(FBW_B_ID);
  });
});
