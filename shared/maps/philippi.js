// Philippi, mid-first century AD — a reconstruction for the historical scenario.
// Layout is a simplified, game-scale interpretation, not an archaeological plan.
const wall = [];
for (let y = 0; y < 30; y++) {
  if (y === 14 || y === 15) continue; // city gate opening
  wall.push({ id: `wall_${y}`, type: 'citywall', x: 30, y });
}

export const PHILIPPI = {
  id: 'philippi',
  region: 'philippi',
  name: 'Philippi (c. AD 50)',
  kind: 'exterior',
  historical: true,
  width: 44,
  height: 30,
  ground: 'dry',
  music: 'ancient',
  ambience: 'ancient',
  areas: [
    { type: 'stone', x: 6, y: 8, w: 18, h: 12 },
    { type: 'stone', x: 0, y: 14, w: 44, h: 2 },
    { type: 'dirt', x: 31, y: 6, w: 7, h: 2 },
    { type: 'dirt', x: 36, y: 6, w: 2, h: 9 },
    { type: 'sand', x: 37, y: 0, w: 2, h: 30 },
    { type: 'water', x: 39, y: 0, w: 5, h: 30 },
  ],
  labels: [
    { text: 'Forum', x: 15, y: 7.6 },
    { text: 'City gate', x: 30, y: 13 },
    { text: 'Riverside', x: 38, y: 4.6 },
  ],
  buildings: [
    { id: 'dye_workshop', name: 'Dyers’ workshop', x: 2, y: 2, w: 7, h: 5, style: 'ancient', private: true },
    { id: 'insula', name: 'Apartment block (insula)', x: 12, y: 1, w: 8, h: 5, style: 'ancient', private: true },
    { id: 'temple', name: 'Temple precinct', x: 22, y: 1, w: 7, h: 6, style: 'temple', private: true },
    { id: 'houses_s', name: 'Houses', x: 4, y: 22, w: 8, h: 5, style: 'ancient', private: true },
    { id: 'baths', name: 'Bath house', x: 16, y: 22, w: 9, h: 5, style: 'ancient', private: true },
  ],
  objects: [
    ...wall,
    { id: 'col_1', type: 'column', x: 7, y: 9 },
    { id: 'col_2', type: 'column', x: 11, y: 9 },
    { id: 'col_3', type: 'column', x: 19, y: 9 },
    { id: 'col_4', type: 'column', x: 23, y: 9 },
    { id: 'fountain', type: 'fountain', x: 14, y: 11, interact: { kind: 'info', text: 'A public fountain in the forum. Romans valued civic water supplies; the exact layout here is the game’s reconstruction.', label: 'Fountain' } },
    { id: 'purple_stall', type: 'stall', x: 8, y: 16, color: '#6d2c8f', interact: { kind: 'info', text: 'Cloth dyed in deep purple shades. Purple cloth was costly in the Roman world. Acts 16:14 describes Lydia as “a seller of purple”.', label: 'Purple cloth stall' } },
    { id: 'olive_stall', type: 'stall', x: 20, y: 16, color: '#7a8c3a' },
    { id: 'milestone', type: 'milestone', x: 27, y: 16, interact: { kind: 'info', text: 'A road marker. The Via Egnatia, a major Roman road across Macedonia, ran through Philippi.', label: 'Read the road marker' } },
    { id: 'river_prayer', type: 'rock', x: 38, y: 9, interact: { kind: 'scripture_spot', ref: 'Acts 16:13-15', label: 'The riverside place of prayer' } },
    { id: 'river_rest', type: 'rock', x: 37, y: 20, interact: { kind: 'prayer', place: 'riverside', label: 'Pray by the river' } },
    { id: 'return_stone', type: 'portal', x: 2, y: 14, interact: { kind: 'history_exit', label: 'Return to your own time' } },
    ...[33, 35].map((x, i) => ({ id: `cypress_${i}`, type: 'cypress', x, y: 3 })),
    ...[33, 35].map((x, i) => ({ id: `cypress_b_${i}`, type: 'cypress', x, y: 25 })),
  ],
  spawns: { default: { x: 4, y: 15 }, arrival: { x: 4, y: 15 } },
};
