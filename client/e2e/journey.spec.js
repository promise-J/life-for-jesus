// The critical path of a whole (short) life, end to end, against the real server and database.
import { test, expect } from '@playwright/test';
import { pos, tile, walkTo, face, waitForWorld, talkTo, newGuestCharacter } from './helpers.js';

test('a complete journey: create, explore, work, buy, pray, read, save, end, report, new life', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));

  // 1–4: open the app, play as a guest, create a character, enter the world
  await newGuestCharacter(page, 'Kelechi');
  await expect(page.getByText('Kelechi, 19')).toBeVisible();
  await expect(page.getByText('First Steps in Udoka')).toBeVisible();

  // 5: move in all four directions
  const start = await pos(page);
  await page.keyboard.down('ArrowDown');
  await page.waitForTimeout(400);
  await page.keyboard.up('ArrowDown');
  const down = await pos(page);
  expect(down.y).toBeGreaterThan(start.y);
  await page.keyboard.down('ArrowRight');
  await page.waitForTimeout(400);
  await page.keyboard.up('ArrowRight');
  const right = await pos(page);
  expect(right.x).toBeGreaterThan(down.x);
  await page.keyboard.down('ArrowLeft');
  await page.waitForTimeout(300);
  await page.keyboard.up('ArrowLeft');
  const left = await pos(page);
  expect(left.x).toBeLessThan(right.x);
  await page.keyboard.down('ArrowUp');
  await page.waitForTimeout(200);
  await page.keyboard.up('ArrowUp');
  expect((await pos(page)).y).toBeLessThan(left.y);

  // 6: talk to a neighbour (Nneka) and make a dialogue choice
  const dialog = await talkTo(page, 'nneka', 'Nneka');
  await dialog.getByRole('button', { name: /How short are you/ }).click({ timeout: 20_000 });
  await dialog.getByRole('button', { name: /I will tell everyone/ }).click({ timeout: 20_000 });
  await expect(dialog).toBeHidden();

  // 7–8: get a job, earn coins, then spend them at Oja Market
  await page.keyboard.press('k');
  await page.getByRole('tab', { name: 'Find work' }).click();
  const porter = page.locator('li', { hasText: 'Market porter' });
  await porter.getByRole('button', { name: 'Apply' }).click();
  await expect(page.getByText(/You got the job/)).toBeVisible();
  await page.getByRole('tab', { name: 'My work' }).click();
  await page.getByRole('button', { name: 'Work a shift' }).click();
  await expect(page.getByText(/Earned 1,\d{3} LC/)).toBeVisible();
  await page.keyboard.press('Escape');

  await walkTo(page, tile(5, 9), { axisFirst: 'y' });
  await walkTo(page, tile(5, 25), { axisFirst: 'y' });
  await walkTo(page, tile(4, 25), { axisFirst: 'x' });
  await face(page, 'left');
  await page.keyboard.press('e');
  const shop = page.getByRole('dialog', { name: /Oja Market food stall/ });
  await expect(shop).toBeVisible();
  await shop.locator('li', { hasText: 'Plate of jollof rice' }).getByRole('button', { name: 'Buy' }).click();
  await expect(page.getByText(/Bought 1 × Plate of jollof rice/)).toBeVisible();
  await page.keyboard.press('Escape');

  // eat it (inventory)
  await page.keyboard.press('i');
  await page.locator('li', { hasText: 'Plate of jollof rice' }).getByRole('button', { name: /Eat/ }).click();
  await expect(page.getByText(/You enjoyed the plate of jollof rice/)).toBeVisible();
  await page.keyboard.press('Escape');

  // 9: complete a mission — go home and sleep
  await walkTo(page, tile(5, 25), { axisFirst: 'x' });
  await walkTo(page, tile(5, 9), { axisFirst: 'y' });
  await walkTo(page, tile(4, 8), { axisFirst: 'x' });
  await page.keyboard.down('ArrowUp');
  await waitForWorld(page, 'home');
  await page.keyboard.up('ArrowUp');
  await walkTo(page, tile(2, 3), { axisFirst: 'x', tolerance: 8 });
  await face(page, 'up');
  await page.keyboard.press('e');
  await page.getByRole('button', { name: 'Sleep until morning' }).click();
  await expect(page.getByText(/Mission complete: First Steps in Udoka/)).toBeVisible();

  // prayer at the prayer corner with a journal entry
  await page.keyboard.press('p');
  await page.getByRole('button', { name: /Thanksgiving/ }).click();
  await page.getByPlaceholder(/Write your character/).fill('Thank you for a new job and a full stomach.');
  await page.getByRole('button', { name: /Pray \(about 20 minutes\)/ }).click();
  await expect(page.getByText('Amen.')).toBeVisible();
  await page.getByRole('tab', { name: 'Prayer journal' }).click();
  await expect(page.getByText('Thank you for a new job and a full stomach.')).toBeVisible();
  await page.keyboard.press('Escape');

  // 10: Scripture — search the Bible Explorer
  await page.keyboard.press('b');
  await page.getByRole('tab', { name: 'Search' }).click();
  await page.getByPlaceholder(/Words/).fill('John 3:16');
  await page.getByRole('button', { name: 'Search', exact: true }).click();
  await expect(page.getByText(/For God so loved the world/).first()).toBeVisible();
  await page.keyboard.press('Escape');

  // 11: save and reload — the character comes back where they were
  const coins = await page.evaluate(() => document.body.innerText.match(/([\d,]+)\s*Life Coins/)?.[1]);
  await page.getByRole('button', { name: 'Pause (Esc)' }).click();
  await page.getByRole('button', { name: /Save now/ }).click();
  await page.reload();
  await waitForWorld(page, 'home');
  await expect(page.getByText(new RegExp(`${coins}\\s*Life Coins`))).toBeVisible();

  // 12–13: trigger the ending (development tools) and walk through it to the report
  await page.getByRole('button', { name: 'Pause (Esc)' }).click();
  await page.getByRole('button', { name: 'Trigger the trumpet' }).click();
  await expect(page.getByText('The trumpet sounds.')).toBeVisible();
  await expect(page.getByText(/earthly journey has come to its end/)).toBeVisible({ timeout: 20_000 });
  await expect(page.getByText(/at the last trumpet/i).first()).toBeVisible();
  await page.getByRole('button', { name: 'Look back on this life' }).click();
  await expect(page.getByText('A life, remembered')).toBeVisible();
  await expect(page.getByText(/Completed “First Steps in Udoka”/).first()).toBeVisible();
  await page.getByRole('button', { name: 'Continue' }).click();
  await expect(page.getByText('Accountability and grace')).toBeVisible();
  await expect(page.getByText(/by grace you have been saved/i).first()).toBeVisible();
  await page.getByRole('button', { name: 'See the full life report' }).click();
  await expect(page.getByText(/record of a simulated life/)).toBeVisible();
  await expect(page.getByText(/Market porter/).first()).toBeVisible();

  // 14: start a new character; the ended one remains with its report
  await page.getByRole('button', { name: 'Start a new life' }).click();
  await page.getByPlaceholder(/Chiamaka/).fill('Ngozi');
  await page.getByRole('button', { name: /Next: where you start/ }).click();
  await page.getByRole('button', { name: /Next: how you play/ }).click();
  await page.getByRole('button', { name: /Begin Ngozi/ }).click();
  await page.waitForURL(/\/play\//);
  await page.goto('/');
  await expect(page.getByText('Ngozi')).toBeVisible();
  await expect(page.getByText('Kelechi')).toBeVisible();
  await expect(page.getByText('Story ended')).toBeVisible();
  await page.getByRole('button', { name: 'Life report for Kelechi' }).click();
  await expect(page.getByText(/Kelechi: a life report/)).toBeVisible();

  expect(errors).toEqual([]);
});

test('touch controls appear on touch devices and move the player', async ({ browser }) => {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
  const page = await ctx.newPage();
  await newGuestCharacter(page, 'Tolu');
  const dpad = page.getByTestId('dpad');
  await expect(dpad).toBeVisible();
  const before = await pos(page);
  const btn = page.getByRole('button', { name: 'Walk down' });
  const box = await btn.boundingBox();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.waitForTimeout(500);
  await page.mouse.up();
  expect((await pos(page)).y).toBeGreaterThan(before.y);
  await expect(page.getByRole('button', { name: 'Interact' })).toBeVisible();
  await ctx.close();
});
