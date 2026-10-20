// Content governance: every reference resolves, every link exists, every map is walkable.
import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import {
  DIALOGUES, NPCS, MISSIONS, SCENARIOS, DELAYED_EVENTS, ACHIEVEMENTS, PRAYER_TYPES, SCRIPTURE_ENTRIES, ENDING_PASSAGES,
  MAPS, OBJECT_TYPES, isBlocked, spawnPoint, npcPresence, parseReference, check, REWARDS, ITEMS, SHOPS, JOBS, COURSES,
  ERAS, objectSize, MISSION_BY_ID, ITEM_BY_ID,
} from '../index.js';
import { newState } from './helpers.js';

const biblePath = fileURLToPath(new URL('../../server/data/web-bible.json', import.meta.url));
const bible = existsSync(biblePath) ? JSON.parse(readFileSync(biblePath, 'utf8')) : null;

function collectRefs() {
  const refs = new Set();
  for (const t of Object.values(DIALOGUES)) {
    for (const r of t.scripture || []) refs.add(r);
    for (const n of Object.values(t.nodes)) for (const c of n.choices || []) for (const r of c.scripture || []) refs.add(r);
  }
  for (const m of MISSIONS) for (const s of m.scripture) refs.add(s.ref);
  for (const s of SCENARIOS) for (const x of s.scripture) refs.add(x.ref);
  for (const a of ACHIEVEMENTS) for (const r of a.scripture || []) refs.add(r);
  for (const p of PRAYER_TYPES) for (const r of p.scripture) refs.add(r);
  for (const e of SCRIPTURE_ENTRIES) refs.add(e.ref);
  for (const e of ENDING_PASSAGES) {
    refs.add(e.ref);
    if (e.fullRef) refs.add(e.fullRef);
  }
  return [...refs];
}

describe('Scripture references', () => {
  const refs = collectRefs();
  it('all parse', () => {
    for (const r of refs) expect(parseReference(r), r).not.toBeNull();
  });
  it.runIf(bible)('all exist in the World English Bible data', () => {
    for (const r of refs) {
      const p = parseReference(r);
      const book = bible.books.find((b) => b.id === p.bookId);
      expect(book, r).toBeTruthy();
      const ch = book.chapters[p.chapter - 1];
      expect(ch, r).toBeTruthy();
      if (p.verseStart) {
        expect(ch[p.verseEnd - 1], `${r} verse`).toBeTruthy();
        expect(p.verseEnd).toBeGreaterThanOrEqual(p.verseStart);
      }
    }
  });
  it('dialogue text never contains quoted verse markers', () => {
    // Dialogue may point to Scripture but verse text is only shown from the Bible data.
    for (const t of Object.values(DIALOGUES)) for (const n of Object.values(t.nodes)) expect(n.text).not.toMatch(/\(\w+ \d+:\d+\)/);
  });
});

describe('Dialogue graph', () => {
  it('every next node exists and every tree has its start', () => {
    for (const [id, t] of Object.entries(DIALOGUES)) {
      expect(t.nodes[t.start], `${id}.start`).toBeTruthy();
      for (const [nid, n] of Object.entries(t.nodes)) {
        for (const c of n.choices || []) if (c.next) expect(t.nodes[c.next], `${id}.${nid}.${c.id}→${c.next}`).toBeTruthy();
        for (const a of n.auto || []) expect(t.nodes[a.next], `${id}.${nid} auto`).toBeTruthy();
        expect((n.choices || []).length + (n.auto || []).length, `${id}.${nid} has a way out`).toBeGreaterThan(0);
      }
    }
  });
  it('every NPC conversation points to a real tree and every tree has a conversation', () => {
    const used = new Set();
    for (const n of NPCS) for (const c of n.conversations) {
      expect(DIALOGUES[c.tree], `${n.id}:${c.tree}`).toBeTruthy();
      used.add(c.tree);
    }
    for (const id of Object.keys(DIALOGUES)) expect(used.has(id), `unused tree ${id}`).toBe(true);
  });
  it('effects reference real missions, items and delayed events', () => {
    const effects = [];
    for (const t of Object.values(DIALOGUES)) for (const n of Object.values(t.nodes)) for (const c of n.choices || []) effects.push(...(c.effects || []));
    for (const s of SCENARIOS) for (const c of s.choices) effects.push(...c.effects);
    for (const e of effects) {
      if (e.startMission) expect(MISSION_BY_ID[e.startMission], e.startMission).toBeTruthy();
      if (e.giveItem) expect(ITEM_BY_ID[e.giveItem]).toBeTruthy();
      if (e.takeItem) expect(ITEM_BY_ID[e.takeItem]).toBeTruthy();
      if (e.schedule) expect(DELAYED_EVENTS[e.schedule.eventId], e.schedule.eventId).toBeTruthy();
    }
  });
});

describe('Conditions are well-formed', () => {
  const s = newState();
  it('missions, scenarios, achievements and NPC conversations evaluate', () => {
    for (const m of MISSIONS) {
      check(m.prerequisites, s);
      for (const o of m.objectives) if (o.track.cond) check(o.track.cond, s);
      for (const b of m.branches || []) check(b.when, s);
      expect(REWARDS[m.reward], m.id).toBeTruthy();
    }
    for (const sc of SCENARIOS) {
      check(sc.trigger, s);
      for (const c of sc.choices) check(c.requires, s);
    }
    for (const a of ACHIEVEMENTS) check(a.when, s);
    for (const n of NPCS) for (const c of n.conversations) check(c.when, s, { npc: n.id });
    for (const e of ERAS) check(e.requires, s);
  });
});

describe('Economy definitions', () => {
  it('shops only stock real items with sane prices', () => {
    for (const shop of Object.values(SHOPS)) for (const id of shop.items) {
      expect(ITEM_BY_ID[id], id).toBeTruthy();
      expect(ITEM_BY_ID[id].price).toBeGreaterThan(0);
    }
    for (const i of ITEMS) expect(Number.isInteger(i.price) && i.price >= 0).toBe(true);
  });
  it('jobs and courses are reachable', () => {
    for (const j of JOBS) expect(MAPS[j.mapId], j.id).toBeTruthy();
    for (const c of COURSES) for (const r of c.requires || []) expect(COURSES.find((x) => x.id === r)).toBeTruthy();
  });
  it('rewards never derive amounts from Scripture', () => {
    for (const r of Object.values(REWARDS)) expect(r).not.toHaveProperty('scriptureMultiplier');
  });
});

describe('Maps', () => {
  it('spawn points and door exits are walkable', () => {
    for (const m of Object.values(MAPS)) for (const [k, sp] of Object.entries(m.spawns)) expect(isBlocked(m, sp.x, sp.y), `${m.id}.${k}`).toBe(false);
  });
  it('every building door leads to a real map and spawn', () => {
    for (const m of Object.values(MAPS)) for (const b of m.buildings || []) if (b.to) {
      expect(MAPS[b.to.mapId], b.id).toBeTruthy();
      expect(spawnPoint(MAPS[b.to.mapId], b.to.spawn)).toBeTruthy();
      expect(MAPS[b.to.mapId].exit.to.mapId).toBe(m.id);
    }
  });
  it('every object type is defined and interactables are reachable from a free tile', () => {
    for (const m of Object.values(MAPS)) for (const o of m.objects) {
      expect(OBJECT_TYPES[o.type], `${m.id}.${o.id}`).toBeTruthy();
      if (!o.interact) continue;
      const s = objectSize(o);
      let reachable = false;
      for (let x = o.x - 1; x <= o.x + s.w; x++) for (let y = o.y - 1; y <= o.y + s.h; y++) {
        const inside = x >= o.x && x < o.x + s.w && y >= o.y && y < o.y + s.h;
        if (!inside && !isBlocked(m, x, y)) reachable = true;
      }
      expect(reachable, `${m.id}.${o.id} unreachable`).toBe(true);
    }
  });
  it('NPC home positions are on walkable tiles', () => {
    for (const n of NPCS) for (const sch of n.schedule) expect(isBlocked(MAPS[sch.mapId], sch.x, sch.y), `${n.id}@${sch.mapId}`).toBe(false);
  });
  it('NPC schedules resolve by time of day', () => {
    expect(npcPresence('chidi', 10 * 60)?.mapId).toBe('university_hall');
    expect(npcPresence('chidi', 17 * 60)?.mapId).toBe('udoka');
    expect(npcPresence('chidi', 23 * 60)).toBeNull();
  });
});
