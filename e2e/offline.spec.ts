import { expect, test } from '@playwright/test';
import { openStart } from './helpers';

test('(g) after the first load the app starts offline (service worker precache)', async ({ page, context }) => {
  await openStart(page);
  // Wait until the service worker controls the page (it claims clients on first install).
  await page.waitForFunction(() => navigator.serviceWorker?.controller != null, undefined, { timeout: 15_000 });

  await context.setOffline(true);
  await page.reload();
  await expect(page.getByRole('heading', { name: /Gotowy na trening\?/ })).toBeVisible();
  await expect(page.getByRole('button', { name: /FBW · masa ciała/ })).toBeVisible();
  await context.setOffline(false);
});
