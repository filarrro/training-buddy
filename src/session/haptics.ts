/**
 * Vibration at the end of a rest and of a timed exercise (FR19). Android only: iOS has no
 * Vibration API, so the settings toggle is shown only where `canVibrate()` is true.
 */
import { useSettings } from '../stores/settings';

export type HapticKind = 'restEnd' | 'timeEnd';

/** Patterns in ms (vibrate, pause, vibrate…), distinct by rhythm like the sound signals. */
const PATTERNS: Record<HapticKind, number[]> = {
  restEnd: [180, 90, 180, 90, 360],
  timeEnd: [140, 70, 140],
};

export function canVibrate(): boolean {
  return typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function';
}

export function vibrate(kind: HapticKind): void {
  if (!useSettings.getState().vibration || !canVibrate()) return;
  try {
    navigator.vibrate(PATTERNS[kind]);
  } catch {
    /* blocked (no user activation yet) — ignore */
  }
}
