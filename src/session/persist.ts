/**
 * Saved session (FR31): the running session is written to IndexedDB (key "session") on every
 * change and when the app goes to the background, so a workout survives a reload or the app
 * being closed. Only a begun, unfinished session is kept; the record is removed otherwise.
 *
 * The record is validated on read: the workout and exercise snapshots go through the same
 * sanitizers as the library, and the steps are regenerated from them — stored statuses are
 * accepted only when they still line up with those steps.
 */
import { kv } from '../data/db';
import { generateSteps, indexById } from '../domain/generator';
import type { Exercise, SessionPhase, SessionStepStatus } from '../domain/types';
import { sanitizeExercise, sanitizeWorkout } from '../domain/validation';
import type { EngineSession } from './engine';

export const SESSION_KEY = 'session';
/** A session untouched for longer than this is offered for discarding (EC14). */
export const STALE_AFTER_MS = 12 * 60 * 60 * 1000;

export interface SavedSession {
  session: EngineSession;
  /** epoch ms of the last write (≈ when the app was left) */
  savedAt: number;
}

type Obj = Record<string, unknown>;
const isObj = (x: unknown): x is Obj => typeof x === 'object' && x !== null && !Array.isArray(x);
const isNum = (x: unknown): x is number => typeof x === 'number' && Number.isFinite(x);
const PHASES: readonly SessionPhase[] = ['work', 'prepare', 'countdown', 'countdownDone', 'rest', 'restDone'];
const STATUSES: readonly SessionStepStatus[] = ['todo', 'done', 'skipped'];

/** Returns a usable saved session, or null when the record is missing, finished or inconsistent. */
export function sanitizeSavedSession(raw: unknown): SavedSession | null {
  if (!isObj(raw) || !isNum(raw.savedAt) || !isObj(raw.session)) return null;
  const s = raw.session;
  if (typeof s.id !== 'string' || s.finishedAt !== undefined) return null;
  const workout = sanitizeWorkout(s.workout);
  if (!workout || !Array.isArray(s.exercises) || !Array.isArray(s.statuses)) return null;
  const exercises = s.exercises.map(sanitizeExercise).filter((e): e is Exercise => e !== null);
  const steps = generateSteps(workout, indexById(exercises));
  const statuses = s.statuses as unknown[];
  if (steps.length === 0 || statuses.length !== steps.length) return null;
  if (!statuses.every((st): st is SessionStepStatus => (STATUSES as readonly unknown[]).includes(st))) return null;
  const index = s.index;
  if (!isNum(index) || !Number.isInteger(index) || index < 0 || index >= steps.length) return null;
  const phase = s.phase as SessionPhase;
  if (!PHASES.includes(phase) || !isNum(s.startedAt)) return null;
  // The phase must match the kind of the current step.
  const resting = phase === 'rest' || phase === 'restDone';
  if (resting !== (steps[index]!.kind === 'rest')) return null;
  const timed = phase === 'rest' || phase === 'restDone' || phase === 'prepare' || phase === 'countdown';
  const endsAt = isNum(s.endsAt) ? s.endsAt : undefined;
  const pausedRemainingMs = isNum(s.pausedRemainingMs) && s.pausedRemainingMs >= 0 ? s.pausedRemainingMs : undefined;
  if (timed && endsAt === undefined && pausedRemainingMs === undefined) return null;
  const completedIndex =
    resting && isNum(s.completedIndex) && steps[s.completedIndex]?.kind === 'work' ? s.completedIndex : undefined;
  const session: EngineSession = {
    id: s.id,
    workout,
    exercises,
    steps,
    statuses,
    index,
    phase,
    startedAt: s.startedAt,
    begun: true,
    ...(timed && endsAt !== undefined ? { endsAt } : {}),
    ...(timed && pausedRemainingMs !== undefined ? { pausedRemainingMs } : {}),
    ...(completedIndex !== undefined ? { completedIndex } : {}),
    ...(completedIndex !== undefined && (STATUSES as readonly unknown[]).includes(s.completedPrevStatus)
      ? { completedPrevStatus: s.completedPrevStatus as SessionStepStatus }
      : {}),
  };
  return { session, savedAt: raw.savedAt };
}

export async function loadSavedSession(): Promise<SavedSession | null> {
  const saved = sanitizeSavedSession(await kv.get<unknown>(SESSION_KEY));
  return saved;
}

/** Writes the session, or removes the record when there is nothing to resume. */
export function saveSession(session: EngineSession | null, now: number = Date.now()): Promise<void> {
  if (!session || !session.begun || session.finishedAt !== undefined) return kv.del(SESSION_KEY);
  return kv.set(SESSION_KEY, JSON.parse(JSON.stringify({ session, savedAt: now })) as unknown);
}

export function clearSavedSession(): Promise<void> {
  return kv.del(SESSION_KEY);
}
