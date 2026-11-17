import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { BUILTIN_EXERCISES, BUILTIN_WORKOUTS, FBW_A_ID } from '../domain/builtins';
import { kv } from '../data/db';
import { useSettings } from '../stores/settings';
import { progress } from './engine';
import { SESSION_KEY, loadSavedSession, sanitizeSavedSession, saveSession } from './persist';
import { createSession, discardSaved, resumeSaved, sessionActions, useSessionStore } from './store';

const fbwA = BUILTIN_WORKOUTS.find((w) => w.id === FBW_A_ID)!;
const T0 = 1_000_000;
const state = () => useSessionStore.getState();

function start(): void {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(T0);
  useSettings.setState({ sound: false, vibration: true });
  createSession(structuredClone(fbwA), structuredClone([...BUILTIN_EXERCISES]));
  sessionActions.begin();
}

beforeEach(async () => {
  useSessionStore.setState({ session: null, saved: null, exitConfirmRequested: false });
  await kv.del(SESSION_KEY);
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe('saved session (FR31)', () => {
  it('round-trips a session in the middle of a rest and resumes it with the right time left', async () => {
    start();
    sessionActions.complete('done'); // → 90 s rest
    await saveSession(state().session, T0 + 10_000);
    const saved = (await loadSavedSession())!;
    expect(saved.savedAt).toBe(T0 + 10_000);
    expect(saved.session).toMatchObject({ phase: 'rest', endsAt: T0 + 90_000, begun: true });
    expect(progress(saved.session).done).toBe(1);

    // App reopened 30 s after it was left: 50 s of rest remain, the clock skips the time away.
    useSessionStore.setState({ session: null, saved });
    vi.setSystemTime(T0 + 40_000);
    expect(resumeSaved()).toBe(true);
    expect(state().saved).toBeNull();
    expect(state().session).toMatchObject({ phase: 'rest', endsAt: T0 + 90_000, startedAt: T0 + 30_000 });
  });

  it('a rest that ran out while the app was closed is over on resume', async () => {
    start();
    sessionActions.complete('done');
    await saveSession(state().session, T0 + 1_000);
    useSessionStore.setState({ session: null, saved: await loadSavedSession() });
    vi.setSystemTime(T0 + 600_000);
    resumeSaved();
    expect(state().session).toMatchObject({ phase: 'work' });
    expect(state().session!.endsAt).toBeUndefined();
  });

  it('keeps only a begun, unfinished session', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(T0);
    createSession(structuredClone(fbwA), structuredClone([...BUILTIN_EXERCISES]));
    await saveSession(state().session); // not begun yet (lock hint)
    expect(await loadSavedSession()).toBeNull();
    sessionActions.begin();
    await saveSession(state().session);
    expect(await loadSavedSession()).not.toBeNull();
    sessionActions.endEarly();
    await saveSession(state().session);
    expect(await loadSavedSession()).toBeNull();
  });

  it('rejects records that do not line up with the workout snapshot', () => {
    start();
    const session = JSON.parse(JSON.stringify(state().session)) as Record<string, unknown>;
    const ok = { savedAt: T0, session };
    expect(sanitizeSavedSession(ok)).not.toBeNull();
    expect(sanitizeSavedSession(null)).toBeNull();
    expect(sanitizeSavedSession({ savedAt: T0, session: { ...session, statuses: ['todo'] } })).toBeNull();
    expect(sanitizeSavedSession({ savedAt: T0, session: { ...session, index: 999 } })).toBeNull();
    expect(sanitizeSavedSession({ savedAt: T0, session: { ...session, phase: 'rest' } })).toBeNull(); // step 0 is work
    expect(sanitizeSavedSession({ savedAt: T0, session: { ...session, finishedAt: T0 } })).toBeNull();
    expect(sanitizeSavedSession({ savedAt: 'x', session })).toBeNull();
  });

  it('discard forgets the saved session', async () => {
    start();
    await saveSession(state().session);
    useSessionStore.setState({ session: null, saved: await loadSavedSession() });
    discardSaved();
    expect(state().saved).toBeNull();
    await Promise.resolve();
    expect(await loadSavedSession()).toBeNull();
  });
});

describe('vibration (FR19)', () => {
  it('vibrates when a rest runs out on its own, not when it is skipped, and respects the setting', () => {
    const vibrate = vi.fn<(pattern: number[]) => boolean>(() => true);
    vi.stubGlobal('navigator', Object.assign(Object.create(navigator), { vibrate }));
    start();
    sessionActions.complete('done');
    vi.setSystemTime(T0 + 30_000);
    sessionActions.skipRest();
    expect(vibrate).not.toHaveBeenCalled();

    vi.setSystemTime(T0 + 31_000);
    sessionActions.complete('done');
    vi.setSystemTime(T0 + 31_000 + 90_000);
    sessionActions.tick();
    expect(vibrate).toHaveBeenCalledTimes(1);

    useSettings.setState({ vibration: false });
    vi.setSystemTime(T0 + 200_000);
    sessionActions.complete('done');
    vi.setSystemTime(T0 + 400_000);
    sessionActions.tick();
    expect(vibrate).toHaveBeenCalledTimes(1);
  });
});
