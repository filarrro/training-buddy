import { beforeEach, describe, expect, it } from 'vitest';
import { FBW_A_ID } from '../domain/builtins';
import { useLibrary } from '../stores/library';
import { useUi } from '../stores/ui';
import { useSessionStore } from '../session/store';
import { currentScreen, nav, useNav } from './nav';

beforeEach(() => {
  nav.reset();
  useLibrary.setState({ exercises: [], workouts: [], plans: [], planLast: {} });
  useUi.setState({ lockHintSeen: false });
  useSessionStore.setState({ session: null, exitConfirmRequested: false });
});

describe('nav', () => {
  it('go / back / replace / reset', () => {
    nav.go({ name: 'config' });
    nav.go({ name: 'configWorkout' });
    expect(currentScreen()).toEqual({ name: 'configWorkout' });
    expect(useNav.getState().direction).toBe('forward');
    nav.back();
    expect(currentScreen()).toEqual({ name: 'config' });
    expect(useNav.getState().direction).toBe('back');
    nav.replace({ name: 'settings' });
    expect(useNav.getState().stack.map((e) => e.screen.name)).toEqual(['start', 'settings']);
    nav.back();
    nav.back();
    expect(useNav.getState().stack).toHaveLength(1);
    nav.reset({ name: 'install' });
    expect(currentScreen()).toEqual({ name: 'install' });
  });

  it('startSession snapshots the workout and shows the lock hint first time (FR37)', () => {
    nav.go({ name: 'preview', workoutId: FBW_A_ID });
    expect(nav.startSession(FBW_A_ID)).toBe(true);
    expect(currentScreen()).toEqual({ name: 'lockHint', workoutId: FBW_A_ID });
    const s = useSessionStore.getState().session!;
    expect(s.workout.id).toBe(FBW_A_ID);
    expect(s.exercises).toHaveLength(5);
    expect(s.steps.filter((x) => x.kind === 'work')).toHaveLength(20);
    expect(s.statuses.every((x) => x === 'todo')).toBe(true);
  });

  it('goes straight to session when the hint was seen; snapshot is independent (BR3)', () => {
    useUi.setState({ lockHintSeen: true });
    nav.go({ name: 'preview', workoutId: FBW_A_ID });
    nav.startSession(FBW_A_ID);
    expect(useNav.getState().stack.map((e) => e.screen.name)).toEqual(['start', 'session']);
    useLibrary.getState().updateWorkout(FBW_A_ID, { mode: 'circuit' });
    expect(useSessionStore.getState().session!.workout.mode).toBe('straight');
  });

  it('refuses to start a missing or empty workout', () => {
    expect(nav.startSession('nope')).toBe(false);
    useLibrary.getState().saveWorkout({
      id: 'w',
      builtIn: false,
      name: 'Empty',
      mode: 'straight',
      rest: { straight: { betweenSetsSec: 90, betweenExercisesSec: 120 }, circuit: { betweenExercisesSec: 30, betweenRoundsSec: 120 }, betweenSidesSec: 0 },
      items: [],
    });
    expect(nav.startSession('w')).toBe(false);
    expect(currentScreen().name).toBe('start');
  });
});
