import { describe, expect, it } from 'vitest';
import { makeT } from '../i18n/core';
import { BUILTIN_EXERCISES_BY_ID, BUILTIN_WORKOUTS, FBW_A_ID } from './builtins';
import { estimateWorkoutSec, formatEstimate } from './estimate';
import {
  exerciseName,
  formatClock,
  formatDuration,
  formatOvertime,
  formatRange,
  formatSetsTarget,
  formatTarget,
  formatTimeRangeHint,
  remainingSec,
  sideLabel,
  workoutName,
} from './format';

const pl = makeT('pl');
const en = makeT('en');
const reps = { type: 'reps', min: 5, max: 7 } as const;
const time = { type: 'time', minSec: 45, maxSec: 60, targetSec: 45 } as const;

describe('format', () => {
  it('formats ranges and targets (FR7)', () => {
    expect(formatRange(5, 7)).toBe('5–7');
    expect(formatRange(10, 10)).toBe('10');
    expect(formatSetsTarget(4, reps, pl)).toBe('4 × 5–7 powt.');
    expect(formatSetsTarget(3, time, pl)).toBe('3 × 45 s');
    expect(formatSetsTarget(3, { type: 'reps', min: 6, max: 8 }, pl, { unilateral: true, category: 'legs' })).toBe(
      '3 × 6–8 powt. na nogę',
    );
    expect(formatTarget(reps, en, { unilateral: true, category: 'push' })).toBe('5–7 reps per side');
    expect(formatTarget({ type: 'reps', min: 1, max: 1 }, en)).toBe('1 rep');
    expect(formatTarget({ type: 'reps', min: 1, max: 2 }, en)).toBe('1–2 reps');
    expect(formatTarget({ type: 'reps', min: 1, max: 1 }, pl)).toBe('1 powt.');
    expect(en('session.progressValue', { done: 1, count: 1 })).toBe('1 of 1 step');
    expect(en('session.progressValue', { done: 0, count: 20 })).toBe('0 of 20 steps');
    expect(pl('session.progressValue', { done: 1, count: 1 })).toBe('1 z 1 kroku');
    expect(pl('session.progressValue', { done: 4, count: 22 })).toBe('4 z 22 kroków');
    expect(formatTimeRangeHint(time, pl)).toBe('zakres 45–60 s');
    expect(formatTimeRangeHint(reps, pl)).toBeNull();
  });

  it('side labels use leg for legs/posterior (FR11)', () => {
    expect(sideLabel('left', 'legs', pl)).toBe('Lewa noga');
    expect(sideLabel('right', 'posterior', pl)).toBe('Prawa noga');
    expect(sideLabel('left', 'core', en)).toBe('Left side');
  });

  it('clock formatting', () => {
    expect(formatClock(90)).toBe('1:30');
    expect(formatClock(5)).toBe('0:05');
    expect(formatClock(-3)).toBe('0:00');
    expect(formatClock(3725)).toBe('1:02:05');
    expect(formatOvertime(12)).toBe('+0:12');
    expect(remainingSec(89_001)).toBe(90);
    expect(remainingSec(-5)).toBe(0);
  });

  it('durations with plurals', () => {
    expect(formatDuration(45, pl)).toBe('45 s');
    expect(formatDuration(32 * 60, pl)).toBe('32 min');
    expect(formatDuration(65 * 60, en)).toBe('1 h 5 min');
  });

  it('names: translated built-ins, user names verbatim', () => {
    const plank = BUILTIN_EXERCISES_BY_ID['builtin:plank']!;
    expect(exerciseName(plank, pl)).toBe('Plank (deska)');
    expect(exerciseName(plank, en)).toBe('Plank');
    expect(workoutName(BUILTIN_WORKOUTS.find((w) => w.id === FBW_A_ID)!, en)).toBe('FBW A · bodyweight');
    expect(workoutName({ ...BUILTIN_WORKOUTS.find((w) => w.id === FBW_A_ID)!, name: 'Mój A' }, en)).toBe('Mój A');
  });
});

describe('estimate (FR5)', () => {
  it('FBW A classic: work + rests', () => {
    // 17 reps steps × 40 + 3 plank × 45 = 680 + 135; rests 12×90 + 4×120 = 1080 + 480
    expect(estimateWorkoutSec(BUILTIN_WORKOUTS.find((w) => w.id === FBW_A_ID)!, BUILTIN_EXERCISES_BY_ID)).toBe(815 + 1560);
    expect(formatEstimate(2375, pl)).toBe('~40 min');
  });
});
