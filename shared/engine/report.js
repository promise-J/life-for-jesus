// Builds the final life report — a record of SIMULATED gameplay, never a spiritual verdict.
import { YEAR, DAY } from '../content/constants.js';
import { JOB_BY_ID, qualificationName, BUSINESS_BY_ID } from '../content/careers.js';
import { PROPERTY_BY_ID } from '../content/items.js';
import { NPC_BY_ID } from '../content/npcs.js';
import { MISSION_BY_ID, MISSIONS } from '../content/missions.js';
import { ACHIEVEMENT_BY_ID } from '../content/achievements.js';
import { SCENARIO_BY_ID } from '../content/scenarios.js';
import { formatDate } from './time.js';

export const REPORT_DISCLAIMER =
  'This is a record of a simulated life in a game. It is not a judgment of any real person’s heart or standing before God. The game cannot see that — and it never calculates salvation from coins, crowns, prayers, gifts or missions.';

function trustLabel(t) {
  if (t >= 70) return 'Close friend';
  if (t >= 40) return 'Friend';
  if (t >= 15) return 'Acquaintance';
  return 'Met';
}

/** lifeEvents: full list from the LifeEvent collection (falls back to state.lifeLog). */
export function buildLifeReport(state, lifeEvents = state.lifeLog) {
  const yearsSimulated = (state.time.minutes - state.time.startMinutes) / YEAR;
  const ageAtEnd = Math.floor((state.time.minutes - state.profile.birthMinutes) / YEAR);
  const careers = [
    ...state.career.history.map((h) => ({ job: JOB_BY_ID[h.jobId]?.name || h.jobId, employer: JOB_BY_ID[h.jobId]?.employer, from: h.from != null ? formatDate(h.from) : null, to: formatDate(h.to) })),
    ...(state.career.jobId ? [{ job: JOB_BY_ID[state.career.jobId].name, employer: JOB_BY_ID[state.career.jobId].employer, from: state.career.startedAt != null ? formatDate(state.career.startedAt) : null, to: 'end of journey' }] : []),
  ];
  const relationships = Object.entries(state.relationships)
    .filter(([, r]) => r.met)
    .map(([id, r]) => ({ id, name: NPC_BY_ID[id]?.name || id, label: trustLabel(r.trust), trust: r.trust, storyline: state.storylines[id]?.outcome || null }))
    .sort((a, b) => b.trust - a.trust);
  const choices = Object.entries(state.scenarios.resolved).map(([id, choiceId]) => {
    const sc = SCENARIO_BY_ID[id];
    const ch = sc?.choices.find((c) => c.id === choiceId);
    return { title: sc?.title || id, choice: ch?.text, outcome: ch?.outcome, prayedFirst: !!state.flags[`prayed_before_${id}`] };
  });
  const highlights = [...lifeEvents].sort((a, b) => (b.weight || 0) - (a.weight || 0) || a.at - b.at).slice(0, 14).sort((a, b) => a.at - b.at);

  // Gentle reflections on roads not taken (never framed as condemnation).
  const missed = [];
  for (const id of ['chidi', 'emeka', 'aisha', 'nneka']) {
    if (!state.relationships[id]?.met) missed.push(`You never met ${NPC_BY_ID[id].name}.`);
  }
  if (!state.counters.prayers) missed.push('Prayer was not part of this character’s story.');
  if (!state.counters.serviceActs) missed.push('This character never volunteered or served others in the game.');
  if (state.scenarios.pending.length) missed.push('A decision was still waiting when the trumpet sounded.');
  const unstarted = MISSIONS.filter((m) => !state.missions.completed.includes(m.id)).length;

  return {
    disclaimer: REPORT_DISCLAIMER,
    name: state.profile.name,
    endedOn: state.ending.status !== 'none' ? state.ending.date : null,
    yearsSimulated: Math.round(yearsSimulated * 10) / 10,
    daysSimulated: Math.round((state.time.minutes - state.time.startMinutes) / DAY),
    ageAtEnd,
    careers,
    education: state.education.completed.map(qualificationName),
    wealth: {
      earned: state.ledger.earned,
      spent: state.ledger.spent,
      given: state.ledger.donated,
      finalCoins: state.coins,
      finalSavings: state.savings,
      peak: state.ledger.peakWealth,
    },
    properties: state.properties.map((p) => PROPERTY_BY_ID[p]?.name || p),
    businesses: [...state.businessHistory, ...(state.business ? [state.business] : [])].map((b) => ({ name: BUSINESS_BY_ID[b.type]?.name, days: b.daysRun, profit: b.totalProfit })),
    relationships,
    service: { acts: state.counters.serviceActs || 0, donations: state.counters.donations || 0 },
    faith: {
      prayers: state.counters.prayers || 0,
      scriptureRead: state.counters.scriptureRead || 0,
      bibleStudies: state.counters.bibleStudies || 0,
      conversations: state.counters.conversations || 0,
      storylines: Object.entries(state.storylines).map(([id, s]) => ({ name: NPC_BY_ID[id]?.name || id, outcome: s.outcome, discipled: !!s.discipled })),
    },
    missions: state.missions.completed.map((id) => ({ title: MISSION_BY_ID[id]?.title, outcome: state.missions.outcomes[id] || null })),
    missionsNotCompleted: unstarted,
    achievements: [...state.achievements.crowns, ...state.achievements.badges].map((id) => ({ id, name: ACHIEVEMENT_BY_ID[id]?.name, kind: ACHIEVEMENT_BY_ID[id]?.kind })),
    choices,
    highlights,
    missed,
  };
}
