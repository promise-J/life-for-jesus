// After every action: delayed consequences, life stages, missions, scenarios and achievements.
import { MISSIONS, MISSION_BY_ID, MISSION_CHAIN } from '../content/missions.js';
import { SCENARIOS } from '../content/scenarios.js';
import { DELAYED_EVENTS } from '../content/scenarios.js';
import { ACHIEVEMENTS } from '../content/achievements.js';
import { REWARDS } from '../content/rewards.js';
import { check } from './conditions.js';
import { applyEffects, startMission } from './effects.js';
import { ageAt, lifeStageFor } from './time.js';
import { addXp, addCoins, emit, say, logLife, inc, setFlag } from './core.js';

export const BOREHOLE_GOAL = 400000;

function eventMatches(ev, track) {
  const types = Array.isArray(track.event) ? track.event : [track.event];
  if (!types.includes(ev.type)) return false;
  for (const [k, v] of Object.entries(track.match || {})) {
    if (k.endsWith('In')) {
      if (!v.includes(ev[k.slice(0, -2)])) return false;
    } else if (k === 'refIncludes') {
      if (!String(ev.ref || '').includes(v)) return false;
    } else if (ev[k] !== v) return false;
  }
  return true;
}

export function objectiveDone(state, missionId, obj) {
  if (obj.track.cond) return check(obj.track.cond, state);
  const count = state.missions.progress[missionId]?.counts?.[obj.id] || 0;
  return count >= (obj.track.count || 1);
}

export function missionView(state, id) {
  const m = MISSION_BY_ID[id];
  return {
    ...m,
    status: state.missions.completed.includes(id) ? 'completed' : state.missions.active.includes(id) ? 'active' : 'available',
    objectives: m.objectives.map((o) => ({
      id: o.id,
      text: o.text,
      optional: !!o.optional,
      done: objectiveDone(state, id, o),
      count: state.missions.progress[id]?.counts?.[o.id] || 0,
      target: o.track.count || 1,
    })),
    outcome: state.missions.outcomes[id] || null,
  };
}

function trackMissions(R) {
  const s = R.state;
  R.counted ??= new Set();
  for (const id of [...s.missions.active]) {
    const m = MISSION_BY_ID[id];
    const prog = s.missions.progress[id] || (s.missions.progress[id] = { counts: {} });
    const countNow = !R.counted.has(id);
    R.counted.add(id);
    for (const obj of m.objectives) {
      if (obj.track.cond || !countNow) continue;
      for (const ev of R.events) {
        if (!eventMatches(ev, obj.track)) continue;
        const add = obj.track.field ? Number(ev[obj.track.field]) || 0 : 1;
        prog.counts[obj.id] = (prog.counts[obj.id] || 0) + add;
      }
    }
    const required = m.objectives.filter((o) => !o.optional);
    if (required.every((o) => objectiveDone(s, id, o))) completeMission(R, id);
  }
}

function completeMission(R, id) {
  const s = R.state;
  const m = MISSION_BY_ID[id];
  s.missions.active = s.missions.active.filter((x) => x !== id);
  if (s.missions.completed.includes(id)) return;
  s.missions.completed.push(id);
  const branch = (m.branches || []).find((b) => check(b.when, s));
  if (branch) s.missions.outcomes[id] = branch.text;
  const optionalDone = m.objectives.filter((o) => o.optional && objectiveDone(s, id, o)).length;
  const reward = REWARDS[m.reward]?.reward || {};
  addXp(R, (reward.xp || 0) + optionalDone * 20);
  if (reward.coins) addCoins(R, reward.coins, `Mission: ${m.title}`);
  inc(R, 'missionsCompleted');
  emit(R, 'mission_completed', { id });
  say(R, `Mission complete: ${m.title}`, 'reward');
  logLife(R, { kind: 'mission', title: `Completed “${m.title}”`, detail: branch?.text || m.summary, weight: 2, tags: ['mission', m.category] });
  if (id === 'walk_to_river' && !s.history.completed.includes('philippi')) {
    s.history.completed.push('philippi');
    emit(R, 'history_complete', { id: 'philippi' });
  }
}

/** Mission Mode keeps the next two chain missions active automatically. */
function offerChain(R) {
  const s = R.state;
  if (s.mode !== 'mission') return;
  const activeChain = s.missions.active.filter((id) => MISSION_BY_ID[id].chain).length;
  let slots = 2 - activeChain;
  for (const id of MISSION_CHAIN) {
    if (slots <= 0) break;
    if (s.missions.active.includes(id) || s.missions.completed.includes(id)) continue;
    const m = MISSION_BY_ID[id];
    if (m.prerequisites && !check(m.prerequisites, s)) continue;
    if (startMission(R, id, { silent: false })) slots--;
  }
}

function runDelayed(R) {
  const s = R.state;
  const due = s.scheduled.filter((x) => x.at <= s.time.minutes);
  if (!due.length) return;
  s.scheduled = s.scheduled.filter((x) => x.at > s.time.minutes);
  for (const d of due) {
    const def = DELAYED_EVENTS[d.eventId];
    if (!def) continue;
    if (def.requires && !check(def.requires, s)) continue;
    applyEffects(R, def.effects);
    say(R, `${def.title}: ${def.text}`, 'story');
    emit(R, 'delayed_event', { id: d.eventId });
    logLife(R, { kind: 'consequence', title: def.title, detail: def.text, weight: 2, tags: ['consequence'] });
  }
}

function triggerScenarios(R) {
  const s = R.state;
  if (s.history.active) return;
  for (const sc of SCENARIOS) {
    if (s.scenarios.resolved[sc.id] || s.scenarios.pending.includes(sc.id)) continue;
    if (s.scenarios.pending.length >= 1) break; // one decision at a time
    if (check(sc.trigger, s)) {
      s.scenarios.pending.push(sc.id);
      emit(R, 'scenario_triggered', { id: sc.id });
      say(R, `A decision awaits: ${sc.title}`, 'decision');
    }
  }
}

function checkWorld(R) {
  const s = R.state;
  if (s.flags.borehole_started && !s.flags.borehole_complete && (s.flags.borehole_fund || 0) >= BOREHOLE_GOAL) {
    setFlag(R, 'borehole_complete');
    say(R, 'The Nkwo borehole is finished! Clean water is flowing in the village square.', 'reward');
    logLife(R, { kind: 'community', title: 'The Nkwo borehole was completed', detail: 'Money and labour from many people, including you.', weight: 4, tags: ['service', 'community'] });
  }
  const stage = lifeStageFor(ageAt(s));
  if (s.lifeStage !== stage.id) {
    if (s.lifeStage) {
      say(R, `New life stage: ${stage.name}.`, 'story');
      logLife(R, { kind: 'life_stage', title: `Became a${/^[aeiou]/i.test(stage.name) ? 'n' : ''} ${stage.name.toLowerCase()}`, weight: 2, tags: ['life'] });
    }
    s.lifeStage = stage.id;
  }
}

function checkAchievements(R) {
  const s = R.state;
  for (const a of ACHIEVEMENTS) {
    const list = a.kind === 'crown' ? s.achievements.crowns : s.achievements.badges;
    if (list.includes(a.id)) continue;
    if (!check(a.when, s)) continue;
    list.push(a.id);
    const reward = REWARDS[a.kind === 'crown' ? 'achievement_crown' : 'achievement_badge'].reward;
    addXp(R, reward.xp);
    emit(R, 'achievement', { id: a.id, kind: a.kind });
    say(R, `${a.kind === 'crown' ? 'Crown' : 'Badge'} earned: ${a.name}`, 'achievement');
    logLife(R, { kind: 'achievement', title: `${a.kind === 'crown' ? 'Crown' : 'Badge'}: ${a.name}`, detail: a.description, weight: a.kind === 'crown' ? 3 : 1, tags: ['achievement'] });
  }
}

export function postProcess(R) {
  runDelayed(R);
  checkWorld(R);
  offerChain(R);
  trackMissions(R);
  offerChain(R);
  trackMissions(R);
  triggerScenarios(R);
  checkAchievements(R);
  checkAchievements(R); // achievements can unlock others via XP / levels
}

export { MISSIONS };
