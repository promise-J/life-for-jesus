import { DAY, HOUR, MONTH, YEAR, START_YEAR, MONTH_NAMES, DAY_NAMES, LIFE_STAGES } from '../content/constants.js';

/** Calendar view of an absolute game minute (minute 0 = 1 Jan START_YEAR, 00:00). */
export function calendar(minutes) {
  const m = Math.max(0, Math.floor(minutes));
  const year = START_YEAR + Math.floor(m / YEAR);
  const month = Math.floor((m % YEAR) / MONTH);
  const day = Math.floor((m % MONTH) / DAY) + 1;
  const hour = Math.floor((m % DAY) / HOUR);
  const minute = m % HOUR;
  const weekday = Math.floor(m / DAY) % 7;
  return { year, month, monthName: MONTH_NAMES[month], day, hour, minute, weekday, weekdayName: DAY_NAMES[weekday] };
}

export function formatDate(minutes) {
  const c = calendar(minutes);
  return `${c.weekdayName} ${c.day} ${c.monthName} ${c.year}`;
}

export function formatTime(minutes) {
  const c = calendar(minutes);
  return `${String(c.hour).padStart(2, '0')}:${String(c.minute).padStart(2, '0')}`;
}

export function isNight(minutes) {
  const h = calendar(minutes).hour;
  return h >= 20 || h < 6;
}

/** 0 = full daylight … 1 = deepest night, smooth around dawn and dusk. */
export function darkness(minutes) {
  const h = (minutes % DAY) / HOUR;
  if (h >= 7 && h <= 18) return 0;
  if (h > 18 && h < 21) return (h - 18) / 3;
  if (h >= 5 && h < 7) return 1 - (h - 5) / 2;
  return 1;
}

export function ageAt(state, minutes = state.time.minutes) {
  return (minutes - state.profile.birthMinutes) / YEAR;
}

export function lifeStageFor(ageYears) {
  let stage = LIFE_STAGES[0];
  for (const s of LIFE_STAGES) if (ageYears >= s.minAge) stage = s;
  return stage;
}

/** Minutes until the next occurrence of hour h (strictly in the future). */
export function minutesUntilHour(minutes, h) {
  const dayStart = minutes - (minutes % DAY);
  let target = dayStart + h * HOUR;
  if (target <= minutes) target += DAY;
  return target - minutes;
}
