import { describe, expect, it } from 'vitest';
import { FBW_A_ID, builtinWorkoutDefaults } from '../../domain/builtins';
import {
  buildExercise,
  buildWorkout,
  digitsOnly,
  draftFromTarget,
  exerciseDraft,
  exerciseErrors,
  hasWorkoutErrors,
  itemDraft,
  moveItem,
  nameError,
  patchTargetDraft,
  targetDraftErrors,
  targetFromDraft,
  workoutDraft,
  workoutErrors,
  workoutFingerprint,
} from './forms';

const never = () => false;
const fbwA = () => builtinWorkoutDefaults().find((w) => w.id === FBW_A_ID)!;

describe('target drafts', () => {
  it('round-trips reps and time targets', () => {
    expect(targetFromDraft(draftFromTarget({ type: 'reps', min: 5, max: 7 }))).toEqual({ type: 'reps', min: 5, max: 7 });
    const time = { type: 'time', minSec: 45, maxSec: 60, targetSec: 50 } as const;
    expect(targetFromDraft(draftFromTarget(time))).toEqual(time);
  });

  it('keeps defaults for the other type so switching type yields a valid target', () => {
    const d = draftFromTarget({ type: 'reps', min: 5, max: 7 });
    expect(targetDraftErrors({ ...d, type: 'time' })).toEqual([]);
  });

  it('validates ranges and order (FR22, D41)', () => {
    const d = draftFromTarget({ type: 'reps', min: 5, max: 7 });
    expect(targetDraftErrors({ ...d, min: '' })).toContain('repsMin');
    expect(targetDraftErrors({ ...d, max: '101' })).toContain('repsMax');
    expect(targetDraftErrors({ ...d, min: '9', max: '8' })).toContain('repsOrder');
    const t = draftFromTarget({ type: 'time', minSec: 45, maxSec: 60, targetSec: 45 });
    expect(targetDraftErrors({ ...t, minSec: '4' })).toContain('timeMin');
    expect(targetDraftErrors({ ...t, maxSec: '601' })).toContain('timeMax');
    expect(targetDraftErrors({ ...t, targetSec: '61' })).toContain('timeTarget');
  });

  it('time target follows the range minimum until edited separately', () => {
    let d = draftFromTarget({ type: 'time', minSec: 45, maxSec: 60, targetSec: 45 });
    d = patchTargetDraft(d, 'minSec', '30');
    expect(d.targetSec).toBe('30');
    d = patchTargetDraft(d, 'targetSec', '40');
    d = patchTargetDraft(d, 'minSec', '35');
    expect(d.targetSec).toBe('40');
  });

  it('strips non-digits', () => {
    expect(digitsOnly('1a2-3.4 5')).toBe('1234');
  });
});

describe('names', () => {
  it('requires, limits and checks uniqueness', () => {
    expect(nameError('  ', 40, never)).toBe('nameRequired');
    expect(nameError('', 40, never, { allowEmpty: true })).toBeNull();
    expect(nameError('x'.repeat(41), 40, never)).toBe('nameTooLong');
    expect(nameError('Góra', 40, (n) => n.toLowerCase() === 'góra')).toBe('nameTaken');
  });
});

describe('exercise drafts', () => {
  it('builds a trimmed custom exercise', () => {
    const d = { ...exerciseDraft(), name: '  Wiosłowanie  ', unilateral: true, sets: 4 };
    expect(exerciseErrors(d, never)).toEqual({ name: null, target: [] });
    expect(buildExercise('x', d)).toEqual({
      id: 'x',
      builtIn: false,
      name: 'Wiosłowanie',
      category: 'pull',
      unilateral: true,
      defaultSets: 4,
      defaultTarget: { type: 'reps', min: 8, max: 12 },
    });
  });
});

describe('workout drafts', () => {
  it('requires at least one item (FR25) and reports item errors by key', () => {
    const d = workoutDraft(undefined);
    expect(workoutErrors({ ...d, name: 'Góra' }, never).noItems).toBe(true);
    const item = itemDraft({ exerciseId: 'builtin:dips', sets: 3, target: { type: 'reps', min: 5, max: 7 } });
    item.target.max = '2';
    const e = workoutErrors({ name: 'Góra', mode: 'straight', items: [item] }, never);
    expect(e.items[item.key]).toEqual(['repsOrder']);
    expect(hasWorkoutErrors(e)).toBe(true);
  });

  it('new workout gets default rests and the trimmed name', () => {
    const item = itemDraft({ exerciseId: 'builtin:dips', sets: 3, target: { type: 'reps', min: 5, max: 7 } });
    const w = buildWorkout('w1', { name: ' Góra ', mode: 'circuit', items: [item] }, undefined);
    expect(w).toMatchObject({ id: 'w1', builtIn: false, name: 'Góra', mode: 'circuit' });
    expect(w.rest.straight.betweenSetsSec).toBe(90);
    expect(w.items).toEqual([{ exerciseId: 'builtin:dips', sets: 3, target: { type: 'reps', min: 5, max: 7 } }]);
  });

  it('FBW A keeps a translated name unless the user changes it (BR11)', () => {
    const base = fbwA();
    const d = workoutDraft(base, 'FBW A');
    expect(d.name).toBe('FBW A');
    const same = buildWorkout(base.id, d, base, 'FBW A');
    expect(same.name).toBeUndefined();
    expect(same.nameKey).toBe('common.workout.fbw-a');
    expect(same.builtIn).toBe(true);
    expect(buildWorkout(base.id, { ...d, name: 'Mój FBW' }, base, 'FBW A').name).toBe('Mój FBW');
    expect(buildWorkout(base.id, { ...d, name: '' }, { ...base, name: 'Mój FBW' }, 'FBW A').name).toBeUndefined();
    expect(workoutErrors({ ...d, name: '' }, never, { builtIn: true }).name).toBeNull();
  });

  it('FBW A untouched translated name is not blocked by a custom workout with that name (AC13)', () => {
    const d = workoutDraft(fbwA(), 'FBW A');
    const taken = (n: string) => n.toLowerCase() === 'fbw a';
    expect(workoutErrors(d, taken, { builtIn: true, translatedName: 'FBW A' }).name).toBeNull();
    expect(workoutErrors(d, taken, { builtIn: true }).name).toBe('nameTaken');
    expect(workoutErrors({ ...d, name: 'fbw a' }, taken, { builtIn: true, translatedName: 'FBW A' }).name).toBe(
      'nameTaken',
    );
  });

  it('fingerprint ignores local item keys', () => {
    const base = fbwA();
    expect(workoutFingerprint(workoutDraft(base, 'FBW A'))).toBe(workoutFingerprint(workoutDraft(base, 'FBW A')));
  });

  it('moves items', () => {
    expect(moveItem(['a', 'b', 'c'], 0, 1)).toEqual(['b', 'a', 'c']);
    expect(moveItem(['a', 'b', 'c'], 2, 1)).toEqual(['a', 'c', 'b']);
    expect(moveItem(['a', 'b', 'c'], 0, -1)).toEqual(['a', 'b', 'c']);
  });
});
