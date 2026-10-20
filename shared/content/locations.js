// World map destinations and historical eras. Only built content is marked available.
export const DESTINATIONS = [
  {
    id: 'udoka',
    name: 'Udoka City',
    country: 'Nigeria',
    description: 'A busy, fictional Nigerian city: Oja Market, Brightwell, the Learning Centre, Grace Chapel and Amaka Close.',
    mapId: 'udoka',
    spawn: 'motor_park',
    cost: 2500,
    hours: 3,
    available: true,
  },
  {
    id: 'nkwo',
    name: 'Nkwo Village',
    country: 'Nigeria',
    description: 'A fictional farming village in the south-east. Family, farmland, and a borehole project.',
    mapId: 'nkwo',
    spawn: 'motor_park',
    cost: 2500,
    hours: 3,
    available: true,
  },
  {
    id: 'abroad',
    name: 'Other countries',
    country: '—',
    description: 'Planned: further countries with their own cultures and storylines. Not yet built.',
    available: false,
    planned: true,
  },
];
export const DESTINATION_BY_ID = Object.fromEntries(DESTINATIONS.map((d) => [d.id, d]));

export const ERAS = [
  {
    id: 'philippi',
    name: 'Philippi, c. AD 50',
    era: 'New Testament',
    mapId: 'philippi',
    spawn: 'arrival',
    description: 'A Roman colony in Macedonia. Walk to the riverside place of prayer described in Acts 16. NPCs are fictional; biblical events are presented only through Scripture text.',
    requires: { level: { gte: 2 } },
    requirementText: 'Reach level 2',
    available: true,
    historicalNotes: [
      'Philippi was a Roman colony; Acts 16:12 also describes it so.',
      'The Via Egnatia, a major Roman road, passed through Philippi.',
      'The riverside place of prayer, Lydia and her trade in purple cloth come from Acts 16:13-15.',
      'Buildings, layout and the characters Aulus and Berenike are the game’s reconstruction and invention.',
    ],
  },
  { id: 'antioch', name: 'Antioch, c. AD 45', era: 'Early church', description: 'Planned scenario — not yet built.', available: false, planned: true },
  { id: 'reformation', name: 'Wittenberg, 1520s', era: 'Reformation', description: 'Planned scenario — not yet built.', available: false, planned: true },
];
export const ERA_BY_ID = Object.fromEntries(ERAS.map((e) => [e.id, e]));

export const REGION_HOME_MAP = { udoka: 'udoka', nkwo: 'nkwo', philippi: 'philippi' };
