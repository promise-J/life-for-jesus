// Prayer options. Prayer in this game is reflective and relational, never transactional:
// it costs a little time, may bring a moment of calm, and is remembered by the story —
// but it never guarantees money, success, safety or any particular outcome.

export const PRAYER_TYPES = [
  { id: 'personal', name: 'Personal prayer', prompt: 'Talk to God about what is on your heart today.', scripture: ['Philippians 4:6-7'] },
  { id: 'thanksgiving', name: 'Thanksgiving', prompt: 'Name the good things in your day, small and large.', scripture: ['1 Thessalonians 5:16-18', 'Psalms 100:4'] },
  { id: 'family', name: 'Pray for family', prompt: 'Bring your family to God by name.', scripture: ['Ephesians 3:14-19'] },
  { id: 'friends', name: 'Pray for a friend', prompt: 'Choose someone you know and pray for them.', scripture: ['Philippians 1:3-6'], needsTarget: true },
  { id: 'difficulty', name: 'Someone in difficulty', prompt: 'Pray for someone who is struggling.', scripture: ['Psalms 34:18', 'Galatians 6:2'], needsTarget: true },
  { id: 'decision', name: 'Before a decision', prompt: 'Ask for wisdom. Prayer will not choose for you — but it can slow you down to think.', scripture: ['James 1:5', 'Proverbs 3:5-6'] },
  { id: 'persecution', name: 'Under pressure', prompt: 'Pray for courage, wisdom, and for those who oppose you.', scripture: ['Matthew 5:44', '1 Peter 3:14-16'], requires: { any: [{ flag: 'threat_note_received' }, { scenarioResolved: 'classroom_mockery' }] } },
  { id: 'mission', name: 'For a mission', prompt: 'Pray for the people involved in something you are working on.', scripture: ['Colossians 4:2-4'] },
  { id: 'quiet', name: 'Quiet reflection', prompt: 'Sit in silence. Breathe. Listen.', scripture: ['Psalms 46:10'] },
  { id: 'scripture_guided', name: 'Scripture-guided prayer', prompt: 'Pray slowly through a passage of Scripture.', scripture: ['Psalms 23', 'Matthew 6:9-13'] },
];
export const PRAYER_BY_ID = Object.fromEntries(PRAYER_TYPES.map((p) => [p.id, p]));

// Places where the prayer interaction exists. `mapId` must match the player's current map.
export const PRAYER_PLACES = {
  home: { mapId: 'home', name: 'Prayer corner at home' },
  church: { mapId: 'church', name: 'Grace Chapel altar' },
  garden: { mapId: 'udoka', name: 'Garden bench, Amaka Close' },
  village_church: { mapId: 'nkwo', name: 'St. Luke’s Village Church' },
  riverside: { mapId: 'philippi', name: 'Riverside, Philippi' },
};

export const PRAYER_DISCLAIMER =
  'Prayer here is part of your character’s story. The game does not reward prayer with money or guaranteed outcomes, and it does not measure anyone’s relationship with God.';
