// Non-player characters. All are original fictional people.
// schedule: [{ from, to, mapId, x, y, wander, days? }] — hours on a 24h clock; days 0=Mon..6=Sun.
// conversations: ordered list, first whose `when` matches is used.
import { DAY, HOUR } from './constants.js';

export const NPCS = [
  {
    id: 'chidi',
    name: 'Chidi Okafor',
    occupation: 'Computer science student',
    personality: 'Sharp, sceptical, funny when relaxed. Worried about the future.',
    circumstances: 'Final-year exams, a tight budget and big questions.',
    look: { gender: 'male', skin: 'mahogany', hair: 'lowcut', hairColor: 'black', outfit: 'casual_red' },
    schedule: [
      { from: 8, to: 16, mapId: 'university_hall', x: 6, y: 6, wander: 1 },
      { from: 16, to: 20, mapId: 'udoka', x: 44, y: 14, wander: 3 },
    ],
    storyline: 'chidi',
    conversations: [
      { tree: 'chidi_paused', when: { flagActive: { flag: 'chidi_pause', days: 2 } } },
      { tree: 'chidi_disciple', when: { stage: { npc: 'chidi', eq: 6 } } },
      { tree: 'chidi_after', when: { stage: { npc: 'chidi', gte: 7 } } },
      { tree: 'chidi_decision', when: { all: [{ stage: { npc: 'chidi', eq: 4 } }, { daysSinceFlag: { flag: 'chidi_got_bible', gte: 2 } }] } },
      { tree: 'chidi_reading', when: { stage: { npc: 'chidi', eq: 4 } } },
      { tree: 'chidi_who_is_jesus', when: { all: [{ stage: { npc: 'chidi', eq: 3 } }, { daysSinceFlag: { flag: 'chidi_s3', gte: 1 } }] } },
      { tree: 'chidi_suffering', when: { all: [{ stage: { npc: 'chidi', eq: 2 } }, { daysSinceFlag: { flag: 'chidi_s2', gte: 1 } }] } },
      { tree: 'chidi_beliefs', when: { all: [{ stage: { npc: 'chidi', eq: 1 } }, { trust: { npc: 'chidi', gte: 8 } }] } },
      { tree: 'chidi_smalltalk', when: { stage: { npc: 'chidi', gte: 1 } } },
      { tree: 'chidi_intro' },
    ],
  },
  {
    id: 'emeka',
    name: 'Emeka Nwosu',
    occupation: 'Keke driver',
    personality: 'Warm, proud, quick to laugh, quicker to worry.',
    circumstances: 'Owes money after a run of sports-betting losses.',
    look: { gender: 'male', skin: 'umber', hair: 'afro', hairColor: 'black', outfit: 'ankara_green' },
    schedule: [{ from: 6, to: 21, mapId: 'udoka', x: 58, y: 42, wander: 2 }],
    storyline: 'emeka',
    conversations: [
      { tree: 'emeka_fellowship', when: { stage: { npc: 'emeka', eq: 5 } } },
      { tree: 'emeka_after', when: { stage: { npc: 'emeka', gte: 6 } } },
      { tree: 'emeka_why', when: { all: [{ stage: { npc: 'emeka', eq: 3 } }, { daysSinceFlag: { flag: 'emeka_s3', gte: 3 } }] } },
      { tree: 'emeka_checkin', when: { stage: { npc: 'emeka', eq: 3 } } },
      { tree: 'emeka_accountability', when: { all: [{ stage: { npc: 'emeka', eq: 2 } }, { daysSinceFlag: { flag: 'emeka_s2', gte: 1 } }] } },
      { tree: 'emeka_help', when: { stage: { npc: 'emeka', eq: 1 } } },
      { tree: 'emeka_smalltalk', when: { stage: { npc: 'emeka', gte: 2 } } },
      { tree: 'emeka_intro' },
    ],
  },
  {
    id: 'aisha',
    name: 'Aisha Bello',
    occupation: 'Senior dispatcher, Brightwell',
    personality: 'Organised, generous with her time, quietly devout Muslim.',
    circumstances: 'Her father has been unwell.',
    look: { gender: 'female', skin: 'caramel', hair: 'gele', hairColor: 'black', outfit: 'office_navy' },
    schedule: [
      { from: 8, to: 17, mapId: 'office', x: 5, y: 5, wander: 2 },
      { from: 17, to: 19, mapId: 'udoka', x: 42, y: 31, wander: 2 },
    ],
    storyline: 'aisha',
    conversations: [
      { tree: 'aisha_after', when: { stage: { npc: 'aisha', gte: 4 } } },
      { tree: 'aisha_question', when: { all: [{ stage: { npc: 'aisha', eq: 3 } }, { daysSinceFlag: { flag: 'aisha_s3', gte: 2 } }] } },
      { tree: 'aisha_father', when: { all: [{ stage: { npc: 'aisha', eq: 2 } }, { daysSinceFlag: { flag: 'aisha_s2', gte: 1 } }] } },
      { tree: 'aisha_lunch', when: { stage: { npc: 'aisha', eq: 1 } } },
      { tree: 'aisha_smalltalk', when: { stage: { npc: 'aisha', gte: 2 } } },
      { tree: 'aisha_intro' },
    ],
  },
  {
    id: 'nneka',
    name: 'Nneka Eze',
    occupation: 'Hairdresser, single mother of two',
    personality: 'Resilient, proud, tired.',
    circumstances: 'Business is slow and school fees are due.',
    look: { gender: 'female', skin: 'chestnut', hair: 'braids', hairColor: 'black', outfit: 'wrapper_purple' },
    schedule: [{ from: 6, to: 21, mapId: 'udoka', x: 13, y: 9, wander: 2 }],
    storyline: 'nneka',
    conversations: [
      { tree: 'nneka_thanks', when: { all: [{ flag: 'nneka_helped' }, { notFlag: 'nneka_thanked' }] } },
      { tree: 'nneka_need', when: { stage: { npc: 'nneka', gte: 1 } } },
      { tree: 'nneka_intro' },
    ],
  },
  {
    id: 'pastor_tunde',
    name: 'Pastor Tunde Adeyemi',
    occupation: 'Pastor, Grace Chapel',
    personality: 'Patient, practical, honest about what he does not know.',
    circumstances: 'Leads a busy neighbourhood church with a food bank.',
    look: { gender: 'male', skin: 'umber', hair: 'lowcut', hairColor: 'grey', outfit: 'kaftan_white' },
    schedule: [{ from: 8, to: 19, mapId: 'church', x: 8, y: 3, wander: 2 }],
    conversations: [{ tree: 'pastor_main' }],
  },
  {
    id: 'brother_sam',
    name: 'Brother Sam Ibe',
    occupation: 'Youth leader & Bible study host',
    personality: 'Energetic, a good listener, terrible at football.',
    circumstances: 'Runs the evening Bible study circle.',
    look: { gender: 'male', skin: 'chestnut', hair: 'twists', hairColor: 'black', outfit: 'ankara_blue' },
    schedule: [{ from: 15, to: 22, mapId: 'church', x: 12, y: 9, wander: 1 }],
    conversations: [{ tree: 'sam_main' }],
  },
  {
    id: 'mama_ngozi',
    name: 'Mama Ngozi',
    occupation: 'Shop owner',
    personality: 'Shrewd, motherly, has seen everything at Oja Market.',
    circumstances: 'Runs the provisions shop and mentors young traders.',
    look: { gender: 'female', skin: 'umber', hair: 'gele', hairColor: 'black', outfit: 'ankara_green' },
    schedule: [{ from: 7, to: 20, mapId: 'shop', x: 6, y: 2, wander: 1 }],
    conversations: [{ tree: 'ngozi_main' }],
  },
  {
    id: 'folake',
    name: 'Mrs Folake Adebayo',
    occupation: 'Operations manager, Brightwell',
    personality: 'Driven, under pressure from head office.',
    circumstances: 'Quarter-end targets are slipping.',
    look: { gender: 'female', skin: 'caramel', hair: 'bun', hairColor: 'black', outfit: 'office_navy' },
    schedule: [{ from: 8, to: 17, mapId: 'office', x: 13, y: 7, wander: 1 }],
    conversations: [{ tree: 'folake_main' }],
  },
  {
    id: 'ibrahim',
    name: 'Mallam Ibrahim',
    occupation: 'Estate security',
    personality: 'Calm, observant, knows everybody on Amaka Close.',
    circumstances: 'Has guarded the close for eleven years.',
    look: { gender: 'male', skin: 'mahogany', hair: 'gele', hairColor: 'black', outfit: 'kaftan_white' },
    schedule: [{ from: 0, to: 24, mapId: 'udoka', x: 5, y: 15, wander: 1 }],
    conversations: [{ tree: 'ibrahim_main' }],
  },
  {
    id: 'dr_amina',
    name: 'Dr Amina Yusuf',
    occupation: 'Doctor, Udoka Clinic',
    personality: 'Brisk, kind, allergic to excuses.',
    circumstances: 'Too many patients, too few nurses.',
    look: { gender: 'female', skin: 'honey', hair: 'bun', hairColor: 'black', outfit: 'kaftan_white' },
    schedule: [{ from: 8, to: 18, mapId: 'clinic', x: 6, y: 4, wander: 1 }],
    conversations: [{ tree: 'amina_main' }],
  },
  {
    id: 'tobi',
    name: 'Tobi Vibes',
    occupation: 'Afrobeats singer (fictional)',
    personality: 'Charismatic on stage, guarded off it.',
    circumstances: 'A hometown show at the Community Centre.',
    look: { gender: 'male', skin: 'chestnut', hair: 'twists', hairColor: 'auburn', outfit: 'casual_red' },
    schedule: [{ from: 17, to: 23, mapId: 'community_centre', x: 8, y: 4, wander: 1, days: [4, 5] }],
    conversations: [
      { tree: 'tobi_after', when: { flag: 'tobi_talked' } },
      { tree: 'tobi_main' },
    ],
  },
  {
    id: 'uncle_obi',
    name: 'Uncle Obi',
    occupation: 'Retired teacher, Nkwo',
    personality: 'Proud of the family, full of opinions and proverbs.',
    circumstances: 'Leads the village borehole committee.',
    look: { gender: 'male', skin: 'umber', hair: 'lowcut', hairColor: 'grey', outfit: 'kaftan_white' },
    schedule: [{ from: 6, to: 21, mapId: 'nkwo', x: 21, y: 15, wander: 2 }],
    conversations: [{ tree: 'obi_main' }],
  },
  {
    id: 'nne_adaeze',
    name: 'Nne Adaeze',
    occupation: 'Farmer and grandmother',
    personality: 'Slow to speak, quick to pray, sharp as a farm knife.',
    circumstances: 'Has farmed the same land for fifty years.',
    look: { gender: 'female', skin: 'umber', hair: 'gele', hairColor: 'grey', outfit: 'wrapper_purple' },
    schedule: [{ from: 6, to: 20, mapId: 'nkwo', x: 6, y: 8, wander: 2 }],
    conversations: [{ tree: 'adaeze_main' }],
  },
  {
    id: 'aulus',
    name: 'Aulus',
    occupation: 'Gatekeeper, retired legionary (fictional)',
    personality: 'Gruff, proud of the colony.',
    circumstances: 'Watches the west gate.',
    look: { gender: 'male', skin: 'sand', hair: 'lowcut', hairColor: 'grey', outfit: 'kaftan_white' },
    schedule: [{ from: 0, to: 24, mapId: 'philippi', x: 28, y: 13, wander: 1 }],
    historical: true,
    conversations: [{ tree: 'aulus_main' }],
  },
  {
    id: 'berenike',
    name: 'Berenike',
    occupation: 'Dye-worker (fictional)',
    personality: 'Busy, curious about strangers.',
    circumstances: 'Carries cloth from the dyers to the market.',
    look: { gender: 'female', skin: 'honey', hair: 'bun', hairColor: 'brown', outfit: 'wrapper_purple' },
    schedule: [{ from: 0, to: 24, mapId: 'philippi', x: 6, y: 8, wander: 2 }],
    historical: true,
    conversations: [
      { tree: 'berenike_done', when: { flag: 'ph_cloth_delivered' } },
      { tree: 'berenike_main' },
    ],
  },
  // Ambient neighbours — short lines only, but present on the streets.
  ...[
    ['walker_1', 'Mrs Bassey', 'female', 'honey', 'braids', 'ankara_blue', 'udoka', 14, 20, 10],
    ['walker_2', 'Kemi', 'female', 'chestnut', 'bun', 'casual_red', 'udoka', 40, 20, 12],
    ['walker_3', 'Ade', 'male', 'umber', 'lowcut', 'ankara_green', 'udoka', 30, 28, 8],
    ['walker_4', 'Hauwa', 'female', 'caramel', 'gele', 'office_navy', 'udoka', 14, 27, 6],
    ['walker_5', 'Uche', 'male', 'mahogany', 'afro', 'casual_red', 'udoka', 44, 38, 5],
    ['walker_6', 'Ifeoma', 'female', 'umber', 'twists', 'wrapper_purple', 'nkwo', 20, 14, 6],
    ['walker_7', 'Gaius (fictional)', 'male', 'sand', 'lowcut', 'kaftan_white', 'philippi', 14, 15, 6],
  ].map(([id, name, gender, skin, hair, outfit, mapId, x, y, wander], i) => ({
    id,
    name,
    occupation: 'Neighbour',
    ambient: true,
    look: { gender, skin, hair, hairColor: 'black', outfit },
    schedule: [{ from: 6, to: 22, mapId, x, y, wander }],
    conversations: [{ tree: 'ambient' }],
    lineSeed: i,
  })),
];

export const NPC_BY_ID = Object.fromEntries(NPCS.map((n) => [n.id, n]));

export function hourOf(minutes) {
  return Math.floor((((minutes % DAY) + DAY) % DAY) / HOUR);
}
export function dayIndex(minutes) {
  return Math.floor(minutes / DAY);
}

/** Where is this NPC at the given game time? Returns the schedule entry or null. */
export function npcPresence(npcOrId, minutes) {
  const npc = typeof npcOrId === 'string' ? NPC_BY_ID[npcOrId] : npcOrId;
  if (!npc) return null;
  const h = hourOf(minutes);
  const dow = dayIndex(minutes) % 7;
  for (const s of npc.schedule) {
    if (s.days && !s.days.includes(dow)) continue;
    if (h >= s.from && h < s.to) return s;
  }
  return null;
}

/** NPCs present in a map at a given time. */
export function npcsInMap(mapId, minutes) {
  return NPCS.filter((n) => npcPresence(n, minutes)?.mapId === mapId);
}

export const AMBIENT_LINES = {
  udoka: [
    'Light came back this morning — I ironed everything in the house before it went again!',
    'This traffic on the main road ehn. I walked faster than the danfo.',
    'Have you tried the akara at the first stall? Hot and fresh.',
    'My daughter just started at the Learning Centre. Proud mother!',
    'Prices have gone up again. We are managing.',
    'Brightwell is hiring, I heard. Check their board.',
    'Football on the square on Saturday. Come and watch us lose.',
  ],
  nkwo: [
    'The rains were kind this year. Yams are fat.',
    'You are from Udoka? Welcome, welcome. Greet your people.',
    'When the borehole is finished, my children will not walk two kilometres for water.',
  ],
  philippi: [
    'Make way — cart coming through to the forum.',
    'You speak strangely, traveller. Where are you from?',
    'The market is busy today. Mind your purse.',
  ],
};
