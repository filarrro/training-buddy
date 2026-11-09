import { afterEach, describe, expect, it, vi } from 'vitest';
import { BUILTIN_EXERCISES, BUILTIN_WORKOUTS, FBW_A_ID } from '../domain/builtins';
import { useSettings } from '../stores/settings';
import { progress } from './engine';
import { ACTION_GUARD_MS, createSession, sessionActions, useSessionStore } from './store';

const fbwA = BUILTIN_WORKOUTS.find((w) => w.id === FBW_A_ID)!;

afterEach(() => vi.useRealTimers());

describe('session store', () => {
  function start(): void {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(1_000_000);
    useSettings.setState({ sound: false });
    createSession(structuredClone(fbwA), structuredClone([...BUILTIN_EXERCISES]));
  }
  const session = () => useSessionStore.getState().session!;
  let t = 1_000_000;
  const later = () => vi.setSystemTime((t += ACTION_GUARD_MS + 1));

  it('ignores a second "Done" within the double-tap window, accepts it afterwards', () => {
    start();
    t = 1_000_000;
    expect(sessionActions.complete('done')).toBe(true);
    later();
    sessionActions.skipRest();
    later();
    expect(sessionActions.complete('done')).toBe(true);
    expect(sessionActions.complete('done')).toBe(false); // double tap → ignored
    expect(progress(session()).done).toBe(2);
  });

  it('"Skip rest" double tap does not mark the next set done (Skip rest → Done)', () => {
    start();
    t = 1_000_000;
    sessionActions.complete('done');
    vi.setSystemTime((t += 60_000)); // rest has been running for a minute
    sessionActions.skipRest();
    expect(session().phase).toBe('work');
    expect(sessionActions.complete('done')).toBe(false); // second tap lands on "Done"
    expect(progress(session()).done).toBe(1);
    expect(session().phase).toBe('work');
  });

  it('"Done" double tap does not drop the rest it just started (Done → Skip rest)', () => {
    start();
    sessionActions.complete('done');
    sessionActions.skipRest();
    expect(session().phase).toBe('rest');
  });

  it('"Back" double tap during rest goes back only one step', () => {
    start();
    t = 1_000_000;
    sessionActions.complete('done');
    later();
    sessionActions.skipRest();
    later();
    sessionActions.complete('done'); // set 2 → rest
    later();
    sessionActions.back();
    sessionActions.back();
    const st = session().steps[session().index]!;
    expect(st.kind === 'work' && st.set).toBe(2);
  });
});
