import { act, cleanup, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { BUILTIN_EXERCISES, BUILTIN_WORKOUTS, FBW_A_ID, FBW_B_ID } from '../domain/builtins';
import type { Workout } from '../domain/types';
import { useSettings } from '../stores/settings';
import { ACTION_GUARD_MS, createSession, sessionActions, useSessionStore } from './store';
import { useSessionSignals } from './useSessionSignals';

/** Minimal fake Web Audio: a manual clock + a log of oscillator starts and immediate stops. */
let clock = 0;
const log: { ev: 'start' | 'stopNow'; at: number; freq: number }[] = [];
class FakeOsc {
  type = 'sine';
  onended: unknown = null;
  startAt = 0;
  freq = 0;
  frequency = {
    setValueAtTime: (f: number) => {
      this.freq = f;
    },
    exponentialRampToValueAtTime() {},
  };
  connect() {}
  disconnect() {}
  start(t: number) {
    this.startAt = t;
    log.push({ ev: 'start', at: t, freq: this.freq });
  }
  stop(t?: number) {
    if (t === undefined) log.push({ ev: 'stopNow', at: this.startAt, freq: this.freq });
  }
}
class FakeCtx {
  static last: FakeCtx | null = null;
  state: string = 'running';
  destination = {};
  onstatechange: (() => void) | null = null;
  resumes = 0;
  constructor() {
    FakeCtx.last = this;
  }
  get currentTime() {
    return clock;
  }
  createGain() {
    return { gain: { value: 1, setValueAtTime() {}, exponentialRampToValueAtTime() {} }, connect() {}, disconnect() {} };
  }
  createOscillator() {
    return new FakeOsc();
  }
  createBuffer() {
    return {};
  }
  createBufferSource() {
    return { connect() {}, start() {} };
  }
  resume() {
    this.resumes++;
    return Promise.resolve();
  }
  setState(state: string) {
    this.state = state;
    this.onstatechange?.();
  }
}
(window as unknown as { AudioContext: unknown }).AudioContext = FakeCtx;

function Harness() {
  useSessionSignals();
  return null;
}

const T0 = 1_000_000;
async function step(ms: number) {
  await act(async () => {
    clock += ms / 1000;
    vi.advanceTimersByTime(ms);
  });
}
const signalStarts = (freq: number) => log.filter((l) => l.ev === 'start' && l.freq === freq);
/** scheduled minus cancelled oscillators of one pitch = what actually sounds */
const audible = (freq: number) => signalStarts(freq).length - log.filter((l) => l.ev === 'stopNow' && l.freq === freq).length;
const REST_END_MAIN = 1318.5; // main note of the rest-end chime
const BEEP = 880;

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(T0);
  clock = 0;
  log.length = 0;
  useSettings.setState({ sound: true, countdownBeeps: true });
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe('session signals', () => {
  it('the rest-end chime is not cut when the phase flips to restDone (FR18, AC5)', async () => {
    createSession(structuredClone(BUILTIN_WORKOUTS.find((w) => w.id === FBW_A_ID)!), structuredClone([...BUILTIN_EXERCISES]));
    render(<Harness />);
    await act(async () => {
      sessionActions.complete('done');
    });
    for (let i = 0; i < 460; i++) await step(200);
    expect(useSessionStore.getState().session!.phase).toBe('restDone');
    expect(log.filter((l) => l.ev === 'stopNow')).toEqual([]);
    expect(signalStarts(REST_END_MAIN)).toHaveLength(1);
  });

  it('a beep is not played again after pause/resume right after it (D43)', async () => {
    // A one-step workout with a single 45 s time exercise.
    const w = structuredClone(BUILTIN_WORKOUTS.find((x) => x.id === FBW_B_ID)!) as Workout;
    w.items = [{ ...w.items[0]!, sets: 1, target: { type: 'time', minSec: 45, maxSec: 60, targetSec: 45 } }];
    createSession(w, structuredClone([...BUILTIN_EXERCISES]));
    render(<Harness />);
    await act(async () => sessionActions.startTimer());
    // prepare 3 s + 42 s of countdown → "3" beep at 3.0 s before the end
    for (let i = 0; i < 225; i++) await step(200);
    await step(150);
    vi.setSystemTime(Date.now() + ACTION_GUARD_MS); // keep the action guard out of the way
    await act(async () => sessionActions.pause());
    await step(1000);
    vi.setSystemTime(Date.now() + ACTION_GUARD_MS);
    await act(async () => sessionActions.resume());
    await step(200);
    for (let i = 0; i < 20; i++) await step(200);
    expect(useSessionStore.getState().session!.phase).toBe('countdownDone');
    expect(audible(BEEP)).toBe(6); // 3 + 3, the "3" beep not repeated
    expect(audible(1568)).toBe(1); // time-end once (cancelled on pause, rescheduled on resume)
  });

  it('re-arms the tap unlock after an interruption and reschedules when audio runs again (BR7)', async () => {
    createSession(structuredClone(BUILTIN_WORKOUTS.find((w) => w.id === FBW_A_ID)!), structuredClone([...BUILTIN_EXERCISES]));
    render(<Harness />);
    const ctx = FakeCtx.last!;
    await act(async () => {
      sessionActions.complete('done');
    });
    // First tap: context running → the fallback listener removes itself.
    window.dispatchEvent(new Event('pointerdown'));
    await act(async () => ctx.setState('interrupted'));
    const resumesBefore = ctx.resumes;
    window.dispatchEvent(new Event('pointerdown'));
    expect(ctx.resumes).toBeGreaterThan(resumesBefore);
    // Audio clock was frozen for 20 s; once running again the chime is rescheduled on the live clock.
    vi.advanceTimersByTime(20_000);
    log.length = 0;
    await act(async () => ctx.setState('running'));
    const chime = signalStarts(REST_END_MAIN);
    expect(chime).toHaveLength(1);
    expect(chime[0]!.at).toBeCloseTo(clock + 70 + 0.32, 1);
  });
});
