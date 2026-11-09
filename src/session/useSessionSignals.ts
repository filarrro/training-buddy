/**
 * Drives timers and sound for the session screen:
 * - ticks the store while a timer runs (phase transitions from `endsAt`, BR6);
 * - pre-schedules signals on the AudioContext timeline (rest end chime, prepare 3-2-1,
 *   countdown 3-2-1 and time-end) and reschedules them on any change (skip/back/pause);
 * - never cuts or repeats a signal: the plan key stays the same across the natural
 *   rest → restDone / countdown → countdownDone transitions, signals already due are remembered
 *   per timer run (pause/resume, returning from background), and cancelling leaves a signal that
 *   already started alone;
 * - on return from background: recompute, and play the end signal if it could not play (EC6);
 * - reschedules when the AudioContext runs again after an interruption (call, Siri; BR7).
 */
import { useEffect, useRef, useState } from 'react';
import { useSettings } from '../stores/settings';
import { audioState, installGestureUnlock, onAudioStateChange, playNow, resumeAudio, schedule } from './audio';
import type { SignalKind } from './audio';
import { timeTargetSec } from './engine';
import type { EngineSession } from './engine';
import { sessionActions, useSessionStore } from './store';

interface PlannedSignal {
  kind: SignalKind;
  at: number;
  /** identity within the timer run, stable across pause/resume (kind + ms before the end) */
  id: string;
}

export interface SignalPlan {
  /** changes whenever the signals must be rescheduled */
  key: string;
  /** one timer run (a rest, or one Start of a time exercise incl. pauses); 'none' otherwise */
  group: string;
  signals: PlannedSignal[];
}

const NONE: SignalPlan = { key: 'none', group: 'none', signals: [] };

/** Signals for the current state. */
export function planSignals(s: EngineSession | null, opts: { countdownBeeps: boolean }): SignalPlan {
  if (!s || s.finishedAt !== undefined) return NONE;
  if (s.phase === 'rest' || s.phase === 'restDone') {
    if (s.endsAt === undefined) return NONE;
    const group = `rest:${s.index}:${s.endsAt}`;
    return { key: group, group, signals: [{ kind: 'restEnd', at: s.endsAt, id: 'restEnd:0' }] };
  }
  if (s.phase !== 'prepare' && s.phase !== 'countdown' && s.phase !== 'countdownDone') return NONE;
  const group = `time:${s.index}`;
  if (s.pausedRemainingMs !== undefined) return { key: `${group}:paused`, group, signals: [] };
  if (s.endsAt === undefined) return NONE;
  const targetMs = timeTargetSec(s) * 1000;
  const end = s.phase === 'prepare' ? s.endsAt + targetMs : s.endsAt;
  const prepEnd = end - targetMs;
  const signals: PlannedSignal[] = [];
  const add = (kind: SignalKind, at: number) => signals.push({ kind, at, id: `${kind}:${end - at}` });
  // "Get ready" 3-2-1 (always: part of FR13)
  for (let k = 3; k >= 1; k--) add('beep', prepEnd - k * 1000);
  // 3-2-1 before the end of the countdown (FR17, toggle in settings)
  if (opts.countdownBeeps && targetMs > 3000) {
    for (let k = 3; k >= 1; k--) add('beep', end - k * 1000);
  }
  add('timeEnd', end);
  // The key is the same for prepare, countdown and countdownDone of one run → no reschedule there.
  return { key: `${group}:${end}`, group, signals };
}

export function useSessionSignals(): void {
  const session = useSessionStore((s) => s.session);
  const sound = useSettings((s) => s.sound);
  const countdownBeeps = useSettings((s) => s.countdownBeeps);
  const [epoch, setEpoch] = useState(0);
  const hiddenAt = useRef<number | null>(null);
  /** ids of signals of the current timer run whose time has already come (never replayed) */
  const due = useRef<{ group: string; ids: Set<string> }>({ group: 'none', ids: new Set() });

  const running = !!session && session.finishedAt === undefined && session.endsAt !== undefined;

  // Ticks while a timer runs (the UI also re-renders from these store updates).
  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => sessionActions.tick(), 200);
    return () => window.clearInterval(id);
  }, [running]);

  // Pre-scheduled signals on the audio timeline.
  const plan = planSignals(session, { countdownBeeps });
  const planRef = useRef(plan);
  planRef.current = plan;
  useEffect(() => {
    const current = planRef.current;
    if (due.current.group !== current.group) due.current = { group: current.group, ids: new Set() };
    if (!sound) return;
    const ids = due.current.ids;
    const live = current.signals
      .filter((p) => !ids.has(p.id))
      .map((p) => ({ p, cancel: schedule(p.kind, p.at) }));
    return () => {
      const now = Date.now();
      for (const { p, cancel } of live) {
        if (p.at <= now) ids.add(p.id);
        cancel();
      }
    };
  }, [plan.key, sound, epoch]);

  // Audio running again (e.g. after a call/Siri, or the first unlock): reschedule on the live clock.
  useEffect(
    () =>
      onAudioStateChange((state) => {
        if (state === 'running') setEpoch((e) => e + 1);
      }),
    [],
  );

  useEffect(() => {
    installGestureUnlock();
    const onVis = () => {
      if (document.visibilityState === 'hidden') {
        hiddenAt.current = Date.now();
        return;
      }
      const since = hiddenAt.current;
      hiddenAt.current = null;
      const wasRunning = audioState() === 'running';
      // A resume outside a gesture may be refused (iOS): the next tap anywhere unlocks it.
      if (!wasRunning) installGestureUnlock();
      const before = useSessionStore.getState().session;
      void resumeAudio();
      sessionActions.tick();
      const after = useSessionStore.getState().session;
      // The end passed while hidden and the audio context was suspended → it did not play.
      if (since !== null && after && before && !wasRunning && after.endsAt !== undefined && after.endsAt >= since) {
        if (after.phase === 'restDone') playNow('restEnd');
        else if (after.phase === 'countdownDone') playNow('timeEnd');
      }
      // Audio clock may have stopped while hidden: reschedule upcoming signals.
      setEpoch((e) => e + 1);
    };
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, []);
}
