import { readFile } from 'node:fs/promises';
import { expect, test, type Page } from '@playwright/test';
import { doneButton, openStart, openWorkout, startWorkout, waitForStored } from './helpers';

const FBW_A = /FBW A · masa ciała/;

/** A session with one set done (in its rest), saved, then the app reloaded. */
async function interruptedSession(page: Page): Promise<void> {
  await openStart(page);
  await startWorkout(page, FBW_A);
  await doneButton(page).click();
  await expect(page.getByRole('button', { name: 'Pomiń przerwę' })).toBeVisible();
  await waitForStored(page, 'session', '"done"');
  await page.reload();
  await expect(page.getByRole('heading', { name: /Gotowy na trening\?/ })).toBeVisible();
}

test.describe('unfinished workout', () => {
  test('(u) survives a reload: "Kontynuuj trening" returns to the running rest', async ({ page }) => {
    await interruptedSession(page);
    const banner = page.locator('.resume');
    await expect(banner).toContainText('Niedokończony trening');
    await expect(banner).toContainText('FBW A · masa ciała');
    await expect(banner).toContainText('Zrobione kroki: 1 z 20');
    await banner.getByRole('button', { name: 'Kontynuuj trening' }).click();
    await expect(page.getByRole('button', { name: 'Pomiń przerwę' })).toBeVisible();
    await expect(page.getByRole('progressbar', { name: 'Postęp treningu' })).toHaveAttribute('aria-valuetext', /1/);
  });

  test('(v) starting another workout asks first; discarding from the banner removes it', async ({ page }) => {
    await interruptedSession(page);
    await openWorkout(page, /FBW B · masa ciała/);
    await page.getByRole('button', { name: 'Start', exact: true }).click();
    const dialog = page.getByRole('alertdialog');
    await expect(dialog).toContainText('Masz niedokończony trening „FBW A · masa ciała”');
    await dialog.getByRole('button', { name: 'Anuluj' }).click();
    // still there after cancelling
    await page.getByRole('button', { name: 'Wstecz' }).first().click();
    await page.getByRole('button', { name: 'Wstecz' }).first().click();
    await expect(page.locator('.resume')).toBeVisible();

    await openWorkout(page, /FBW B · masa ciała/);
    await page.getByRole('button', { name: 'Start', exact: true }).click();
    await page.getByRole('alertdialog').getByRole('button', { name: 'Porzuć i zacznij' }).click();
    await expect(page.locator('.sx-name')).toBeVisible();
    await expect(page.getByRole('progressbar', { name: 'Postęp treningu' })).toHaveAttribute('aria-valuetext', /^0/);
  });
});

test('(w) backup: export, reset, import restores favourites and workout options', async ({ page }, testInfo) => {
  await openStart(page);
  await openWorkout(page, FBW_A);
  await page.getByRole('button', { name: 'Dodaj do ulubionych: FBW A · masa ciała' }).click();
  await page.getByRole('switch', { name: /Seria rozgrzewkowa/ }).click();
  await waitForStored(page, 'library', '"warmup":true');
  await page.getByRole('button', { name: 'Wstecz' }).first().click();
  await page.getByRole('button', { name: 'Wstecz' }).first().click();

  await page.getByRole('button', { name: 'Ustawienia' }).click();
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Eksportuj dane' }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/^training-buddy-\d{4}-\d{2}-\d{2}\.json$/);
  const path = testInfo.outputPath('backup.json');
  await download.saveAs(path);
  const backup = JSON.parse(await readFile(path, 'utf8')) as { app: string; version: number; data: { favorites: string[] } };
  expect(backup).toMatchObject({ app: 'training-buddy', version: 1 });
  expect(backup.data.favorites).toEqual(['builtin:fbw-a']);

  // reset → first-launch state
  await page.getByRole('button', { name: 'Resetuj dane' }).click();
  await page.getByRole('alertdialog').getByRole('button', { name: 'Resetuj' }).click();
  await expect(page.getByRole('heading', { name: /Gotowy na trening\?/ })).toBeVisible();
  await expect(page.getByRole('heading', { name: /Ulubione/ })).toHaveCount(0);

  await page.getByRole('button', { name: 'Ustawienia' }).click();
  const input = page.locator('input[type="file"]');
  // a broken file changes nothing
  await input.setInputFiles({ name: 'bad.json', mimeType: 'application/json', buffer: Buffer.from('{"app":"x"}') });
  await expect(page.getByText('To nie jest poprawny plik kopii. Dane bez zmian.')).toBeVisible();
  // a file from a newer version is refused
  await input.setInputFiles({
    name: 'newer.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify({ ...backup, version: 99 })),
  });
  await expect(page.getByText(/z nowszej wersji aplikacji/)).toBeVisible();

  await input.setInputFiles(path);
  const dialog = page.getByRole('alertdialog');
  await expect(dialog).toContainText('Zastąpić dane kopią?');
  await dialog.getByRole('button', { name: 'Zastąp dane' }).click();
  await expect(page.getByText('Dane odtworzone z kopii.')).toBeVisible();

  await page.getByRole('button', { name: 'Wstecz' }).first().click();
  await expect(page.getByRole('heading', { name: /Ulubione/ })).toBeVisible();
  await page.locator('.wcard').first().click();
  await expect(page.getByRole('switch', { name: /Seria rozgrzewkowa/ })).toHaveAttribute('aria-checked', 'true');
});
