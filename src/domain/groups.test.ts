import { describe, expect, it } from 'vitest';
import {
  BUILTIN_EXERCISES_BY_ID,
  BUILTIN_WORKOUTS,
  FBW_A_EXPRESS_ID,
  FBW_A_WEIGHTS_ID,
  FBW_B_EXPRESS_ID,
  FBW_B_WEIGHTS_ID,
} from './builtins';
import { generateSteps, workSteps } from './generator';
import { removeItems } from './items';
import type { RestStep, Step, Workout, WorkoutItem } from './types';
import { sanitizeWorkout } from './validation';

const w = (id: string) => BUILTIN_WORKOUTS.find((x) => x.id === id)!;
const steps = (wk: Workout) => generateSteps(wk, BUILTIN_EXERCISES_BY_ID);
const rests = (s: Step[]) => s.filter((x): x is RestStep => x.kind === 'rest');
const names = (s: Step[]) =>
  s.map((x) =>
    x.kind === 'work' ? `${x.exerciseId.slice(8)}${x.side ? `:${x.side[0]}` : ''}` : `rest${x.durationSec}`,
  );

describe('weighted built-ins: linked groups and per-item rests', () => {
  it('all built-in items reference built-in exercises', () => {
    for (const wk of BUILTIN_WORKOUTS)
      for (const i of wk.items) expect(BUILTIN_EXERCISES_BY_ID[i.exerciseId]).toBeDefined();
  });

  it('FBW A: 3 × 5×(4–6) with 3 min, two supersets of 3 rounds with 2 min, knee raises', () => {
    const s = steps(w(FBW_A_WEIGHTS_ID));
    expect(workSteps(s)).toHaveLength(30);
    const r = rests(s);
    expect(r.filter((x) => x.durationSec === 180)).toHaveLength(15);
    expect(r.filter((x) => x.durationSec === 120)).toHaveLength(8);
    expect(r).toHaveLength(23);
    // superset: curl → french press back-to-back, then 2 min
    const seq = names(s);
    const i = seq.indexOf('barbell-curl');
    expect(seq.slice(i, i + 4)).toEqual(['barbell-curl', 'barbell-french-press', 'rest120', 'barbell-curl']);
    const curl = workSteps(s).find((x) => x.exerciseId === 'builtin:barbell-curl')!;
    expect(curl).toMatchObject({
      group: 'superset',
      round: 1,
      roundsTotal: 3,
      exerciseNo: 4,
      exerciseTotal: 8,
    });
    const squat = workSteps(s)[0]!;
    expect(squat.group).toBeUndefined();
    expect(squat).toMatchObject({ set: 1, setsTotal: 5, exerciseNo: 1 });
  });

  it('FBW B: unilateral curl in a superset (left, right, french press, rest), side plank per side', () => {
    const s = steps(w(FBW_B_WEIGHTS_ID));
    expect(workSteps(s)).toHaveLength(33);
    const seq = names(s);
    const i = seq.indexOf('db-supinated-curl:l');
    expect(seq.slice(i, i + 5)).toEqual([
      'db-supinated-curl:l',
      'db-supinated-curl:r',
      'db-french-press-standing',
      'rest120',
      'db-supinated-curl:l',
    ]);
    expect(rests(s).filter((x) => x.durationSec === 210)).toHaveLength(15);
    expect(seq.filter((x) => x.startsWith('side-plank'))).toHaveLength(6);
  });

  it('express A: two circuits (5 rounds / 3.5 min, 3 rounds / 2.5 min)', () => {
    const s = steps(w(FBW_A_EXPRESS_ID));
    expect(workSteps(s)).toHaveLength(15 + 12);
    const first = workSteps(s).slice(0, 3);
    expect(first.map((x) => x.group)).toEqual(['circuit', 'circuit', 'circuit']);
    expect(first[0]).toMatchObject({ round: 1, roundsTotal: 5 });
    const r = rests(s);
    expect(r.filter((x) => x.durationSec === 210)).toHaveLength(5); // 4 between rounds + 1 before circuit 2
    expect(r.filter((x) => x.durationSec === 150)).toHaveLength(2); // none after the very last step
    expect(r.filter((x) => x.reason === 'rounds')).toHaveLength(4 + 2);
  });

  it('split A/B: one block per exercise with 3 min / 2 min rests; lunges per leg', () => {
    const a = steps(w('builtin:split-a'));
    // pull-ups, row, pulldown 5×; RDL 3×; lunges 3× left/right; two curls 3×; climbers 3×
    expect(workSteps(a)).toHaveLength(15 + 3 + 6 + 3 + 3 + 3);
    expect(workSteps(a).every((x) => x.group === undefined)).toBe(true);
    const b = steps(w('builtin:split-b'));
    expect(workSteps(b)).toHaveLength(5 + 3 + 5 + 3 + 5 + 5 + 3 + 3 + 4);
    // 4 heavy 5×5 blocks: 4 rests between sets + 1 before the next exercise, 3:00 each
    expect(rests(b).filter((x) => x.durationSec === 180)).toHaveLength(4 * 5);
  });

  it('PPL C: heavy blocks, then knee raise → jackknife → side plank circuit (3 rounds, 2:30)', () => {
    const c = steps(w('builtin:ppl-c'));
    const seq = names(c);
    const i = seq.indexOf('hanging-knee-raise');
    expect(seq.slice(i, i + 6)).toEqual([
      'hanging-knee-raise',
      'jackknife',
      'side-plank:l',
      'side-plank:r',
      'rest150',
      'hanging-knee-raise',
    ]);
    const plank = workSteps(c).find((x) => x.exerciseId === 'builtin:side-plank')!;
    expect(plank).toMatchObject({ group: 'circuit', round: 1, roundsTotal: 3 });
    expect(seq[seq.length - 1]).toBe('side-plank:r');
    const curl = workSteps(steps(w('builtin:ppl-b'))).filter((x) => x.exerciseId === 'builtin:db-supinated-curl');
    expect(curl).toHaveLength(10); // 5 sets × left/right
  });

  it('express B: overhead press → squat → pull-up circuit first', () => {
    const s = steps(w(FBW_B_EXPRESS_ID));
    expect(names(s).slice(0, 4)).toEqual(['overhead-press', 'back-squat', 'pullup', 'rest210']);
  });

  it('circuit mode ignores links and per-item rests', () => {
    const wk = { ...w(FBW_A_WEIGHTS_ID), mode: 'circuit' as const };
    const s = steps(wk);
    expect(workSteps(s).every((x) => x.group === undefined)).toBe(true);
    expect(rests(s).every((x) => [30, 120].includes(x.durationSec))).toBe(true);
  });

  it('items without own rests behave exactly as before (bodyweight FBW A)', () => {
    const s = steps(w('builtin:fbw-a'));
    expect(workSteps(s)).toHaveLength(20);
    expect(rests(s).filter((x) => x.reason === 'sets')).toHaveLength(12);
    expect(rests(s).filter((x) => x.reason === 'exercises')).toHaveLength(4);
  });
});

describe('removeItems keeps groups consistent', () => {
  const it3 = (id: string, extra: Partial<WorkoutItem> = {}): WorkoutItem => ({
    exerciseId: id,
    sets: 3,
    target: { type: 'reps', min: 8, max: 12 },
    ...extra,
  });

  it('removing the end of a group makes the previous item the end and keeps the group rest', () => {
    const items = [it3('a', { linkNext: true }), it3('b', { restSec: 120 }), it3('c')];
    const out = removeItems(items, (i) => i.exerciseId === 'b');
    expect(out).toEqual([it3('a', { restSec: 120 }), it3('c')]);
  });

  it('removing the middle of a group keeps the chain', () => {
    const items = [it3('a', { linkNext: true }), it3('b', { linkNext: true }), it3('c', { restSec: 90 })];
    expect(removeItems(items, (i) => i.exerciseId === 'b')).toEqual([
      it3('a', { linkNext: true }),
      it3('c', { restSec: 90 }),
    ]);
  });

  it('a link on the last item is dropped', () => {
    expect(removeItems([it3('a'), it3('b', { linkNext: true }), it3('c')], (i) => i.exerciseId === 'c')).toEqual([
      it3('a'),
      it3('b'),
    ]);
  });
});

describe('validation of new item fields', () => {
  it('keeps restSec, linkNext and note keys; drops bad values', () => {
    const wk = sanitizeWorkout({
      id: 'x',
      name: 'X',
      mode: 'straight',
      noteKey: 'common.note.warmup',
      items: [
        {
          exerciseId: 'a',
          sets: 3,
          target: { type: 'reps', min: 1, max: 2 },
          linkNext: true,
          restSec: 9999,
          noteKey: 'evil',
        },
        {
          exerciseId: 'b',
          sets: 3,
          target: { type: 'reps', min: 1, max: 2 },
          restSec: 120,
          linkNext: true,
        },
      ],
    })!;
    expect(wk.noteKey).toBe('common.note.warmup');
    expect(wk.items[0]).toEqual({
      exerciseId: 'a',
      sets: 3,
      target: { type: 'reps', min: 1, max: 2 },
      linkNext: true,
    });
    expect(wk.items[1]).toEqual({
      exerciseId: 'b',
      sets: 3,
      target: { type: 'reps', min: 1, max: 2 },
      restSec: 120,
    });
  });
});
