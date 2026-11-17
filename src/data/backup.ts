/**
 * Backup file (FR30, BR12): custom exercises, workouts and plans (with changed built-ins),
 * favourites and settings. Not included: the running session and the "last workout" of each plan.
 * Import replaces everything after confirmation; a file from a newer schema version or one that
 * does not validate cleanly is rejected and the data stays untouched (EC18).
 */
import type { Exercise, Plan, Settings, Workout } from '../domain/types';
import { sanitizeLibrary, sanitizeSettings } from '../domain/validation';
import { isIos, isStandalone } from '../pwa/platform';
import { useLibrary } from '../stores/library';
import { defaultSettings, useSettings } from '../stores/settings';

export const BACKUP_APP = 'training-buddy';
export const BACKUP_VERSION = 1;

export interface BackupData {
  exercises: Exercise[];
  workouts: Workout[];
  plans: Plan[];
  favorites: string[];
  settings: Settings;
}

export interface BackupFile {
  app: typeof BACKUP_APP;
  version: number;
  /** ISO date-time */
  exportedAt: string;
  data: BackupData;
}

export type BackupParse = { ok: true; file: BackupFile } | { ok: false; error: 'invalid' | 'newer' };

const isObj = (x: unknown): x is Record<string, unknown> => typeof x === 'object' && x !== null && !Array.isArray(x);

export function buildBackup(now: Date = new Date()): BackupFile {
  const lib = useLibrary.getState();
  const s = useSettings.getState();
  const data: BackupData = {
    exercises: lib.exercises,
    workouts: lib.workouts,
    plans: lib.plans,
    favorites: lib.favorites,
    settings: {
      lang: s.lang,
      theme: s.theme,
      sound: s.sound,
      countdownBeeps: s.countdownBeeps,
      vibration: s.vibration,
      keepScreenOn: s.keepScreenOn,
    },
  };
  return {
    app: BACKUP_APP,
    version: BACKUP_VERSION,
    exportedAt: now.toISOString(),
    data: JSON.parse(JSON.stringify(data)) as BackupData,
  };
}

/** Validates the text of a backup file with the same sanitizers as reads from IndexedDB. */
export function parseBackup(text: string): BackupParse {
  const invalid: BackupParse = { ok: false, error: 'invalid' };
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return invalid;
  }
  if (!isObj(raw) || raw.app !== BACKUP_APP) return invalid;
  const version = raw.version;
  if (typeof version !== 'number' || !Number.isInteger(version) || version < 1) return invalid;
  if (version > BACKUP_VERSION) return { ok: false, error: 'newer' };
  const d = raw.data;
  if (!isObj(d) || !isObj(d.settings)) return invalid;
  if (!Array.isArray(d.exercises) || !Array.isArray(d.workouts) || !Array.isArray(d.plans)) return invalid;
  const lib = sanitizeLibrary(d);
  // An entry dropped by validation means the file is damaged: reject it rather than import a part.
  if (
    lib.exercises.length !== d.exercises.length ||
    lib.workouts.length !== d.workouts.length ||
    lib.plans.length !== d.plans.length
  )
    return invalid;
  return {
    ok: true,
    file: {
      app: BACKUP_APP,
      version,
      exportedAt: typeof raw.exportedAt === 'string' ? raw.exportedAt : '',
      data: {
        exercises: lib.exercises,
        workouts: lib.workouts,
        plans: lib.plans,
        favorites: lib.favorites,
        settings: sanitizeSettings(d.settings, defaultSettings()),
      },
    },
  };
}

/** Replaces all data with the backup (the stores persist themselves). */
export function applyBackup(file: BackupFile): void {
  const { settings, ...lib } = file.data;
  useLibrary.setState({ ...lib, planLast: {} });
  useSettings.setState(settings);
}

export function backupFileName(now: Date = new Date()): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `training-buddy-${now.getFullYear()}-${p(now.getMonth() + 1)}-${p(now.getDate())}.json`;
}

/**
 * Hands the file to the user: a download, or the share sheet in an installed iOS app, where
 * downloads do not work. 'cancelled' = the share sheet was dismissed.
 */
export async function saveBackupFile(file: BackupFile, now: Date = new Date()): Promise<'saved' | 'cancelled'> {
  const name = backupFileName(now);
  const blob = new Blob([JSON.stringify(file, null, 2)], { type: 'application/json' });
  if (isIos() && isStandalone() && typeof navigator.canShare === 'function') {
    const shared = new File([blob], name, { type: 'application/json' });
    if (navigator.canShare({ files: [shared] })) {
      try {
        await navigator.share({ files: [shared] });
        return 'saved';
      } catch (e) {
        if (e instanceof DOMException && e.name === 'AbortError') return 'cancelled';
        // fall through to a download
      }
    }
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 10_000);
  return 'saved';
}
