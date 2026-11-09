import { describe, expect, it } from 'vitest';
import { BUILTIN_EXERCISES, BUILTIN_WORKOUTS, FBW_A_ID } from '../domain/builtins';
import type { WorkStep, Workout } from '../domain/types';
import {
  PREPARE_MS,
  advance,
  buildSession,
  canGoBack,
  complete,
  endEarly,
  firstTodo,
  goBack,
  isFinished,
  jumpTo,
  overtimeMs,
  pauseTimer,
  peekNext,
  progress,
  remainingMs,
  resumeTimer,
  skipRest,
  startTimer,
  summarize,
} from './engine';
import type { EngineSession } from './engine';

const fbwA = BUILTIN_WORKOUTS.find((w) => w.id === FBW_A_ID)!;
const T0 = 1_000_000;

function make(w: Workout = fbwA): EngineSession {
  return buildSession(w, [...BUILTIN_EXERCISES], 'test', T0);
}

/** Step index of the n-th work step matching the predicate. */
function workIdx(s: EngineSession, pred: (w: WorkStep) => boolean): number {
  return s.steps.findIndex((st) => st.kind === 'work' && pred(st));
}
const byEx = (s: EngineSession, exerciseId: string, set: number, side?: 'left' | 'right') =>
  workIdx(s, (w) => w.exerciseId === exerciseId && w.set === set && (side ? w.side === side : true));

const PULL = 'builtin:pullup-overhand';
const DIPS = 'builtin:dips';
const BSS = 'builtin:bulgarian-split-squat';
const PLANK = 'builtin:plank';
const NORDIC = 'builtin:nordic-curl';

const cur = (s: EngineSession) => s.steps[s.index]!;
const curWork = (s: EngineSession) => cur(s) as WorkStep;

/** "Done" + skip any rest that follows. */
function doneAndSkip(s: EngineSession, now = T0): EngineSession {
  const n = complete(s, 'done', now);
  return n.phase === 'rest' ? skipRest(n) : n;
}

describe('session creation (BR3)', () => {
  it('starts at the first work step with all statuses todo', () => {
    const s = make();
    expect(s.index).toBe(0);
    expect(s.phase).toBe('work');
    expect(curWork(s).exerciseId).toBe(PULL);
    expect(progress(s)).toMatchObject({ done: 0, skipped: 0, total: 20, value: 0 });
  });
});

describe('complete + rest (BR5, FR18, AC5)', () => {
  it('"Done" starts the rest between sets (90 s) with endsAt', () => {
    const s = complete(make(), 'done', T0);
    expect(s.phase).toBe('rest');
    expect(cur(s)).toMatchObject({ kind: 'rest', reason: 'sets', durationSec: 90 });
    expect(s.endsAt).toBe(T0 + 90_000);
    expect(s.completedIndex).toBe(0);
    expect(progress(s).done).toBe(1);
  });

  it('after the last set of an exercise the rest is between exercises (120 s)', () => {
    let s = make();
    for (let i = 0; i < 3; i++) s = doneAndSkip(s);
    s = complete(s, 'done', T0);
    expect(cur(s)).toMatchObject({ kind: 'rest', reason: 'exercises', durationSec: 120 });
    s = skipRest(s);
    expect(curWork(s)).toMatchObject({ exerciseId: DIPS, set: 1 });
  });

  it('rest ends from timestamps (BR6) and counts overtime (D16, EC6)', () => {
    let s = complete(make(), 'done', T0);
    expect(advance(s, T0 + 89_000)).toBe(s);
    expect(remainingMs(s, T0 + 30_000)).toBe(60_000);
    s = advance(s, T0 + 102_000);
    expect(s.phase).toBe('restDone');
    expect(overtimeMs(s, T0 + 102_000)).toBe(12_000);
    s = skipRest(s); // "Next"
    expect(s.phase).toBe('work');
    expect(curWork(s)).toMatchObject({ exerciseId: PULL, set: 2 });
    expect(s.endsAt).toBeUndefined();
  });

  it('"Skip rest" shows the next step immediately (AC7)', () => {
    const s = skipRest(complete(make(), 'done', T0));
    expect(s.phase).toBe('work');
    expect(curWork(s)).toMatchObject({ exerciseId: PULL, set: 2 });
  });

  it('unilateral: separate left/right steps, no rest between sides by default (FR11)', () => {
    let s = make();
    s = jumpTo(s, byEx(s, BSS, 1, 'left'));
    expect(curWork(s).side).toBe('left');
    s = complete(s, 'done', T0);
    expect(s.phase).toBe('work');
    expect(curWork(s)).toMatchObject({ exerciseId: BSS, set: 1, side: 'right' });
  });

  it('side-switch rest is used when configured', () => {
    const w: Workout = { ...fbwA, rest: { ...fbwA.rest, betweenSidesSec: 15 } };
    let s = make(w);
    s = jumpTo(s, byEx(s, BSS, 1, 'left'));
    s = complete(s, 'done', T0);
    expect(cur(s)).toMatchObject({ kind: 'rest', reason: 'sides', durationSec: 15 });
  });

  it('"Skip set" marks skipped and moves on like done (FR17)', () => {
    const s = complete(make(), 'skipped', T0);
    expect(s.statuses[0]).toBe('skipped');
    expect(s.phase).toBe('rest');
    expect(progress(s)).toMatchObject({ done: 0, skipped: 1, value: 1 / 20 });
  });

  it('rest actions are ignored outside rest; complete is ignored during rest', () => {
    const s = make();
    expect(skipRest(s)).toBe(s);
    const r = complete(s, 'done', T0);
    expect(complete(r, 'done', T0)).toBe(r);
  });
});

describe('back (FR14, AC7, EC3)', () => {
  it('from set 2 goes back to set 1 of the same exercise', () => {
    let s = doneAndSkip(make());
    expect(curWork(s).set).toBe(2);
    s = goBack(s);
    expect(curWork(s)).toMatchObject({ exerciseId: PULL, set: 1 });
    expect(s.statuses[s.index]).toBe('done'); // status kept outside rest
  });

  it('from the first set goes to the last step of the previous exercise', () => {
    let s = make();
    s = jumpTo(s, byEx(s, NORDIC, 1));
    s = goBack(s);
    expect(curWork(s)).toMatchObject({ exerciseId: BSS, set: 3, side: 'right' });
  });

  it('is impossible on the very first step', () => {
    const s = make();
    expect(canGoBack(s)).toBe(false);
    expect(goBack(s)).toBe(s);
  });

  it('during rest returns to the step just completed and makes it todo', () => {
    let s = complete(make(), 'done', T0);
    expect(canGoBack(s)).toBe(true);
    s = goBack(s);
    expect(s.phase).toBe('work');
    expect(s.index).toBe(0);
    expect(s.statuses[0]).toBe('todo');
    expect(s.endsAt).toBeUndefined();
  });

  it('during rest keeps a step that was done before this completion done (BR4)', () => {
    let s = doneAndSkip(make()); // pull-ups set 1 done → set 2
    s = goBack(s); // set 1 (still done)
    s = complete(s, 'done', T0); // "Done" again → rest
    expect(s.phase).toBe('rest');
    s = goBack(s);
    expect(curWork(s)).toMatchObject({ exerciseId: PULL, set: 1 });
    expect(s.statuses[byEx(s, PULL, 1)]).toBe('done');
    s = jumpTo(s, byEx(s, DIPS, 1));
    expect(s.statuses[byEx(s, PULL, 1)]).toBe('done');
    expect(progress(s).done).toBe(1);
  });

  it('after the rest ended (restDone) still returns to the step just completed (FR14, AC9)', () => {
    let s = make();
    s = jumpTo(s, byEx(s, DIPS, 1));
    s = doneAndSkip(s); // dips 1 done → dips 2
    s = jumpTo(s, byEx(s, PULL, 2));
    s = complete(s, 'done', T0);
    s = advance(s, T0 + 91_000);
    expect(s.phase).toBe('restDone');
    expect(canGoBack(s)).toBe(true);
    s = goBack(s);
    expect(curWork(s)).toMatchObject({ exerciseId: PULL, set: 2 });
    expect(s.statuses[byEx(s, PULL, 2)]).toBe('skipped'); // status from before the mistaken "Done"
  });

  it('back then done again goes to the first todo, not through done steps (EC3)', () => {
    let s = make();
    s = doneAndSkip(s); // set 1 done
    s = doneAndSkip(s); // set 2 done → set 3
    s = goBack(s); // set 2
    s = goBack(s); // set 1
    expect(curWork(s).set).toBe(1);
    s = complete(s, 'done', T0);
    expect(s.phase).toBe('rest');
    s = skipRest(s);
    expect(curWork(s)).toMatchObject({ exerciseId: PULL, set: 3 });
  });
});

describe('jump from the step list (FR15, AC8, AC9, EC1, EC2, EC5)', () => {
  it('AC8: pull-ups set 1 → dips set 1 skips pull-ups 1–4 and counts them in progress', () => {
    let s = make();
    s = jumpTo(s, byEx(s, DIPS, 1));
    expect(curWork(s)).toMatchObject({ exerciseId: DIPS, set: 1 });
    for (let set = 1; set <= 4; set++) expect(s.statuses[byEx(s, PULL, set)]).toBe('skipped');
    expect(progress(s)).toMatchObject({ done: 0, skipped: 4, value: 4 / 20 });
  });

  it('AC9: after dips 1, pick pull-ups set 2, "Done" → rest → dips set 2', () => {
    let s = make();
    s = jumpTo(s, byEx(s, DIPS, 1));
    s = doneAndSkip(s);
    expect(curWork(s)).toMatchObject({ exerciseId: DIPS, set: 2 });
    s = jumpTo(s, byEx(s, PULL, 2)); // backward jump: no status change
    expect(s.statuses[byEx(s, DIPS, 2)]).toBe('todo');
    s = complete(s, 'done', T0);
    expect(s.statuses[byEx(s, PULL, 2)]).toBe('done');
    expect(s.phase).toBe('rest');
    expect(cur(s)).toMatchObject({ kind: 'rest', reason: 'sets', durationSec: 90 });
    s = skipRest(s);
    expect(curWork(s)).toMatchObject({ exerciseId: DIPS, set: 2 });
  });

  it('EC1: skipped steps are not revisited automatically', () => {
    let s = make();
    s = jumpTo(s, byEx(s, PLANK, 1));
    expect(firstTodo(s)).toBe(byEx(s, PLANK, 1));
    s = doneAndSkip(s);
    expect(curWork(s)).toMatchObject({ exerciseId: PLANK, set: 2 });
  });

  it('EC2: done on a skipped step chosen from the list → back to the first todo', () => {
    let s = make();
    s = jumpTo(s, byEx(s, DIPS, 1)); // pull-ups 1-4 skipped
    s = jumpTo(s, byEx(s, PULL, 3));
    s = complete(s, 'done', T0);
    expect(s.statuses[byEx(s, PULL, 3)]).toBe('done');
    // dips set 1 is the first todo; the step before it in the list is a 120 s exercise rest
    expect(cur(s)).toMatchObject({ kind: 'rest', reason: 'exercises', durationSec: 120 });
    expect(skipRest(s).index).toBe(byEx(s, DIPS, 1));
  });

  it('EC5: jumping during rest cancels the rest and shows the chosen step', () => {
    let s = complete(make(), 'done', T0);
    s = jumpTo(s, byEx(s, DIPS, 2));
    expect(s.phase).toBe('work');
    expect(s.endsAt).toBeUndefined();
    expect(curWork(s)).toMatchObject({ exerciseId: DIPS, set: 2 });
    // the step that followed the rest and everything up to dips 2 is skipped; set 1 stays done
    expect(s.statuses[byEx(s, PULL, 1)]).toBe('done');
    expect(s.statuses[byEx(s, PULL, 2)]).toBe('skipped');
    expect(s.statuses[byEx(s, DIPS, 1)]).toBe('skipped');
  });

  it('jumping during rest to the upcoming step just ends the rest', () => {
    let s = complete(make(), 'done', T0);
    s = jumpTo(s, byEx(s, PULL, 2));
    expect(s.phase).toBe('work');
    expect(s.statuses[byEx(s, PULL, 2)]).toBe('todo');
  });

  it('jumping forward never turns a done step into skipped', () => {
    let s = doneAndSkip(make());
    s = goBack(s); // pull-ups 1 (done) is current
    s = jumpTo(s, byEx(s, DIPS, 1));
    expect(s.statuses[byEx(s, PULL, 1)]).toBe('done');
    expect(s.statuses[byEx(s, PULL, 2)]).toBe('skipped');
  });

  it('ignores rest steps and unknown indexes', () => {
    const s = make();
    expect(jumpTo(s, 1)).toBe(s); // index 1 is a rest
    expect(jumpTo(s, 999)).toBe(s);
  });
});

describe('finish (FR20, FR21, EC4, AC10, AC11)', () => {
  it('finishing the last todo step finishes without a rest', () => {
    let s = make();
    let guard = 0;
    while (!isFinished(s) && guard++ < 100) s = doneAndSkip(s, T0 + 60_000);
    expect(isFinished(s)).toBe(true);
    expect(s.endedEarly).toBeUndefined();
    expect(s.finishedAt).toBe(T0 + 60_000);
    expect(progress(s)).toMatchObject({ done: 20, value: 1 });
    const sum = summarize(s);
    expect(sum).toMatchObject({ setsDone: 17, setsSkipped: 0, setsLeft: 0, setsTotal: 17, exercisesDone: 5 });
    expect(sum.durationSec).toBe(60);
  });

  it('EC4: only done/skipped left → finished, summary shows skipped', () => {
    let s = make();
    s = jumpTo(s, byEx(s, PLANK, 3)); // everything before skipped
    expect(peekNext(s)).toBe(-1);
    s = complete(s, 'done', T0);
    expect(isFinished(s)).toBe(true);
    const sum = summarize(s);
    expect(sum.setsDone).toBe(1);
    expect(sum.setsSkipped).toBe(16);
    expect(sum.exercisesDone).toBe(1);
  });

  it('AC11: ending early marks the session endedEarly with remaining sets', () => {
    let s = doneAndSkip(make());
    s = endEarly(s, T0 + 30_000);
    expect(isFinished(s)).toBe(true);
    expect(s.endedEarly).toBe(true);
    const sum = summarize(s);
    expect(sum).toMatchObject({ setsDone: 1, setsSkipped: 0, setsLeft: 16, durationSec: 30 });
    expect(complete(s, 'done', T0)).toBe(s);
  });

  it('a unilateral set counts as done only when both sides are done', () => {
    let s = make();
    s = jumpTo(s, byEx(s, BSS, 1, 'left'));
    s = complete(s, 'done', T0); // left done → right
    s = complete(s, 'skipped', T0); // right skipped
    s = endEarly(s, T0);
    const sum = summarize(s);
    // 4+4 pull/dip sets were skipped by the jump, BSS set 1 is half done → skipped
    expect(sum.setsSkipped).toBe(9);
    expect(sum.setsDone).toBe(0);
  });
});

describe('time exercise (FR13, D30, D43, AC6)', () => {
  const plankStart = () => {
    const s = make();
    return jumpTo(s, byEx(s, PLANK, 1));
  };

  it('does not start by itself; Start → 3 s prepare → 45 s countdown → done', () => {
    let s = plankStart();
    expect(s.phase).toBe('work');
    expect(advance(s, T0 + 999_999)).toBe(s);
    s = startTimer(s, T0);
    expect(s.phase).toBe('prepare');
    expect(s.endsAt).toBe(T0 + PREPARE_MS);
    s = advance(s, T0 + 3000);
    expect(s.phase).toBe('countdown');
    expect(s.endsAt).toBe(T0 + 3000 + 45_000);
    expect(remainingMs(s, T0 + 13_000)).toBe(35_000);
    s = advance(s, T0 + 48_000);
    expect(s.phase).toBe('countdownDone');
    s = complete(s, 'done', T0 + 50_000);
    expect(s.phase).toBe('rest');
  });

  it('background: prepare and countdown both elapsed → countdownDone at once (BR6)', () => {
    const s = advance(startTimer(plankStart(), T0), T0 + 120_000);
    expect(s.phase).toBe('countdownDone');
  });

  it('pause/resume in prepare and countdown keeps the remaining time', () => {
    let s = startTimer(plankStart(), T0);
    s = pauseTimer(s, T0 + 1000);
    expect(s.pausedRemainingMs).toBe(2000);
    expect(s.endsAt).toBeUndefined();
    expect(advance(s, T0 + 100_000)).toBe(s);
    s = resumeTimer(s, T0 + 10_000);
    expect(s.endsAt).toBe(T0 + 12_000);
    s = advance(s, T0 + 12_000);
    expect(s.phase).toBe('countdown');
    s = pauseTimer(s, T0 + 22_000);
    expect(remainingMs(s, T0 + 50_000)).toBe(35_000);
    s = resumeTimer(s, T0 + 50_000);
    expect(s.endsAt).toBe(T0 + 85_000);
  });

  it('"Done" works while counting down', () => {
    let s = advance(startTimer(plankStart(), T0), T0 + 10_000);
    expect(s.phase).toBe('countdown');
    s = complete(s, 'done', T0 + 10_000);
    expect(s.phase).toBe('rest');
    expect(s.pausedRemainingMs).toBeUndefined();
  });

  it('Start is ignored for reps exercises', () => {
    const s = make();
    expect(startTimer(s, T0)).toBe(s);
  });

  it('back during countdown resets the timer', () => {
    let s = advance(startTimer(plankStart(), T0), T0 + 10_000);
    s = goBack(s);
    expect(s.phase).toBe('work');
    expect(s.endsAt).toBeUndefined();
  });
});

describe('circuit mode (BR2)', () => {
  const circuit: Workout = { ...fbwA, mode: 'circuit' };

  it('done goes through the round with 30 s rests, 120 s between rounds', () => {
    let s = make(circuit);
    expect(curWork(s)).toMatchObject({ exerciseId: PULL, round: 1 });
    s = complete(s, 'done', T0);
    expect(cur(s)).toMatchObject({ kind: 'rest', reason: 'exercises', durationSec: 30 });
    s = skipRest(s);
    expect(curWork(s)).toMatchObject({ exerciseId: DIPS, round: 1 });
    s = jumpTo(s, byEx(s, PLANK, 1));
    s = complete(s, 'done', T0);
    expect(cur(s)).toMatchObject({ kind: 'rest', reason: 'rounds', durationSec: 120 });
    s = skipRest(s);
    expect(curWork(s)).toMatchObject({ exerciseId: PULL, round: 2 });
  });

  it('jump + done returns to the first todo with the rest before it (AC9 in circuit)', () => {
    let s = make(circuit);
    s = jumpTo(s, byEx(s, DIPS, 1)); // pull-ups round 1 skipped
    s = jumpTo(s, byEx(s, PULL, 1));
    s = complete(s, 'done', T0);
    expect(cur(s)).toMatchObject({ kind: 'rest', reason: 'exercises', durationSec: 30 });
    expect(skipRest(s).index).toBe(byEx(s, DIPS, 1));
  });

  it('round 4 only has pull-ups and dips; finishing works', () => {
    let s = make(circuit);
    const r4 = s.steps.filter((x) => x.kind === 'work' && x.round === 4) as WorkStep[];
    expect(r4.map((x) => x.exerciseId)).toEqual([PULL, DIPS]);
    let guard = 0;
    while (!isFinished(s) && guard++ < 100) s = doneAndSkip(s);
    expect(summarize(s)).toMatchObject({ setsDone: 17, setsTotal: 17 });
  });
});
