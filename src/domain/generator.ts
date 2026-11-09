import type { ExercisesById, RestReason, RestStep, Step, WorkStep, Workout } from './types';

interface PlannedRest {
  reason: RestReason;
  durationSec: number;
}

interface PlannedWork {
  step: Omit<WorkStep, 'workIndex'>;
  /** rest that follows this work step (before the next work step), if any */
  restAfter: PlannedRest | null;
}

function restDuration(workout: Workout, reason: RestReason): number {
  const r = workout.rest;
  switch (reason) {
    case 'sides':
      return r.betweenSidesSec;
    case 'sets':
      return r.straight.betweenSetsSec;
    case 'exercises':
      return workout.mode === 'circuit' ? r.circuit.betweenExercisesSec : r.straight.betweenExercisesSec;
    case 'rounds':
      return r.circuit.betweenRoundsSec;
  }
}

function planned(workout: Workout, reason: RestReason): PlannedRest {
  return { reason, durationSec: restDuration(workout, reason) };
}

/** Items whose exercise exists, with their original index. */
function resolvedItems(workout: Workout, exercisesById: ExercisesById) {
  return workout.items
    .map((item, itemIndex) => ({ item, itemIndex, exercise: exercisesById[item.exerciseId] }))
    .filter((x) => x.exercise !== undefined && x.item.sets > 0);
}

type Resolved = ReturnType<typeof resolvedItems>[number];

/**
 * Splits items into blocks: consecutive items chained with `linkNext` form one group
 * (superset / circuit block); every other item is a block of its own.
 */
export function blocksOf<T extends { item: { linkNext?: boolean } }>(items: readonly T[]): T[][] {
  const blocks: T[][] = [];
  let cur: T[] = [];
  items.forEach((x, i) => {
    cur.push(x);
    if (!x.item.linkNext || i === items.length - 1) {
      blocks.push(cur);
      cur = [];
    }
  });
  return blocks;
}

/**
 * Straight mode (BR1) with optional per-item rests and linked groups:
 * - single item: all sets, rest `restSec ?? betweenSetsSec` between sets and
 *   `restSec ?? betweenExercisesSec` before the next block;
 * - linked group: rounds of one set of each item back-to-back (no rest inside a round except
 *   side switches), then the group rest (`restSec` of its last item) after every round.
 */
function planStraight(workout: Workout, exercisesById: ExercisesById): PlannedWork[] {
  const items = resolvedItems(workout, exercisesById);
  const blocks = blocksOf(items);
  const out: PlannedWork[] = [];
  const pos = new Map<Resolved, number>(items.map((x, i) => [x, i]));
  const sidesOf = (x: Resolved) => (x.exercise!.unilateral ? (['left', 'right'] as const) : [undefined]);
  const sideRest = planned(workout, 'sides');

  blocks.forEach((block) => {
    const last = block[block.length - 1]!;
    const own = last.item.restSec;
    const betweenSets: PlannedRest = own !== undefined ? { reason: 'sets', durationSec: own } : planned(workout, 'sets');
    const afterBlock: PlannedRest =
      own !== undefined ? { reason: 'exercises', durationSec: own } : planned(workout, 'exercises');

    if (block.length === 1) {
      const x = block[0]!;
      const sides = sidesOf(x);
      for (let set = 1; set <= x.item.sets; set++) {
        sides.forEach((side, sideIdx) => {
          let restAfter: PlannedRest;
          if (sideIdx < sides.length - 1) restAfter = sideRest;
          else if (set < x.item.sets) restAfter = betweenSets;
          else restAfter = afterBlock;
          out.push({
            step: {
              kind: 'work',
              itemIndex: x.itemIndex,
              exerciseId: x.item.exerciseId,
              set,
              setsTotal: x.item.sets,
              exerciseNo: pos.get(x)! + 1,
              exerciseTotal: items.length,
              ...(side ? { side } : {}),
            },
            restAfter,
          });
        });
      }
      return;
    }

    const group = block.length === 2 ? 'superset' : 'circuit';
    const rounds = block.reduce((m, x) => Math.max(m, x.item.sets), 0);
    const afterRound: PlannedRest = own !== undefined ? { reason: 'rounds', durationSec: own } : planned(workout, 'sets');
    for (let round = 1; round <= rounds; round++) {
      const inRound = block.filter((x) => x.item.sets >= round);
      inRound.forEach((x, idx) => {
        const sides = sidesOf(x);
        sides.forEach((side, sideIdx) => {
          let restAfter: PlannedRest | null;
          if (sideIdx < sides.length - 1) restAfter = sideRest;
          else if (idx < inRound.length - 1) restAfter = null; // back-to-back inside the round
          else if (round < rounds) restAfter = afterRound;
          else restAfter = afterBlock;
          out.push({
            step: {
              kind: 'work',
              itemIndex: x.itemIndex,
              exerciseId: x.item.exerciseId,
              set: round,
              setsTotal: x.item.sets,
              exerciseNo: pos.get(x)! + 1,
              exerciseTotal: items.length,
              group,
              round,
              roundsTotal: rounds,
              ...(side ? { side } : {}),
            },
            restAfter,
          });
        });
      });
    }
  });
  return out;
}

function planCircuit(workout: Workout, exercisesById: ExercisesById): PlannedWork[] {
  const items = resolvedItems(workout, exercisesById);
  const rounds = items.reduce((m, x) => Math.max(m, x.item.sets), 0);
  const out: PlannedWork[] = [];
  for (let round = 1; round <= rounds; round++) {
    const inRound = items.filter((x) => x.item.sets >= round);
    inRound.forEach(({ item, itemIndex, exercise }, pos) => {
      const sides = exercise!.unilateral ? (['left', 'right'] as const) : [undefined];
      sides.forEach((side, sideIdx) => {
        const lastSide = sideIdx === sides.length - 1;
        let restAfter: PlannedRest | null;
        if (!lastSide) restAfter = planned(workout, 'sides');
        else if (pos < inRound.length - 1) restAfter = planned(workout, 'exercises');
        else restAfter = planned(workout, 'rounds');
        out.push({
          step: {
            kind: 'work',
            itemIndex,
            exerciseId: item.exerciseId,
            set: round,
            setsTotal: item.sets,
            exerciseNo: pos + 1,
            exerciseTotal: inRound.length,
            round,
            roundsTotal: rounds,
            ...(side ? { side } : {}),
          },
          restAfter,
        });
      });
    });
  }
  return out;
}

/**
 * Flattens a workout into steps (BR1 straight with linked groups / BR2 circuit).
 * Rests of 0 s are omitted; there is never a rest after the last work step.
 * Items whose exercise is unknown are skipped.
 */
export function generateSteps(workout: Workout, exercisesById: ExercisesById): Step[] {
  const plan =
    workout.mode === 'circuit' ? planCircuit(workout, exercisesById) : planStraight(workout, exercisesById);
  const steps: Step[] = [];
  plan.forEach((p, i) => {
    steps.push({ ...p.step, workIndex: i });
    const isLast = i === plan.length - 1;
    if (!isLast && p.restAfter && p.restAfter.durationSec > 0) {
      const rest: RestStep = { kind: 'rest', reason: p.restAfter.reason, durationSec: p.restAfter.durationSec };
      steps.push(rest);
    }
  });
  return steps;
}

export function workSteps(steps: readonly Step[]): WorkStep[] {
  return steps.filter((s): s is WorkStep => s.kind === 'work');
}

export function countWorkSteps(steps: readonly Step[]): number {
  return steps.reduce((n, s) => n + (s.kind === 'work' ? 1 : 0), 0);
}

/** Index of the rest step directly preceding steps[index], or -1 (BR5). */
export function restBefore(steps: readonly Step[], index: number): number {
  return index > 0 && steps[index - 1]?.kind === 'rest' ? index - 1 : -1;
}

/** Map of entities by id. */
export function indexById<T extends { id: string }>(items: readonly T[]): Record<string, T> {
  return Object.fromEntries(items.map((e) => [e.id, e]));
}
