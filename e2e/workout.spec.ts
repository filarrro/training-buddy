import { expect, test } from '@playwright/test';
import { doneButton, openStart, progressText, startWorkout } from './helpers';

/** Mirrors ACTION_GUARD_MS in src/session/store.ts (double-tap guard between session actions). */
const ACTION_GUARD_MS = 400;

test.describe('workout session', () => {
  test('(a) completes FBW A end-to-end and shows the summary', async ({ page }) => {
    await page.clock.install();
    await openStart(page);
    await startWorkout(page, /FBW A · masa ciała/);

    const skipRest = page.getByRole('button', { name: 'Pomiń przerwę' });
    const timerStart = page.locator('.sx-actions').getByRole('button', { name: 'Start', exact: true });
    const finishTitle = page.getByRole('heading', { name: 'Trening ukończony!' });
    let timedOnce = false;

    for (let guard = 0; guard < 80; guard++) {
      if (await finishTitle.isVisible()) break;
      if (await skipRest.isVisible()) {
        await page.clock.fastForward(ACTION_GUARD_MS + 100);
        await skipRest.click();
        continue;
      }
      if (!timedOnce && (await timerStart.isVisible())) {
        // Plank set 1: run the real timer — prepare 3-2-1, then the 45 s countdown.
        await page.clock.fastForward(ACTION_GUARD_MS + 100);
        await timerStart.click();
        await expect(page.getByText('Przygotuj się')).toBeVisible();
        await page.clock.fastForward(3_500);
        await expect(page.getByText('Trzymaj!')).toBeVisible();
        await page.clock.fastForward(46_000);
        await expect(page.getByText('Czas!')).toBeVisible();
        timedOnce = true;
      }
      // Human pace: the store ignores a second action within ACTION_GUARD_MS (double-tap guard,
      // e.g. left → right side with no rest in between, or "Pomiń przerwę" → "Zrobione").
      await page.clock.fastForward(ACTION_GUARD_MS + 100);
      await doneButton(page).click();
    }

    await expect(finishTitle).toBeVisible();
    expect(timedOnce).toBe(true);
    const summary = page.getByRole('region', { name: 'Podsumowanie' });
    await expect(summary).toBeVisible();
    await expect(summary.getByText('5 z 5')).toBeVisible();
    await page.getByRole('button', { name: 'Wróć do startu' }).click();
    await expect(page.getByRole('heading', { name: /Gotowy na trening\?/ })).toBeVisible();
  });

  test('(b) "Wstecz" from set 2 returns to set 1', async ({ page }) => {
    await openStart(page);
    await startWorkout(page, /FBW A · masa ciała/);
    const position = page.locator('.sx-position');
    await expect(position).toHaveText(/Seria 1\/4/);
    await doneButton(page).click();
    await page.waitForTimeout(ACTION_GUARD_MS + 100); // human pace (double-tap guard)
    await page.getByRole('button', { name: 'Pomiń przerwę' }).click();
    await expect(position).toHaveText(/Seria 2\/4/);

    await page.waitForTimeout(ACTION_GUARD_MS + 100);
    await page.locator('.sx-actions').getByRole('button', { name: 'Wstecz' }).click();
    await expect(position).toHaveText(/Seria 1\/4/);
    await expect(page.getByText('Zrobione wcześniej')).toBeVisible();
  });

  test('(c) jumping forward via the step list marks skipped steps and counts them', async ({ page }) => {
    await openStart(page);
    await startWorkout(page, /FBW A · masa ciała/);
    expect(await progressText(page)).toBe('0 z 20 kroków');

    await page.getByRole('button', { name: 'Lista kroków' }).click();
    const sheet = page.getByRole('dialog', { name: 'Lista kroków' });
    await expect(sheet).toBeVisible();
    // FBW A order: pull-ups (4 sets) → dips; jump to dips set 1.
    await sheet.locator('section', { hasText: 'Dipy (pompki na poręczach)' }).getByRole('button', { name: /Seria 1/ }).click();
    await expect(sheet).toBeHidden();

    await expect(page.locator('.sx-name')).toHaveText('Dipy (pompki na poręczach)');
    await expect(page.locator('.sx-position')).toHaveText(/Ćwiczenie 2\/5 · Seria 1\/4/);
    expect(await progressText(page)).toBe('4 z 20 kroków');

    await page.getByRole('button', { name: 'Lista kroków' }).click();
    await expect(sheet.getByText('Pominięte')).toHaveCount(4);
  });
});

test.describe('session layout on a short phone', () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test('(j) time step before Start: "Potem" card is not under the two-row action bar', async ({ page }) => {
    await openStart(page);
    await startWorkout(page, /FBW A · masa ciała/);
    await page.getByRole('button', { name: 'Lista kroków' }).click();
    const sheet = page.getByRole('dialog', { name: 'Lista kroków' });
    await sheet.locator('section', { hasText: 'Plank (deska)' }).getByRole('button', { name: /Seria 1/ }).click();
    await expect(sheet).toBeHidden();
    await expect(page.locator('.sx-actions').getByRole('button', { name: 'Start', exact: true })).toBeVisible();
    const card = await page.locator('.sx-upnext').boundingBox();
    const bar = await page.locator('.sx-actions').boundingBox();
    expect(card && bar).toBeTruthy();
    // the bar's top padding fades out (16 px); the card must end above the buttons
    expect(card!.y + card!.height).toBeLessThanOrEqual(bar!.y + 16);
  });
});
