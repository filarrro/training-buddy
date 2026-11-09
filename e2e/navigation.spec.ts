import { devices, expect, test } from '@playwright/test';
import { openStart, startWorkout, waitForStored } from './helpers';

test('(h) system back: closes a sheet first, asks before discarding a dirty form', async ({ page }) => {
  await openStart(page);
  await page.getByRole('button', { name: /Ćwiczenia i treningi/ }).click();
  await page.getByRole('radio', { name: 'Treningi' }).click();
  await page.getByRole('button', { name: 'Nowy trening' }).click();
  await page.getByLabel('Nazwa').fill('Szkic');

  await page.getByRole('button', { name: 'Dodaj ćwiczenie' }).first().click();
  const picker = page.getByRole('dialog', { name: 'Wybierz ćwiczenie' });
  await expect(picker).toBeVisible();
  await page.goBack();
  await expect(picker).toBeHidden();
  await expect(page.getByLabel('Nazwa')).toHaveValue('Szkic');

  await page.goBack();
  const discard = page.getByRole('alertdialog', { name: 'Odrzucić zmiany?' });
  await expect(discard).toBeVisible();
  await discard.getByRole('button', { name: 'Odrzuć' }).click();
  await expect(page.getByRole('heading', { name: 'Konfigurator' })).toBeVisible();
});

test('(h2) system back during a session asks to end the workout', async ({ page }) => {
  await openStart(page);
  await startWorkout(page, /FBW A · masa ciała/);
  await page.goBack();
  const confirm = page.getByRole('alertdialog', { name: 'Zakończyć trening?' });
  await expect(confirm).toBeVisible();
  await confirm.getByRole('button', { name: 'Ćwiczę dalej' }).click();
  await expect(confirm).toBeHidden();
  await expect(page.locator('.sx-position')).toHaveText(/Seria 1\/4/);
});

test.describe('iOS first launch', () => {
  test.use({ userAgent: devices['iPhone 13'].userAgent });

  test('(i) shows the install screen once, then the start screen', async ({ page }) => {
    await page.goto('/');
    const cont = page.getByRole('button', { name: 'Kontynuuj w przeglądarce' });
    await expect(cont).toBeVisible();
    await cont.click();
    await expect(page.getByRole('heading', { name: /Gotowy na trening\?/ })).toBeVisible();
    await waitForStored(page, 'ui', '"installScreenSeen":true');
    await page.reload();
    await expect(page.getByRole('heading', { name: /Gotowy na trening\?/ })).toBeVisible();
    await expect(cont).toBeHidden();
  });
});
