import { describe, it, expect } from 'vitest';
import {
  applyAction, ActionError, MAPS, stepMovement, resolveDirection, findInteraction, isValidStandingPosition,
  calendar, lifeStageFor, ageAt, scheduleEnding, shouldEnd, MIN_DAYS_BEFORE_ENDING, DAY, YEAR, MONTH, HOUR,
  buildLifeReport, validateCreation, LIMITS, missionView, levelOf, TILE,
} from '../index.js';
import { newState, driver, tileCentre, BASE_INPUT } from './helpers.js';

const expectFail = (fn, code) => {
  try {
    fn();
  } catch (e) {
    expect(e).toBeInstanceOf(ActionError);
    if (code) expect(e.code).toBe(code);
    return e;
  }
  throw new Error('expected an ActionError');
};

describe('character creation', () => {
  it('validates input', () => {
    expect(validateCreation(BASE_INPUT)).toEqual([]);
    expect(validateCreation({ ...BASE_INPUT, name: 'x' }).length).toBeGreaterThan(0);
    expect(validateCreation({ ...BASE_INPUT, gender: 'robot' }).length).toBeGreaterThan(0);
    expect(validateCreation({ ...BASE_INPUT, name: '<script>' }).length).toBeGreaterThan(0);
  });
  it('gender does not change starting opportunities', () => {
    const a = newState({ gender: 'male' });
    const b = newState({ gender: 'female' });
    expect(a.coins).toBe(b.coins);
    expect(a.skills).toEqual(b.skills);
    expect(a.education).toEqual(b.education);
  });
  it('mission mode offers the first missions immediately', () => {
    expect(newState({ mode: 'mission' }).missions.active).toEqual(['first_steps', 'honest_work']);
    expect(newState({ mode: 'free' }).missions.active).toEqual([]);
  });
});

describe('movement (four directions, collisions)', () => {
  const map = MAPS.udoka;
  it('resolves to a single direction — most recent key wins', () => {
    expect(resolveDirection({ up: true, left: true }, ['up', 'left'])).toBe('left');
    expect(resolveDirection({ up: true, left: true }, ['left', 'up'])).toBe('up');
    expect(resolveDirection({}, [])).toBeNull();
  });
  it('moves in each of the four directions on open ground', () => {
    const start = tileCentre(10, 20);
    for (const [dir, dx, dy] of [['up', 0, -1], ['down', 0, 1], ['left', -1, 0], ['right', 1, 0]]) {
      const p = stepMovement(start, dir, 100, 0.1, map);
      expect(p.moved).toBe(true);
      expect(Math.sign(p.x - start.x)).toBe(dx);
      expect(Math.sign(p.y - start.y)).toBe(dy);
    }
  });
  it('stops at buildings', () => {
    // standing just below the home's south wall, left of the door
    let p = tileCentre(2, 8);
    for (let i = 0; i < 20; i++) p = stepMovement(p, 'up', 120, 0.05, map);
    expect(p.y).toBeGreaterThanOrEqual(8 * TILE + 10);
    expect(isValidStandingPosition(map, p.x, p.y)).toBe(true);
  });
  it('finds interactables in front of the player', () => {
    const home = MAPS.home;
    const pos = tileCentre(2, 4); // just below the bed? bed is (1,1)-(2,2); stand at (2,3) facing up
    const hit = findInteraction(home, tileCentre(2, 3), 'up');
    expect(hit?.target?.id).toBe('bed');
    expect(pos).toBeTruthy();
  });
});

describe('time and ageing', () => {
  it('calendar uses 30-day months', () => {
    expect(calendar(0)).toMatchObject({ year: 2027, monthName: 'Jan', day: 1, hour: 0 });
    expect(calendar(MONTH + DAY + 7 * HOUR)).toMatchObject({ monthName: 'Feb', day: 2, hour: 7 });
    expect(calendar(YEAR).year).toBe(2028);
  });
  it('ages and changes life stage', () => {
    const s = newState({ startAge: 'school_leaver' });
    expect(Math.floor(ageAt(s))).toBe(17);
    expect(lifeStageFor(17).id).toBe('teen');
    expect(lifeStageFor(18).id).toBe('young_adult');
    expect(lifeStageFor(61).id).toBe('elder');
  });
  it('sync clamps client-reported time to real elapsed time', () => {
    const d = driver(newState());
    const t0 = d.state.time.minutes;
    const { x, y } = d.state.location;
    d.act('sync', { mapId: 'udoka', x, y, facing: 'down', elapsedMinutes: 500 }, { realElapsedMs: 10_000 });
    expect(d.state.time.minutes - t0).toBeLessThanOrEqual(15);
    d.act('sync', { mapId: 'udoka', x, y, facing: 'down', elapsedMinutes: 99999 }, {});
    expect(d.state.time.minutes - t0).toBeLessThanOrEqual(15 + LIMITS.maxSyncMinutes);
  });
  it('rejects teleporting across regions or into walls', () => {
    const d = driver(newState());
    expectFail(() => d.act('sync', { mapId: 'nkwo', x: 100, y: 100, facing: 'down', elapsedMinutes: 0 }), 'wrong_region');
    expectFail(() => d.act('sync', { mapId: 'udoka', x: 3 * TILE + 5, y: 4 * TILE + 5, facing: 'down', elapsedMinutes: 0 }), 'invalid_position');
  });
});

describe('economy and inventory', () => {
  it('buys, eats and prevents negative balances', () => {
    const d = driver(newState());
    const coins = d.state.coins;
    d.act('buy', { shopId: 'oja_food', itemId: 'jollof_plate', qty: 2 });
    expect(d.state.coins).toBe(coins - 2400);
    d.act('use_item', { itemId: 'jollof_plate' });
    expect(d.state.inventory.find((i) => i.itemId === 'jollof_plate').qty).toBe(1);
    d.at('shop');
    expectFail(() => d.act('buy', { shopId: 'ngozi', itemId: 'laptop', qty: 1 }), 'insufficient_funds');
    expect(d.state.coins).toBe(coins - 2400);
  });
  it('requires being at the shop', () => {
    const d = driver(newState()).at('home');
    expectFail(() => d.act('buy', { shopId: 'oja_food', itemId: 'bread' }), 'wrong_location');
  });
  it('prevents duplicate non-stackable items and invalid quantities', () => {
    const d = driver(newState()).patch((s) => (s.coins = 100000)).at('udoka');
    d.act('buy', { shopId: 'oja_goods', itemId: 'phone' });
    expectFail(() => d.act('buy', { shopId: 'oja_goods', itemId: 'phone' }), 'already_owned');
    expectFail(() => d.act('buy', { shopId: 'oja_food', itemId: 'bread', qty: -3 }));
    expectFail(() => d.act('buy', { shopId: 'oja_food', itemId: 'bread', qty: 1.5 }));
  });
  it('enforces inventory slots', () => {
    const d = driver(newState()).patch((s) => {
      s.coins = 10_000_000;
      s.inventory = Array.from({ length: LIMITS.inventorySlots }, (_, i) => ({ itemId: i % 2 ? 'bread' : 'water_pack', qty: 1 })).map((x, i) => ({ ...x, itemId: ['bread', 'water_pack', 'suya', 'akara_pap', 'fruit_basket', 'jollof_plate'][i % 6] }));
    });
    // dedupe to valid unique slots then fill with distinct non-stackables
    d.patch((s) => {
      s.inventory = ['bread', 'water_pack', 'suya', 'akara_pap', 'fruit_basket', 'jollof_plate', 'foodstuff_bag', 'gift_hamper', 'bible', 'study_notes', 'coding_book', 'devotional', 'ankara_outfit', 'corporate_outfit', 'scrubs', 'phone', 'laptop', 'sewing_machine', 'farm_tools', 'guitar', 'mattress', 'standing_fan', 'generator', 'bicycle'].map((itemId) => ({ itemId, qty: 1 }));
    });
    expect(d.state.inventory.length).toBe(LIMITS.inventorySlots);
    d.act('buy', { shopId: 'oja_food', itemId: 'bread' }); // stacking is fine
    d.at('udoka');
    expectFail(() => d.act('buy', { shopId: 'motors', itemId: 'car' }), 'inventory_full');
  });
  it('sells at half price and never sells keepsakes', () => {
    const d = driver(newState()).patch((s) => {
      s.inventory.push({ itemId: 'ankara_outfit', qty: 1 }, { itemId: 'purple_swatch', qty: 1 });
    });
    const c = d.state.coins;
    d.act('sell', { shopId: 'oja_goods', itemId: 'ankara_outfit' });
    expect(d.state.coins).toBe(c + 3000);
    expectFail(() => d.act('sell', { shopId: 'oja_goods', itemId: 'purple_swatch' }));
  });
  it('monthly costs fall into arrears instead of negative coins', () => {
    const d = driver(newState()).patch((s) => (s.coins = 1000)).at('home');
    d.act('wait', { hours: 12 });
    d.patch((s) => (s.time.minutes = MONTH - 30));
    d.act('wait', { hours: 1 });
    expect(d.state.coins).toBe(0);
    expect(d.state.stats.arrears).toBeGreaterThan(0);
  });
});

describe('work and education', () => {
  it('applies for a job only when qualified, works shifts during opening hours', () => {
    const d = driver(newState({ startAge: 'school_leaver' }));
    expectFail(() => d.act('apply_job', { jobId: 'office_assistant' }), 'not_eligible');
    d.act('apply_job', { jobId: 'shop_assistant' });
    expect(d.state.career.jobId).toBe('shop_assistant');
    d.at('shop').setTime(22);
    expectFail(() => d.act('work_shift'), 'closed');
    d.setTime(9);
    const coins = d.state.coins;
    d.act('work_shift');
    expect(d.state.coins).toBeGreaterThan(coins);
    expect(d.state.counters.shifts).toBe(1);
    expect(d.state.achievements.badges).toContain('first_paycheck');
  });
  it('enrols, studies and completes a course', () => {
    const d = driver(newState({ startAge: 'school_leaver' })).at('university_hall').patch((s) => (s.coins = 50000));
    d.act('enroll', { courseId: 'waec' });
    expect(d.state.education.enrolled.courseId).toBe('waec');
    for (let i = 0; i < 30 && d.state.education.enrolled; i++) {
      d.patch((s) => (s.stats.energy = 100));
      d.act('study');
    }
    expect(d.state.education.completed).toContain('waec');
    expect(d.state.achievements.badges).toContain('graduate');
  });
});

describe('prayer is not transactional', () => {
  it('never adds coins and gives at most one calm bonus a day', () => {
    const d = driver(newState()).at('home');
    const coins = d.state.coins;
    d.patch((s) => (s.stats.wellbeing = 50));
    d.act('pray', { prayerType: 'thanksgiving', place: 'home', journal: 'Thank you for today.' });
    d.act('pray', { prayerType: 'quiet', place: 'home' });
    expect(d.state.coins).toBe(coins);
    expect(d.state.stats.wellbeing).toBe(53);
    expect(d.last.journal).toBeNull();
    expect(d.state.counters.prayers).toBe(2);
  });
  it('returns the journal entry for storage, and requires a real prayer place', () => {
    const d = driver(newState()).at('home');
    const r = d.act('pray', { prayerType: 'personal', place: 'home', journal: '  Help me be honest at work.  ' });
    expect(r.journal.text).toBe('Help me be honest at work.');
    d.at('office');
    expectFail(() => d.act('pray', { prayerType: 'personal', place: 'home' }), 'wrong_location');
  });
});

function talkTo(d, npcId, choices) {
  d.act('talk_start', { npcId });
  for (const c of choices) d.act('talk_choose', { choiceId: c });
}

describe('evangelism storylines', () => {
  function chidiSetup(seed) {
    const d = driver(newState({}, seed)).at('udoka').setTime(17);
    return d;
  }
  const passDays = (d, n) => d.patch((s) => { s.time.minutes += n * DAY; }).setTime(17);

  it('respectful, caring path can reach a fictional conversion outcome — never in one conversation', () => {
    const d = chidiSetup('chidi-yes');
    talkTo(d, 'chidi', ['listen', 'enc', 'ok']);
    expect(d.state.storylines.chidi).toBeUndefined();
    talkTo(d, 'chidi', ['ask', 'sorry', 'ok']);
    for (let i = 0; i < 2; i++) talkTo(d, 'chidi', ['study', 'ok']);
    passDays(d, 1);
    talkTo(d, 'chidi', ['listen', 'ok']);
    passDays(d, 1);
    d.patch((s) => s.inventory.push({ itemId: 'bible', qty: 1 }));
    talkTo(d, 'chidi', ['explain', 'gift', 'ok']);
    expect(d.state.relationships.chidi.stage).toBe(4);
    passDays(d, 2);
    talkTo(d, 'chidi', ['yes', 'pray', 'next']);
    expect(d.state.storylines.chidi.outcome).toBe('conversion');
    expect(d.state.achievements.crowns).toContain('crown_of_rejoicing');
    expect(d.state.missions.completed).not.toContain('chidis_questions'); // not accepted in free mode
  });

  it('a pushy approach damages trust and the storyline ends in friendship, not conversion', () => {
    const d = chidiSetup('chidi-no');
    talkTo(d, 'chidi', ['pushy', 'sorry']);
    talkTo(d, 'chidi', ['chat']); // smalltalk
    d.patch((s) => (s.relationships.chidi.trust = 10));
    talkTo(d, 'chidi', ['explain', 'ok']);
    passDays(d, 1);
    talkTo(d, 'chidi', ['glib', 'ok']);
    passDays(d, 1);
    talkTo(d, 'chidi', ['explain', 'phone', 'ok']);
    passDays(d, 2);
    talkTo(d, 'chidi', ['yes', 'friends', 'ok']);
    expect(d.state.storylines.chidi.outcome).toBe('friendship');
    expect(d.state.counters.conversions).toBeUndefined();
  });

  it('respecting a request for space is rewarded; ignoring it is not', () => {
    const d = chidiSetup('pause');
    talkTo(d, 'chidi', ['listen', 'enc', 'ok']);
    d.patch((s) => (s.relationships.chidi.trust = 10));
    talkTo(d, 'chidi', ['pushy', 'resp']);
    expect(d.state.flags.chidi_pause).toBeTruthy();
    const t = d.state.relationships.chidi.trust;
    talkTo(d, 'chidi', ['yes']);
    expect(d.state.relationships.chidi.trust).toBeGreaterThan(t);
    expect(d.state.counters.respectfulWitness).toBeGreaterThan(0);
  });

  it('locked choices cannot be chosen (e.g. gifting a Bible you do not have)', () => {
    const d = chidiSetup('lock');
    d.patch((s) => { s.relationships.chidi = { trust: 30, stage: 3, met: true, notes: [] }; s.flags.chidi_s3 = 0; });
    passDays(d, 2);
    d.act('talk_start', { npcId: 'chidi' });
    d.act('talk_choose', { choiceId: 'explain' });
    expectFail(() => d.act('talk_choose', { choiceId: 'gift' }), 'choice_locked');
  });

  it('Emeka: budget, accountability, grace, fellowship → discipleship crown', () => {
    const d = driver(newState({}, 'emeka')).at('udoka').setTime(9);
    const next = (n) => d.patch((s) => { s.time.minutes += n * DAY; }).setTime(9);
    talkTo(d, 'emeka', ['listen', 'pray', 'ok']);
    talkTo(d, 'emeka', ['budget', 'ok']);
    next(1);
    talkTo(d, 'emeka', ['acc', 'ok']);
    next(3);
    talkTo(d, 'emeka', ['gospel', 'pray', 'fellow']);
    expect(d.state.storylines.emeka.outcome).toBe('conversion');
    talkTo(d, 'emeka', ['serve', 'ok']);
    expect(d.state.storylines.emeka.discipled).toBe(true);
    expect(d.state.achievements.crowns).toContain('disciple_maker');
  });

  it('Aisha: a respectful friendship storyline with no conversion target', () => {
    const d = driver(newState({}, 'aisha')).at('office').setTime(9);
    d.patch((s) => { s.career.jobId = 'office_assistant'; });
    const next = (n) => d.patch((s) => { s.time.minutes += n * DAY; }).setTime(9);
    talkTo(d, 'aisha', ['thanks', 'bye']);
    talkTo(d, 'aisha', ['yes', 'listen', 'bye']);
    next(1);
    talkTo(d, 'aisha', ['cover', 'bye']);
    next(2);
    talkTo(d, 'aisha', ['explain', 'friend', 'bye']);
    expect(d.state.storylines.aisha.outcome).toBe('friendship');
    expect(d.state.counters.conversions).toBeUndefined();
    expect(d.state.counters.respectfulWitness).toBeGreaterThanOrEqual(1);
  });

  it('cannot talk to someone who is not there', () => {
    const d = driver(newState()).at('udoka').setTime(10);
    expectFail(() => d.act('talk_start', { npcId: 'chidi' }), 'not_here');
  });

  it('blocks other actions during a conversation', () => {
    const d = driver(newState()).at('udoka').setTime(10);
    d.act('talk_start', { npcId: 'nneka' });
    expectFail(() => d.act('buy', { shopId: 'oja_food', itemId: 'bread' }), 'in_dialogue');
  });
});

describe('missions', () => {
  it('Mission Mode completes First Steps and offers the next mission', () => {
    const d = driver(newState({ mode: 'mission' }));
    d.act('buy', { shopId: 'oja_food', itemId: 'akara_pap' });
    d.act('use_item', { itemId: 'akara_pap' });
    d.at('home').act('sleep');
    expect(d.state.missions.completed).toContain('first_steps');
    expect(d.state.missions.active).toContain('quiet_place');
    expect(d.state.stats.xp).toBeGreaterThanOrEqual(60);
    expect(missionView(d.state, 'first_steps').status).toBe('completed');
  });
  it('rewards are never granted twice', () => {
    const d = driver(newState({ mode: 'mission' }));
    d.act('buy', { shopId: 'oja_food', itemId: 'akara_pap', qty: 2 });
    d.act('use_item', { itemId: 'akara_pap' });
    d.at('home').act('sleep');
    const xp = d.state.counters.missionsCompleted;
    d.act('use_item', { itemId: 'akara_pap' });
    d.act('sleep');
    expect(d.state.counters.missionsCompleted).toBe(xp);
    expect(d.state.missions.completed.filter((x) => x === 'first_steps').length).toBe(1);
  });
  it('Free Life missions start from a board', () => {
    const d = driver(newState());
    d.act('accept_mission', { missionId: 'faithful_steward' });
    expect(d.state.missions.active).toContain('faithful_steward');
    expectFail(() => d.act('accept_mission', { missionId: 'honest_scales' })); // NPC-given, not on the board
  });
});

describe('decisions and delayed consequences', () => {
  it('the uncle_fees scenario triggers, resolves, and its consequence arrives later', () => {
    const d = driver(newState()).patch((s) => { s.coins = 50000; s.time.minutes += 13 * DAY; });
    d.at('home').act('wait', { hours: 1 });
    expect(d.state.scenarios.pending).toContain('uncle_fees');
    d.act('resolve_scenario', { scenarioId: 'uncle_fees', choiceId: 'give_all' });
    expect(d.state.coins).toBe(30000);
    expect(d.state.ledger.donated).toBe(20000);
    expect(d.state.scheduled.some((x) => x.eventId === 'obinna_thanks')).toBe(true);
    d.patch((s) => (s.time.minutes += 21 * DAY));
    d.act('wait', { hours: 1 });
    expect(d.state.lifeLog.some((l) => l.title === 'A letter from Obinna')).toBe(true);
  });
  it('choices with requirements are enforced', () => {
    const d = driver(newState()).patch((s) => { s.coins = 0; s.time.minutes += 13 * DAY; });
    d.at('home').act('wait', { hours: 1 });
    expectFail(() => d.act('resolve_scenario', { scenarioId: 'uncle_fees', choiceId: 'give_all' }), 'choice_locked');
    d.act('resolve_scenario', { scenarioId: 'uncle_fees', choiceId: 'decline' });
    expectFail(() => d.act('resolve_scenario', { scenarioId: 'uncle_fees', choiceId: 'decline' }));
  });
});

describe('historical scenarios', () => {
  it('freezes the original timeline and returns the player where they left', () => {
    const d = driver(newState()).patch((s) => (s.stats.xp = 200)).at('udoka');
    const t = d.state.time.minutes;
    const loc = { ...d.state.location };
    d.act('enter_history', { eraId: 'philippi' });
    expect(d.state.location.mapId).toBe('philippi');
    d.act('wait', { hours: 5 });
    d.act('read_scripture', { ref: 'Acts 16:13-15' });
    expect(d.state.flags.ph_read_acts16).toBeTruthy();
    expect(d.state.time.minutes).toBe(t);
    d.act('exit_history');
    expect(d.state.location).toEqual(loc);
    expect(d.state.time.minutes).toBe(t);
  });
  it('locked eras cannot be entered', () => {
    const d = driver(newState());
    expectFail(() => d.act('enter_history', { eraId: 'philippi' }), 'locked');
    expectFail(() => d.act('enter_history', { eraId: 'reformation' }));
  });
});

describe('the unexpected trumpet', () => {
  const s0 = newState();
  it('schedules within bounds, never before the minimum, deterministic per secret', () => {
    const a = scheduleEnding({ secret: 'x', endingMode: 'surprise', startMinutes: s0.time.startMinutes, birthMinutes: s0.profile.birthMinutes });
    const b = scheduleEnding({ secret: 'x', endingMode: 'surprise', startMinutes: s0.time.startMinutes, birthMinutes: s0.profile.birthMinutes });
    expect(a).toBe(b);
    const samples = Array.from({ length: 400 }, (_, i) => scheduleEnding({ secret: `s${i}`, endingMode: 'surprise', startMinutes: s0.time.startMinutes, birthMinutes: s0.profile.birthMinutes }));
    const years = samples.map((m) => (m - s0.time.startMinutes) / YEAR);
    expect(Math.min(...samples)).toBeGreaterThanOrEqual(s0.time.startMinutes + MIN_DAYS_BEFORE_ENDING * DAY);
    expect(Math.max(...samples)).toBeLessThanOrEqual(s0.profile.birthMinutes + 92 * YEAR);
    const early = years.filter((y) => y < 1).length / years.length;
    const mid = years.filter((y) => y >= 1 && y < 8).length / years.length;
    expect(early).toBeGreaterThan(0.15);
    expect(early).toBeLessThan(0.35);
    expect(mid).toBeGreaterThan(0.35);
    expect(scheduleEnding({ secret: 'x', endingMode: 'off', startMinutes: 0, birthMinutes: 0 })).toBeNull();
    const brief = Array.from({ length: 100 }, (_, i) => scheduleEnding({ secret: `b${i}`, endingMode: 'brief', startMinutes: 0, birthMinutes: -20 * YEAR }));
    expect(Math.max(...brief)).toBeLessThanOrEqual(181 * DAY);
  });
  it('ends exactly at the scheduled moment, mid-action, and locks the character', () => {
    const d = driver(newState()).at('home');
    const endAt = d.state.time.minutes + 30 * DAY;
    d.patch((s) => (s.coins = 1_000_000));
    const r = d.act('live_month', {}, { endAtMinutes: endAt });
    expect(r.ended).toBe(true);
    expect(d.state.time.minutes).toBe(endAt);
    expect(d.state.ending.status).toBe('triggered');
    expect(r.messages.some((m) => /countdown/i.test(m.text))).toBe(false);
    expectFail(() => d.act('wait', { hours: 1 }), 'ended');
  });
  it('does not fire during a historical scenario or when disabled', () => {
    const d = driver(newState()).patch((s) => (s.stats.xp = 200));
    d.act('enter_history', { eraId: 'philippi' });
    d.act('wait', { hours: 2 }, { endAtMinutes: 0 });
    expect(d.state.ending.status).toBe('none');
    const off = newState({ endingMode: 'off' });
    expect(shouldEnd(off, 0)).toBe(false);
  });
  it('builds a life report labelled as simulation, with no salvation verdict', () => {
    const d = driver(newState()).at('home');
    d.act('pray', { prayerType: 'personal', place: 'home' });
    d.act('wait', { hours: 1 }, { forceEnding: true });
    const rep = buildLifeReport(d.state);
    expect(rep.disclaimer).toMatch(/simulated/);
    expect(rep.faith.prayers).toBe(1);
    expect(JSON.stringify(rep)).not.toMatch(/saved|condemned|heaven|hell/i);
  });
});

describe('levels', () => {
  it('level curve', () => {
    expect(levelOf(0)).toBe(1);
    expect(levelOf(100)).toBe(2);
    expect(levelOf(400)).toBe(3);
  });
});
