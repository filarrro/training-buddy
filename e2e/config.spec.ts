import { expect, test } from '@playwright/test';
import { openStart } from './helpers';

test('(f) creates a custom exercise and a workout with it, then starts it', async ({ page }) => {
  const exName = 'Wiosłowanie E2E';
  const workoutName = 'Plecy E2E';
  await openStart(page);
  await page.getByRole('button', { name: /Ćwiczenia i treningi/ }).click();

  // New exercise
  await page.getByRole('radio', { name: 'Ćwiczenia' }).click();
  await page.getByRole('button', { name: 'Nowe ćwiczenie' }).click();
  await page.getByLabel('Nazwa').fill(exName);
  await page.getByRole('radiogroup', { name: 'Kategoria' }).getByRole('radio', { name: 'Pull' }).click();
  await page.getByRole('button', { name: 'Zapisz' }).click();
  await expect(page.getByRole('button', { name: `Edytuj: ${exName}` })).toBeVisible();

  // New workout using it
  await page.getByRole('radio', { name: 'Treningi' }).click();
  await page.getByRole('button', { name: 'Nowy trening' }).click();
  await page.getByLabel('Nazwa').fill(workoutName);
  await page.getByRole('button', { name: 'Dodaj ćwiczenie' }).first().click();
  const picker = page.getByRole('dialog', { name: 'Wybierz ćwiczenie' });
  await picker.getByRole('button', { name: new RegExp(exName) }).click();
  await expect(picker).toBeHidden();
  await expect(page.getByRole('article', { name: 'Ćwiczenie 1' })).toContainText(exName);
  await page.getByRole('button', { name: 'Zapisz' }).click();
  await expect(page.getByRole('button', { name: `Edytuj: ${workoutName}` })).toBeVisible();

  // Back to start and run it
  await page.getByRole('button', { name: 'Wstecz' }).first().click();
  await expect(page.getByRole('heading', { name: /Gotowy na trening\?/ })).toBeVisible();
  await page.getByRole('button', { name: new RegExp(workoutName) }).click();
  await page.getByRole('button', { name: 'Start', exact: true }).click();
  await page.getByRole('button', { name: 'Rozumiem, zaczynamy' }).click();
  await expect(page.locator('.sx-name')).toHaveText(exName);
  await expect(page.locator('.sx-position')).toHaveText(/Seria 1\/3/);
});
