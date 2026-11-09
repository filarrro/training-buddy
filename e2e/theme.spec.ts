import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { doneButton, openStart, waitForStored } from './helpers';

const theme = (page: Page) => page.evaluate(() => document.documentElement.dataset.theme);

test.describe('light / dark theme', () => {
  test('(n) follows the system by default and live', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await openStart(page);
    expect(await theme(page)).toBe('light');
    await page.emulateMedia({ colorScheme: 'dark' });
    await expect.poll(() => theme(page)).toBe('dark');
  });

  test('(o) a fixed choice wins over the system and survives a reload without a flash', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await openStart(page);
    await page.getByRole('button', { name: 'Ustawienia' }).click();
    await page.getByRole('radiogroup', { name: 'Motyw' }).getByRole('radio', { name: 'Ciemny' }).click();
    expect(await theme(page)).toBe('dark');
    await waitForStored(page, 'settings', '"theme":"dark"');
    await page.reload({ waitUntil: 'domcontentloaded' });
    // Set by the inline script before the app (and its stored settings) loaded.
    expect(await theme(page)).toBe('dark');
    await page.getByRole('button', { name: 'Ustawienia' }).click();
    await page.getByRole('radiogroup', { name: 'Motyw' }).getByRole('radio', { name: 'Systemowy' }).click();
    expect(await theme(page)).toBe('light');
  });

  test('(p) quick toggle on the start screen', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' });
    await openStart(page);
    await page.getByRole('button', { name: 'Włącz jasny motyw' }).click();
    expect(await theme(page)).toBe('light');
    await page.getByRole('button', { name: 'Włącz ciemny motyw' }).click();
    expect(await theme(page)).toBe('dark');
  });

  for (const scheme of ['light', 'dark'] as const) {
    test(`(q) colour contrast passes on main screens — ${scheme}`, async ({ page }) => {
      await page.emulateMedia({ colorScheme: scheme, reducedMotion: 'reduce' });
      const check = async (where: string) => {
        await page.waitForTimeout(900); // let entrance animations settle
        const r = await new AxeBuilder({ page }).withRules(['color-contrast']).analyze();
        const issues = r.violations.flatMap((v) =>
          v.nodes.map((n) => `${where}: ${n.target.join(' ')} — ${n.any[0]?.message ?? ''}`),
        );
        expect(issues, issues.join('\n')).toEqual([]);
      };
      await openStart(page);
      await check('start');
      await page.getByRole('button', { name: /FBW · masa ciała/ }).first().click();
      await check('plan');
      await page.locator('.plan-screen').getByRole('button', { name: /FBW A · masa ciała/ }).first().click();
      await check('preview');
      await page.getByRole('button', { name: 'Start', exact: true }).click();
      await page.getByRole('button', { name: 'Rozumiem, zaczynamy' }).click();
      await check('session work');
      await doneButton(page).click();
      await check('session rest');
      await page.getByRole('button', { name: 'Pomiń przerwę' }).click();
      await page.waitForTimeout(500);
      await page.getByRole('button', { name: 'Menu treningu' }).click();
      await page.getByRole('button', { name: 'Zakończ trening' }).first().click();
      await page.getByRole('alertdialog').getByRole('button', { name: /Zakończ/ }).click();
      await check('finish');
      await page.goto('/');
      await page.getByRole('button', { name: 'Ustawienia' }).click();
      await check('settings');
      await page.goto('/');
      await page.getByRole('button', { name: /Ćwiczenia i treningi/ }).click();
      await check('config plans');
      await page.getByRole('radio', { name: 'Ćwiczenia' }).click();
      await check('config exercises');
      await page.getByRole('button', { name: 'Nowe ćwiczenie' }).click();
      await check('exercise editor');
      await page.getByRole('button', { name: 'Wstecz' }).first().click();
      await page.getByRole('radio', { name: 'Treningi' }).click();
      await page.getByRole('button', { name: /Edytuj: FBW A$/ }).first().click();
      await check('workout editor');
    });
  }
});
