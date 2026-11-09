import { expect, type Page } from '@playwright/test';

/** Open the app on a fresh profile and wait for the start screen. */
export async function openStart(page: Page): Promise<void> {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: /Gotowy na trening\?|Ready to train\?/ })).toBeVisible();
}

/** Plan that holds each built-in workout (start screen lists plans, not workouts). */
function planOf(name: RegExp | string): RegExp {
  const n = String(name);
  if (n.includes('masa ciała')) return /FBW · masa ciała/;
  if (n.includes('ekspres')) return /FBW · ekspres/;
  return /FBW · z obciążeniem/;
}

/** Start screen → plan → workout preview. */
export async function openWorkout(page: Page, name: RegExp | string): Promise<void> {
  await page.getByRole('button', { name: planOf(name) }).first().click();
  await page.locator('.plan-screen').getByRole('button', { name }).first().click();
}

/** Start screen → plan → preview of a workout → Start → (first time) lock hint → session. */
export async function startWorkout(page: Page, name: RegExp | string): Promise<void> {
  await openWorkout(page, name);
  await page.getByRole('button', { name: 'Start', exact: true }).click();
  const lock = page.getByRole('button', { name: 'Rozumiem, zaczynamy' });
  await expect(lock).toBeVisible();
  await lock.click();
  await expect(page.getByRole('progressbar', { name: 'Postęp treningu' })).toBeVisible();
}

/** The "Zrobione" button in the session action bar (main button, or the secondary one before a timer start). */
export const doneButton = (page: Page) => page.locator('.sx-actions').getByRole('button', { name: 'Zrobione' });

/** Session progress text "x/y" from the header. */
export async function progressText(page: Page): Promise<string> {
  const bar = page.getByRole('progressbar', { name: 'Postęp treningu' });
  return (await bar.getAttribute('aria-valuetext')) ?? '';
}

/**
 * Wait until the IndexedDB key (DB "training-buddy", store "kv") holds a value whose JSON contains
 * `needle`. Persist writes are async; reloading a few ms after a tap could abort the pending
 * transaction, which no real user does — so tests wait for the commit before reloading.
 */
export async function waitForStored(page: Page, key: string, needle: string): Promise<void> {
  await page.waitForFunction(
    async ([k, n]) => {
      // Never create the DB here (the app's idb-keyval open must run the upgrade): abort it.
      const db = await new Promise<IDBDatabase | null>((resolve) => {
        const req = indexedDB.open('training-buddy');
        req.onupgradeneeded = () => req.transaction?.abort();
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => resolve(null);
      });
      if (!db) return false;
      try {
        if (!db.objectStoreNames.contains('kv')) return false;
        const value = await new Promise<unknown>((resolve, reject) => {
          const req = db.transaction('kv', 'readonly').objectStore('kv').get(k);
          req.onsuccess = () => resolve(req.result);
          req.onerror = () => reject(req.error);
        });
        return value !== undefined && JSON.stringify(value).includes(n);
      } catch {
        return false;
      } finally {
        db.close();
      }
    },
    [key, needle] as const,
    { timeout: 5_000, polling: 50 },
  );
}
