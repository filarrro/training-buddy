import { describe, expect, it } from 'vitest';
import { BUILTIN_EXERCISES_BY_ID, BUILTIN_WORKOUTS, FBW_A_ID, FBW_B_ID } from './builtins';
import { countWorkSteps, generateSteps, restBefore, workSteps } from './generator';
import type { RestStep, Step, Workout } from './types';

const fbwA = BUILTIN_WORKOUTS.find((w) => w.id === FBW_A_ID)!;
const fbwB = BUILTIN_WORKOUTS.find((w) => w.id === FBW_B_ID)!;
const circuit = (w: Workout): Workout => ({ ...w, mode: 'circuit' });
const rests = (steps: Step[], reason?: RestStep['reason']) =>
  steps.filter((s): s is RestStep => s.kind === 'rest' && (!reason || s.reason === reason));

describe('generateSteps — straight (BR1)', () => {
  const steps = generateSteps(fbwA, BUILTIN_EXERCISES_BY_ID);

  it('FBW A has 20 work steps, 12 set rests and 4 exercise rests (AC3)', () => {
    expect(countWorkSteps(steps)).toBe(20);
    expect(rests(steps, 'sets')).toHaveLength(12);
    expect(rests(steps, 'exercises')).toHaveLength(4);
    expect(rests(steps, 'sides')).toHaveLength(0);
    expect(rests(steps)).toHaveLength(16);
  });

  it('uses default durations 90 s / 120 s', () => {
    expect(rests(steps, 'sets').every((r) => r.durationSec === 90)).toBe(true);
    expect(rests(steps, 'exercises').every((r) => r.durationSec === 120)).toBe(true);
  });

  it('never starts or ends with a rest and never has two rests in a row', () => {
    expect(steps[0]!.kind).toBe('work');
    expect(steps[steps.length - 1]!.kind).toBe('work');
    steps.forEach((s, i) => {
      if (s.kind === 'rest') expect(steps[i + 1]!.kind).toBe('work');
    });
  });

  it('unilateral exercise yields left/right per set (AC3, FR11)', () => {
    const bss = workSteps(steps).filter((s) => s.exerciseId === 'builtin:bulgarian-split-squat');
    expect(bss).toHaveLength(6);
    expect(bss.map((s) => `${s.set}${s.side}`)).toEqual(['1left', '1right', '2left', '2right', '3left', '3right']);
    expect(bss.every((s) => s.exerciseNo === 3 && s.exerciseTotal === 5 && s.setsTotal === 3)).toBe(true);
  });

  it('labels positions for "Ćwiczenie 2/5 · Seria 3/4"', () => {
    const w = workSteps(steps);
    expect(w[0]).toMatchObject({ exerciseNo: 1, exerciseTotal: 5, set: 1, setsTotal: 4, workIndex: 0 });
    expect(w[6]).toMatchObject({ exerciseId: 'builtin:dips', exerciseNo: 2, set: 3, setsTotal: 4 });
    expect(w[19]!.workIndex).toBe(19);
    expect(w[0]!.round).toBeUndefined();
  });

  it('adds side rest after left only when > 0', () => {
    const w: Workout = { ...fbwA, rest: { ...fbwA.rest, betweenSidesSec: 10 } };
    const s = generateSteps(w, BUILTIN_EXERCISES_BY_ID);
    expect(rests(s, 'sides')).toHaveLength(3);
    const idx = s.findIndex((x) => x.kind === 'work' && x.side === 'left');
    expect(s[idx + 1]).toEqual({ kind: 'rest', reason: 'sides', durationSec: 10 });
  });

  it('omits rests of 0 s', () => {
    const w: Workout = { ...fbwA, rest: { ...fbwA.rest, straight: { betweenSetsSec: 0, betweenExercisesSec: 60 } } };
    const s = generateSteps(w, BUILTIN_EXERCISES_BY_ID);
    expect(rests(s, 'sets')).toHaveLength(0);
    expect(rests(s, 'exercises')).toHaveLength(4);
  });

  it('skips items with unknown exercises and handles empty workouts', () => {
    const w: Workout = { ...fbwA, items: [{ exerciseId: 'gone', sets: 3, target: { type: 'reps', min: 1, max: 2 } }] };
    expect(generateSteps(w, BUILTIN_EXERCISES_BY_ID)).toEqual([]);
    expect(generateSteps({ ...fbwA, items: [] }, BUILTIN_EXERCISES_BY_ID)).toEqual([]);
  });

  it('single set single exercise has no rest', () => {
    const w: Workout = { ...fbwA, items: [{ ...fbwA.items[0]!, sets: 1 }] };
    expect(generateSteps(w, BUILTIN_EXERCISES_BY_ID)).toHaveLength(1);
  });
});

describe('generateSteps — circuit (BR2)', () => {
  const steps = generateSteps(circuit(fbwA), BUILTIN_EXERCISES_BY_ID);
  const work = workSteps(steps);

  it('FBW A has 20 work steps in 4 rounds, 13 in-round and 3 between-round rests (AC3)', () => {
    expect(work).toHaveLength(20);
    expect(new Set(work.map((s) => s.round))).toEqual(new Set([1, 2, 3, 4]));
    expect(work.every((s) => s.roundsTotal === 4)).toBe(true);
    expect(rests(steps, 'exercises')).toHaveLength(13);
    expect(rests(steps, 'rounds')).toHaveLength(3);
    expect(rests(steps, 'sets')).toHaveLength(0);
  });

  it('round 4 contains only pull-ups and dips (AC4)', () => {
    const r4 = work.filter((s) => s.round === 4);
    expect(r4.map((s) => s.exerciseId)).toEqual(['builtin:pullup-overhand', 'builtin:dips']);
    expect(r4.map((s) => `${s.exerciseNo}/${s.exerciseTotal}`)).toEqual(['1/2', '2/2']);
  });

  it('uses circuit durations 30 s / 120 s', () => {
    expect(rests(steps, 'exercises').every((r) => r.durationSec === 30)).toBe(true);
    expect(rests(steps, 'rounds').every((r) => r.durationSec === 120)).toBe(true);
  });

  it('unilateral exercise yields left/right in every round', () => {
    const bss = work.filter((s) => s.exerciseId === 'builtin:bulgarian-split-squat');
    expect(bss.map((s) => `${s.round}${s.side}`)).toEqual(['1left', '1right', '2left', '2right', '3left', '3right']);
  });

  it('ends with a work step', () => {
    expect(steps[steps.length - 1]!.kind).toBe('work');
  });

  it('FBW B circuit: 3 rounds of 5 (skater squat both sides)', () => {
    const s = generateSteps(circuit(fbwB), BUILTIN_EXERCISES_BY_ID);
    expect(countWorkSteps(s)).toBe(18);
    expect(rests(s, 'rounds')).toHaveLength(2);
    expect(rests(s, 'exercises')).toHaveLength(12);
  });
});

describe('restBefore', () => {
  it('returns the rest directly preceding a step', () => {
    const steps = generateSteps(fbwA, BUILTIN_EXERCISES_BY_ID);
    expect(restBefore(steps, 0)).toBe(-1);
    expect(restBefore(steps, 2)).toBe(1);
    expect(restBefore(steps, 1)).toBe(-1);
  });
});
