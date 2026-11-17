/**
 * Session store. Thin wrapper over the pure engine. The running session is mirrored to IndexedDB
 * (session/persist.ts) once initSessionPersistence() has run; a session found there at startup is
 * offered as `saved` ("Continue workout") and becomes current only through resumeSaved().
 * Contract used by foundation: createSession(), requestExitConfirm(), useSessionStore
 * (session, exitConfirmRequested), clearExitConfirm().
 */
import { create } from 'zustand';
import type { ActiveSession, Exercise, Workout } from '../domain/types';
import { newId, useLibrary } from '../stores/library';
import { unlockAudio } from './audio';
import * as engine from './engine';
import type { CompleteResult, EngineSession } from './engine';
import { vibrate } from './haptics';
import { clearSavedSession, loadSavedSession, saveSession } from './persist';
import type { SavedSession } from './persist';

export interface SessionState {
  session: EngineSession | null;
  /** set by requestExitConfirm(); the session screen shows the "End workout?" dialog */
  exitConfirmRequested: boolean;
  /** unfinished session from a previous run of the app, waiting for "Continue" or "Discard" */
  saved: SavedSession | null;
}

export const useSessionStore = create<SessionState>(() => ({
  session: null,
  exitConfirmRequested: false,
  saved: null,
}));

/** Create a new session from snapshots (BR3) and make it current. Called by nav.startSession(). */
export function createSession(workout: Workout, exercises: Exercise[]): ActiveSession {
  // Called synchronously from the "Start" tap → a user gesture: unlock Web Audio now (BR7).
  unlockAudio();
  const session = engine.buildSession(workout, exercises, newId(), Date.now());
  // Starting a workout replaces an unfinished one (the UI asks first, D39).
  useSessionStore.setState({ session, exitConfirmRequested: false, saved: null });
  lastActionAt = -Infinity;
  return session;
}

/**
 * "Continue workout": make the saved session current. Timers keep their real end time (a rest
 * that ran out while the app was closed is over); the workout clock skips the time away.
 */
export function resumeSaved(): boolean {
  const { saved } = useSessionStore.getState();
  if (!saved) return false;
  unlockAudio();
  const now = Date.now();
  const away = Math.max(0, now - saved.savedAt);
  const session = engine.advance({ ...saved.session, startedAt: saved.session.startedAt + away }, now);
  useSessionStore.setState({ session, saved: null, exitConfirmRequested: false });
  lastActionAt = -Infinity;
  return true;
}

/** "Discard": forget the saved session (it does not count as a finished workout, EC13). */
export function discardSaved(): void {
  useSessionStore.setState({ saved: null });
  void clearSavedSession();
}

let persistenceStarted = false;

/**
 * Called once at app start: offers a session saved by a previous run and from then on mirrors the
 * current session to IndexedDB on every change and when the app goes to the background.
 */
export function initSessionPersistence(): void {
  if (persistenceStarted || typeof window === 'undefined') return;
  persistenceStarted = true;
  void loadSavedSession().then((saved) => {
    // A workout started in the meantime wins.
    if (saved && !useSessionStore.getState().session) useSessionStore.setState({ saved });
  });
  useSessionStore.subscribe((state, prev) => {
    if (state.session === prev.session) return;
    // Nothing current and a saved session still on offer: its record must stay.
    if (!state.session && state.saved) return;
    void saveSession(state.session);
  });
  document.addEventListener('visibilitychange', () => {
    const { session } = useSessionStore.getState();
    if (document.visibilityState === 'hidden' && session) void saveSession(session);
  });
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
  const settled = engine.advance(session, now);
  // A timer ran out on its own (not skipped by the user): vibrate (FR19).
  if (session.phase === 'rest' && settled.phase !== 'rest') vibrate('restEnd');
  else if (settled.phase === 'countdownDone' && session.phase !== 'countdownDone') vibrate('timeEnd');
  const next = fn(settled, now);
  if (next === session) return false;
  useSessionStore.setState({ session: next });
  // A rest ended (also on its own, with auto-advance): "Skip rest" and "Done" share one spot, so a
  // tap aimed at the rest screen must not complete the set that has just appeared.
  if (engine.isResting(session) && !engine.isResting(next)) lastActionAt = now;
  // Finished (completed or ended early with at least one set done): plans suggest the next workout.
  if (!session.finishedAt && next.finishedAt && engine.hasDoneSet(next)) {
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
