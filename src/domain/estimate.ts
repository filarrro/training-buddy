import { generateSteps } from './generator';
import type { ExercisesById, Workout } from './types';
import type { TFunction } from '../i18n/core';

/** Assumed duration of one set of a reps exercise (FR5). */
export const REPS_SET_SEC = 40;

/**
 * FR5: work steps × assumed set time (40 s for reps, target for time) + sum of rests.
 * Returns seconds.
 */
export function estimateWorkoutSec(workout: Workout, exercisesById: ExercisesById): number {
  const steps = generateSteps(workout, exercisesById);
  let total = 0;
  for (const s of steps) {
    if (s.kind === 'rest') total += s.durationSec;
    else {
      const target = workout.items[s.itemIndex]!.target;
      total += target.type === 'time' ? target.targetSec : REPS_SET_SEC;
    }
  }
  return total;
}

/** "~35 min" (at least 1 min). */
export function formatEstimate(totalSec: number, t: TFunction): string {
  return t('common.duration.approxMin', { count: Math.max(1, Math.round(totalSec / 60)) });
}
