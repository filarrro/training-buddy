/**
 * State-based navigation (no router). The current screen is the top of `stack`.
 * Browser/system "back" is bridged in app/history.ts.
 */
import { create } from 'zustand';
import { getWorkout, getWorkoutExercises } from '../stores/library';
import { useUi } from '../stores/ui';
import { createSession } from '../session/store';

export type Screen =
  | { name: 'start' }
  | { name: 'plan'; planId: string }
  | { name: 'preview'; workoutId: string }
  | { name: 'session' }
  | { name: 'finish' }
  | { name: 'config' }
  | { name: 'configWorkout'; workoutId?: string }
  | { name: 'configExercise'; exerciseId?: string }
  | { name: 'configPlan'; planId?: string }
  | { name: 'settings' }
  | { name: 'install' }
  | { name: 'lockHint'; workoutId: string };

export type ScreenName = Screen['name'];

/** Drives the enter animation: forward = slide from right, back = from left, fade = cross-fade. */
export type NavDirection = 'forward' | 'back' | 'fade';

export interface NavEntry {
  screen: Screen;
  /** unique per push — used as React key so each visit re-runs the enter animation */
  key: number;
}

export interface NavState {
  stack: NavEntry[];
  direction: NavDirection;
  /** push a screen */
  go: (screen: Screen) => void;
  /** replace the current screen (e.g. lockHint → session, session → finish) */
  replace: (screen: Screen) => void;
  /** pop one screen (no-op at root) */
  back: () => void;
  /** clear history and show `screen` (default: start) */
  reset: (screen?: Screen) => void;
  /**
   * Snapshot the workout + its exercises, create the session (session/store.createSession) and
   * go to 'lockHint' (first time, FR37) or 'session'. Returns false if the workout is missing or empty.
   */
  startSession: (workoutId: string) => boolean;
}

let seq = 0;
const entry = (screen: Screen): NavEntry => ({ screen, key: ++seq });

function clone<T>(x: T): T {
  return JSON.parse(JSON.stringify(x)) as T;
}

export const useNav = create<NavState>((set, get) => ({
  stack: [entry({ name: 'start' })],
  direction: 'fade',
  go: (screen) => set((s) => ({ stack: [...s.stack, entry(screen)], direction: 'forward' })),
  replace: (screen) => set((s) => ({ stack: [...s.stack.slice(0, -1), entry(screen)], direction: 'forward' })),
  back: () =>
    set((s) => (s.stack.length > 1 ? { stack: s.stack.slice(0, -1), direction: 'back' } : s)),
  reset: (screen = { name: 'start' }) => set({ stack: [entry(screen)], direction: 'fade' }),
  startSession: (workoutId) => {
    const workout = getWorkout(workoutId);
    if (!workout) return false;
    const exercises = getWorkoutExercises(workout);
    if (exercises.length === 0) return false;
    createSession(clone(workout), clone(exercises));
    const target: Screen = useUi.getState().lockHintSeen ? { name: 'session' } : { name: 'lockHint', workoutId };
    // Session replaces the preview so leaving the session never lands on a stale preview.
    const cur = get().stack[get().stack.length - 1]?.screen.name;
    if (cur === 'preview') get().replace(target);
    else get().go(target);
    return true;
  },
}));

/** Current navigation entry (screen + key). */
export const useCurrentEntry = (): NavEntry => useNav((s) => s.stack[s.stack.length - 1]!);
/** Current screen. */
export const useScreen = (): Screen => useNav((s) => s.stack[s.stack.length - 1]!.screen);
export const currentScreen = (): Screen => {
  const s = useNav.getState().stack;
  return s[s.length - 1]!.screen;
};

/** Imperative shortcuts for event handlers: nav.go({ name: 'settings' }). */
export const nav = {
  go: (screen: Screen) => useNav.getState().go(screen),
  replace: (screen: Screen) => useNav.getState().replace(screen),
  back: () => useNav.getState().back(),
  reset: (screen?: Screen) => useNav.getState().reset(screen),
  startSession: (workoutId: string) => useNav.getState().startSession(workoutId),
};
