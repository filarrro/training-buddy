import { describe, expect, it } from 'vitest';
import { builtinWorkoutDefaults } from './builtins';
import { sanitizeLibrary, sanitizeSettings, sanitizeWorkout, validateTarget } from './validation';

describe('validation', () => {
  it('validateTarget enforces FR22 rules', () => {
    expect(validateTarget({ type: 'reps', min: 5, max: 7 })).toEqual([]);
    expect(validateTarget({ type: 'reps', min: 8, max: 7 })).toContain('repsOrder');
    expect(validateTarget({ type: 'reps', min: 0, max: 101 })).toEqual(['repsMin', 'repsMax']);
    expect(validateTarget({ type: 'time', minSec: 45, maxSec: 60, targetSec: 70 })).toEqual(['timeTarget']);
    expect(validateTarget({ type: 'time', minSec: 4, maxSec: 601, targetSec: 30 })).toEqual(['timeMin', 'timeMax']);
  });

  it('sanitizeLibrary never throws and drops invalid entries', () => {
    expect(sanitizeLibrary(null)).toEqual({ exercises: [], workouts: [], plans: [], planLast: {} });
    expect(sanitizeLibrary('garbage')).toEqual({ exercises: [], workouts: [], plans: [], planLast: {} });
    const lib = sanitizeLibrary({
      exercises: [
        { id: 'a', name: 'A', category: 'pull', unilateral: false, defaultSets: 3, defaultTarget: { type: 'reps', min: 1, max: 2 } },
        { id: 'b', name: 'B', category: 'nope', defaultSets: 3, defaultTarget: { type: 'reps', min: 1, max: 2 } },
        { id: 'builtin:plank', name: 'X', category: 'core', defaultSets: 3, defaultTarget: { type: 'reps', min: 1, max: 2 } },
      ],
      workouts: [...builtinWorkoutDefaults(), { id: 'w', items: 'x' }, 42],
    });
    expect(lib.exercises.map((e) => e.id)).toEqual(['a']);
    expect(lib.workouts.map((w) => w.id)).toEqual(builtinWorkoutDefaults().map((w) => w.id));
  });

  it('sanitizeWorkout fills missing rests with defaults and drops bad items', () => {
    const w = sanitizeWorkout({
      id: 'x',
      name: 'X',
      mode: 'weird',
      rest: { straight: { betweenSetsSec: 60 } },
      items: [
        { exerciseId: 'a', sets: 3, target: { type: 'reps', min: 1, max: 2 } },
        { exerciseId: 'b', sets: 11, target: { type: 'reps', min: 1, max: 2 } },
      ],
    })!;
    expect(w.mode).toBe('straight');
    expect(w.rest.straight).toEqual({ betweenSetsSec: 60, betweenExercisesSec: 120 });
    expect(w.rest.circuit).toEqual({ betweenExercisesSec: 30, betweenRoundsSec: 120 });
    expect(w.items).toHaveLength(1);
  });

  it('sanitizeSettings falls back per field', () => {
    const d = { lang: 'pl', theme: 'system', sound: true, countdownBeeps: true, vibration: true, keepScreenOn: true } as const;
    expect(sanitizeSettings({ lang: 'de', sound: false, vibration: 'yes', theme: 'neon' }, d)).toEqual({ ...d, sound: false });
    expect(sanitizeSettings({ theme: 'light' }, d).theme).toBe('light');
  });
});
