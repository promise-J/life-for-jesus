// A small, data-driven condition language used by dialogues, missions, scenarios and achievements.
import { DAY } from '../content/constants.js';

export function rel(state, npc) {
  return state.relationships[npc] || { trust: 0, stage: 0, met: false, notes: [] };
}

function hasItem(state, itemId, qty = 1) {
  const slot = state.inventory.find((s) => s.itemId === itemId);
  return !!slot && slot.qty >= qty;
}

function cmp(value, spec) {
  if (spec == null) return !!value;
  if (typeof spec !== 'object') return value === spec;
  if ('eq' in spec && value !== spec.eq) return false;
  if ('gte' in spec && !(value >= spec.gte)) return false;
  if ('lte' in spec && !(value <= spec.lte)) return false;
  if ('gt' in spec && !(value > spec.gt)) return false;
  if ('lt' in spec && !(value < spec.lt)) return false;
  return true;
}

/**
 * Evaluate a condition object against a game state.
 * ctx: { npc } — the default NPC for relationship checks (dialogues).
 */
export function check(cond, state, ctx = {}) {
  if (!cond) return true;
  if (Array.isArray(cond)) return cond.every((c) => check(c, state, ctx));
  for (const [key, val] of Object.entries(cond)) {
    if (!checkOne(key, val, state, ctx)) return false;
  }
  return true;
}

function checkOne(key, val, state, ctx) {
  switch (key) {
    case 'all':
      return val.every((c) => check(c, state, ctx));
    case 'any':
      return val.some((c) => check(c, state, ctx));
    case 'not':
      return !check(val, state, ctx);
    case 'flag':
      return !!state.flags[val];
    case 'notFlag':
      return !state.flags[val];
    case 'flagEq':
      return state.flags[val.flag] === val.value;
    case 'flagActive': {
      // flag set within the last `days` days (flags store the minute they were set)
      const t = state.flags[val.flag];
      return typeof t === 'number' && state.time.minutes - t < val.days * DAY;
    }
    case 'daysSinceFlag': {
      const t = state.flags[val.flag];
      if (typeof t !== 'number') return false;
      // calendar days: something set yesterday evening counts as one day ago this morning
      return Math.floor(state.time.minutes / DAY) - Math.floor(t / DAY) >= val.gte;
    }
    case 'trust':
      return cmp(rel(state, val.npc || ctx.npc).trust, val);
    case 'stage':
      return cmp(rel(state, val.npc || ctx.npc).stage, val);
    case 'met':
      return !!rel(state, val).met;
    case 'counter':
      return cmp(state.counters[val.name] || 0, val);
    case 'coins':
      return cmp(state.coins, val);
    case 'savings':
      return cmp(state.savings, val);
    case 'hasItem':
      return typeof val === 'string' ? hasItem(state, val) : hasItem(state, val.id, val.qty);
    case 'mission': {
      const status = missionStatus(state, val.id);
      return Array.isArray(val.status) ? val.status.includes(status) : status === val.status;
    }
    case 'missionCompleted':
      return state.missions.completed.includes(val);
    case 'job':
      return val === true ? !!state.career.jobId : state.career.jobId === val;
    case 'jobAt':
      return !!state.career.jobId && val.includes(state.career.jobId);
    case 'qualification':
      return state.education.completed.includes(val);
    case 'enrolled':
      return !!state.education.enrolled;
    case 'skill':
      return cmp(state.skills[val.name] || 0, val);
    case 'mode':
      return state.mode === val;
    case 'region':
      return state.location.region === val;
    case 'mapId':
      return state.location.mapId === val;
    case 'business':
      return val === true ? !!state.business : state.business?.type === val;
    case 'property':
      return state.properties.includes(val);
    case 'age':
      return cmp(ageYears(state), val);
    case 'level':
      return cmp(levelOf(state.stats.xp), val);
    case 'achievement':
      return state.achievements.crowns.includes(val) || state.achievements.badges.includes(val);
    case 'storyline':
      return cmp(state.storylines[val.id]?.outcome, val.outcome != null ? val.outcome : undefined);
    case 'storylineOutcome':
      return state.storylines[val.id]?.outcome === val.outcome;
    case 'historyCompleted':
      return state.history.completed.includes(val);
    case 'scenarioResolved':
      return !!state.scenarios.resolved[val];
    case 'scenarioChoice':
      return state.scenarios.resolved[val.id] === val.choice;
    case 'stat':
      return cmp(state.stats[val.name], val);
    case 'daysPlayed':
      return cmp((state.time.minutes - state.time.startMinutes) / DAY, val);
    default:
      throw new Error(`Unknown condition: ${key}`);
  }
}

export function missionStatus(state, id) {
  if (state.missions.completed.includes(id)) return 'completed';
  if (state.missions.active.includes(id)) return 'active';
  if (state.missions.abandoned?.includes(id)) return 'abandoned';
  return 'notStarted';
}

export function ageYears(state) {
  return Math.floor((state.time.minutes - state.profile.birthMinutes) / (DAY * 360));
}

export function levelOf(xp) {
  return Math.floor(Math.sqrt(Math.max(0, xp) / 100)) + 1;
}
