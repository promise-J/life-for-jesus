// Crowns and badges are FICTIONAL GAMEPLAY RECOGNITIONS. They record what happened in the
// simulation. They do not measure anyone's real spiritual state, and the game never treats
// them as salvation, merit before God, or eternal reward.

export const ACHIEVEMENTS = [
  // ── Crown achievements (themes inspired by Scripture) ──
  {
    id: 'faithful_witness',
    kind: 'crown',
    name: 'Faithful Witness',
    description: 'Shared your faith three times while respecting the other person’s freedom and pace.',
    when: { counter: { name: 'respectfulWitness', gte: 3 } },
    scripture: ['Acts 1:8', '1 Peter 3:15-16'],
  },
  {
    id: 'crown_of_rejoicing',
    kind: 'crown',
    name: 'Crown of Rejoicing',
    description: 'A fictional storyline reached the point where a character chose to follow Jesus. (Gameplay only — software cannot know anyone’s heart.)',
    when: { counter: { name: 'conversions', gte: 1 } },
    scripture: ['1 Thessalonians 2:19', 'Luke 15:7'],
  },
  {
    id: 'servants_heart',
    kind: 'crown',
    name: 'Servant’s Heart',
    description: 'Completed five acts of practical service for others.',
    when: { counter: { name: 'serviceActs', gte: 5 } },
    scripture: ['Mark 10:43-45'],
  },
  {
    id: 'steadfast',
    kind: 'crown',
    name: 'Steadfast',
    description: 'Stood by your faith with wisdom and gentleness under pressure.',
    when: { counter: { name: 'steadfastChoices', gte: 1 } },
    scripture: ['James 1:12'],
  },
  {
    id: 'missionary_journey',
    kind: 'crown',
    name: 'Missionary Journey',
    description: 'Served beyond your own city: completed the Nkwo borehole project and walked to the river at Philippi.',
    when: { all: [{ missionCompleted: 'generous_hands' }, { missionCompleted: 'walk_to_river' }] },
    scripture: ['Romans 10:14-15'],
  },
  {
    id: 'faithful_steward',
    kind: 'crown',
    name: 'Faithful Steward',
    description: 'Built an emergency fund and stayed out of arrears.',
    when: { missionCompleted: 'faithful_steward' },
    scripture: ['Luke 16:10-11'],
  },
  {
    id: 'disciple_maker',
    kind: 'crown',
    name: 'Disciple Maker',
    description: 'Walked with someone beyond a first decision into fellowship and service.',
    when: { counter: { name: 'discipleship', gte: 1 } },
    scripture: ['Matthew 28:19-20'],
  },
  {
    id: 'quiet_place',
    kind: 'crown',
    name: 'The Quiet Place',
    description: 'Made a habit of prayer: ten prayer times of at least three different kinds. (Recognises participation, not spiritual worth.)',
    when: { all: [{ counter: { name: 'prayers', gte: 10 } }, { counter: { name: 'prayerKinds', gte: 3 } }] },
    scripture: ['Matthew 6:6'],
  },
  {
    id: 'integrity',
    kind: 'crown',
    name: 'Honest Scales',
    description: 'Chose honesty when dishonesty would have paid.',
    when: { counter: { name: 'integrityChoices', gte: 2 } },
    scripture: ['Proverbs 11:1'],
  },
  // ── Legacy badges (life milestones) ──
  { id: 'first_paycheck', kind: 'badge', name: 'First Paycheck', description: 'Worked your first shift.', when: { counter: { name: 'shifts', gte: 1 } } },
  { id: 'graduate', kind: 'badge', name: 'Graduate', description: 'Completed a course at the Learning Centre.', when: { counter: { name: 'coursesCompleted', gte: 1 } } },
  { id: 'promoted', kind: 'badge', name: 'Moving Up', description: 'Earned a promotion.', when: { counter: { name: 'promotions', gte: 1 } } },
  { id: 'entrepreneur', kind: 'badge', name: 'Entrepreneur', description: 'Started your own business.', when: { counter: { name: 'businessesStarted', gte: 1 } } },
  { id: 'homeowner', kind: 'badge', name: 'Homeowner', description: 'Bought your own home.', when: { property: 'flat_amaka' } },
  { id: 'community_builder', kind: 'badge', name: 'Community Builder', description: 'Helped complete the Nkwo borehole.', when: { flag: 'borehole_complete' } },
  { id: 'time_traveller', kind: 'badge', name: 'Walked to the River', description: 'Completed the Philippi historical scenario.', when: { historyCompleted: 'philippi' } },
  { id: 'mission_five', kind: 'badge', name: 'Five Missions', description: 'Completed five missions.', when: { counter: { name: 'missionsCompleted', gte: 5 } } },
  { id: 'elder', kind: 'badge', name: 'Grey Hair, Good Crown', description: 'Reached the age of 60 in the simulation.', when: { age: { gte: 60 } } },
  { id: 'scripture_reader', kind: 'badge', name: 'Berean', description: 'Read twenty Scripture passages in the Bible Explorer.', when: { counter: { name: 'scriptureRead', gte: 20 } } },
];

export const ACHIEVEMENT_BY_ID = Object.fromEntries(ACHIEVEMENTS.map((a) => [a.id, a]));
