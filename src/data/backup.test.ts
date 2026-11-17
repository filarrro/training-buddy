import { beforeEach, describe, expect, it } from 'vitest';
import { FBW_A_ID, PLAN_FBW_WEIGHTS_ID } from '../domain/builtins';
import { makeT } from '../i18n/core';
import { useLibrary } from '../stores/library';
import { useSettings } from '../stores/settings';
import { BACKUP_VERSION, applyBackup, backupFileName, buildBackup, parseBackup } from './backup';

const lib = () => useLibrary.getState();
const pl = makeT('pl');

beforeEach(() => {
  useLibrary.setState({ exercises: [], workouts: [], plans: [], planLast: {}, favorites: [] });
  useSettings.setState({ lang: 'pl', theme: 'system', sound: true, countdownBeeps: true, vibration: true, keepScreenOn: true });
});

function seed(): void {
  lib().saveExercise({
    id: 'ex1',
    builtIn: false,
    name: 'Moje ćwiczenie',
    category: 'pull',
    unilateral: false,
    defaultSets: 3,
    defaultTarget: { type: 'reps', min: 8, max: 12 },
  });
  lib().updateWorkout(FBW_A_ID, { mode: 'circuit', warmup: true, autoAdvance: false });
  lib().duplicateWorkout(FBW_A_ID, pl);
  lib().duplicatePlan(PLAN_FBW_WEIGHTS_ID, pl);
  lib().toggleFavorite(FBW_A_ID);
  lib().recordWorkoutDone(FBW_A_ID, 123);
  useSettings.setState({ theme: 'light', sound: false });
}

describe('backup (FR30, AC21)', () => {
  it('export → reset → import restores exercises, workouts, plans, favourites and settings 1:1', () => {
    seed();
    const before = { exercises: lib().exercises, workouts: lib().workouts, plans: lib().plans, favorites: lib().favorites };
    const text = JSON.stringify(buildBackup(new Date('2026-11-16T10:00:00Z')));
    expect(text).not.toContain('planLast');

    useLibrary.setState({ exercises: [], workouts: [], plans: [], planLast: {}, favorites: [] });
    useSettings.setState({ theme: 'system', sound: true });

    const parsed = parseBackup(text);
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    expect(parsed.file.exportedAt).toBe('2026-11-16T10:00:00.000Z');
    applyBackup(parsed.file);
    expect({ exercises: lib().exercises, workouts: lib().workouts, plans: lib().plans, favorites: lib().favorites }).toEqual(before);
    expect(lib().planLast).toEqual({});
    expect(useSettings.getState()).toMatchObject({ theme: 'light', sound: false, lang: 'pl' });
  });

  it('rejects a file from a newer version and anything that is not a clean backup (EC18)', () => {
    seed();
    const file = buildBackup();
    expect(parseBackup(JSON.stringify({ ...file, version: BACKUP_VERSION + 1 }))).toEqual({ ok: false, error: 'newer' });
    const invalid = { ok: false, error: 'invalid' };
    expect(parseBackup('not json')).toEqual(invalid);
    expect(parseBackup('{}')).toEqual(invalid);
    expect(parseBackup(JSON.stringify({ ...file, app: 'other' }))).toEqual(invalid);
    expect(parseBackup(JSON.stringify({ ...file, data: { ...file.data, workouts: 'x' } }))).toEqual(invalid);
    // one damaged entry → the whole file is rejected, nothing is imported in part
    const damaged = { ...file, data: { ...file.data, exercises: [{ id: 'broken' }] } };
    expect(parseBackup(JSON.stringify(damaged))).toEqual(invalid);
  });

  it('names the file by date', () => {
    expect(backupFileName(new Date(2026, 10, 6))).toBe('training-buddy-2026-11-06.json');
  });
});
