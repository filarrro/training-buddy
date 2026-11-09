/**
 * Pure session engine (no React, no stores). Every function takes a session + `now` (epoch ms)
 * and returns a NEW session object (or the same object when nothing changed).
 *
 * Rules: BR4 (statuses + progress), BR5 (next = first todo, rest = the rest directly before it),
 * BR6 (timers from `endsAt`), FR13 (time exercise: Start → 3 s prepare → countdown → done),
 * FR14 (back), FR15 (jump from the step list), FR16/FR21 (end early), FR20 (finished).
 */
import { generateSteps, indexById, restBefore } from '../domain/generator';
import type {
  ActiveSession,
  Exercise,
  RestStep,
  SessionStepStatus,
  Step,
  Target,
  WorkStep,
  Workout,
} from '../domain/types';

/** Fixed "Get ready" before a time countdown (D30). */
export const PREPARE_MS = 3000;

/** Session as used by the engine: ActiveSession + engine-only bookkeeping. */
export interface EngineSession extends ActiveSession {
  /** while resting: the work step that was just completed (FR14 "back" during rest returns there) */
  completedIndex?: number;
  /** status of `completedIndex` before that completion; "Back" during rest restores it (BR4) */
  completedPrevStatus?: SessionStepStatus;
  /** true once the session screen has been shown (startedAt is reset then) */
  begun?: boolean;
}

export type CompleteResult = 'done' | 'skipped';

// ---------- creation ----------

export function buildSession(workout: Workout, exercises: Exercise[], id: string, now: number): EngineSession {
  const steps = generateSteps(workout, indexById(exercises));
  const statuses: SessionStepStatus[] = steps.map(() => 'todo');
  const first = steps.findIndex((s) => s.kind === 'work');
  return {
    id,
    workout,
    exercises,
    steps,
    statuses,
    index: first < 0 ? 0 : first,
    phase: 'work',
    startedAt: now,
  };
}

// ---------- queries ----------

export function isWork(step: Step | undefined): step is WorkStep {
  return step?.kind === 'work';
}

export function isFinished(s: ActiveSession): boolean {
  return s.finishedAt !== undefined;
}

export function isResting(s: ActiveSession): boolean {
  return s.phase === 'rest' || s.phase === 'restDone';
}

/** The step the user is looking at (rest or work). */
export function currentStep(s: ActiveSession): Step | undefined {
  return s.steps[s.index];
}

/** Index of the work step that is current, or (during rest) the one coming after the rest. */
export function focusIndex(s: ActiveSession): number {
  return isResting(s) ? s.index + 1 : s.index;
}

export function currentRest(s: ActiveSession): RestStep | undefined {
  const st = s.steps[s.index];
  return st?.kind === 'rest' ? st : undefined;
}

export function targetOf(s: ActiveSession, step: WorkStep): Target {
  const item = s.workout.items[step.itemIndex];
  if (item) return item.target;
  const ex = exerciseOf(s, step);
  return ex ? ex.defaultTarget : { type: 'reps', min: 1, max: 1 };
}

export function exerciseOf(s: ActiveSession, step: WorkStep): Exercise | undefined {
  return s.exercises.find((e) => e.id === step.exerciseId);
}

/** First work step with status todo, in list order, or -1. */
export function firstTodo(s: Pick<ActiveSession, 'steps' | 'statuses'>): number {
  return s.steps.findIndex((st, i) => st.kind === 'work' && s.statuses[i] === 'todo');
}

/**
 * Where "Done" on the current work step would lead (BR5): first todo work step other than the
 * current one, or -1 (= workout finished).
 */
export function peekNext(s: ActiveSession): number {
  const cur = focusIndex(s);
  return s.steps.findIndex((st, i) => st.kind === 'work' && i !== cur && s.statuses[i] === 'todo');
}

export interface Progress {
  done: number;
  skipped: number;
  total: number;
  /** (done + skipped) / total, 0..1 (BR4) */
  value: number;
}

export function progress(s: Pick<ActiveSession, 'steps' | 'statuses'>): Progress {
  let done = 0;
  let skipped = 0;
  let total = 0;
  s.steps.forEach((st, i) => {
    if (st.kind !== 'work') return;
    total++;
    if (s.statuses[i] === 'done') done++;
    else if (s.statuses[i] === 'skipped') skipped++;
  });
  return { done, skipped, total, value: total === 0 ? 0 : (done + skipped) / total };
}

/** "Back" is possible during rest, or when a work step exists before the current one. */
export function canGoBack(s: ActiveSession): boolean {
  if (isFinished(s)) return false;
  if (isResting(s)) return true;
  return prevWorkIndex(s.steps, s.index) >= 0;
}

function prevWorkIndex(steps: readonly Step[], from: number): number {
  for (let i = from - 1; i >= 0; i--) if (steps[i]!.kind === 'work') return i;
  return -1;
}

/** Remaining ms of the running/paused timer (prepare, countdown, rest); 0 when none. */
export function remainingMs(s: ActiveSession, now: number): number {
  if (s.pausedRemainingMs !== undefined) return s.pausedRemainingMs;
  if (s.endsAt === undefined) return 0;
  return Math.max(0, s.endsAt - now);
}

/** Time over the finished rest (D16), ms. */
export function overtimeMs(s: ActiveSession, now: number): number {
  if (s.phase !== 'restDone' || s.endsAt === undefined) return 0;
  return Math.max(0, now - s.endsAt);
}

export function isPaused(s: ActiveSession): boolean {
  return s.pausedRemainingMs !== undefined;
}

/** Target seconds of the current time exercise, or 0. */
export function timeTargetSec(s: ActiveSession): number {
  const st = s.steps[s.index];
  if (!isWork(st)) return 0;
  const target = targetOf(s, st);
  return target.type === 'time' ? target.targetSec : 0;
}

// ---------- transitions ----------

function withoutTimer(s: EngineSession): EngineSession {
  const { endsAt: _e, pausedRemainingMs: _p, completedIndex: _c, completedPrevStatus: _s, ...rest } = s;
  return rest;
}

/** Show work step `index` (phase work, no timer). */
function showWork(s: EngineSession, index: number): EngineSession {
  return { ...withoutTimer(s), index, phase: 'work' };
}

function finish(s: EngineSession, now: number, endedEarly: boolean): EngineSession {
  const base = { ...withoutTimer(s), finishedAt: now };
  return endedEarly ? { ...base, endedEarly: true } : base;
}

/**
 * Move on after a work step was completed (BR5): first todo; rest = the rest step directly
 * before it in the generated list; none → finished (FR20).
 */
function moveOn(
  s: EngineSession,
  completedIndex: number,
  prevStatus: SessionStepStatus,
  now: number,
): EngineSession {
  const next = firstTodo(s);
  if (next < 0) return finish(s, now, false);
  const r = restBefore(s.steps, next);
  const rest = r >= 0 ? (s.steps[r] as RestStep) : undefined;
  if (!rest || rest.durationSec <= 0) return showWork(s, next);
  return {
    ...withoutTimer(s),
    index: r,
    phase: 'rest',
    endsAt: now + rest.durationSec * 1000,
    completedIndex,
    completedPrevStatus: prevStatus,
  };
}

/** "Done" / "Skip set" on the current work step (FR12, FR17). */
export function complete(s: EngineSession, result: CompleteResult, now: number): EngineSession {
  if (isFinished(s) || isResting(s)) return s;
  const i = s.index;
  if (!isWork(s.steps[i])) return s;
  const statuses = s.statuses.slice();
  const prev = statuses[i]!;
  // Skipping a step that was already done keeps it done (no data loss).
  statuses[i] = result === 'skipped' && prev === 'done' ? 'done' : result;
  return moveOn({ ...s, statuses }, i, prev, now);
}

/** "Skip rest" during rest, and "Next" after it ended: show the upcoming work step. */
export function skipRest(s: EngineSession): EngineSession {
  if (isFinished(s) || !isResting(s)) return s;
  return showWork(s, s.index + 1);
}

/**
 * "Back" (FR14): during rest → the step just completed (its status from before that completion is
 * restored, so a set done earlier stays done);
 * otherwise → previous work step in list order (statuses untouched).
 */
export function goBack(s: EngineSession): EngineSession {
  if (isFinished(s)) return s;
  if (isResting(s)) {
    const target = s.completedIndex ?? prevWorkIndex(s.steps, s.index);
    if (target < 0) return showWork(s, s.index + 1);
    const statuses = s.statuses.slice();
    statuses[target] = s.completedIndex === target ? (s.completedPrevStatus ?? 'todo') : 'todo';
    return showWork({ ...s, statuses }, target);
  }
  const prev = prevWorkIndex(s.steps, s.index);
  return prev < 0 ? s : showWork(s, prev);
}

/**
 * Jump from the step list (FR15, D27, D47). Forward: the current step and todo work steps
 * before the target become skipped. Backward: no status change. During rest the rest is cancelled.
 */
export function jumpTo(s: EngineSession, target: number): EngineSession {
  if (isFinished(s) || !isWork(s.steps[target])) return s;
  const ref = focusIndex(s);
  if (target === ref) return isResting(s) ? showWork(s, target) : s;
  let statuses = s.statuses;
  if (target > ref) {
    statuses = s.statuses.slice();
    for (let i = ref; i < target; i++) {
      if (s.steps[i]!.kind === 'work' && statuses[i] === 'todo') statuses[i] = 'skipped';
    }
  }
  return showWork({ ...s, statuses }, target);
}

/** "Start" on a time exercise (FR13): 3 s prepare, then the countdown. */
export function startTimer(s: EngineSession, now: number): EngineSession {
  if (isFinished(s) || s.phase !== 'work' || timeTargetSec(s) <= 0) return s;
  const { pausedRemainingMs: _p, ...rest } = s;
  return { ...rest, phase: 'prepare', endsAt: now + PREPARE_MS };
}

/** Pause prepare/countdown (D43). */
export function pauseTimer(s: EngineSession, now: number): EngineSession {
  if (isFinished(s) || (s.phase !== 'prepare' && s.phase !== 'countdown') || s.endsAt === undefined) return s;
  const { endsAt, ...rest } = s;
  return { ...rest, pausedRemainingMs: Math.max(0, endsAt - now) };
}

export function resumeTimer(s: EngineSession, now: number): EngineSession {
  if (s.pausedRemainingMs === undefined) return s;
  const { pausedRemainingMs, ...rest } = s;
  return { ...rest, endsAt: now + pausedRemainingMs };
}

/**
 * Recompute phases from timestamps (BR6): prepare → countdown → countdownDone, rest → restDone.
 * Safe to call any time (ticks, visibilitychange); returns the same object when unchanged.
 */
export function advance(s: EngineSession, now: number): EngineSession {
  let cur = s;
  for (let guard = 0; guard < 3; guard++) {
    if (isFinished(cur) || cur.endsAt === undefined || now < cur.endsAt) return cur;
    if (cur.phase === 'prepare') {
      cur = { ...cur, phase: 'countdown', endsAt: cur.endsAt + timeTargetSec(cur) * 1000 };
    } else if (cur.phase === 'countdown') {
      cur = { ...cur, phase: 'countdownDone' };
    } else if (cur.phase === 'rest') {
      cur = { ...cur, phase: 'restDone' };
    } else {
      return cur;
    }
  }
  return cur;
}

/** "End workout" confirmed (FR16/FR21). */
export function endEarly(s: EngineSession, now: number): EngineSession {
  if (isFinished(s)) return s;
  return finish(s, now, true);
}

// ---------- summary (FR20/FR21) ----------

export interface SessionSummary {
  durationSec: number;
  exercisesTotal: number;
  /** exercises with at least one done step */
  exercisesDone: number;
  /** a set (both sides for unilateral) counts as done when all its steps are done */
  setsDone: number;
  /** finished sets with at least one skipped step */
  setsSkipped: number;
  /** sets with steps never done nor skipped (only after an early end) */
  setsLeft: number;
  setsTotal: number;
}

export function summarize(s: ActiveSession, now: number = Date.now()): SessionSummary {
  const sets = new Map<string, SessionStepStatus[]>();
  const items = new Map<number, boolean>();
  s.steps.forEach((st, i) => {
    if (st.kind !== 'work') return;
    const key = `${st.itemIndex}:${st.set}`;
    const list = sets.get(key) ?? [];
    list.push(s.statuses[i]!);
    sets.set(key, list);
    items.set(st.itemIndex, (items.get(st.itemIndex) ?? false) || s.statuses[i] === 'done');
  });
  let setsDone = 0;
  let setsSkipped = 0;
  let setsLeft = 0;
  for (const list of sets.values()) {
    if (list.every((x) => x === 'done')) setsDone++;
    else if (list.some((x) => x === 'todo')) setsLeft++;
    else setsSkipped++;
  }
  const end = s.finishedAt ?? now;
  return {
    durationSec: Math.max(0, Math.round((end - s.startedAt) / 1000)),
    exercisesTotal: items.size,
    exercisesDone: [...items.values()].filter(Boolean).length,
    setsDone,
    setsSkipped,
    setsLeft,
    setsTotal: sets.size,
  };
}
