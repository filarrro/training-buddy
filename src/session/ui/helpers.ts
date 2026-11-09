import { useEffect, useState } from 'react';
import { exerciseName, formatTarget, sideLabel, sideUnit } from '../../domain/format';
import type { ActiveSession, RestStep, WorkStep } from '../../domain/types';
import type { TFunction } from '../../i18n';
import { exerciseOf, targetOf } from '../engine';

/** Re-render every `intervalMs` (display clocks). */
export function useNow(intervalMs: number): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    setNow(Date.now());
    const id = window.setInterval(() => setNow(Date.now()), intervalMs);
    return () => window.clearInterval(id);
  }, [intervalMs]);
  return now;
}

export function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
}

/** "Ćwiczenie 2/5 · Seria 3/4", "Runda 2/4 · Ćwiczenie 3/5" or "Superseria · Runda 1/3 · Ćwiczenie 4/8" (FR10). */
export function positionText(step: WorkStep, t: TFunction): string {
  if (step.group) {
    return t(step.group === 'superset' ? 'session.position.superset' : 'session.position.circuitBlock', {
      round: step.round ?? step.set,
      roundTotal: step.roundsTotal ?? step.setsTotal,
      ex: step.exerciseNo,
      exTotal: step.exerciseTotal,
    });
  }
  if (step.round !== undefined) {
    return t('session.position.circuit', {
      round: step.round,
      roundTotal: step.roundsTotal ?? step.round,
      ex: step.exerciseNo,
      exTotal: step.exerciseTotal,
    });
  }
  return t('session.position.straight', {
    ex: step.exerciseNo,
    exTotal: step.exerciseTotal,
    set: step.set,
    setTotal: step.setsTotal,
  });
}

/** "Lewa noga (1/2)" (FR11) or null. */
export function sideText(s: ActiveSession, step: WorkStep, t: TFunction): string | null {
  if (!step.side) return null;
  const ex = exerciseOf(s, step);
  return t('session.sideProgress', {
    side: sideLabel(step.side, ex?.category, t),
    n: step.side === 'left' ? 1 : 2,
  });
}

export function stepName(s: ActiveSession, step: WorkStep, t: TFunction): string {
  const ex = exerciseOf(s, step);
  return ex ? exerciseName(ex, t) : step.exerciseId;
}

export function stepTargetText(s: ActiveSession, step: WorkStep, t: TFunction): string {
  return formatTarget(targetOf(s, step), t);
}

export function restReasonText(s: ActiveSession, rest: RestStep, t: TFunction): string {
  if (rest.reason === 'sides') {
    const next = s.steps[s.steps.indexOf(rest) + 1];
    const ex = next && next.kind === 'work' ? exerciseOf(s, next) : undefined;
    return t(`session.rest.reason.sides.${sideUnit(ex?.category)}`);
  }
  return t(`session.rest.reason.${rest.reason}`);
}

/** Coaching note of the step's workout item (e.g. "Slow 5-second lowering"), or null. */
export function stepNote(s: ActiveSession, step: WorkStep, t: TFunction): string | null {
  const key = s.workout.items[step.itemIndex]?.noteKey;
  return key ? t(key) : null;
}

/** Index of the first item of the linked group containing `itemIndex`. */
export function groupStart(s: ActiveSession, itemIndex: number): number {
  let k = itemIndex;
  while (k > 0 && s.workout.items[k - 1]?.linkNext) k--;
  return k;
}
