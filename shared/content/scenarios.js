// Moral-decision scenarios. Each is triggered by a condition (checked after actions) or by an effect.
// No option is simply "the correct answer"; consequences can be costly either way.
// scripture: [{ ref, why }] — why the passage is relevant, shown as explanatory commentary.

export const SCENARIOS = [
  {
    id: 'falsify_report',
    title: 'The quarter-end report',
    category: 'integrity',
    npcs: ['folake'],
    trigger: { all: [{ jobAt: ['office_assistant', 'operations_officer', 'delivery_rider', 'junior_developer'] }, { counter: { name: 'shiftsAtBrightwell', gte: 3 } }] },
    context:
      'Mrs Folake calls you in. Deliveries are 18% below target. "Change the missed deliveries to ‘customer unavailable’," she says. "Head office will never check, and if they do the numbers will be fine by then. There is a bonus in it for you — and frankly, your job depends on this team hitting target."',
    scripture: [
      { ref: 'Proverbs 11:1', why: 'Scripture treats dishonest measures as offensive to God — a report is a kind of measure.' },
      { ref: 'Luke 16:10', why: 'Jesus connects faithfulness in small things with faithfulness in large ones.' },
    ],
    choices: [
      {
        id: 'refuse',
        text: 'Refuse respectfully and offer to write an accurate report that explains the shortfall and a plan to fix it.',
        effects: [{ trust: -6, npc: 'folake' }, { wellbeing: -3 }, { setFlag: 'refused_falsify' }, { counter: 'integrityChoices' }, { schedule: { eventId: 'audit_vindicates', inDays: 10 } }],
        outcome: 'Folake is cold with you for the rest of the week. You write the honest report and a recovery plan. You do not get the bonus.',
      },
      {
        id: 'comply',
        text: 'Change the numbers. Everyone does it, and you need this job.',
        effects: [{ coins: 5000, reason: 'Quarter-end bonus' }, { trust: 5, npc: 'folake' }, { wellbeing: -6 }, { setFlag: 'falsified_report' }, { schedule: { eventId: 'audit_finds', inDays: 12 } }],
        outcome: 'The report goes to head office. Your bonus arrives on Friday. Something about it sits heavy.',
      },
      {
        id: 'context',
        text: 'Suggest submitting the real numbers with a strong context note: fuel scarcity and a broken van. Requires good communication.',
        requires: { skill: { name: 'communication', gte: 15 } },
        effects: [{ trust: 2, npc: 'folake' }, { skill: 'communication', amount: 2 }, { setFlag: 'refused_falsify' }, { counter: 'integrityChoices' }, { schedule: { eventId: 'audit_vindicates', inDays: 10 } }],
        outcome: 'Folake hesitates, then agrees. "If this blows up, it is your name on the note." It is a risk — but an honest one.',
      },
    ],
  },
  {
    id: 'honest_scale',
    title: 'The heavy scale',
    category: 'integrity',
    npcs: ['mama_ngozi'],
    trigger: { all: [{ mission: { id: 'honest_scales', status: 'active' } }, { counter: { name: 'shiftsAtShop', gte: 1 } }] },
    context:
      'Mama Ngozi is at the wholesaler. You notice the shop scale has been reading 200g heavy — customers buying rice have been getting less than they paid for. Twenty pre-packed bags are on the shelf. A customer is waiting.',
    scripture: [{ ref: 'Proverbs 11:1', why: 'Honest weights matter to God — and to the woman buying rice for her family.' }],
    choices: [
      {
        id: 'fix_tell',
        text: 'Recalibrate the scale, repack the bags at the correct weight (unpaid overtime), and tell Mama Ngozi when she returns.',
        effects: [{ time: 120 }, { energy: -15 }, { trust: 10, npc: 'mama_ngozi' }, { setFlag: 'scale_fixed' }, { counter: 'integrityChoices' }, { skill: 'trade', amount: 2 }],
        outcome: 'Two hours of repacking. When Mama Ngozi returns she is quiet for a long moment, then says: "That scale was my late husband’s. I should have checked it. Thank you."',
      },
      {
        id: 'ignore',
        text: 'Leave it. It is not your shop, and it is only 200g.',
        effects: [{ trust: -4, npc: 'mama_ngozi' }, { setFlag: 'scale_ignored' }, { schedule: { eventId: 'scale_complaint', inDays: 4 } }],
        outcome: 'You serve the customer. The day goes on.',
      },
      {
        id: 'refund',
        text: 'Fix the scale and give today’s customers the difference from your own pay.',
        requires: { coins: { gte: 2000 } },
        effects: [{ coins: -2000, reason: 'Refunded customers for short weight' }, { trust: 12, npc: 'mama_ngozi' }, { setFlag: 'scale_fixed' }, { counter: 'integrityChoices' }, { counter: 'serviceActs' }],
        outcome: 'It costs you, but three customers leave smiling. Mama Ngozi hears about it from a neighbour before you can tell her.',
      },
    ],
  },
  {
    id: 'uncle_fees',
    title: 'A call from Uncle Obi',
    category: 'family',
    npcs: ['uncle_obi'],
    trigger: { daysPlayed: { gte: 12 } },
    context:
      'Your phone rings. Uncle Obi: "Nwa m, your cousin Obinna has passed his entrance exam! But the fees are 30,000 and we are 20,000 short. The family is looking to you — you are the one in the city now."',
    scripture: [
      { ref: '1 Timothy 5:8', why: 'Scripture takes providing for one’s own household seriously.' },
      { ref: 'Galatians 6:10', why: 'Doing good to all people, especially within the household of faith.' },
      { ref: 'Luke 14:28', why: 'Counting the cost before committing — including with money you do not have.' },
    ],
    choices: [
      { id: 'give_all', text: 'Send the full 20,000.', requires: { coins: { gte: 20000 } }, effects: [{ coins: -20000, reason: 'School fees for cousin Obinna', donation: true }, { setFlag: 'paid_obinna' }, { counter: 'familyHelp' }, { event: 'donate', cause: 'family', amount: 20000 }, { wellbeing: 4 }, { schedule: { eventId: 'obinna_thanks', inDays: 20 } }], outcome: 'Uncle Obi shouts so loudly with joy that you hold the phone away from your ear.' },
      { id: 'give_part', text: 'Send 8,000 and help find a scholarship for the rest.', requires: { coins: { gte: 8000 } }, effects: [{ coins: -8000, reason: 'Part of cousin Obinna’s fees', donation: true }, { time: 120 }, { setFlag: 'part_obinna' }, { counter: 'familyHelp' }, { event: 'donate', cause: 'family', amount: 8000 }, { schedule: { eventId: 'bursary_found', inDays: 8 } }], outcome: 'You spend an evening on the phone and online looking for bursaries. Uncle Obi grumbles, but he is grateful.' },
      { id: 'decline', text: 'Explain honestly that you cannot afford it right now, and promise to visit.', effects: [{ wellbeing: -4 }, { setFlag: 'declined_obinna' }, { schedule: { eventId: 'family_tension', inDays: 5 } }], outcome: 'There is a long silence. "Okay. We will manage." You are not sure they will.' },
    ],
  },
  {
    id: 'betting_invite',
    title: 'Just one slip',
    category: 'peer_pressure',
    npcs: ['walker_5'],
    trigger: { all: [{ daysPlayed: { gte: 5 } }, { coins: { gte: 5000 } }] },
    context:
      'Uche from the square waves his phone at you. "Big match tonight! Odds are mad. Put five thousand on it — I have a feeling. Everybody is betting. Don’t be a dull person."',
    scripture: [{ ref: 'Proverbs 13:11', why: 'A proverb contrasting quick wealth with patient, honest gain.' }],
    choices: [
      { id: 'decline', text: 'Laugh it off and say you will watch the match with them instead.', effects: [{ wellbeing: 2 }, { setFlag: 'declined_betting' }, { counter: 'integrityChoices' }], outcome: 'You watch the match at the square. Your team loses. Your wallet does not.' },
      { id: 'bet', text: 'Put 5,000 on it. Just this once.', effects: [{ coins: -5000, reason: 'Sports bet' }, { setFlag: 'placed_bet' }, { randomOutcome: { chance: 0.3, win: [{ coins: 12000, reason: 'Betting win' }, { setFlag: 'won_bet' }], lose: [{ wellbeing: -4 }] } }], outcome: 'You place the bet and watch every minute with your heart in your mouth.' },
    ],
  },
  {
    id: 'classroom_mockery',
    title: 'Laughed at in class',
    category: 'hostility',
    npcs: [],
    trigger: { all: [{ enrolled: true }, { counter: { name: 'studyHours', gte: 12 } }] },
    context:
      'In a discussion class, someone learns you go to church and the room turns on you: "So you believe in fairy tales? Educated people have moved past that." People laugh. The lecturer waits to see what you will say.',
    scripture: [
      { ref: '1 Peter 3:15-16', why: 'Be ready to explain your hope — with gentleness and respect.' },
      { ref: 'Matthew 5:11-12', why: 'Jesus speaks of being insulted because of him.' },
    ],
    choices: [
      { id: 'gentle', text: 'Answer calmly: explain briefly why you believe, and invite anyone curious to talk after class.', effects: [{ skill: 'communication', amount: 2 }, { setFlag: 'stood_gently' }, { counter: 'steadfastChoices' }, { counter: 'respectfulWitness' }, { wellbeing: -2 }], outcome: 'A few people roll their eyes. After class, one quiet student comes over: "I go to church too. I was scared to say it."' },
      { id: 'later', text: 'Say "I am happy to talk about it another time" and keep the class on topic.', effects: [{ setFlag: 'deflected_mockery' }, { counter: 'steadfastChoices' }], outcome: 'The lecturer nods and moves on. You are not sure if that was courage or avoidance — but it was not denial.' },
      { id: 'mock', text: 'Mock them back about their own beliefs.', effects: [{ wellbeing: -3 }, { skill: 'communication', amount: -1 }, { setFlag: 'mocked_back' }], outcome: 'You get a laugh. You also get a reputation, and it is not the one you wanted.' },
    ],
  },
  {
    id: 'fellowship_threat',
    title: 'A note on the gate',
    category: 'persecution',
    npcs: ['ibrahim', 'pastor_tunde'],
    trigger: { all: [{ counter: { name: 'bibleStudies', gte: 2 } }, { daysPlayed: { gte: 20 } }] },
    context:
      'After an evening outreach, someone leaves an anonymous note on the church gate warning the youth fellowship to stop "preaching on our streets" or face trouble. Some youth want to carry on as normal; parents are frightened.',
    scripture: [
      { ref: 'Matthew 10:16', why: 'Jesus sends his disciples out to be wise as well as harmless.' },
      { ref: '1 Peter 3:14', why: 'Suffering for doing right is not a sign of God’s absence.' },
      { ref: 'James 1:12', why: 'Perseverance under trial is honoured.' },
    ],
    choices: [
      { id: 'prudent', text: 'Report it to the police and church leaders, pause street outreach for now, and keep meeting inside the church with a safety plan.', effects: [{ setFlag: 'threat_note_received' }, { setFlag: 'threat_prudent' }, { counter: 'steadfastChoices' }], outcome: 'The police take a statement. Pastor Tunde thanks you for protecting the younger members. Fellowship continues — quieter, but faithful.' },
      { id: 'pairs', text: 'Continue visiting neighbours, but only in pairs, in daylight, with leaders informed.', effects: [{ setFlag: 'threat_note_received' }, { setFlag: 'threat_pairs' }, { counter: 'steadfastChoices' }, { wellbeing: -2 }], outcome: 'You keep going carefully. Most neighbours are friendly; the note was not the voice of the street.' },
      { id: 'defy', text: 'Hold a loud open-air meeting the next night to show you are not afraid.', effects: [{ setFlag: 'threat_note_received' }, { setFlag: 'threat_defiant' }, { wellbeing: -5 }, { schedule: { eventId: 'defiance_fallout', inDays: 2 } }], outcome: 'A big crowd comes. So does tension. Some parents pull their children out of the fellowship.' },
    ],
  },
  {
    id: 'comfort_vs_promise',
    title: 'The concert and the promise',
    category: 'commitment',
    npcs: ['nneka', 'tobi'],
    trigger: { all: [{ flag: 'nneka_helped' }, { daysPlayed: { gte: 8 } }] },
    context:
      'You promised Nneka you would help her move her salon chairs to a new shop on Saturday. Then a friend offers you a free backstage pass to see Tobi Vibes on the same afternoon.',
    scripture: [{ ref: 'Matthew 5:37', why: 'Let your yes be yes — keeping your word.' }],
    choices: [
      { id: 'keep', text: 'Keep your promise to Nneka.', effects: [{ time: 240 }, { energy: -20 }, { trust: 8, npc: 'nneka' }, { counter: 'serviceActs' }, { event: 'service', kind: 'moving_help' }, { setFlag: 'kept_promise' }], outcome: 'You miss the concert. Nneka’s new shop opens on Monday with three bookings.' },
      { id: 'swap', text: 'Ask a friend from church to cover for you, then go to the concert.', effects: [{ wellbeing: 6 }, { trust: -2, npc: 'nneka' }, { setFlag: 'swapped_promise' }], outcome: 'Brother Sam covers for you. Nneka is gracious, though a little disappointed.' },
      { id: 'skip', text: 'Text Nneka last minute that something came up.', effects: [{ wellbeing: 4 }, { trust: -10, npc: 'nneka' }, { setFlag: 'broke_promise' }], outcome: 'The concert is incredible. Nneka moves the chairs alone with her children.' },
    ],
  },
  {
    id: 'adulterated_stock',
    title: 'A cheaper supplier',
    category: 'business',
    npcs: [],
    trigger: { business: 'provisions_stall' },
    context:
      'A supplier offers you palm oil and groundnut oil at 40% below market price. A trader whispers that it is diluted. Your margins would double.',
    scripture: [{ ref: 'Proverbs 11:1', why: 'Honest dealing in trade.' }, { ref: 'Luke 16:10-11', why: 'Faithfulness with worldly wealth.' }],
    choices: [
      { id: 'decline', text: 'Decline and stay with your usual supplier.', effects: [{ counter: 'integrityChoices' }, { setFlag: 'refused_bad_stock' }, { business: { reputation: 5 } }], outcome: 'Your margins stay thin. Your regular customers stay regular.' },
      { id: 'buy', text: 'Buy it. Customers will not know.', effects: [{ setFlag: 'sold_bad_stock' }, { business: { reputation: -10, bonusStock: 40 } }, { schedule: { eventId: 'bad_stock_found', inDays: 7 } }], outcome: 'Forty units of stock for a fraction of the price. Sales are brisk.' },
    ],
  },
  {
    id: 'windfall',
    title: 'What will you do with it?',
    category: 'stewardship',
    npcs: [],
    trigger: { coins: { gte: 250000 } },
    context:
      'Your savings and income have grown. For the first time, you have real money to decide about. Everyone around you seems to have an opinion.',
    scripture: [
      { ref: '1 Timothy 6:17-19', why: 'Paul does not condemn the rich; he warns against arrogance and trusting riches, and urges generosity.' },
      { ref: 'Luke 12:15', why: 'Life does not consist in the abundance of possessions.' },
    ],
    choices: [
      { id: 'emergency', text: 'Move 150,000 into savings as an emergency fund.', effects: [{ deposit: 150000 }, { setFlag: 'built_emergency_fund' }], outcome: 'Boring. Wise. You sleep better.' },
      { id: 'invest', text: 'Keep it working: plan to invest in a business or tools.', effects: [{ setFlag: 'planned_investment' }, { skill: 'trade', amount: 2 }], outcome: 'You spend a weekend with a notebook and Mama Ngozi’s advice.' },
      { id: 'give', text: 'Give 50,000 to the Nkwo borehole fund.', effects: [{ coins: -50000, reason: 'Nkwo borehole fund', donation: true }, { event: 'donate', cause: 'borehole', amount: 50000 }, { flagAdd: { flag: 'borehole_fund', amount: 50000 } }], outcome: 'Uncle Obi sends a voice note that is mostly shouting and partly singing.' },
      { id: 'enjoy', text: 'Treat yourself — you have worked hard.', effects: [{ wellbeing: 8 }, { coins: -30000, reason: 'Treated yourself' }], outcome: 'A good dinner, new shoes, and a day off. Enjoying God’s gifts is not a sin.' },
    ],
  },
];
export const SCENARIO_BY_ID = Object.fromEntries(SCENARIOS.map((s) => [s.id, s]));

// Delayed consequences, scheduled by scenario choices and dialogue effects.
export const DELAYED_EVENTS = {
  audit_vindicates: {
    title: 'Head office audit',
    text: 'Head office audited every branch. Brightwell’s honest report — and its recovery plan — stood out. Folake grudgingly mentions your name to the regional manager.',
    effects: [{ trust: 8, npc: 'folake' }, { careerPerformance: 15 }, { xp: 40 }, { wellbeing: 5 }],
  },
  audit_finds: {
    title: 'Head office audit',
    text: 'Auditors found the altered delivery records. Folake says it was your idea. You receive a written warning and your performance rating drops.',
    effects: [{ careerPerformance: -25 }, { wellbeing: -8 }, { trust: -8, npc: 'folake' }],
  },
  scale_complaint: {
    title: 'A complaint at the shop',
    text: 'A customer weighed her rice at home and came back angry. Mama Ngozi found the faulty scale — and found out you had noticed.',
    effects: [{ trust: -8, npc: 'mama_ngozi' }, { wellbeing: -4 }],
  },
  obinna_thanks: {
    title: 'A letter from Obinna',
    text: 'Your cousin Obinna sends a photo in his new school uniform with a note: "I will make you proud."',
    effects: [{ wellbeing: 6 }],
  },
  bursary_found: {
    title: 'A bursary',
    text: 'A church bursary covers the rest of Obinna’s fees. Your evening of searching paid off.',
    effects: [{ wellbeing: 5 }, { xp: 20 }],
  },
  family_tension: {
    title: 'Family tension',
    text: 'An aunt posts something pointed in the family WhatsApp group about "people who forget where they came from". It stings. Later, Uncle Obi calls quietly to say Obinna will start next term instead.',
    effects: [{ wellbeing: -3 }],
  },
  emeka_money_followup: {
    title: 'Emeka’s confession',
    text: 'Emeka admits he bet half of the money you gave him, hoping to "multiply" it. He lost it. Then he asks for help again — this time with a budget and accountability.',
    requires: { notFlag: 'emeka_accountability' },
    effects: [{ trust: -2, npc: 'emeka' }, { wellbeing: -3 }],
  },
  defiance_fallout: {
    title: 'Fallout from the meeting',
    text: 'Two youth members’ parents withdraw them from fellowship, and the estate committee bans evening gatherings on the street. Pastor Tunde asks you, gently, to talk with him before the next big decision.',
    effects: [{ wellbeing: -4 }],
  },
  bad_stock_found: {
    title: 'Customers notice',
    text: 'A customer’s stew tasted wrong. Word spread at Oja that your oil was diluted. Sales collapse for weeks.',
    effects: [{ business: { reputation: -25 } }, { wellbeing: -6 }],
  },
};
