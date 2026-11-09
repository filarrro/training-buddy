import { expect, test } from '@playwright/test';
import { doneButton, openStart, openWorkout, startWorkout } from './helpers';

const ACTION_GUARD_MS = 400;

test.describe('weighted plans with supersets and circuits', () => {
  test('(k) express A: circuit exercises follow back-to-back, rest only after the round', async ({ page }) => {
    await openStart(page);
    await openWorkout(page, /FBW A · ekspres/);
    // Preview shows the circuit blocks with their own rests and the warm-up note.
    await expect(page.getByText('Przed treningiem zrób rozgrzewkę.')).toBeVisible();
    await expect(page.getByText('Obwód', { exact: true }).first()).toBeVisible();
    await expect(page.getByText('5 rund')).toBeVisible();
    await page.getByRole('button', { name: 'Start', exact: true }).click();
    await page.getByRole('button', { name: 'Rozumiem, zaczynamy' }).click();

    const position = page.locator('.sx-position');
    await expect(position).toHaveText('Obwód · Runda 1/5 · Ćwiczenie 1/6');
    await expect(page.locator('.sx-name')).toHaveText('Wyciskanie sztangi leżąc');
    await doneButton(page).click();
    // no rest inside the round
    await expect(position).toHaveText('Obwód · Runda 1/5 · Ćwiczenie 2/6');
    await page.waitForTimeout(ACTION_GUARD_MS + 100);
    await doneButton(page).click();
    await expect(position).toHaveText('Obwód · Runda 1/5 · Ćwiczenie 3/6');
    await expect(page.getByText('Powolne, 5-sekundowe opuszczanie.')).toBeVisible();
    await page.waitForTimeout(ACTION_GUARD_MS + 100);
    await doneButton(page).click();
    // rest after the round: 3:30
    await expect(page.getByText('Przerwa między rundami')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Pomiń przerwę' })).toBeVisible();
  });

  test('(l) FBW A weighted: superset label and 3 min rest after a heavy set', async ({ page }) => {
    await openStart(page);
    await startWorkout(page, /^FBW A(?! ·)/);
    await expect(page.locator('.sx-position')).toHaveText('Ćwiczenie 1/8 · Seria 1/5');
    await doneButton(page).click();
    await expect(page.getByText('Przerwa między seriami')).toBeVisible();
    await expect(page.locator('.sx-rest, .sx-clock, [class*="rest"]').getByText(/^(3:00|2:59)$/).first()).toBeVisible();
  });
});

test('(m) plan suggests B after finishing A (ended early with a set done)', async ({ page }) => {
  await openStart(page);
  await expect(page.getByText('Następny: FBW A · masa ciała')).toBeVisible();
  await startWorkout(page, /FBW A · masa ciała/);
  await doneButton(page).click();
  await page.waitForTimeout(500);
  await page.getByRole('button', { name: 'Menu treningu' }).click();
  await page.getByRole('button', { name: 'Zakończ trening' }).first().click();
  await page.getByRole('alertdialog').getByRole('button', { name: /Zakończ/ }).click();
  await page.getByRole('button', { name: 'Wróć do startu' }).click();
  await expect(page.getByText('Następny: FBW B · masa ciała')).toBeVisible();
});
