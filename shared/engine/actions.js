// Action handlers. Each validates its own preconditions and mutates R.state through core helpers.
import { HOUR, DAY, MONTH, LIMITS } from '../content/constants.js';
import { ITEM_BY_ID, SHOPS, SELL_RATIO, PROPERTY_BY_ID } from '../content/items.js';
import { JOB_BY_ID, COURSE_BY_ID, BUSINESS_BY_ID } from '../content/careers.js';
import { NPC_BY_ID, npcPresence, AMBIENT_LINES } from '../content/npcs.js';
import { DIALOGUES } from '../content/dialogues.js';
import { SCENARIO_BY_ID } from '../content/scenarios.js';
import { MISSION_BY_ID } from '../content/missions.js';
import { PRAYER_BY_ID, PRAYER_PLACES } from '../content/prayer.js';
import { DESTINATION_BY_ID, ERA_BY_ID } from '../content/locations.js';
import { HAIR_STYLES, HAIR_COLORS, OUTFITS } from '../content/character.js';
import { parseReference } from '../content/books.js';
import { getMap, spawnPoint, TILE } from '../maps/index.js';
import { isValidStandingPosition } from './movement.js';
import { check } from './conditions.js';
import { calendar, minutesUntilHour } from './time.js';
import { stepRng, randInt, pick } from './rng.js';
import { applyEffects, startMission } from './effects.js';
import {
  fail, emit, say, logLife, inc, addStat, addSkill, addXp, addCoins, spendCoins, addItem, removeItem, itemQty,
  boost, setFlag, relationship, noteRelationship, advance, clamp,
} from './core.js';
import { BOREHOLE_GOAL } from './tracking.js';

// ─── helpers ───
const isInt = (n) => Number.isInteger(n);
function requireMap(R, mapId, label) {
  if (R.state.location.mapId !== mapId) fail(`You need to be at ${label || getMap(mapId)?.name || mapId}.`, 'wrong_location');
}
function requireRegion(R, region, label) {
  if (R.state.location.region !== region) fail(`You need to be in ${label || region}.`, 'wrong_location');
}
function requireEnergy(R, amount, what = 'that') {
  if (R.state.stats.energy < amount) fail(`You are too tired for ${what}. Eat something or rest.`, 'too_tired');
}
function notInHistory(R) {
  if (R.state.history.active) fail('Not available during a historical scenario.', 'in_history');
}
function hour(R) {
  return calendar(R.state.time.minutes).hour;
}
function meetsRequirements(state, req = {}) {
  const missing = [];
  for (const q of req.qualifications || []) if (!state.education.completed.includes(q)) missing.push(`qualification: ${COURSE_BY_ID[q]?.name || q}`);
  for (const i of req.items || []) if (!itemQty(state, i)) missing.push(`item: ${ITEM_BY_ID[i]?.name || i}`);
  for (const p of req.properties || []) if (!state.properties.includes(p)) missing.push(`property: ${PROPERTY_BY_ID[p]?.name || p}`);
  for (const [k, v] of Object.entries(req.skills || {})) if ((state.skills[k] || 0) < v) missing.push(`${k} skill ${v}`);
  return missing;
}
export { meetsRequirements };

function placeTo(R, mapId, spawnKey) {
  const map = getMap(mapId);
  const sp = spawnPoint(map, spawnKey);
  R.state.location = { mapId, region: map.region, x: sp.x * TILE + TILE / 2, y: sp.y * TILE + TILE - 1, facing: 'down' };
  markVisited(R, mapId);
}
function markVisited(R, mapId) {
  if (!R.state.visited.includes(mapId)) {
    R.state.visited.push(mapId);
    emit(R, 'visit', { mapId });
  }
  const region = getMap(mapId).region;
  if (!R.state.flags[`visited_${region}`]) setFlag(R, `visited_${region}`);
}

// ─── movement / clock sync ───
function sync(R, p) {
  const s = R.state;
  const map = getMap(p.mapId);
  if (!map) fail('Unknown map.');
  if (map.region !== s.location.region) fail('You cannot walk to another region. Use the motor park.', 'wrong_region');
  if (!isValidStandingPosition(map, p.x, p.y)) fail('Invalid position.', 'invalid_position');
  if (!['up', 'down', 'left', 'right'].includes(p.facing)) fail('Invalid facing.');
  s.location = { mapId: map.id, region: map.region, x: Math.round(p.x), y: Math.round(p.y), facing: p.facing };
  markVisited(R, map.id);
  // Free-roam time is client-reported but clamped by real elapsed time and a per-sync cap.
  let elapsed = isInt(p.elapsedMinutes) ? Math.max(0, p.elapsedMinutes) : 0;
  if (typeof R.ctx.realElapsedMs === 'number') {
    const allowed = Math.ceil((R.ctx.realElapsedMs / 1000) * LIMITS.realtimeMinutesPerSecond * 1.25) + 2;
    elapsed = Math.min(elapsed, allowed);
  }
  elapsed = Math.min(elapsed, LIMITS.maxSyncMinutes);
  if (elapsed > 0) {
    advance(R, elapsed);
    s.time.idleCarry += elapsed;
    const tired = Math.floor(s.time.idleCarry / 90);
    if (tired > 0) {
      addStat(R, 'energy', -tired);
      s.time.idleCarry -= tired * 90;
    }
  }
}

// ─── rest & time ───
function sleep(R) {
  notInHistory(R);
  requireMap(R, 'home', 'home');
  const until = minutesUntilHour(R.state.time.minutes, 6);
  advance(R, Math.max(until, 4 * HOUR));
  const restore = 75 + boost(R.state, 'sleep');
  R.state.stats.energy = clamp(Math.max(R.state.stats.energy, restore));
  addStat(R, 'wellbeing', 2);
  if (R.state.stats.health < 100) addStat(R, 'health', 3);
  emit(R, 'sleep');
  say(R, 'You slept and woke at dawn feeling rested.');
}

function nap(R) {
  requireMap(R, 'home', 'home');
  advance(R, 2 * HOUR);
  addStat(R, 'energy', 20);
  emit(R, 'nap');
}

function wait(R, p) {
  const hours = p.hours;
  if (!isInt(hours) || hours < 1 || hours > 12) fail('Wait between 1 and 12 hours.');
  advance(R, hours * HOUR);
  addStat(R, 'energy', -Math.floor(hours / 3));
}

/** Fast-forward a month of ordinary routine. Work, business and bills happen automatically. */
function liveMonth(R) {
  notInHistory(R);
  requireMap(R, 'home', 'home');
  const s = R.state;
  if (s.scenarios.pending.length) fail('A decision is waiting for you first.', 'decision_pending');
  const rng = stepRng(s);
  const start = s.time.minutes;
  advance(R, MONTH);
  const fraction = (s.time.minutes - start) / MONTH; // shorter if the trumpet sounded mid-month
  const days = Math.round(20 * fraction);
  let income = 0;
  const parts = [];
  if (s.career.jobId && days > 0) {
    const job = JOB_BY_ID[s.career.jobId];
    const pay = shiftPay(s, job, rng) * days;
    income += pay;
    s.career.shiftsInJob += days;
    inc(R, 'shifts', days);
    addSkill(R, job.skill, Math.ceil(days / 8));
    s.career.performance = clamp(s.career.performance + 4);
    parts.push(`${days} shifts as ${job.name}`);
    checkPromotion(R, job);
  }
  if (s.business && days > 0) {
    let profit = 0;
    for (let i = 0; i < Math.round(days * 0.6); i++) profit += businessDay(R, rng, { silent: true });
    parts.push(`your ${BUSINESS_BY_ID[s.business.type].name} (${profit >= 0 ? '+' : ''}${profit.toLocaleString()} LC)`);
  }
  if (income > 0) addCoins(R, income, 'Wages for the month');
  s.stats.energy = 70;
  addXp(R, Math.round(20 * fraction));
  const ev = pick(rng, MONTH_EVENTS);
  applyEffects(R, ev.effects);
  say(R, `A month passes${parts.length ? ': ' + parts.join(', ') : ''}. ${ev.text}`, 'story');
  if (ev.log) logLife(R, { kind: 'life', title: ev.text, weight: 1, tags: ['life'] });
  emit(R, 'live_month');
}

const MONTH_EVENTS = [
  { text: 'A quiet month.', effects: [] },
  { text: 'Your cousin got married — you danced until your feet hurt.', effects: [{ wellbeing: 6 }, { coins: -3000, reason: 'Wedding gift' }], log: true },
  { text: 'The grid was down for a week. Everything was harder.', effects: [{ wellbeing: -3 }] },
  { text: 'You caught malaria and spent some days in bed.', effects: [{ health: -20 }, { wellbeing: -4 }], log: true },
  { text: 'A friend from school visited Udoka. You showed them around.', effects: [{ wellbeing: 5 }] },
  { text: 'Fuel prices rose again; transport costs bit hard.', effects: [{ coins: -2000, reason: 'Fuel price rise' }] },
  { text: 'Rain flooded part of the main road. The city slowed down.', effects: [{ wellbeing: -1 }] },
  { text: 'You found an old notebook of your mother’s recipes.', effects: [{ wellbeing: 4 }] },
];

// ─── food & items ───
function useItem(R, p) {
  const item = ITEM_BY_ID[p.itemId];
  if (!item || !item.use || !['food', 'gift'].includes(item.category)) fail('You cannot use that.');
  removeItem(R, item.id, 1);
  if (item.use.energy) addStat(R, 'energy', item.use.energy);
  if (item.use.wellbeing) addStat(R, 'wellbeing', item.use.wellbeing);
  if (item.use.health) addStat(R, 'health', item.use.health);
  advance(R, 20);
  emit(R, 'eat', { itemId: item.id });
  say(R, `You enjoyed the ${item.name.toLowerCase()}.`);
}

function buy(R, p) {
  const shop = SHOPS[p.shopId];
  if (!shop) fail('Unknown shop.');
  requireMap(R, shop.mapId, shop.name);
  if (!shop.items.includes(p.itemId)) fail('That shop does not sell this item.');
  const qty = p.qty ?? 1;
  if (!isInt(qty) || qty < 1 || qty > 10) fail('Buy between 1 and 10 at a time.');
  const item = ITEM_BY_ID[p.itemId];
  const total = item.price * qty;
  if (R.state.coins < total) fail(`You need ${total.toLocaleString()} LC.`, 'insufficient_funds');
  addItem(R, item.id, qty); // validates inventory space first
  spendCoins(R, total, `Bought ${qty} × ${item.name}`);
  emit(R, 'buy', { itemId: item.id, qty, category: item.category });
  say(R, `Bought ${qty} × ${item.name} for ${total.toLocaleString()} LC.`);
  if (item.price >= 100000) logLife(R, { kind: 'purchase', title: `Bought a ${item.name.toLowerCase()}`, detail: `${total.toLocaleString()} LC`, weight: 2, tags: ['money', 'possessions'] });
}

function sell(R, p) {
  const shop = SHOPS[p.shopId];
  if (!shop) fail('Unknown shop.');
  requireMap(R, shop.mapId, shop.name);
  const item = ITEM_BY_ID[p.itemId];
  if (!item) fail('Unknown item.');
  if (item.sellable === false) fail('That item cannot be sold.');
  if (!shop.buysCategories.includes(item.category)) fail(`${shop.name} does not buy that.`);
  const qty = p.qty ?? 1;
  if (!isInt(qty) || qty < 1 || qty > LIMITS.stackMax) fail('Invalid quantity.');
  removeItem(R, item.id, qty);
  const total = Math.floor(item.price * SELL_RATIO) * qty;
  addCoins(R, total, `Sold ${qty} × ${item.name}`);
  emit(R, 'sell', { itemId: item.id, qty });
  say(R, `Sold ${qty} × ${item.name} for ${total.toLocaleString()} LC.`);
}

// ─── work ───
function shiftPay(state, job, rng) {
  let pay = job.pay * (1 + (state.skills[job.skill] || 0) / 250);
  if (job.variablePay) pay *= 1 - job.variablePay / 2 + rng() * job.variablePay;
  return Math.round(pay);
}

function checkPromotion(R, job) {
  const s = R.state;
  if (job.promotesTo && s.career.shiftsInJob >= 20 && s.career.performance >= 60) {
    const next = JOB_BY_ID[job.promotesTo];
    s.career.history.push({ jobId: job.id, from: s.career.startedAt, to: s.time.minutes });
    s.career.jobId = next.id;
    s.career.shiftsInJob = 0;
    s.career.startedAt = s.time.minutes;
    inc(R, 'promotions');
    emit(R, 'promoted', { jobId: next.id });
    say(R, `Promotion! You are now ${next.name}.`, 'reward');
    logLife(R, { kind: 'career', title: `Promoted to ${next.name}`, detail: next.employer, weight: 3, tags: ['career'] });
  }
}

function workShift(R) {
  notInHistory(R);
  const s = R.state;
  const job = JOB_BY_ID[s.career.jobId];
  if (!job) fail('You do not have a job yet. Check a vacancies board.', 'no_job');
  requireMap(R, job.mapId, job.employer);
  const h = hour(R);
  if (h < job.schedule[0] || h >= job.schedule[1]) fail(`${job.employer} shifts start between ${job.schedule[0]}:00 and ${job.schedule[1] - 1}:00.`, 'closed');
  requireEnergy(R, job.energy, 'a shift');
  const rng = stepRng(s);
  const pay = shiftPay(s, job, rng);
  advance(R, job.hours * HOUR);
  addStat(R, 'energy', -job.energy);
  addCoins(R, pay, `Shift: ${job.name}`);
  addSkill(R, job.skill, 1);
  addXp(R, 10);
  s.career.shiftsInJob += 1;
  s.career.performance = clamp(s.career.performance + (s.stats.energy > 30 ? 3 : 1));
  inc(R, 'shifts');
  if (job.mapId === 'office') inc(R, 'shiftsAtBrightwell');
  if (job.mapId === 'shop') inc(R, 'shiftsAtShop');
  emit(R, 'work_shift', { jobId: job.id, mapId: job.mapId });
  if (s.counters.shifts === 1) logLife(R, { kind: 'career', title: 'First paycheck', detail: `${job.name} at ${job.employer}`, weight: 2, tags: ['career'] });
  let extra = '';
  if (rng() < 0.15) {
    const ev = pick(rng, WORK_EVENTS);
    applyEffects(R, ev.effects);
    extra = ' ' + ev.text;
  }
  say(R, `Worked a shift as ${job.name}. Earned ${pay.toLocaleString()} LC.${extra}`);
  checkPromotion(R, job);
}

const WORK_EVENTS = [
  { text: 'A customer thanked you for your patience.', effects: [{ wellbeing: 3 }] },
  { text: 'The power went off mid-shift. Long day.', effects: [{ energy: -5 }] },
  { text: 'A colleague shared puff-puff with everyone.', effects: [{ energy: 5 }, { wellbeing: 2 }] },
  { text: 'You fixed a problem nobody else could. Your manager noticed.', effects: [{ careerPerformance: 4 }] },
];

/** Unpaid volunteering at a workplace you are not employed at (e.g. Mama Ngozi's store room). */
function volunteer(R, p) {
  if (p.mapId !== 'shop') fail('There is no volunteer work here.');
  requireMap(R, 'shop');
  requireEnergy(R, 15, 'volunteering');
  advance(R, 4 * HOUR);
  addStat(R, 'energy', -15);
  addSkill(R, 'trade', 1);
  inc(R, 'shiftsAtShop');
  emit(R, 'volunteer', { mapId: 'shop' });
  say(R, 'You helped out in the store room for a few hours. Mama Ngozi gives you a nod of approval.');
}

function applyJob(R, p) {
  notInHistory(R);
  const s = R.state;
  const job = JOB_BY_ID[p.jobId];
  if (!job) fail('Unknown job.');
  if (job.requires.promotionOnly) fail('That role is filled by promotion.');
  if (s.career.jobId === job.id) fail('You already have that job.');
  const missing = meetsRequirements(s, job.requires);
  if (missing.length) fail(`Not eligible yet — missing ${missing.join(', ')}.`, 'not_eligible');
  if (s.career.jobId) s.career.history.push({ jobId: s.career.jobId, from: s.career.startedAt, to: s.time.minutes });
  s.career.jobId = job.id;
  s.career.shiftsInJob = 0;
  s.career.performance = 50;
  s.career.startedAt = s.time.minutes;
  advance(R, 30);
  emit(R, 'hired', { jobId: job.id });
  say(R, `You got the job: ${job.name} at ${job.employer}!`, 'reward');
  logLife(R, { kind: 'career', title: `Started work as ${job.name}`, detail: job.employer, weight: 2, tags: ['career'] });
}

function quitJob(R) {
  const s = R.state;
  if (!s.career.jobId) fail('You do not have a job.');
  const job = JOB_BY_ID[s.career.jobId];
  s.career.history.push({ jobId: job.id, from: s.career.startedAt, to: s.time.minutes });
  s.career.jobId = null;
  emit(R, 'quit', { jobId: job.id });
  say(R, `You left your job as ${job.name}.`);
  logLife(R, { kind: 'career', title: `Left work as ${job.name}`, weight: 1, tags: ['career'] });
}

// ─── education ───
function enroll(R, p) {
  notInHistory(R);
  requireMap(R, 'university_hall', 'the Learning Centre registrar');
  const s = R.state;
  const course = COURSE_BY_ID[p.courseId];
  if (!course) fail('Unknown course.');
  if (s.education.enrolled) fail('Finish or drop your current course first.');
  if (s.education.completed.includes(course.id)) fail('You have already completed that course.');
  const missing = (course.requires || []).filter((q) => !s.education.completed.includes(q));
  if (missing.length) fail(`You need ${missing.map((q) => COURSE_BY_ID[q]?.name || q).join(', ')} first.`, 'not_eligible');
  spendCoins(R, Math.round(course.fee), `Fees: ${course.name}`);
  s.education.enrolled = { courseId: course.id, progress: 0, startedAt: s.time.minutes };
  emit(R, 'enroll', { courseId: course.id });
  say(R, `Enrolled in ${course.name}.`, 'reward');
  logLife(R, { kind: 'education', title: `Enrolled in ${course.name}`, weight: 1, tags: ['education'] });
}

function dropCourse(R) {
  const s = R.state;
  if (!s.education.enrolled) fail('You are not enrolled.');
  const c = COURSE_BY_ID[s.education.enrolled.courseId];
  s.education.enrolled = null;
  say(R, `You dropped ${c.name}. Fees are not refunded.`, 'warn');
  logLife(R, { kind: 'education', title: `Dropped ${c.name}`, weight: 1, tags: ['education'] });
}

function study(R) {
  notInHistory(R);
  const s = R.state;
  if (!s.education.enrolled) fail('Enrol in a course first.', 'not_enrolled');
  const atHall = s.location.mapId === 'university_hall';
  const atHomeWithLaptop = s.location.mapId === 'home' && itemQty(s, 'laptop') > 0;
  if (!atHall && !atHomeWithLaptop) fail('Study at the Learning Centre (or at home if you own a laptop).', 'wrong_location');
  requireEnergy(R, 12, 'studying');
  const course = COURSE_BY_ID[s.education.enrolled.courseId];
  const hours = 3;
  const gain = Math.round(hours * (1 + boost(s, 'study')) * 10) / 10;
  advance(R, hours * HOUR);
  addStat(R, 'energy', -12);
  s.education.enrolled.progress = Math.round((s.education.enrolled.progress + gain) * 10) / 10;
  addSkill(R, course.skill, 1);
  if (boost(s, 'skill_tech') && course.skill !== 'tech') addSkill(R, 'tech', 1);
  addXp(R, 8);
  inc(R, 'studyHours', hours);
  emit(R, 'study', { hours, courseId: course.id });
  if (s.education.enrolled.progress >= course.hours) {
    s.education.completed.push(course.id);
    s.education.enrolled = null;
    inc(R, 'coursesCompleted');
    addXp(R, 80);
    emit(R, 'qualification', { courseId: course.id });
    say(R, `You completed ${course.name}! 🎓`, 'reward');
    logLife(R, { kind: 'education', title: `Completed ${course.name}`, weight: 3, tags: ['education'] });
  } else {
    say(R, `Studied ${hours} hours (${Math.min(100, Math.floor((s.education.enrolled.progress / course.hours) * 100))}% of ${course.name}).`);
  }
}

// ─── business ───
function startBusiness(R, p) {
  notInHistory(R);
  const s = R.state;
  const b = BUSINESS_BY_ID[p.type];
  if (!b) fail('Unknown business.');
  if (s.business) fail('You already run a business. Close it first.');
  requireMap(R, b.mapId, b.name);
  const missing = meetsRequirements(s, b.requires);
  if (missing.length) fail(`You need ${missing.join(', ')}.`, 'not_eligible');
  spendCoins(R, b.startup, `Started ${b.name}`);
  s.business = { type: b.id, stock: 0, reputation: 50, daysRun: 0, totalProfit: 0, startedAt: s.time.minutes };
  inc(R, 'businessesStarted');
  emit(R, 'business_started', { type: b.id });
  say(R, `You opened your ${b.name}!`, 'reward');
  logLife(R, { kind: 'business', title: `Started a business: ${b.name}`, weight: 3, tags: ['business', 'money'] });
}

function restock(R, p) {
  const s = R.state;
  if (!s.business || !BUSINESS_BY_ID[s.business.type].usesStock) fail('Your business does not use stock.');
  requireMap(R, BUSINESS_BY_ID[s.business.type].mapId);
  const qty = p.qty;
  if (!isInt(qty) || qty < 1 || qty > 200) fail('Restock between 1 and 200 units.');
  const unit = ITEM_BY_ID.stall_stock.price;
  spendCoins(R, unit * qty, `Stock × ${qty}`);
  s.business.stock += qty;
  emit(R, 'restock', { qty });
  say(R, `Bought ${qty} units of stock.`);
}

function businessDay(R, rng, { silent = false } = {}) {
  const s = R.state;
  const b = BUSINESS_BY_ID[s.business.type];
  const rep = s.business.reputation / 50;
  const skill = 1 + (s.skills[b.skill] || 0) / 100;
  let revenue;
  if (b.usesStock) {
    const demand = Math.round((8 + (s.skills.trade || 0) / 4 + rng() * 12) * rep);
    const sold = Math.max(0, Math.min(s.business.stock, demand));
    s.business.stock -= sold;
    revenue = sold * b.unitSell;
  } else {
    revenue = Math.round(randInt(rng, b.revenue[0], b.revenue[1]) * skill * rep);
  }
  let fee = b.dayFee;
  if (b.id === 'provisions_stall' && s.properties.includes('market_stall_lease')) fee = 0;
  const profit = revenue - fee;
  if (revenue > 0) addCoins(R, revenue, `${b.name} sales`);
  if (fee > 0) {
    const pay = Math.min(fee, s.coins);
    if (pay > 0) spendCoins(R, pay, `${b.name} running costs`);
  }
  s.business.daysRun += 1;
  s.business.totalProfit += profit;
  addSkill(R, b.skill, 1);
  if (!silent) say(R, `Business day: ${revenue.toLocaleString()} LC in sales, ${fee.toLocaleString()} LC costs (${profit >= 0 ? 'profit' : 'loss'} ${Math.abs(profit).toLocaleString()} LC).`);
  emit(R, 'business_day', { type: b.id, profit });
  return profit;
}

function runBusiness(R) {
  notInHistory(R);
  const s = R.state;
  if (!s.business) fail('You have no business yet.');
  const b = BUSINESS_BY_ID[s.business.type];
  requireMap(R, b.mapId, b.name);
  if (b.usesStock && s.business.stock <= 0) fail('You have no stock to sell. Restock first.', 'no_stock');
  requireEnergy(R, b.energy, 'a business day');
  const rng = stepRng(s);
  advance(R, b.hours * HOUR);
  addStat(R, 'energy', -b.energy);
  businessDay(R, rng);
  addXp(R, 10);
}

function closeBusiness(R) {
  const s = R.state;
  if (!s.business) fail('You have no business.');
  const b = BUSINESS_BY_ID[s.business.type];
  s.businessHistory.push({ type: b.id, daysRun: s.business.daysRun, totalProfit: s.business.totalProfit, from: s.business.startedAt, to: s.time.minutes });
  if (s.businessHistory.length > 10) s.businessHistory.shift();
  logLife(R, { kind: 'business', title: `Closed ${b.name}`, detail: `${s.business.daysRun} days, total ${s.business.totalProfit.toLocaleString()} LC`, weight: 2, tags: ['business'] });
  s.business = null;
  say(R, `You closed your ${b.name}.`);
}

// ─── money ───
function bank(R, p) {
  requireMap(R, 'udoka', 'the Cooperative Bank');
  const s = R.state;
  const amount = p.amount;
  if (!isInt(amount) || amount <= 0 || amount > 1e9) fail('Enter a whole amount.');
  if (p.op === 'deposit') {
    if (s.coins < amount) fail('Not enough coins.', 'insufficient_funds');
    s.coins -= amount;
    s.savings += amount;
    R.ledger.push({ delta: -amount, reason: 'Deposit to savings' });
    emit(R, 'deposit', { amount });
    say(R, `Deposited ${amount.toLocaleString()} LC.`);
  } else if (p.op === 'withdraw') {
    if (s.savings < amount) fail('Not enough savings.', 'insufficient_funds');
    s.savings -= amount;
    s.coins += amount;
    R.ledger.push({ delta: amount, reason: 'Withdrawal from savings' });
    emit(R, 'withdraw', { amount });
    say(R, `Withdrew ${amount.toLocaleString()} LC.`);
  } else if (p.op === 'pay_arrears') {
    const pay = Math.min(amount, s.stats.arrears, s.coins);
    if (pay <= 0) fail('Nothing to pay.');
    spendCoins(R, pay, 'Paid arrears');
    s.stats.arrears -= pay;
    say(R, `Paid ${pay.toLocaleString()} LC of arrears.`);
  } else fail('Unknown bank operation.');
}

const DONATION_CAUSES = {
  church_offering: { name: 'Grace Chapel offering', mapId: 'church' },
  food_bank: { name: 'Food bank fund', mapId: 'church' },
  community_projects: { name: 'Community Centre projects', mapId: 'community_centre' },
  borehole: { name: 'Nkwo borehole', mapId: 'nkwo' },
};
export { DONATION_CAUSES };

function donate(R, p) {
  const cause = DONATION_CAUSES[p.cause];
  if (!cause) fail('Unknown cause.');
  requireMap(R, cause.mapId, cause.name);
  const amount = p.amount;
  if (!isInt(amount) || amount < 100 || amount > 1e8) fail('Give at least 100 LC.');
  spendCoins(R, amount, `Gift: ${cause.name}`, { donation: true });
  inc(R, 'donations');
  emit(R, 'donate', { cause: p.cause, amount });
  if (p.cause === 'borehole') {
    R.state.flags.borehole_started = R.state.flags.borehole_started || R.state.time.minutes;
    R.state.flags.borehole_fund = (R.state.flags.borehole_fund || 0) + amount;
    setFlag(R, 'borehole_contributed');
    emit(R, 'borehole_contribution', { amount });
  }
  say(R, `You gave ${amount.toLocaleString()} LC to the ${cause.name}. (Giving is recorded in your life story; it does not buy achievements.)`);
  if (amount >= 20000) logLife(R, { kind: 'generosity', title: `Gave ${amount.toLocaleString()} LC to the ${cause.name}`, weight: 2, tags: ['generosity', 'money'] });
}

function boreholeLabour(R) {
  requireMap(R, 'nkwo', 'Nkwo');
  const s = R.state;
  if (s.flags.borehole_complete) fail('The borehole is already finished.');
  requireEnergy(R, 35, 'a day of labour');
  const today = Math.floor(s.time.minutes / DAY);
  if (s.flags.borehole_last_labour_day === today) fail('You have already worked on the borehole today.');
  advance(R, 8 * HOUR);
  addStat(R, 'energy', -35);
  s.flags.borehole_last_labour_day = today;
  s.flags.borehole_started = s.flags.borehole_started || s.time.minutes;
  s.flags.borehole_fund = (s.flags.borehole_fund || 0) + 25000; // a day's labour, valued for the project
  setFlag(R, 'borehole_contributed');
  inc(R, 'serviceActs');
  emit(R, 'service', { kind: 'borehole_labour' });
  emit(R, 'borehole_contribution', { labour: true });
  say(R, `You dug and carried pipes all day. Project progress: ${Math.min(100, Math.floor((s.flags.borehole_fund / BOREHOLE_GOAL) * 100))}%.`);
}

function buyProperty(R, p) {
  requireMap(R, 'udoka', 'the Udoka Homes estate agent');
  const s = R.state;
  const prop = PROPERTY_BY_ID[p.propertyId];
  if (!prop) fail('Unknown property.');
  if (s.properties.includes(prop.id)) fail('You already own that.');
  spendCoins(R, prop.price, `Property: ${prop.name}`);
  s.properties.push(prop.id);
  emit(R, 'property', { id: prop.id });
  say(R, `You bought: ${prop.name}!`, 'reward');
  logLife(R, { kind: 'property', title: `Bought ${prop.name}`, detail: `${prop.price.toLocaleString()} LC`, weight: 3, tags: ['money', 'possessions'] });
}

function clinic(R) {
  requireMap(R, 'clinic', 'Udoka Clinic');
  spendCoins(R, 3000, 'Clinic check-up');
  advance(R, 90);
  R.state.stats.health = 100;
  addStat(R, 'energy', 10);
  emit(R, 'clinic');
  say(R, 'Dr Amina’s team checked you over. You feel much better.');
}

// ─── faith life ───
function pray(R, p) {
  const s = R.state;
  const type = PRAYER_BY_ID[p.prayerType];
  if (!type) fail('Unknown prayer type.');
  const place = PRAYER_PLACES[p.place];
  if (!place) fail('Unknown prayer place.');
  requireMap(R, place.mapId, place.name);
  if (type.requires && !check(type.requires, s)) fail('That prayer option is not relevant right now.');
  let target = null;
  if (type.needsTarget) {
    target = NPC_BY_ID[p.target];
    if (!target || !s.relationships[target.id]?.met) fail('Choose someone you have met.');
  }
  const text = typeof p.journal === 'string' ? p.journal.trim().slice(0, LIMITS.journalTextMax) : '';
  advance(R, 20);
  inc(R, 'prayers');
  inc(R, `prayer_${type.id}`);
  if (!s.prayerKindsSeen.includes(type.id)) {
    s.prayerKindsSeen.push(type.id);
    R.state.counters.prayerKinds = s.prayerKindsSeen.length;
  }
  // A moment of calm, at most once a day — never money, success or protection.
  const today = Math.floor(s.time.minutes / DAY);
  if (s.flags.last_prayer_calm_day !== today) {
    s.flags.last_prayer_calm_day = today;
    addStat(R, 'wellbeing', 3);
  }
  if (target) {
    setFlag(R, `prayed_for_${target.id}`);
    noteRelationship(R, target.id, 'You prayed for them.');
  }
  if (type.id === 'decision' && s.scenarios.pending.length) {
    setFlag(R, `prayed_before_${s.scenarios.pending[0]}`);
    say(R, 'You take time to pray and think before deciding. The choice is still yours.');
  }
  if (p.place === 'riverside') setFlag(R, 'ph_prayed_river');
  if (text) {
    R.journal = { prayerType: type.id, place: p.place, text, target: target?.id || null };
    emit(R, 'journal');
  }
  emit(R, 'pray', { prayerType: type.id, place: p.place, target: target?.id });
  say(R, `You spent time in prayer${target ? ` for ${target.name}` : ''}.`, 'calm');
}

function readScripture(R, p) {
  const s = R.state;
  const parsed = parseReference(p.ref);
  if (!parsed) fail('Unknown Scripture reference.');
  const key = String(p.ref).slice(0, 60);
  const today = Math.floor(s.time.minutes / DAY);
  const seenKey = `${key}@${today}`;
  if (!s.readRefs.includes(seenKey)) {
    s.readRefs.push(seenKey);
    if (s.readRefs.length > 200) s.readRefs.splice(0, s.readRefs.length - 200);
    inc(R, 'scriptureRead');
    addXp(R, 2);
  }
  if (s.location.mapId === 'philippi' && parsed.bookId === 'act' && parsed.chapter === 16) setFlag(R, 'ph_read_acts16');
  emit(R, 'read_scripture', { ref: key });
}

function bibleStudy(R) {
  requireMap(R, 'church', 'Grace Chapel');
  const s = R.state;
  const h = hour(R);
  if (h < 16 || h >= 22) fail('Bible study meets in the evenings (16:00–22:00).', 'closed');
  const today = Math.floor(s.time.minutes / DAY);
  if (s.flags.last_bible_study_day === today) fail('You have already joined Bible study today.');
  s.flags.last_bible_study_day = today;
  advance(R, 90);
  addSkill(R, 'communication', 1);
  inc(R, 'bibleStudies');
  addXp(R, 12);
  emit(R, 'bible_study');
  let text = 'Brother Sam led the circle through a passage, slowly. Good questions, better chin-chin.';
  if (s.flags.chidi_disciple_invited && relationship(R, 'chidi').stage === 6) {
    relationship(R, 'chidi').stage = 7;
    setFlag(R, 'chidi_s7');
    s.storylines.chidi = { ...s.storylines.chidi, discipled: true };
    inc(R, 'discipleship');
    emit(R, 'discipleship', { npc: 'chidi' });
    logLife(R, { kind: 'discipleship', title: 'Studied the Bible with Chidi', detail: 'He brought a notebook full of questions.', weight: 4, tags: ['faith'] });
    text = 'Chidi came with a notebook full of questions. Brother Sam was delighted. You walked home together talking about Thomas and his doubts.';
  }
  say(R, text, 'calm');
}

function service(R, p) {
  const places = { food_bank: 'church', youth_tutoring: 'community_centre' };
  const mapId = places[p.service];
  if (!mapId) fail('Unknown service.');
  requireMap(R, mapId);
  const s = R.state;
  requireEnergy(R, 20, 'volunteering');
  const today = Math.floor(s.time.minutes / DAY);
  const key = `last_service_${p.service}`;
  if (s.flags[key] === today) fail('You have already volunteered here today.');
  s.flags[key] = today;
  advance(R, 3 * HOUR);
  addStat(R, 'energy', -20);
  addStat(R, 'wellbeing', 4);
  addSkill(R, p.service === 'food_bank' ? 'care' : 'teaching', 1);
  inc(R, 'serviceActs');
  addXp(R, 15);
  emit(R, 'service', { kind: p.service });
  say(R, p.service === 'food_bank' ? 'You packed and handed out food parcels for three hours.' : 'You helped children with homework at the community centre.', 'calm');
  if ((s.counters.serviceActs || 0) % 5 === 1) logLife(R, { kind: 'service', title: p.service === 'food_bank' ? 'Served at the food bank' : 'Tutored children at the community centre', weight: 1, tags: ['service'] });
}

// ─── conversations ───
function pickTree(state, npc) {
  for (const c of npc.conversations) if (!c.when || check(c.when, state, { npc: npc.id })) return c.tree;
  return null;
}

function resolveAuto(R, tree, nodeId, npcId) {
  let id = nodeId;
  for (let guard = 0; guard < 5; guard++) {
    const node = DIALOGUES[tree].nodes[id];
    if (!node?.auto) return id;
    const branch = node.auto.find((a) => !a.when || check(a.when, R.state, { npc: npcId }));
    id = branch.next;
  }
  return id;
}

function talkStart(R, p) {
  const s = R.state;
  const npc = NPC_BY_ID[p.npcId];
  if (!npc) fail('Unknown person.');
  const here = npcPresence(npc, s.time.minutes);
  if (!here || here.mapId !== s.location.mapId) fail(`${npc.name} is not here right now.`, 'not_here');
  const tree = pickTree(s, npc);
  const def = DIALOGUES[tree];
  const node = resolveAuto(R, tree, def.start, npc.id);
  s.dialogue = { npcId: npc.id, tree, node };
  advance(R, 5);
  if (!npc.ambient) inc(R, 'conversationsStarted');
  emit(R, 'talk', { npc: npc.id, tree });
}

function talkChoose(R, p) {
  const s = R.state;
  if (!s.dialogue) fail('You are not in a conversation.');
  const { npcId, tree, node } = s.dialogue;
  const def = DIALOGUES[tree];
  const choice = def.nodes[node].choices.find((c) => c.id === p.choiceId);
  if (!choice) fail('That is not an option.', 'invalid_choice');
  if (choice.requires && !check(choice.requires, s, { npc: npcId })) fail('You cannot choose that right now.', 'choice_locked');
  applyEffects(R, choice.effects || [], { npc: npcId });
  advance(R, 3);
  emit(R, 'dialogue_choice', { npc: npcId, tree, kind: choice.kind });
  if (choice.kind === 'pushy') say(R, 'That landed badly. People respond to respect, not pressure.', 'warn');
  if (choice.end || !choice.next) {
    s.dialogue = null;
    emit(R, 'talk_end', { npc: npcId });
    return;
  }
  s.dialogue = { npcId, tree, node: resolveAuto(R, tree, choice.next, npcId) };
}

function talkEnd(R) {
  R.state.dialogue = null;
}

// ─── decisions & missions ───
function resolveScenario(R, p) {
  const s = R.state;
  if (!s.scenarios.pending.includes(p.scenarioId)) fail('That decision is not waiting for you.');
  const sc = SCENARIO_BY_ID[p.scenarioId];
  const choice = sc.choices.find((c) => c.id === p.choiceId);
  if (!choice) fail('That is not an option.');
  if (choice.requires && !check(choice.requires, s)) fail('You cannot choose that option.', 'choice_locked');
  applyEffects(R, choice.effects);
  s.scenarios.pending = s.scenarios.pending.filter((x) => x !== sc.id);
  s.scenarios.resolved[sc.id] = choice.id;
  emit(R, 'scenario', { id: sc.id, choice: choice.id });
  say(R, choice.outcome, 'story');
  const prayed = s.flags[`prayed_before_${sc.id}`] ? ' You prayed before deciding.' : '';
  logLife(R, { kind: 'decision', title: sc.title, detail: `${choice.text} — ${choice.outcome}${prayed}`, weight: 3, tags: ['decision', sc.category] });
}

function acceptMission(R, p) {
  const m = MISSION_BY_ID[p.missionId];
  if (!m || !m.board) fail('That mission is not on the board.');
  if (!startMission(R, m.id)) fail('You cannot start that mission right now.');
}

// ─── travel & history ───
function travel(R, p) {
  notInHistory(R);
  const s = R.state;
  const dest = DESTINATION_BY_ID[p.to];
  if (!dest || !dest.available) fail('That destination is not available.');
  if (dest.mapId === s.location.region) fail('You are already there.');
  const fromPark = (s.location.mapId === 'udoka' || s.location.mapId === 'nkwo');
  if (!fromPark) fail('Travel leaves from the motor park.', 'wrong_location');
  const cost = itemQty(s, 'car') ? Math.round(dest.cost / 2) : dest.cost;
  spendCoins(R, cost, `Travel to ${dest.name}`);
  advance(R, dest.hours * HOUR);
  addStat(R, 'energy', -10);
  placeTo(R, dest.mapId, dest.spawn);
  emit(R, 'travel', { to: dest.id });
  say(R, `You arrived in ${dest.name}.`);
  if (!s.flags[`first_trip_${dest.id}`]) {
    s.flags[`first_trip_${dest.id}`] = s.time.minutes;
    logLife(R, { kind: 'travel', title: `First trip to ${dest.name}`, weight: 1, tags: ['travel'] });
  }
}

function enterHistory(R, p) {
  const s = R.state;
  notInHistory(R);
  const era = ERA_BY_ID[p.eraId];
  if (!era || !era.available) fail('That era is not available yet.');
  if (era.requires && !check(era.requires, s)) fail(`Locked: ${era.requirementText}.`, 'locked');
  s.history.active = { eraId: era.id, minutes: 8 * HOUR, enteredAt: s.time.minutes, returnLocation: { ...s.location } };
  placeTo(R, era.mapId, era.spawn);
  emit(R, 'history_enter', { scenarioId: era.id });
  say(R, `You step into ${era.name}. (Your own timeline is paused while you are here.)`, 'story');
  if (!s.flags[`entered_${era.id}`]) {
    s.flags[`entered_${era.id}`] = s.time.minutes;
    logLife(R, { kind: 'history', title: `Walked through ${era.name}`, weight: 2, tags: ['history'] });
  }
}

function exitHistory(R) {
  const s = R.state;
  if (!s.history.active) fail('You are not in a historical scenario.');
  const back = s.history.active.returnLocation;
  s.history.active = null;
  s.location = back;
  emit(R, 'history_exit');
  say(R, 'You return to your own time. No time has passed here.', 'story');
}

function updateAppearance(R, p) {
  requireMap(R, 'home', 'home');
  const prof = R.state.profile;
  if (p.hair && HAIR_STYLES.some((h) => h.id === p.hair)) prof.hair = p.hair;
  if (p.hairColor && HAIR_COLORS.some((h) => h.id === p.hairColor)) prof.hairColor = p.hairColor;
  if (p.outfit && OUTFITS.some((o) => o.id === p.outfit)) prof.outfit = p.outfit;
  emit(R, 'appearance');
}

export function ambientLine(state, npcId) {
  const npc = NPC_BY_ID[npcId];
  const lines = AMBIENT_LINES[getMap(state.location.mapId)?.region] || AMBIENT_LINES.udoka;
  const day = Math.floor(state.time.minutes / DAY);
  return lines[(day + (npc?.lineSeed || 0)) % lines.length];
}

export const ACTIONS = {
  sync, sleep, nap, wait, live_month: liveMonth,
  use_item: useItem, buy, sell,
  work_shift: workShift, volunteer, apply_job: applyJob, quit_job: quitJob,
  enroll, drop_course: dropCourse, study,
  start_business: startBusiness, restock, run_business: runBusiness, close_business: closeBusiness,
  bank, donate, borehole_labour: boreholeLabour, buy_property: buyProperty, clinic,
  pray, read_scripture: readScripture, bible_study: bibleStudy, service,
  talk_start: talkStart, talk_choose: talkChoose, talk_end: talkEnd,
  resolve_scenario: resolveScenario, accept_mission: acceptMission,
  travel, enter_history: enterHistory, exit_history: exitHistory,
  update_appearance: updateAppearance,
};

// Actions that remain possible while a conversation is open.
export const DIALOGUE_SAFE = new Set(['talk_choose', 'talk_end', 'sync', 'read_scripture']);
