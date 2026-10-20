// The unexpected-trumpet scheduler. The schedule is generated and stored on the SERVER ONLY and is
// never sent to the client, so the player cannot see a countdown. It is a fictional game mechanic
// and makes no claim about real-world events or the actual time of Christ's return.
import { DAY, YEAR } from '../content/constants.js';
import { mulberry32, hashSeed, triangular } from './rng.js';

export const MIN_DAYS_BEFORE_ENDING = 21;
export const MAX_AGE = 92;

/**
 * Pick the game minute at which the trumpet sounds, using a controlled mixture distribution:
 *  - surprise: 25% within the first year, 45% within 1–8 years, 30% later in life (up to old age).
 *  - brief:    within roughly the first season (21 days – 6 months).
 *  - off:      null (sandbox — no ending).
 * Every outcome is at least MIN_DAYS_BEFORE_ENDING game days after the start, and never past MAX_AGE.
 */
export function scheduleEnding({ secret, endingMode, startMinutes, birthMinutes }) {
  if (endingMode === 'off') return null;
  const rng = mulberry32(hashSeed(`trumpet:${secret}`));
  const minDays = MIN_DAYS_BEFORE_ENDING;
  let days;
  if (endingMode === 'brief') {
    days = triangular(rng, minDays, 180, 60);
  } else {
    const ageNow = (startMinutes - birthMinutes) / YEAR;
    const yearsToMaxAge = Math.max(2, MAX_AGE - ageNow);
    const bucket = rng();
    if (bucket < 0.25) days = triangular(rng, minDays, 360, 120);
    else if (bucket < 0.7) days = triangular(rng, 360, 8 * 360, 2.5 * 360);
    else days = triangular(rng, 8 * 360, yearsToMaxAge * 360, Math.min(yearsToMaxAge, 30) * 360);
  }
  const at = startMinutes + Math.round(days * DAY);
  const ageCap = birthMinutes + MAX_AGE * YEAR;
  return Math.max(startMinutes + minDays * DAY, Math.min(at, ageCap));
}

/** Decide whether the ending fires now. Never during a historical scenario (that clock is separate). */
export function shouldEnd(state, endAtMinutes) {
  if (state.ending.status !== 'none') return false;
  if (state.settings.endingMode === 'off') return false;
  if (state.history.active) return false;
  return typeof endAtMinutes === 'number' && state.time.minutes >= endAtMinutes;
}
