/**
 * Settings "Test sound" — delegates to the session audio module so the test plays the real
 * rest-end signal through the shared AudioContext (and unlocks it inside the tap on iOS).
 */
import { playTest } from '../../session/audio';

/** Plays the "rest is over" signal. Returns false when Web Audio is unavailable. */
export async function playTestBeep(): Promise<boolean> {
  try {
    return playTest('restEnd');
  } catch {
    return false;
  }
}
