// Core helpers shared by all actions. Every mutation goes through a run context `R`:
// R = { state, ctx, events, messages, logs, ledger, journal }
import { LIMITS, MONTH, MONTHLY_COSTS, YEAR, STATS_MAX } from '../content/constants.js';
import { ITEM_BY_ID } from '../content/items.js';
import { DIFFICULTIES } from '../content/character.js';
import { levelOf } from './conditions.js';
import { formatDate } from './time.js';

export class ActionError extends Error {
  constructor(code, message, status = 400) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

export function fail(message, code = 'invalid_action', status = 400) {
  throw new ActionError(code, message, status);
}

export function createRun(state, ctx = {}) {
  return { state, ctx, events: [], messages: [], logs: [], ledger: [], journal: null };
}

export const clamp = (v, lo = 0, hi = STATS_MAX) => Math.max(lo, Math.min(hi, v));

export function emit(R, type, data = {}) {
  R.events.push({ type, ...data });
}

export function say(R, text, kind = 'info') {
  R.messages.push({ kind, text });
}

/** Record a significant life event (persisted to the LifeEvent collection + bounded lifeLog). */
export function logLife(R, { kind, title, detail = '', weight = 1, tags = [] }) {
  const entry = { at: R.state.time.minutes, date: formatDate(R.state.time.minutes), kind, title, detail, weight, tags };
  R.logs.push(entry);
  R.state.lifeLog.push(entry);
  if (R.state.lifeLog.length > LIMITS.lifeLogEntries) R.state.lifeLog.splice(0, R.state.lifeLog.length - LIMITS.lifeLogEntries);
}

export function inc(R, name, amount = 1) {
  R.state.counters[name] = (R.state.counters[name] || 0) + amount;
}

export function addStat(R, name, delta) {
  R.state.stats[name] = clamp(R.state.stats[name] + delta);
}

export function addSkill(R, name, amount) {
  if (!(name in R.state.skills)) return;
  R.state.skills[name] = clamp(R.state.skills[name] + amount);
}

export function addXp(R, amount) {
  if (!amount) return;
  const before = levelOf(R.state.stats.xp);
  R.state.stats.xp = Math.max(0, R.state.stats.xp + amount);
  const after = levelOf(R.state.stats.xp);
  if (after > before) {
    say(R, `Level up! You are now level ${after}.`, 'reward');
    emit(R, 'level_up', { level: after });
  }
}

export function addCoins(R, amount, reason) {
  if (!Number.isInteger(amount) || amount < 0) fail('Invalid amount.');
  if (amount === 0) return;
  R.state.coins += amount;
  R.state.ledger.earned += amount;
  R.state.ledger.peakWealth = Math.max(R.state.ledger.peakWealth, R.state.coins + R.state.savings);
  R.ledger.push({ delta: amount, reason });
}

export function spendCoins(R, amount, reason, { donation = false } = {}) {
  if (!Number.isInteger(amount) || amount <= 0) fail('Invalid amount.');
  if (R.state.coins < amount) fail(`You need ${amount.toLocaleString()} LC but have ${R.state.coins.toLocaleString()} LC.`, 'insufficient_funds');
  R.state.coins -= amount;
  if (donation) R.state.ledger.donated += amount;
  else R.state.ledger.spent += amount;
  R.ledger.push({ delta: -amount, reason });
}

export function itemQty(state, itemId) {
  return state.inventory.find((s) => s.itemId === itemId)?.qty || 0;
}

export function addItem(R, itemId, qty = 1) {
  const item = ITEM_BY_ID[itemId];
  if (!item) fail('Unknown item.');
  if (!Number.isInteger(qty) || qty <= 0) fail('Invalid quantity.');
  const inv = R.state.inventory;
  const slot = inv.find((s) => s.itemId === itemId);
  if (slot) {
    if (!item.stackable) fail(`You already own a ${item.name}.`, 'already_owned');
    if (slot.qty + qty > LIMITS.stackMax) fail(`You can carry at most ${LIMITS.stackMax} of that.`, 'stack_full');
    slot.qty += qty;
  } else {
    if (inv.length >= LIMITS.inventorySlots) fail('Your inventory is full.', 'inventory_full');
    if (!item.stackable && qty > 1) fail('You can only own one of those.');
    inv.push({ itemId, qty });
  }
}

export function removeItem(R, itemId, qty = 1) {
  if (!Number.isInteger(qty) || qty <= 0) fail('Invalid quantity.');
  const inv = R.state.inventory;
  const idx = inv.findIndex((s) => s.itemId === itemId);
  if (idx < 0 || inv[idx].qty < qty) fail('You do not have enough of that item.', 'missing_item');
  inv[idx].qty -= qty;
  if (inv[idx].qty === 0) inv.splice(idx, 1);
}

export function boost(state, key) {
  let total = 0;
  for (const s of state.inventory) {
    const b = ITEM_BY_ID[s.itemId]?.boosts?.[key];
    if (b) total += b;
  }
  return total;
}

export function setFlag(R, name, value) {
  R.state.flags[name] = value === undefined ? R.state.time.minutes : value;
  emit(R, 'flag', { flag: name });
}

export function relationship(R, npcId) {
  if (!R.state.relationships[npcId]) R.state.relationships[npcId] = { trust: 0, stage: 0, met: false, notes: [] };
  return R.state.relationships[npcId];
}

export function noteRelationship(R, npcId, text) {
  const r = relationship(R, npcId);
  r.notes.push({ at: R.state.time.minutes, text });
  if (r.notes.length > LIMITS.relationshipNotes) r.notes.splice(0, r.notes.length - LIMITS.relationshipNotes);
}

export function costMultiplier(state) {
  return DIFFICULTIES.find((d) => d.id === state.settings.difficulty)?.costMultiplier ?? 1;
}

/**
 * Advance the game clock. In a historical scenario the original timeline is frozen and only the
 * scenario clock moves. Crossing a month boundary runs the monthly accounting.
 */
export function advance(R, minutes) {
  if (minutes <= 0) return;
  const s = R.state;
  if (s.history.active) {
    s.history.active.minutes += minutes;
    return;
  }
  const before = s.time.minutes;
  let after = before + minutes;
  // Never run past the scheduled ending: the action stops at that moment.
  const endAt = R.ctx.endAtMinutes;
  if (typeof endAt === 'number' && s.settings.endingMode !== 'off' && after >= endAt && before < endAt) after = endAt;
  s.time.minutes = after;
  const monthsCrossed = Math.floor(after / MONTH) - Math.floor(before / MONTH);
  for (let i = 0; i < monthsCrossed; i++) monthlyTick(R);
}

export function monthlyTick(R) {
  const s = R.state;
  const mult = costMultiplier(s);
  const ownsHome = s.properties.includes('flat_amaka');
  const costs = Math.round((MONTHLY_COSTS.food + MONTHLY_COSTS.transport + (ownsHome ? 0 : MONTHLY_COSTS.rent)) * mult);
  let due = costs + s.stats.arrears;
  s.stats.arrears = 0;
  const fromCoins = Math.min(s.coins, due);
  if (fromCoins > 0) {
    s.coins -= fromCoins;
    s.ledger.spent += fromCoins;
    R.ledger.push({ delta: -fromCoins, reason: 'Monthly living costs' });
    due -= fromCoins;
  }
  if (due > 0) {
    const fromSavings = Math.min(s.savings, due);
    s.savings -= fromSavings;
    s.ledger.spent += fromSavings;
    due -= fromSavings;
    if (fromSavings > 0) say(R, `You drew ${fromSavings.toLocaleString()} LC from savings to cover bills.`, 'warn');
  }
  if (due > 0) {
    s.stats.arrears = due;
    addStat(R, 'wellbeing', -10);
    say(R, `You could not cover this month's bills. ${due.toLocaleString()} LC is now in arrears.`, 'warn');
    logLife(R, { kind: 'hardship', title: 'Fell behind on bills', detail: `${due.toLocaleString()} LC in arrears.`, weight: 2, tags: ['money'] });
  } else {
    say(R, `Monthly costs paid: ${costs.toLocaleString()} LC${ownsHome ? ' (no rent — your own home)' : ''}.`);
  }
  // Cooperative savings interest: 1% a month (a fictional, simplified rate).
  if (s.savings > 0) {
    const interest = Math.floor(s.savings * 0.01);
    s.savings += interest;
    s.ledger.earned += interest;
  }
  // The Nkwo village keeps giving to the borehole once the project has started.
  if (s.flags.borehole_started && !s.flags.borehole_complete) {
    s.flags.borehole_fund = (s.flags.borehole_fund || 0) + 40000;
  }
  inc(R, 'monthsLived');
}

export { YEAR };
