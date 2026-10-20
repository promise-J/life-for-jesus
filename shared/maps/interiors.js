// Interior scenes. Each room is surrounded by walls; the exit tile sits in the bottom wall.
function room({ id, region = 'udoka', name, width, height, floor, wall, music, ambience, objects, exitTo, exitX }) {
  const ex = exitX ?? Math.floor(width / 2);
  return {
    id,
    region,
    name,
    kind: 'interior',
    width,
    height,
    floor,
    wall,
    music: music || 'indoor',
    ambience: ambience || 'indoor',
    objects,
    exit: { x: ex, y: height - 1, to: exitTo },
    spawns: { default: { x: ex, y: height - 2 }, entry: { x: ex, y: height - 2 } },
  };
}

export const HOME = room({
  id: 'home',
  name: 'Your home',
  width: 12,
  height: 9,
  floor: 'wood',
  wall: '#f3dfb8',
  music: 'home',
  exitTo: { mapId: 'udoka', spawn: 'home' },
  exitX: 6,
  objects: [
    { id: 'bed', type: 'bed', x: 1, y: 1, interact: { kind: 'bed', label: 'Rest, sleep or let time pass' } },
    { id: 'wardrobe', type: 'wardrobe', x: 4, y: 1, interact: { kind: 'wardrobe', label: 'Wardrobe — your profile' } },
    { id: 'bookshelf', type: 'shelf', x: 6, y: 1, interact: { kind: 'bible', label: 'Bookshelf — open the Bible Explorer' } },
    { id: 'stove', type: 'stove', x: 9, y: 1, interact: { kind: 'kitchen', label: 'Kitchen — eat something' } },
    { id: 'fridge', type: 'fridge', x: 10, y: 1 },
    { id: 'table', type: 'table', x: 7, y: 4 },
    { id: 'chair', type: 'chair', x: 6, y: 4 },
    { id: 'prayer_mat', type: 'mat', x: 1, y: 5, interact: { kind: 'prayer', place: 'home', label: 'Prayer corner' } },
    { id: 'plant', type: 'plant', x: 10, y: 6 },
  ],
});

export const SHOP = room({
  id: 'shop',
  name: "Mama Ngozi's Provisions",
  width: 12,
  height: 9,
  floor: 'tile',
  wall: '#ffe7b0',
  exitTo: { mapId: 'udoka', spawn: 'shop' },
  objects: [
    { id: 'shelf_1', type: 'shelf', x: 1, y: 1, w: 3 },
    { id: 'shelf_2', type: 'shelf', x: 8, y: 1, w: 3 },
    { id: 'counter', type: 'counter', x: 4, y: 3, w: 4, interact: { kind: 'shop', shopId: 'ngozi', label: 'Counter — buy & sell' } },
    { id: 'back_store', type: 'crates', x: 10, y: 5, interact: { kind: 'work', label: 'Store room — shop assistant shift' } },
    { id: 'scale', type: 'scale', x: 1, y: 5, interact: { kind: 'info', text: 'A well-used weighing scale. Mama Ngozi checks it every Monday.', label: 'Look at the scale' } },
    { id: 'sacks', type: 'sacks', x: 2, y: 6 },
  ],
});

export const OFFICE = room({
  id: 'office',
  name: 'Brightwell Logistics & Tech',
  width: 16,
  height: 11,
  floor: 'carpet',
  wall: '#dfe8f2',
  music: 'work',
  exitTo: { mapId: 'udoka', spawn: 'office' },
  objects: [
    { id: 'reception', type: 'counter', x: 6, y: 7, w: 4 },
    { id: 'job_board', type: 'noticeboard', x: 2, y: 1, interact: { kind: 'job_board', label: 'Vacancies board' } },
    { id: 'desk_1', type: 'desk', x: 2, y: 3 },
    { id: 'desk_2', type: 'desk', x: 5, y: 3 },
    { id: 'my_desk', type: 'desk', x: 8, y: 3, interact: { kind: 'work', label: 'Your workstation — work a shift' } },
    { id: 'desk_4', type: 'desk', x: 11, y: 3 },
    { id: 'manager_desk', type: 'desk', x: 12, y: 6 },
    { id: 'cooler', type: 'cooler', x: 14, y: 1 },
    { id: 'plant_o', type: 'plant', x: 1, y: 8 },
    { id: 'plant_o2', type: 'plant', x: 14, y: 8 },
  ],
});

export const CHURCH = room({
  id: 'church',
  name: 'Grace Chapel',
  width: 16,
  height: 13,
  floor: 'church',
  wall: '#f6efe2',
  music: 'church',
  ambience: 'church',
  exitTo: { mapId: 'udoka', spawn: 'church' },
  objects: [
    { id: 'altar', type: 'altar', x: 6, y: 1, w: 4, interact: { kind: 'prayer', place: 'church', label: 'Kneel and pray' } },
    { id: 'pulpit', type: 'pulpit', x: 11, y: 2 },
    ...[4, 6, 8].flatMap((y) => [
      { id: `pew_l_${y}`, type: 'pew', x: 2, y, w: 4 },
      { id: `pew_r_${y}`, type: 'pew', x: 10, y, w: 4 },
    ]),
    { id: 'food_bank', type: 'table', x: 1, y: 10, w: 2, interact: { kind: 'service', service: 'food_bank', label: 'Food bank table — volunteer' } },
    { id: 'study_table', type: 'table', x: 12, y: 10, w: 2, interact: { kind: 'bible_study', label: 'Bible study circle' } },
    { id: 'church_job', type: 'noticeboard', x: 14, y: 1, interact: { kind: 'job_board', label: 'Church office — volunteer & staff roles' } },
    { id: 'church_work', type: 'desk', x: 1, y: 1, interact: { kind: 'work', label: 'Church office — work a shift' } },
  ],
});

export const UNIVERSITY = room({
  id: 'university_hall',
  name: 'Udoka University & Learning Centre',
  width: 14,
  height: 10,
  floor: 'tile',
  wall: '#e7eef7',
  music: 'study',
  exitTo: { mapId: 'udoka', spawn: 'university_hall' },
  objects: [
    { id: 'board', type: 'blackboard', x: 4, y: 1, w: 5 },
    { id: 'registrar', type: 'counter', x: 10, y: 2, w: 3, interact: { kind: 'enroll', label: 'Registrar — courses & fees' } },
    ...[3, 5].flatMap((y) => [2, 5, 8].map((x) => ({ id: `cdesk_${x}_${y}`, type: 'schooldesk', x, y }))),
    { id: 'study_desk', type: 'schooldesk', x: 2, y: 7, interact: { kind: 'study', label: 'Study desk — study for your course' } },
    { id: 'library', type: 'shelf', x: 9, y: 7, w: 3, interact: { kind: 'study', label: 'Library — study' } },
    { id: 'teach_desk', type: 'desk', x: 12, y: 5, interact: { kind: 'work', label: 'Teaching desk — work a shift' } },
  ],
});

export const CLINIC = room({
  id: 'clinic',
  name: 'Udoka Clinic',
  width: 12,
  height: 9,
  floor: 'tile',
  wall: '#e8f6f3',
  exitTo: { mapId: 'udoka', spawn: 'clinic' },
  objects: [
    { id: 'clinic_desk', type: 'counter', x: 3, y: 2, w: 4, interact: { kind: 'clinic', label: 'Reception — check-up & treatment' } },
    { id: 'clinic_bed_1', type: 'bed', x: 9, y: 1 },
    { id: 'clinic_bed_2', type: 'bed', x: 9, y: 4 },
    { id: 'clinic_work', type: 'desk', x: 1, y: 5, interact: { kind: 'work', label: 'Ward station — work a shift' } },
    { id: 'clinic_plant', type: 'plant', x: 1, y: 1 },
  ],
});

export const COMMUNITY = room({
  id: 'community_centre',
  name: 'Udoka Community Centre',
  width: 16,
  height: 11,
  floor: 'wood',
  wall: '#fbe3d0',
  music: 'event',
  exitTo: { mapId: 'udoka', spawn: 'community_centre' },
  objects: [
    { id: 'stage', type: 'stage', x: 4, y: 1, w: 8, interact: { kind: 'work', label: 'Stage — perform a gig (musicians)' } },
    ...[5, 7].flatMap((y) => [3, 5, 7, 9, 11].map((x) => ({ id: `chair_${x}_${y}`, type: 'chair', x, y }))),
    { id: 'cc_board', type: 'noticeboard', x: 14, y: 1, interact: { kind: 'mission_board', label: 'Community projects board' } },
    { id: 'cc_service', type: 'table', x: 1, y: 8, w: 2, interact: { kind: 'service', service: 'youth_tutoring', label: 'Youth homework club — volunteer' } },
  ],
});

export const INTERIORS = [HOME, SHOP, OFFICE, CHURCH, UNIVERSITY, CLINIC, COMMUNITY];
