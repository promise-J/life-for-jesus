// Udoka — an original, fictional Nigerian city. Coordinates are in 32px tiles.
const lampRow = (y, xs) => xs.map((x, i) => ({ id: `lamp_${y}_${i}`, type: 'lamp', x, y }));
const treeRow = (y, xs, type = 'tree') => xs.map((x, i) => ({ id: `${type}_${y}_${i}`, type, x, y }));

export const UDOKA = {
  id: 'udoka',
  region: 'udoka',
  name: 'Udoka City',
  kind: 'exterior',
  width: 64,
  height: 44,
  ground: 'grass',
  music: 'city',
  ambience: 'city',
  areas: [
    // pavements first, then roads on top
    { type: 'pavement', x: 0, y: 18, w: 64, h: 5 },
    { type: 'pavement', x: 28, y: 0, w: 5, h: 44 },
    { type: 'pavement', x: 0, y: 31, w: 64, h: 4 },
    { type: 'road', x: 0, y: 19, w: 64, h: 3, lanes: 'h' },
    { type: 'road', x: 29, y: 0, w: 3, h: 44, lanes: 'v' },
    { type: 'road', x: 0, y: 32, w: 64, h: 2, lanes: 'h' },
    // Amaka Close
    { type: 'path', x: 1, y: 9, w: 27, h: 2 },
    { type: 'path', x: 22, y: 11, w: 2, h: 1 },
    // University lawn path
    { type: 'path', x: 33, y: 13, w: 26, h: 2 },
    // Oja Market ground
    { type: 'plaza', x: 1, y: 23, w: 27, h: 8 },
    // Shop row forecourt south of secondary road
    { type: 'plaza', x: 1, y: 35, w: 27, h: 1 },
    { type: 'plaza', x: 1, y: 40, w: 27, h: 3 },
    // Office and community centre forecourt
    { type: 'plaza', x: 33, y: 30, w: 30, h: 1 },
    // Football pitch and motor park
    { type: 'pitch', x: 34, y: 35, w: 15, h: 8 },
    { type: 'plaza', x: 51, y: 35, w: 12, h: 8 },
  ],
  labels: [
    { text: 'Amaka Close', x: 8, y: 0.4 },
    { text: 'Udoka University', x: 42, y: 0.4 },
    { text: 'Oja Market', x: 13, y: 22.6 },
    { text: 'Town Square', x: 41, y: 34.6 },
    { text: 'Motor Park', x: 56, y: 34.6 },
  ],
  buildings: [
    { id: 'home', name: 'Your home', x: 2, y: 3, w: 6, h: 5, style: 'house_blue', door: { x: 4, y: 7 }, to: { mapId: 'home', spawn: 'entry' } },
    { id: 'nneka_house', name: "Nneka's house", x: 10, y: 3, w: 6, h: 5, style: 'house_peach', private: true },
    { id: 'church', name: 'Grace Chapel', x: 18, y: 1, w: 9, h: 8, style: 'church', door: { x: 22, y: 8 }, to: { mapId: 'church', spawn: 'entry' } },
    { id: 'university', name: 'Udoka University & Learning Centre', x: 35, y: 2, w: 14, h: 9, style: 'university', door: { x: 41, y: 10 }, to: { mapId: 'university_hall', spawn: 'entry' } },
    { id: 'clinic', name: 'Udoka Clinic', x: 52, y: 3, w: 8, h: 7, style: 'clinic', door: { x: 55, y: 9 }, to: { mapId: 'clinic', spawn: 'entry' } },
    { id: 'shop', name: "Mama Ngozi's Provisions", x: 4, y: 35, w: 7, h: 5, style: 'shop', door: { x: 7, y: 39 }, to: { mapId: 'shop', spawn: 'entry' } },
    { id: 'bank', name: 'Udoka Cooperative Bank', x: 14, y: 35, w: 7, h: 5, style: 'bank', private: true },
    { id: 'office', name: 'Brightwell Logistics & Tech', x: 35, y: 23, w: 12, h: 7, style: 'office', door: { x: 40, y: 29 }, to: { mapId: 'office', spawn: 'entry' } },
    { id: 'community_centre', name: 'Udoka Community Centre', x: 50, y: 23, w: 11, h: 7, style: 'community', door: { x: 55, y: 29 }, to: { mapId: 'community_centre', spawn: 'entry' } },
    { id: 'guard_post', name: 'Estate gate post', x: 2, y: 12, w: 3, h: 3, style: 'kiosk', private: true },
  ],
  objects: [
    // Amaka Close greenery
    ...treeRow(1, [1, 9, 16]),
    ...treeRow(14, [8, 12, 16, 20, 24], 'palm'),
    { id: 'garden_bench', type: 'bench', x: 10, y: 12, interact: { kind: 'prayer', place: 'garden', label: 'Sit quietly and pray' } },
    { id: 'flowers_1', type: 'flowers', x: 9, y: 8 },
    { id: 'flowers_2', type: 'flowers', x: 1, y: 8 },
    { id: 'estate_agent', type: 'booth', x: 25, y: 12, interact: { kind: 'property', label: 'Udoka Homes — estate agent' } },
    { id: 'church_board', type: 'noticeboard', x: 25, y: 9, interact: { kind: 'mission_board', label: 'Grace Chapel notice board' } },
    // University lawn
    ...treeRow(12, [34, 50, 60]),
    ...treeRow(16, [36, 44, 52, 60], 'palm'),
    { id: 'campus_bench', type: 'bench', x: 46, y: 12 },
    { id: 'campus_bench_2', type: 'bench', x: 54, y: 12 },
    // Oja Market stalls
    { id: 'stall_food_1', type: 'stall', x: 2, y: 24, color: '#e85d3f', interact: { kind: 'shop', shopId: 'oja_food', label: 'Food stall' } },
    { id: 'stall_food_2', type: 'stall', x: 6, y: 24, color: '#f2b632' },
    { id: 'stall_cloth', type: 'stall', x: 10, y: 24, color: '#2f6fd6', interact: { kind: 'shop', shopId: 'oja_goods', label: 'Cloth, books & tools' } },
    { id: 'stall_4', type: 'stall', x: 14, y: 24, color: '#1f9d6b' },
    { id: 'stall_5', type: 'stall', x: 18, y: 24, color: '#7b4bc4' },
    { id: 'stall_6', type: 'stall', x: 22, y: 24, color: '#e85d3f' },
    { id: 'stall_7', type: 'stall', x: 2, y: 28, color: '#1f9d6b' },
    { id: 'stall_8', type: 'stall', x: 6, y: 28, color: '#2f6fd6' },
    { id: 'stall_trader', type: 'stall', x: 10, y: 28, color: '#f2b632', interact: { kind: 'business', label: 'Rent a market stall / run your business' } },
    { id: 'stall_10', type: 'stall', x: 14, y: 28, color: '#e85d3f' },
    { id: 'porter_post', type: 'cart', x: 19, y: 29, interact: { kind: 'work', label: 'Market porter work point' } },
    { id: 'stall_12', type: 'stall', x: 22, y: 28, color: '#7b4bc4' },
    // Bank front and shop row
    { id: 'atm', type: 'atm', x: 17, y: 40, interact: { kind: 'bank', label: 'Cooperative Bank teller window' } },
    ...treeRow(41, [2, 12, 24], 'palm'),
    // Office / community centre forecourt
    { id: 'office_sign', type: 'sign', x: 34, y: 29, interact: { kind: 'info', text: 'Brightwell Logistics & Tech — "Moving Udoka forward." Office hours 8:00–17:00.', label: 'Read sign' } },
    // Town square
    { id: 'goal_west', type: 'goal', x: 34, y: 38 },
    { id: 'goal_east', type: 'goal', x: 48, y: 38 },
    { id: 'town_board', type: 'noticeboard', x: 50, y: 41, interact: { kind: 'mission_board', label: 'Town notice board' } },
    { id: 'square_bench', type: 'bench', x: 41, y: 43 },
    // Motor park
    { id: 'danfo_1', type: 'bus', x: 52, y: 37 },
    { id: 'danfo_2', type: 'bus', x: 52, y: 40 },
    { id: 'keke_1', type: 'keke', x: 60, y: 41 },
    { id: 'ticket_booth', type: 'booth', x: 57, y: 36, interact: { kind: 'travel', label: 'Motor park — buy a ticket' } },
    { id: 'keke_rank', type: 'sign', x: 61, y: 37, interact: { kind: 'business', label: 'Keke rank — run your keke' } },
    { id: 'motors_lot', type: 'car', x: 59, y: 39, interact: { kind: 'shop', shopId: 'motors', label: 'Udoka Motors — bicycles & vehicles' } },
    // Street lamps
    ...lampRow(18, [6, 16, 26, 36, 46, 56]),
    ...lampRow(31, [6, 16, 26, 36, 46, 56]),
  ],
  spawns: {
    default: { x: 4, y: 8 },
    home: { x: 4, y: 8 },
    church: { x: 22, y: 9 },
    university_hall: { x: 41, y: 11 },
    clinic: { x: 55, y: 10 },
    shop: { x: 7, y: 40 },
    office: { x: 40, y: 30 },
    community_centre: { x: 55, y: 30 },
    motor_park: { x: 57, y: 38 },
  },
};
