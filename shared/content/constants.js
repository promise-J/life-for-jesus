// Core simulation constants. The game uses a simplified calendar of 12 months x 30 days.
export const HOUR = 60;
export const DAY = 24 * HOUR;
export const WEEK = 7 * DAY;
export const MONTH = 30 * DAY;
export const YEAR = 12 * MONTH;

export const START_YEAR = 2027;
export const START_HOUR = 7;

export const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
export const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export const CURRENCY = { code: 'LC', name: 'Life Coins' };

export const LIMITS = {
  inventorySlots: 24,
  stackMax: 99,
  lifeLogEntries: 40,
  relationshipNotes: 8,
  journalTextMax: 1000,
  maxSyncMinutes: 180, // most game minutes a single client sync may add
  realtimeMinutesPerSecond: 1, // free-roam clock speed: 1 real second = 1 game minute
};

export const LIFE_STAGES = [
  { id: 'teen', name: 'Teenager', minAge: 0 },
  { id: 'young_adult', name: 'Young adult', minAge: 18 },
  { id: 'adult', name: 'Adult', minAge: 25 },
  { id: 'midlife', name: 'Midlife', minAge: 40 },
  { id: 'elder', name: 'Elder', minAge: 60 },
];

export const MONTHLY_COSTS = {
  food: 24000,
  transport: 6000,
  rent: 20000, // waived once you own a home
};

export const STATS_MAX = 100;
