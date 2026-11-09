/**
 * Session store (in memory; persistence/resume is T9). Thin wrapper over the pure engine.
 * Contract used by foundation: createSession(), requestExitConfirm(), useSessionStore
 * (session, exitConfirmRequested), clearExitConfirm().
 */
import { create } from 'zustand';
import type { ActiveSession, Exercise, Workout } from '../domain/types';
import { newId, useLibrary } from '../stores/library';
import { unlockAudio } from './audio';
import * as engine from './engine';
import type { CompleteResult, EngineSession } from './engine';

export interface SessionState {
  session: EngineSession | null;
  /** set by requestExitConfirm(); the session screen shows the "End workout?" dialog */
  exitConfirmRequested: boolean;
}

export const useSessionStore = create<SessionState>(() => ({ session: null, exitConfirmRequested: false }));

/** Create a new session from snapshots (BR3) and make it current. Called by nav.startSession(). */
export function createSession(workout: Workout, exercises: Exercise[]): ActiveSession {
  // Called synchronously from the "Start" tap → a user gesture: unlock Web Audio now (BR7).
  unlockAudio();
  const session = engine.buildSession(workout, exercises, newId(), Date.now());
  useSessionStore.setState({ session, exitConfirmRequested: false });
  lastActionAt = -Infinity;
  return session;
}

/** System back during a session → ask before leaving (FR16). */
export function requestExitConfirm(): void {
  useSessionStore.setState({ exitConfirmRequested: true });
}

export function clearExitConfirm(): void {
  useSessionStore.setState({ exitConfirmRequested: false });
}

/** Applies `fn` to the current session; returns true when the session changed. */
function update(fn: (s: EngineSession, now: number) => EngineSession): boolean {
  const { session } = useSessionStore.getState();
  if (!session) return false;
  const now = Date.now();
  // Always settle timers first so actions act on the up-to-date phase (BR6).
  const next = fn(engine.advance(session, now), now);
  if (next === session) return false;
  useSessionStore.setState({ session: next });
  // Finished (completed or ended early with at least one set done): plans suggest the next workout.
  if (!session.finishedAt && next.finishedAt && next.statuses.some((st) => st === 'done')) {
    useLibrary.getState().recordWorkoutDone(next.workout.id, next.finishedAt);
  }
  return true;
}

/**
 * Double-tap guard for every user action that changes the step or phase: a second action within
 * this window after one that changed the session is ignored. The action bars put different
 * buttons in the same spots (Done ↔ Skip rest, Start ↔ Done, Back ↔ Back), so without it a
 * double tap would complete a set that was never performed, drop a rest, or go back twice; it
 * also stops a double "Done" on the left side of a unilateral exercise from completing the right.
 */
export const ACTION_GUARD_MS = 400;
let lastActionAt = -Infinity;

/** Runs a user action unless it falls in the guard window; true when it changed the session. */
function guarded(fn: (s: EngineSession, now: number) => EngineSession): boolean {
  const now = Date.now();
  if (now - lastActionAt < ACTION_GUARD_MS) return false;
  if (!update(fn)) return false;
  lastActionAt = now;
  return true;
}

/** Imperative session actions for the UI. */
export const sessionActions = {
  /** Session screen shown for the first time: the workout clock starts now. */
  begin: () => {
    update((s, now) => (s.begun ? s : { ...s, begun: true, startedAt: now }));
  },
  complete: (result: CompleteResult) => guarded((s, t) => engine.complete(s, result, t)),
  skipRest: () => {
    guarded((s) => engine.skipRest(s));
  },
  back: () => {
    guarded((s) => engine.goBack(s));
  },
  jumpTo: (index: number) => {
    guarded((s) => engine.jumpTo(s, index));
  },
  startTimer: () => {
    guarded((s, now) => engine.startTimer(s, now));
  },
  pause: () => {
    guarded((s, now) => engine.pauseTimer(s, now));
  },
  resume: () => {
    guarded((s, now) => engine.resumeTimer(s, now));
  },
  /** Recompute phases from timestamps (interval ticks, visibilitychange). */
  tick: () => {
    update((s) => s);
  },
  endEarly: () => {
    update((s, now) => engine.endEarly(s, now));
    clearExitConfirm();
  },
  /** "Back to start": drop the finished session. */
  clear: () => useSessionStore.setState({ session: null, exitConfirmRequested: false }),
};
