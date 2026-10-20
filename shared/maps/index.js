import { UDOKA } from './udoka.js';
import { INTERIORS } from './interiors.js';
import { NKWO } from './nkwo.js';
import { PHILIPPI } from './philippi.js';

export const TILE = 32;

/** Default footprint (tiles) and solidity for each object type. */
export const OBJECT_TYPES = {
  tree: { w: 1, h: 1, solid: true },
  palm: { w: 1, h: 1, solid: true },
  bigtree: { w: 2, h: 2, solid: true },
  cypress: { w: 1, h: 1, solid: true },
  bush: { w: 1, h: 1, solid: true },
  flowers: { w: 1, h: 1, solid: false },
  lamp: { w: 1, h: 1, solid: true },
  bench: { w: 2, h: 1, solid: true },
  booth: { w: 1, h: 1, solid: true },
  noticeboard: { w: 1, h: 1, solid: true },
  stall: { w: 2, h: 2, solid: true },
  cart: { w: 1, h: 1, solid: true },
  atm: { w: 1, h: 1, solid: true },
  sign: { w: 1, h: 1, solid: true },
  goal: { w: 1, h: 2, solid: true },
  bus: { w: 3, h: 2, solid: true },
  keke: { w: 2, h: 1, solid: true },
  car: { w: 2, h: 1, solid: true },
  borehole: { w: 1, h: 1, solid: true },
  fence: { w: 1, h: 1, solid: true },
  citywall: { w: 1, h: 1, solid: true },
  column: { w: 1, h: 1, solid: true },
  fountain: { w: 2, h: 2, solid: true },
  milestone: { w: 1, h: 1, solid: true },
  rock: { w: 1, h: 1, solid: true },
  portal: { w: 1, h: 1, solid: true },
  // furniture
  bed: { w: 2, h: 2, solid: true },
  wardrobe: { w: 1, h: 1, solid: true },
  shelf: { w: 2, h: 1, solid: true },
  stove: { w: 1, h: 1, solid: true },
  fridge: { w: 1, h: 1, solid: true },
  table: { w: 2, h: 1, solid: true },
  chair: { w: 1, h: 1, solid: true },
  mat: { w: 2, h: 1, solid: false },
  plant: { w: 1, h: 1, solid: true },
  counter: { w: 3, h: 1, solid: true },
  crates: { w: 1, h: 2, solid: true },
  scale: { w: 1, h: 1, solid: true },
  sacks: { w: 2, h: 1, solid: true },
  desk: { w: 2, h: 1, solid: true },
  cooler: { w: 1, h: 1, solid: true },
  altar: { w: 4, h: 1, solid: true },
  pulpit: { w: 1, h: 1, solid: true },
  pew: { w: 4, h: 1, solid: true },
  blackboard: { w: 5, h: 1, solid: true },
  schooldesk: { w: 2, h: 1, solid: true },
  stage: { w: 8, h: 2, solid: true },
};

export const MAPS = Object.fromEntries([UDOKA, ...INTERIORS, NKWO, PHILIPPI].map((m) => [m.id, m]));

export function getMap(id) {
  return MAPS[id] || null;
}

export function objectSize(obj) {
  const t = OBJECT_TYPES[obj.type] || { w: 1, h: 1, solid: true };
  return { w: obj.w ?? t.w, h: obj.h ?? t.h, solid: obj.solid ?? t.solid };
}

const gridCache = new Map();

/** Build (and cache) a Uint8Array collision grid for a map: 1 = blocked. */
export function collisionGrid(map) {
  if (gridCache.has(map.id)) return gridCache.get(map.id);
  const { width, height } = map;
  const g = new Uint8Array(width * height);
  const block = (x, y) => {
    if (x >= 0 && y >= 0 && x < width && y < height) g[y * width + x] = 1;
  };
  if (map.kind === 'interior') {
    for (let x = 0; x < width; x++) {
      block(x, 0);
      if (x !== map.exit.x) block(x, height - 1);
    }
    for (let y = 0; y < height; y++) {
      block(0, y);
      block(width - 1, y);
    }
  }
  for (const a of map.areas || []) {
    if (a.type === 'water') for (let y = a.y; y < a.y + a.h; y++) for (let x = a.x; x < a.x + a.w; x++) block(x, y);
  }
  for (const b of map.buildings || []) {
    for (let y = b.y; y < b.y + b.h; y++)
      for (let x = b.x; x < b.x + b.w; x++) {
        if (b.door && b.door.x === x && b.door.y === y) continue;
        block(x, y);
      }
  }
  for (const o of map.objects || []) {
    const s = objectSize(o);
    if (!s.solid) continue;
    for (let y = o.y; y < o.y + s.h; y++) for (let x = o.x; x < o.x + s.w; x++) block(x, y);
  }
  gridCache.set(map.id, g);
  return g;
}

export function isBlocked(map, tx, ty) {
  if (tx < 0 || ty < 0 || tx >= map.width || ty >= map.height) return true;
  return collisionGrid(map)[ty * map.width + tx] === 1;
}

/** Returns the transition target if (tx,ty) is a door / exit tile, else null. */
export function transitionAt(map, tx, ty) {
  if (map.kind === 'interior') {
    if (tx === map.exit.x && ty === map.exit.y) return map.exit.to;
    return null;
  }
  for (const b of map.buildings || []) {
    if (b.door && b.to && b.door.x === tx && b.door.y === ty) return b.to;
  }
  return null;
}

/** All interactable objects in a map (excluding NPCs). */
export function interactables(map) {
  return (map.objects || []).filter((o) => o.interact);
}

export function spawnPoint(map, key) {
  return map.spawns[key] || map.spawns.default;
}

export function mapsInRegion(region) {
  return Object.values(MAPS).filter((m) => m.region === region).map((m) => m.id);
}

export { UDOKA, NKWO, PHILIPPI, INTERIORS };
