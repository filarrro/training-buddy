import { expect, test } from '@playwright/test';
import { openStart, waitForStored, openWorkout } from './helpers';

test.describe('persistence', () => {
  test('(d) circuit mode chosen in preview survives a reload', async ({ page }) => {
    await openStart(page);
    await openWorkout(page, /FBW A · masa ciała/);
    const modes = page.getByRole('radiogroup', { name: 'Tryb treningu' });
    await expect(modes.getByRole('radio', { name: 'Klasyczny' })).toHaveAttribute('aria-checked', 'true');
    await modes.getByRole('radio', { name: 'Obwód' }).click();
    await expect(modes.getByRole('radio', { name: 'Obwód' })).toHaveAttribute('aria-checked', 'true');
    await expect(page.getByText('4 rundy')).toBeVisible();
    await waitForStored(page, 'library', '"mode":"circuit"');

    await page.reload();
    await expect(page.getByRole('heading', { name: /Gotowy na trening\?/ })).toBeVisible();
    await openWorkout(page, /FBW A · masa ciała/);
    await expect(
      page.getByRole('radiogroup', { name: 'Tryb treningu' }).getByRole('radio', { name: 'Obwód' }),
    ).toHaveAttribute('aria-checked', 'true');
  });

  test('(e) switching the language to English survives a reload', async ({ page }) => {
    await openStart(page);
    await page.getByRole('button', { name: 'Ustawienia' }).click();
    await page.getByRole('radiogroup', { name: 'Język' }).getByRole('radio', { name: 'English' }).click();
    await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible();
    await waitForStored(page, 'settings', '"lang":"en"');

    await page.reload();
    await expect(page.getByRole('heading', { name: /Ready to train\?/i })).toBeVisible();
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  });
});
