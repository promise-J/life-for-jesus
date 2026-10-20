// Robustness: thousands of random actions must only ever fail with ActionError, never crash,
// and invariants (no negative money, bounded inventory/logs) must always hold.
import { describe, it, expect } from 'vitest';
import {
  applyAction, ActionError, ACTION_TYPES, MAPS, SHOPS, ITEMS, JOBS, COURSES, BUSINESSES, NPCS, DIALOGUES, SCENARIOS, PRAYER_TYPES,
  PRAYER_PLACES, MISSIONS, DESTINATIONS, ERAS, PROPERTIES, LIMITS, mulberry32, hashSeed, TILE,
} from '../index.js';
import { newState } from './helpers.js';

const pick = (r, a) => a[Math.floor(r() * a.length)];

function randomAction(r, s) {
  const type = pick(r, ACTION_TYPES);
  const mapIds = Object.keys(MAPS);
  switch (type) {
    case 'sync': {
      const m = MAPS[pick(r, mapIds)];
      return { type, payload: { mapId: m.id, x: Math.floor(r() * m.width * TILE), y: Math.floor(r() * m.height * TILE), facing: pick(r, ['up', 'down', 'left', 'right']), elapsedMinutes: Math.floor(r() * 300) } };
    }
    case 'buy':
    case 'sell': {
      const shop = pick(r, Object.values(SHOPS));
      return { type, payload: { shopId: shop.id, itemId: pick(r, ITEMS).id, qty: pick(r, [1, 2, 0, -1, 1.5]) } };
    }
    case 'use_item': return { type, payload: { itemId: pick(r, ITEMS).id } };
    case 'apply_job': return { type, payload: { jobId: pick(r, JOBS).id } };
    case 'enroll': return { type, payload: { courseId: pick(r, COURSES).id } };
    case 'start_business': return { type, payload: { type: pick(r, BUSINESSES).id } };
    case 'restock': return { type, payload: { qty: pick(r, [5, 50, 0, 1000]) } };
    case 'bank': return { type, payload: { op: pick(r, ['deposit', 'withdraw', 'pay_arrears', 'steal']), amount: pick(r, [100, 5000, -1, 1e12]) } };
    case 'donate': return { type, payload: { cause: pick(r, ['church_offering', 'food_bank', 'borehole', 'x']), amount: pick(r, [100, 2000, 50]) } };
    case 'buy_property': return { type, payload: { propertyId: pick(r, PROPERTIES).id } };
    case 'pray': return { type, payload: { prayerType: pick(r, PRAYER_TYPES).id, place: pick(r, Object.keys(PRAYER_PLACES)), target: pick(r, NPCS).id, journal: 'x' } };
    case 'read_scripture': return { type, payload: { ref: pick(r, ['John 3:16', 'Acts 16:13-15', 'Nope 1:1']) } };
    case 'service': return { type, payload: { service: pick(r, ['food_bank', 'youth_tutoring']) } };
    case 'talk_start': return { type, payload: { npcId: pick(r, NPCS).id } };
    case 'talk_choose': {
      const d = s.dialogue;
      const choices = d ? DIALOGUES[d.tree].nodes[d.node].choices : [];
      return { type, payload: { choiceId: choices.length ? pick(r, choices).id : 'none' } };
    }
    case 'resolve_scenario': {
      const id = s.scenarios.pending[0] || pick(r, SCENARIOS).id;
      const sc = SCENARIOS.find((x) => x.id === id);
      return { type, payload: { scenarioId: id, choiceId: pick(r, sc.choices).id } };
    }
    case 'accept_mission': return { type, payload: { missionId: pick(r, MISSIONS).id } };
    case 'travel': return { type, payload: { to: pick(r, DESTINATIONS).id } };
    case 'enter_history': return { type, payload: { eraId: pick(r, ERAS).id } };
    case 'wait': return { type, payload: { hours: pick(r, [1, 6, 12, 0, 99]) } };
    case 'volunteer': return { type, payload: { mapId: 'shop' } };
    default: return { type, payload: {} };
  }
}

describe('random play', () => {
  for (const seed of ['alpha', 'beta', 'gamma', 'delta']) {
    it(`survives 600 random actions (${seed})`, () => {
      const r = mulberry32(hashSeed(seed));
      let s = newState({ mode: seed === 'beta' ? 'free' : 'mission' }, seed);
      s.coins = 400000;
      let applied = 0;
      for (let i = 0; i < 600; i++) {
        // sometimes jump to a random map in the current region so location-bound actions get exercised
        if (r() < 0.25) {
          const inRegion = Object.values(MAPS).filter((m) => m.region === s.location.region);
          const m = pick(r, inRegion);
          s = { ...s, location: { ...s.location, mapId: m.id } };
        }
        const action = randomAction(r, s);
        try {
          const res = applyAction(s, action, { endAtMinutes: s.time.startMinutes + 4000 * 1440 });
          s = res.state;
          applied++;
        } catch (e) {
          if (!(e instanceof ActionError)) throw new Error(`${action.type} ${JSON.stringify(action.payload)} crashed: ${e.stack}`);
        }
        expect(s.coins).toBeGreaterThanOrEqual(0);
        expect(s.savings).toBeGreaterThanOrEqual(0);
        expect(s.inventory.length).toBeLessThanOrEqual(LIMITS.inventorySlots);
        expect(s.inventory.every((x) => x.qty > 0 && Number.isInteger(x.qty))).toBe(true);
        expect(s.lifeLog.length).toBeLessThanOrEqual(LIMITS.lifeLogEntries);
        for (const v of Object.values(s.stats)) expect(Number.isFinite(v)).toBe(true);
        if (s.ending.status !== 'none') break;
      }
      expect(applied).toBeGreaterThan(50);
    });
  }
});
