// Captures documentation screenshots (docs/screenshots). Run with: SCREENSHOTS=1 npx playwright test screenshots
import { test, expect } from '@playwright/test';
import { tile, walkTo, face, waitForWorld, talkTo, newGuestCharacter } from './helpers.js';

const OUT = '../docs/screenshots';
test.skip(!process.env.SCREENSHOTS, 'set SCREENSHOTS=1 to capture documentation screenshots');

test('capture screens', async ({ page }) => {
  await page.goto('/');
  await page.screenshot({ path: `${OUT}/01-main-menu.png` });
  await newGuestCharacter(page, 'Adaeze');
  await page.waitForTimeout(800);
  await page.screenshot({ path: `${OUT}/02-udoka.png` });

  const dialog = await talkTo(page, 'nneka', 'Nneka');
  await page.waitForTimeout(2500);
  await page.screenshot({ path: `${OUT}/03-dialogue.png` });
  await dialog.getByRole('button', { name: /How short are you/ }).click({ timeout: 20_000 });
  await dialog.getByRole('button', { name: /I will tell everyone/ }).click({ timeout: 20_000 });
  await expect(dialog).toBeHidden();

  await page.keyboard.press('j');
  await expect(page.getByRole('dialog', { name: 'Missions' })).toBeVisible();
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${OUT}/04-missions.png` });
  await page.keyboard.press('Escape');

  await walkTo(page, tile(5, 9), { axisFirst: 'y' });
  await walkTo(page, tile(5, 22), { axisFirst: 'y' });
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${OUT}/05-market.png` });
  await walkTo(page, tile(5, 9), { axisFirst: 'y' });
  await walkTo(page, tile(4, 8), { axisFirst: 'x' });
  await page.keyboard.down('ArrowUp');
  await waitForWorld(page, 'home');
  await page.keyboard.up('ArrowUp');
  await walkTo(page, tile(2, 6), { axisFirst: 'x', tolerance: 8 });
  await face(page, 'left');
  await page.keyboard.press('p');
  await page.getByRole('button', { name: /Scripture-guided/ }).click();
  await page.waitForTimeout(1200);
  await page.screenshot({ path: `${OUT}/06-prayer.png` });
  await page.keyboard.press('Escape');

  await page.keyboard.press('b');
  await page.getByRole('tab', { name: 'Topics' }).click();
  await page.waitForTimeout(1500);
  await page.screenshot({ path: `${OUT}/07-bible.png` });
  await page.keyboard.press('Escape');

  await page.keyboard.press('m');
  await page.getByRole('tab', { name: 'Eras (history)' }).click();
  await page.screenshot({ path: `${OUT}/08-map.png` });
  await page.keyboard.press('Escape');

  await page.getByRole('button', { name: 'Pause (Esc)' }).click();
  await page.getByRole('button', { name: 'Trigger the trumpet' }).click();
  await page.waitForTimeout(1500);
  await page.screenshot({ path: `${OUT}/09-trumpet.png` });
  await expect(page.getByText(/earthly journey has come to its end/)).toBeVisible({ timeout: 20_000 });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: `${OUT}/10-ending-scripture.png` });
  await page.getByRole('button', { name: 'Look back on this life' }).click();
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByRole('button', { name: 'See the full life report' }).click();
  await page.waitForTimeout(1500);
  await page.screenshot({ path: `${OUT}/11-life-report.png` });
});
