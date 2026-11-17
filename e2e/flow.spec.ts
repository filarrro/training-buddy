import { expect, test } from '@playwright/test';
import { doneButton, openStart, openWorkout, waitForStored } from './helpers';

const WORKOUT = /FBW A · masa ciała/;

async function begin(page: import('@playwright/test').Page): Promise<void> {
  await page.getByRole('button', { name: 'Start', exact: true }).click();
  await page.getByRole('button', { name: 'Rozumiem, zaczynamy' }).click();
  await expect(page.getByRole('progressbar', { name: 'Postęp treningu' })).toBeVisible();
}

test.describe('favourites and session flow', () => {
  test('(r) a favourite workout is listed first on the start screen and survives a reload', async ({ page }) => {
    await openStart(page);
    await expect(page.getByRole('heading', { name: /Ulubione/ })).toHaveCount(0);
    await openWorkout(page, WORKOUT);
    await page.getByRole('button', { name: 'Dodaj do ulubionych: FBW A · masa ciała' }).click();
    await waitForStored(page, 'library', 'builtin:fbw-a');
    await page.reload();
    await expect(page.getByRole('heading', { name: /Ulubione/ })).toBeVisible();
    await expect(page.locator('.wcard .wcard__name').first()).toHaveText('FBW A · masa ciała');
    // straight from the start screen into the preview
    await page.locator('.wcard').first().click();
    await expect(page.getByRole('button', { name: 'Usuń z ulubionych: FBW A · masa ciała' })).toBeVisible();
  });

  test('(s) the rest ends on its own by default; with the option off it waits and counts overtime', async ({ page }) => {
    await page.clock.install();
    await openStart(page);
    await openWorkout(page, WORKOUT);
    await begin(page);
    await doneButton(page).click();
    await expect(page.getByRole('button', { name: 'Pomiń przerwę' })).toBeVisible();
    await page.clock.fastForward(91_000);
    await expect(page.getByText('Ćwiczenie 1/5 · Seria 2/4')).toBeVisible();
    await expect(doneButton(page)).toBeVisible();

    // End, switch the option off and try again.
    await page.getByRole('button', { name: 'Menu treningu' }).click();
    await page.getByRole('button', { name: /Zakończ trening/ }).click();
    await page.getByRole('button', { name: 'Zakończ', exact: true }).click();
    await page.getByRole('button', { name: 'Wróć do startu' }).click();
    await openWorkout(page, WORKOUT);
    await page.getByRole('switch', { name: 'Automatycznie po przerwie' }).click();
    await page.getByRole('button', { name: 'Start', exact: true }).click();
    await expect(page.getByRole('progressbar', { name: 'Postęp treningu' })).toBeVisible();
    await page.clock.fastForward(1_000);
    await doneButton(page).click();
    await page.clock.fastForward(95_000);
    await expect(page.getByRole('heading', { name: 'Przerwa zakończona' })).toBeVisible();
    await expect(page.getByText('ponad przerwę')).toBeVisible();
    await page.getByRole('button', { name: 'Dalej' }).click();
    await expect(page.getByText('Ćwiczenie 1/5 · Seria 2/4')).toBeVisible();
  });

  test('(t) warm-up round: one light set of every exercise, then the plan from set 1', async ({ page }) => {
    await page.clock.install();
    await openStart(page);
    await openWorkout(page, WORKOUT);
    await page.getByRole('switch', { name: 'Seria rozgrzewkowa' }).click();
    await begin(page);
    await expect(page.getByText('Rozgrzewka · Ćwiczenie 1/5')).toBeVisible();
    await expect(page.getByText(/Lekko: małe obciążenie/)).toBeVisible();
    await doneButton(page).click();
    // short circuit rest (30 s), then exercise 2 of the warm-up on its own
    await expect(page.getByRole('heading', { name: 'Przerwa między ćwiczeniami' })).toBeVisible();
    await page.clock.fastForward(31_000);
    await expect(page.getByText('Rozgrzewka · Ćwiczenie 2/5')).toBeVisible();
    // jump to the first set of the plan through the step list
    await page.getByRole('button', { name: 'Lista kroków' }).click();
    await expect(page.getByRole('heading', { name: 'Rozgrzewka', exact: true })).toBeVisible();
  });
});
