import { estimateWorkoutSec } from '../../domain/estimate';
import type { Category, ExercisesById, Workout } from '../../domain/types';

export interface WorkoutStats {
  /** items with a known exercise */
  exerciseCount: number;
  /** sum of sets */
  setCount: number;
  /** rounds in circuit mode (max sets) */
  rounds: number;
  /** unique categories in item order */
  categories: Category[];
  /** FR5 estimate in seconds */
  estimateSec: number;
}

/** Summary numbers shown on the start card and in the preview. */
export function workoutStats(workout: Workout, byId: ExercisesById): WorkoutStats {
  const known = workout.items.filter((i) => byId[i.exerciseId]);
  const categories: Category[] = [];
  for (const item of known) {
    const cat = byId[item.exerciseId]!.category;
    if (!categories.includes(cat)) categories.push(cat);
  }
  return {
    exerciseCount: known.length,
    setCount: known.reduce((n, i) => n + i.sets, 0),
    rounds: known.reduce((n, i) => Math.max(n, i.sets), 0),
    categories,
    estimateSec: known.length ? estimateWorkoutSec(workout, byId) : 0,
  };
}
