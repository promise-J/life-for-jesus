// Applies data-driven effects from dialogues, scenarios and delayed events.
import { DAY } from '../content/constants.js';
import { MISSION_BY_ID } from '../content/missions.js';
import { NPC_BY_ID } from '../content/npcs.js';
import { stepRng } from './rng.js';
import { check } from './conditions.js';
import {
  addCoins, spendCoins, addItem, removeItem, addStat, addSkill, addXp, inc, emit, say, logLife,
  setFlag, relationship, noteRelationship, advance, clamp, fail,
} from './core.js';

export function applyEffects(R, effects = [], ectx = {}) {
  for (const e of effects) applyEffect(R, e, ectx);
}

function applyEffect(R, e, ectx) {
  const s = R.state;
  const npc = e.npc || ectx.npc;
  if ('trust' in e) {
    const r = relationship(R, npc);
    r.trust = clamp(r.trust + e.trust, 0, 100);
  }
  if ('met' in e) {
    const r = relationship(R, npc);
    if (!r.met) {
      r.met = true;
      emit(R, 'met', { npc });
      noteRelationship(R, npc, 'You met.');
    }
  }
  if ('stage' in e) {
    const r = relationship(R, npc);
    if (e.stage > r.stage) {
      r.stage = e.stage;
      setFlag(R, `${npc}_s${e.stage}`);
    }
  }
  if (e.setFlag) setFlag(R, e.setFlag, e.value);
  if (e.clearFlag) delete s.flags[e.clearFlag];
  if (e.flagAdd) {
    s.flags[e.flagAdd.flag] = (Number(s.flags[e.flagAdd.flag]) || 0) + e.flagAdd.amount;
    if (e.flagAdd.flag === 'borehole_fund') {
      s.flags.borehole_started = s.flags.borehole_started || s.time.minutes;
      setFlag(R, 'borehole_contributed');
      emit(R, 'borehole_contribution', { amount: e.flagAdd.amount });
    }
  }
  if ('coins' in e) {
    if (e.coins > 0) addCoins(R, e.coins, e.reason || 'Story event');
    else if (e.coins < 0) {
      spendCoins(R, -e.coins, e.reason || 'Story event', { donation: !!e.donation });
    }
  }
  if (e.deposit) {
    const amt = Math.min(e.deposit, s.coins);
    s.coins -= amt;
    s.savings += amt;
    R.ledger.push({ delta: -amt, reason: 'Moved to savings' });
  }
  if ('xp' in e) addXp(R, e.xp);
  if (e.skill) addSkill(R, e.skill, e.amount ?? 1);
  if ('wellbeing' in e) addStat(R, 'wellbeing', e.wellbeing);
  if ('energy' in e) addStat(R, 'energy', e.energy);
  if ('health' in e) addStat(R, 'health', e.health);
  if (e.giveItem) addItem(R, e.giveItem, e.qty || 1);
  if (e.takeItem) removeItem(R, e.takeItem, e.qty || 1);
  if (e.counter) inc(R, e.counter, e.amount ?? 1);
  if (e.time) advance(R, e.time);
  if (e.startMission) startMission(R, e.startMission, { silent: false });
  if (e.event) emit(R, e.event, { ...e, event: undefined, npc: e.npc ?? npc });
  if (e.log) logLife(R, e.log);
  if (e.schedule) {
    s.scheduled.push({ eventId: e.schedule.eventId, at: s.time.minutes + e.schedule.inDays * DAY });
  }
  if (e.storyline) applyStoryline(R, e.storyline, npc);
  if (e.careerPerformance && s.career.jobId) {
    s.career.performance = clamp(s.career.performance + e.careerPerformance);
  }
  if (e.business && s.business) {
    if (e.business.reputation) s.business.reputation = clamp(s.business.reputation + e.business.reputation);
    if (e.business.bonusStock) s.business.stock += e.business.bonusStock;
  }
  if (e.randomOutcome) {
    const rng = stepRng(s);
    const won = rng() < e.randomOutcome.chance;
    applyEffects(R, won ? e.randomOutcome.win : e.randomOutcome.lose, ectx);
    say(R, won ? 'It went your way this time.' : 'It did not go your way.', won ? 'info' : 'warn');
  }
}

function applyStoryline(R, { id, outcome, discipled }, npc) {
  const s = R.state;
  const prev = s.storylines[id] || {};
  const first = !prev.outcome;
  s.storylines[id] = { ...prev, outcome, at: prev.at ?? s.time.minutes, ...(discipled ? { discipled: true } : {}) };
  const name = NPC_BY_ID[id]?.name || NPC_BY_ID[npc]?.name || id;
  if (first) {
    inc(R, 'evangelismStorylines');
    emit(R, 'storyline_outcome', { id, outcome });
    if (outcome === 'conversion') {
      inc(R, 'conversions');
      logLife(R, { kind: 'evangelism', title: `${name} chose to follow Jesus`, detail: 'A fictional storyline outcome after a long friendship.', weight: 5, tags: ['faith', 'relationships'] });
    } else {
      logLife(R, { kind: 'evangelism', title: `An honest friendship with ${name}`, detail: 'They were not persuaded, and the friendship remained.', weight: 3, tags: ['faith', 'relationships'] });
    }
  }
  if (discipled && !prev.discipled) {
    logLife(R, { kind: 'discipleship', title: `Walked with ${name} into fellowship`, weight: 4, tags: ['faith'] });
  }
}

export function startMission(R, id, { silent = false } = {}) {
  const s = R.state;
  const m = MISSION_BY_ID[id];
  if (!m) fail('Unknown mission.');
  if (s.missions.active.includes(id) || s.missions.completed.includes(id)) return false;
  if (m.prerequisites && !check(m.prerequisites, s)) {
    if (!silent) say(R, `“${m.title}” is not available yet.`, 'warn');
    return false;
  }
  s.missions.active.push(id);
  s.missions.progress[id] = { counts: {}, startedAt: s.time.minutes };
  emit(R, 'mission_started', { id });
  if (!silent) say(R, `New mission: ${m.title}`, 'mission');
  return true;
}
