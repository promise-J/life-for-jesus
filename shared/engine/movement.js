// Pure movement & interaction rules shared by Phaser (client) and tests.
import { TILE, isBlocked, interactables, objectSize } from '../maps/index.js';

export const DIRS = {
  up: { dx: 0, dy: -1 },
  down: { dx: 0, dy: 1 },
  left: { dx: -1, dy: 0 },
  right: { dx: 1, dy: 0 },
};

// Feet hitbox relative to the character's foot position (x = centre, y = bottom).
export const HITBOX = { w: 18, h: 10 };

/**
 * Four-direction input resolution. The most recently pressed key wins so that
 * diagonals never occur; `order` is the press order (oldest first).
 */
export function resolveDirection(pressed, order = []) {
  for (let i = order.length - 1; i >= 0; i--) if (pressed[order[i]]) return order[i];
  for (const d of ['up', 'down', 'left', 'right']) if (pressed[d]) return d;
  return null;
}

function boxBlocked(map, x, y) {
  const left = x - HITBOX.w / 2;
  const right = x + HITBOX.w / 2 - 1;
  const top = y - HITBOX.h;
  const bottom = y - 1;
  const tx0 = Math.floor(left / TILE);
  const tx1 = Math.floor(right / TILE);
  const ty0 = Math.floor(top / TILE);
  const ty1 = Math.floor(bottom / TILE);
  for (let ty = ty0; ty <= ty1; ty++) for (let tx = tx0; tx <= tx1; tx++) if (isBlocked(map, tx, ty)) return true;
  return false;
}

/** Advance a position by one step, sliding against solid tiles. Returns { x, y, moved }. */
export function stepMovement(pos, dir, speed, dt, map) {
  if (!dir) return { ...pos, moved: false };
  const { dx, dy } = DIRS[dir];
  const dist = Math.min(speed * dt, TILE / 2); // cap per-frame distance to avoid tunnelling
  let { x, y } = pos;
  const nx = x + dx * dist;
  const ny = y + dy * dist;
  if (!boxBlocked(map, nx, ny)) return { x: nx, y: ny, moved: true };
  // approach the obstacle pixel by pixel so the player can sit flush against it
  let moved = false;
  for (let i = 0; i < Math.ceil(dist); i++) {
    const tx = x + dx;
    const ty = y + dy;
    if (boxBlocked(map, tx, ty)) break;
    x = tx;
    y = ty;
    moved = true;
  }
  return { x, y, moved };
}

export function tileOf(px, py) {
  return { tx: Math.floor(px / TILE), ty: Math.floor((py - 1) / TILE) };
}

export function isValidStandingPosition(map, x, y) {
  if (typeof x !== 'number' || typeof y !== 'number' || !Number.isFinite(x) || !Number.isFinite(y)) return false;
  if (x < 0 || y < 0 || x > map.width * TILE || y > map.height * TILE) return false;
  return !boxBlocked(map, x, y);
}

/**
 * Find the closest thing the player can interact with, in front of them.
 * npcs: [{ id, x, y }] in pixels. Returns { kind: 'npc'|'object', target } or null.
 */
export function findInteraction(map, pos, facing, npcs = [], range = 30) {
  const d = DIRS[facing] || DIRS.down;
  const px = pos.x + d.dx * 18;
  const py = pos.y - 6 + d.dy * 18;
  let best = null;
  let bestDist = Infinity;
  for (const n of npcs) {
    const dist = Math.hypot(n.x - px, n.y - 8 - py);
    // People are easier to address than furniture: anyone right beside you counts, in any direction.
    const beside = Math.hypot(n.x - pos.x, n.y - pos.y) - 10;
    const near = Math.min(dist, beside);
    if (near < range + 8 && near < bestDist) {
      best = { kind: 'npc', target: n };
      bestDist = near;
    }
  }
  for (const o of interactables(map)) {
    const s = objectSize(o);
    const rx = Math.max(o.x * TILE, Math.min(px, (o.x + s.w) * TILE));
    const ry = Math.max(o.y * TILE, Math.min(py, (o.y + s.h) * TILE));
    const dist = Math.hypot(rx - px, ry - py);
    if (dist < range && dist < bestDist) {
      best = { kind: 'object', target: o };
      bestDist = dist;
    }
  }
  return best;
}
