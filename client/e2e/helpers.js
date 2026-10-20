import { expect } from '@playwright/test';

export const TILE = 32;
export const tile = (tx, ty) => ({ x: tx * TILE + TILE / 2, y: ty * TILE + TILE - 1 });

export async function pos(page) {
  return page.evaluate(() => window.__lfj?.bridge?.pos || null);
}

export async function waitForWorld(page, mapId) {
  await expect.poll(async () => (await pos(page))?.mapId, { timeout: 30_000 }).toBe(mapId);
  await page.waitForTimeout(300);
}

/** Walk with the keyboard (one axis at a time) until close to the target pixel position. */
export async function walkTo(page, target, { tolerance = 6, axisFirst = 'y', maxSteps = 400 } = {}) {
  const axes = axisFirst === 'y' ? ['y', 'x'] : ['x', 'y'];
  for (const axis of axes) {
    let stuck = 0;
    for (let i = 0; i < maxSteps; i++) {
      const p = await pos(page);
      const delta = target[axis] - p[axis];
      if (Math.abs(delta) <= tolerance) break;
      const key = axis === 'x' ? (delta > 0 ? 'ArrowRight' : 'ArrowLeft') : delta > 0 ? 'ArrowDown' : 'ArrowUp';
      const ms = Math.min(400, Math.max(60, (Math.abs(delta) / 118) * 1000 * 0.8));
      await page.keyboard.down(key);
      await page.waitForTimeout(ms);
      await page.keyboard.up(key);
      const after = await pos(page);
      stuck = after.x === p.x && after.y === p.y ? stuck + 1 : 0;
      if (stuck >= 3) throw new Error(`Blocked walking ${key} at ${JSON.stringify(p)} toward ${JSON.stringify(target)}`);
    }
  }
  return pos(page);
}

/** Tap a key briefly to turn and face a direction without moving far. */
export async function face(page, dir) {
  const key = { up: 'ArrowUp', down: 'ArrowDown', left: 'ArrowLeft', right: 'ArrowRight' }[dir];
  await page.keyboard.down(key);
  await page.waitForTimeout(20);
  await page.keyboard.up(key);
}

export async function npcPosition(page, npcId) {
  return page.evaluate((id) => {
    const n = window.__lfj.game.scene.getScene('world').npcs.get(id);
    return n ? { x: n.sprite.x, y: n.sprite.y } : null;
  }, npcId);
}

export async function newGuestCharacter(page, name, { mode = 'Mission Mode' } = {}) {
  await page.goto('/');
  const guest = page.getByRole('button', { name: 'Play as guest' });
  if (await guest.isVisible().catch(() => false)) await guest.click();
  await page.getByRole('button', { name: /Start a new life/ }).click();
  await page.getByPlaceholder(/Chiamaka/).fill(name);
  await page.getByRole('radio', { name: 'Male', exact: true }).click();
  await page.getByRole('button', { name: /Next: where you start/ }).click();
  await page.getByRole('button', { name: /Next: how you play/ }).click();
  await page.getByRole('radio', { name: new RegExp(mode) }).click();
  await page.getByRole('button', { name: new RegExp(`Begin ${name}`) }).click();
  await page.waitForURL(/\/play\//);
  // Software-rendered CI browsers run WebGL very slowly; the canvas renderer is used for tests.
  await page.goto(`${page.url()}?renderer=canvas`);
  await waitForWorld(page, 'udoka');
}

/** Approach a (wandering) NPC and press E until the conversation opens. */
export async function talkTo(page, npcId, name) {
  const dialog = page.getByRole('dialog', { name: new RegExp(`Conversation with ${name}`) });
  for (let attempt = 0; attempt < 8; attempt++) {
    const n = await npcPosition(page, npcId);
    if (!n) throw new Error(`${npcId} is not in this map`);
    try {
      await walkTo(page, { x: n.x - 26, y: n.y }, { axisFirst: attempt % 2 ? 'x' : 'y', tolerance: 10 });
    } catch {
      /* path blocked; try again from wherever we are */
    }
    await face(page, 'right');
    await page.keyboard.press('e');
    if (await dialog.isVisible({ timeout: 1500 }).catch(() => false)) return dialog;
  }
  throw new Error(`Could not start a conversation with ${name}`);
}
