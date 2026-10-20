import { START_HOUR, HOUR, YEAR, DAY } from '../content/constants.js';
import { SKIN_TONES, HAIR_STYLES, HAIR_COLORS, OUTFITS, GENDERS, START_AGES, BACKGROUNDS, DIFFICULTIES, GAME_MODES, ENDING_MODES, COUNTRIES, SKILLS } from '../content/character.js';
import { getMap, spawnPoint, TILE } from '../maps/index.js';
import { mulberry32, hashSeed, randInt } from './rng.js';

export const STATE_VERSION = 1;

const ids = (arr) => arr.map((x) => x.id);

export const CREATION_OPTIONS = {
  gender: ids(GENDERS),
  skin: ids(SKIN_TONES),
  hair: ids(HAIR_STYLES),
  hairColor: ids(HAIR_COLORS),
  outfit: ids(OUTFITS),
  startAge: ids(START_AGES),
  background: ids(BACKGROUNDS),
  difficulty: ids(DIFFICULTIES),
  mode: ids(GAME_MODES),
  endingMode: ids(ENDING_MODES),
  country: ids(COUNTRIES),
};

/** Validate creation input. Returns a list of error strings (empty when valid). */
export function validateCreation(input) {
  const errors = [];
  const name = typeof input?.name === 'string' ? input.name.trim() : '';
  if (name.length < 2 || name.length > 24) errors.push('Name must be 2–24 characters.');
  if (name && !/^[\p{L}\p{M}' .-]+$/u.test(name)) errors.push('Name may only contain letters, spaces, apostrophes, dots and hyphens.');
  for (const [key, options] of Object.entries(CREATION_OPTIONS)) {
    if (!options.includes(input?.[key])) errors.push(`Invalid ${key}.`);
  }
  if (input?.city && input.city !== 'udoka') errors.push('Invalid city.');
  return errors;
}

export function px(tile) {
  return tile * TILE + TILE / 2;
}

export function createInitialState(input, seed) {
  const startAge = START_AGES.find((s) => s.id === input.startAge);
  const background = BACKGROUNDS.find((b) => b.id === input.background);
  const rng = mulberry32(hashSeed(`${seed}:birth`));
  const startMinutes = START_HOUR * HOUR;
  const birthMinutes = startMinutes - startAge.age * YEAR - randInt(rng, 0, 300) * DAY;
  const skills = Object.fromEntries(SKILLS.map((s) => [s, 0]));
  for (const [k, v] of Object.entries(background.skills)) skills[k] += v;
  const home = getMap('udoka');
  const sp = spawnPoint(home, 'home');

  return {
    version: STATE_VERSION,
    seed: String(seed),
    rngCounter: 0,
    mode: input.mode,
    settings: { difficulty: input.difficulty, endingMode: input.endingMode },
    profile: {
      name: input.name.trim(),
      gender: input.gender,
      skin: input.skin,
      hair: input.hair,
      hairColor: input.hairColor,
      outfit: input.outfit,
      background: input.background,
      startAge: input.startAge,
      country: input.country,
      city: 'udoka',
      birthMinutes,
    },
    time: { minutes: startMinutes, startMinutes, idleCarry: 0 },
    location: { mapId: 'udoka', region: 'udoka', x: px(sp.x), y: px(sp.y) + TILE / 2 - 1, facing: 'down' },
    stats: { energy: 90, health: 100, wellbeing: 70, xp: 0, arrears: 0 },
    skills,
    coins: background.coins,
    savings: 0,
    ledger: { earned: 0, spent: 0, donated: 0, peakWealth: background.coins },
    inventory: [
      { itemId: 'bread', qty: 1 },
      { itemId: 'water_pack', qty: 1 },
    ],
    properties: [],
    education: { enrolled: null, completed: [...startAge.qualifications] },
    career: { jobId: null, performance: 50, shiftsInJob: 0, history: [] },
    business: null,
    businessHistory: [],
    relationships: {},
    storylines: {},
    missions: { active: [], completed: [], progress: {}, outcomes: {} },
    achievements: { crowns: [], badges: [] },
    counters: {},
    prayerKindsSeen: [],
    readRefs: [],
    flags: {},
    scenarios: { pending: [], resolved: {} },
    scheduled: [],
    dialogue: null,
    history: { active: null, completed: [] },
    visited: ['udoka'],
    lifeStage: null,
    lifeLog: [],
    ending: { status: 'none' },
  };
}
