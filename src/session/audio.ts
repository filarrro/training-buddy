/**
 * Synthesised session signals (Web Audio, works offline, BR7). No audio files.
 *
 * - unlockAudio(): create/resume the AudioContext inside a user gesture (the "Start" tap).
 * - schedule(kind, atEpochMs): pre-schedules a signal on the AudioContext timeline so it does
 *   not depend on throttled JS timers; returns a cancel function.
 * - playNow(kind): immediate signal (fallback after returning from background, test sound).
 *
 * D24: navigator.audioSession.type = 'ambient' (Safari) mixes with the user's music.
 */
import { useSettings } from '../stores/settings';

export type SignalKind = 'beep' | 'restEnd' | 'timeEnd';

type Ctx = AudioContext;

interface AudioSessionLike {
  type?: string;
}

let ctx: Ctx | null = null;
let master: GainNode | null = null;
let gestureListenerInstalled = false;
const stateListeners = new Set<(state: string) => void>();

function soundEnabled(): boolean {
  return useSettings.getState().sound;
}

function setAmbientSession(): void {
  try {
    const nav = navigator as Navigator & { audioSession?: AudioSessionLike };
    if (nav.audioSession && nav.audioSession.type !== 'ambient') nav.audioSession.type = 'ambient';
  } catch {
    /* unsupported */
  }
}

function getCtx(): Ctx | null {
  if (ctx) return ctx;
  if (typeof window === 'undefined') return null;
  const AC =
    window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AC) return null;
  try {
    setAmbientSession();
    ctx = new AC({ latencyHint: 'interactive' });
    master = ctx.createGain();
    master.gain.value = 0.9;
    master.connect(ctx.destination);
    const created = ctx;
    created.onstatechange = () => {
      // Interrupted/suspended (call, Siri, lock screen): only a user gesture reliably resumes it on
      // iOS → re-arm the tap listener. Listeners reschedule pending signals once it runs again.
      if (created.state !== 'running') installGestureUnlock();
      stateListeners.forEach((fn) => fn(created.state));
    };
  } catch {
    ctx = null;
    master = null;
  }
  return ctx;
}

/** Resume the context (must run inside a user gesture the first time on iOS). */
export function unlockAudio(): void {
  const c = getCtx();
  if (!c) return;
  if (c.state !== 'running') void c.resume().catch(() => {});
  // iOS: playing a (silent) buffer inside the gesture fully unlocks output.
  try {
    const buf = c.createBuffer(1, 1, 22050);
    const src = c.createBufferSource();
    src.buffer = buf;
    src.connect(c.destination);
    src.start(0);
  } catch {
    /* ignore */
  }
}

/**
 * Fallback: unlock on the next touch/click anywhere (the Start tap was missed, or the context was
 * suspended/interrupted later). Removes itself once the context runs; re-armed on every state
 * change away from 'running' and whenever a signal is scheduled on a stopped context.
 */
export function installGestureUnlock(): void {
  if (gestureListenerInstalled || typeof window === 'undefined') return;
  gestureListenerInstalled = true;
  const handler = () => {
    unlockAudio();
    if (ctx?.state === 'running') {
      window.removeEventListener('pointerdown', handler, true);
      window.removeEventListener('keydown', handler, true);
      gestureListenerInstalled = false;
    }
  };
  window.addEventListener('pointerdown', handler, true);
  window.addEventListener('keydown', handler, true);
}

export function audioState(): AudioContextState | 'unavailable' {
  return ctx ? ctx.state : 'unavailable';
}

/** Subscribe to AudioContext state changes (e.g. 'running' again after an interruption). */
export function onAudioStateChange(fn: (state: string) => void): () => void {
  stateListeners.add(fn);
  return () => {
    stateListeners.delete(fn);
  };
}

/** Resume after returning to the app (best effort, not a gesture). */
export function resumeAudio(): Promise<void> {
  if (!ctx || ctx.state === 'running') return Promise.resolve();
  return ctx.resume().catch(() => {});
}

interface Tone {
  freq: number;
  /** offset from the signal start, s */
  at: number;
  dur: number;
  type: OscillatorType;
  gain: number;
  /** optional pitch glide target */
  glideTo?: number;
}

/** Envelopes of the three signals (distinct by pitch, rhythm and timbre). */
const SIGNALS: Record<SignalKind, Tone[]> = {
  // short 3-2-1 tick
  beep: [{ freq: 880, at: 0, dur: 0.12, type: 'sine', gain: 0.55 }],
  // rest end: bright rising three-note chime, longer
  restEnd: [
    { freq: 659.25, at: 0, dur: 0.35, type: 'triangle', gain: 0.6 },
    { freq: 880, at: 0.16, dur: 0.35, type: 'triangle', gain: 0.6 },
    { freq: 1318.5, at: 0.32, dur: 0.75, type: 'triangle', gain: 0.65 },
    { freq: 2637, at: 0.32, dur: 0.5, type: 'sine', gain: 0.12 },
  ],
  // time exercise end: double "ding-ding" with a low punch, clearly different from the chime
  timeEnd: [
    { freq: 1046.5, at: 0, dur: 0.22, type: 'square', gain: 0.22 },
    { freq: 1046.5, at: 0.28, dur: 0.22, type: 'square', gain: 0.22 },
    { freq: 1568, at: 0.56, dur: 0.6, type: 'triangle', gain: 0.55 },
    { freq: 220, at: 0, dur: 0.3, type: 'sine', gain: 0.4, glideTo: 110 },
  ],
};

function scheduleTones(c: Ctx, out: AudioNode, kind: SignalKind, startAt: number): OscillatorNode[] {
  const nodes: OscillatorNode[] = [];
  for (const tone of SIGNALS[kind]) {
    const t0 = startAt + tone.at;
    const osc = c.createOscillator();
    const g = c.createGain();
    osc.type = tone.type;
    osc.frequency.setValueAtTime(tone.freq, t0);
    if (tone.glideTo) osc.frequency.exponentialRampToValueAtTime(tone.glideTo, t0 + tone.dur);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(tone.gain, t0 + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + tone.dur);
    osc.connect(g);
    g.connect(out);
    osc.start(t0);
    osc.stop(t0 + tone.dur + 0.05);
    osc.onended = () => {
      try {
        g.disconnect();
      } catch {
        /* ignore */
      }
    };
    nodes.push(osc);
  }
  return nodes;
}

const noop = () => {};

/**
 * Schedule a signal at an epoch time. Signals in the past (> 250 ms ago) are ignored.
 * Returns a cancel function: it stops the signal only if it has not started yet on the audio
 * clock — a signal already sounding always plays to its end (a chime is never cut off).
 */
export function schedule(kind: SignalKind, atEpochMs: number): () => void {
  if (!soundEnabled()) return noop;
  const c = getCtx();
  if (!c || !master) return noop;
  if (c.state !== 'running') installGestureUnlock();
  const delaySec = (atEpochMs - Date.now()) / 1000;
  if (delaySec < -0.25) return noop;
  const startAt = c.currentTime + Math.max(0, delaySec);
  const nodes = scheduleTones(c, master, kind, startAt);
  return () => {
    if (c.currentTime >= startAt) return;
    for (const n of nodes) {
      try {
        n.stop();
        n.disconnect();
      } catch {
        /* already stopped */
      }
    }
  };
}

/** Play a signal now (respects the sound setting). */
export function playNow(kind: SignalKind): void {
  if (!soundEnabled()) return;
  const c = getCtx();
  if (!c || !master) return;
  if (c.state !== 'running') void c.resume().catch(() => {});
  scheduleTones(c, master, kind, c.currentTime + 0.02);
}

/**
 * Settings "Test sound": plays the rest-end signal even when sound is switched off, through the
 * same AudioContext as the session (so the tap also unlocks audio on iOS). False = no Web Audio.
 */
export function playTest(kind: SignalKind = 'restEnd'): boolean {
  const c = getCtx();
  if (!c || !master) return false;
  unlockAudio();
  scheduleTones(c, master, kind, c.currentTime + 0.03);
  return true;
}
