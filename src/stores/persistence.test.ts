import { describe, expect, it, vi } from 'vitest';
import { kv } from '../data/db';
import { FBW_A_ID } from '../domain/builtins';
import { getWorkout, useLibrary } from './library';
import { useSettings } from './settings';
import { useUi } from './ui';
import { waitForHydration } from './hydration';

const flush = () => new Promise((r) => setTimeout(r, 20));

describe('persistence (FR40, AC13, AC14)', () => {
  it('hydrates, writes to IndexedDB and rehydrates', async () => {
    await waitForHydration();
    expect(useLibrary.persist.hasHydrated()).toBe(true);

    useLibrary.getState().updateWorkout(FBW_A_ID, { mode: 'circuit' });
    useSettings.getState().setLang('en');
    useUi.getState().markLockHintSeen();
    await flush();

    const stored = await kv.get<{ state: { workouts: unknown[] }; version: number }>('library');
    expect(stored?.version).toBe(1);
    expect(stored?.state.workouts).toHaveLength(1);

    // simulate reload: fresh module instances hydrate from IndexedDB
    vi.resetModules();
    const fresh = await import('./library');
    const freshSettings = await import('./settings');
    const freshUi = await import('./ui');
    await (await import('./hydration')).waitForHydration();
    expect(fresh.getWorkout(FBW_A_ID)!.mode).toBe('circuit');
    expect(freshSettings.useSettings.getState().lang).toBe('en');
    expect(typeof freshSettings.useSettings.getState().setLang).toBe('function');
    expect(freshUi.useUi.getState().lockHintSeen).toBe(true);
    expect(getWorkout(FBW_A_ID)!.mode).toBe('circuit');
  });

  it('corrupt stored data falls back to defaults without crashing (EC22)', async () => {
    await kv.set('library', { state: { exercises: 'bad', workouts: [{ nope: true }] }, version: 1 });
    await kv.set('settings', { state: { lang: 'xx', sound: 'loud' }, version: 1 });
    await useLibrary.persist.rehydrate();
    await useSettings.persist.rehydrate();
    expect(useLibrary.getState().exercises).toEqual([]);
    expect(useLibrary.getState().workouts).toEqual([]);
    expect(['pl', 'en']).toContain(useSettings.getState().lang);
    expect(useSettings.getState().sound).toBe(true);
  });

  it('settings.update ignores unknown/invalid values', () => {
    useSettings.getState().update({ sound: false });
    expect(useSettings.getState().sound).toBe(false);
    useSettings.getState().update({ lang: 'xx' as 'pl' });
    expect(['pl', 'en']).toContain(useSettings.getState().lang);
  });
});
