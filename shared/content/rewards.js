// Central reward configuration. Amounts are game-balancing choices — no number here is
// derived from or prescribed by Scripture. The server applies these; clients cannot submit amounts.
export const REWARDS = {
  mission_small: { id: 'mission_small', description: 'Completing a short mission', trigger: 'mission', requirements: 'All required objectives complete', reward: { xp: 60, coins: 0 }, repeatable: false },
  mission_work: { id: 'mission_work', description: 'Completing an employment mission', trigger: 'mission', requirements: 'All required objectives complete', reward: { xp: 100, coins: 2000 }, repeatable: false },
  mission_prayer: { id: 'mission_prayer', description: 'Completing a prayer mission', trigger: 'mission', requirements: 'All required objectives complete', reward: { xp: 80, coins: 0 }, repeatable: false, note: 'Prayer never pays coins.' },
  mission_education: { id: 'mission_education', description: 'Completing an education mission', trigger: 'mission', requirements: 'All required objectives complete', reward: { xp: 120, coins: 0 }, repeatable: false },
  mission_service: { id: 'mission_service', description: 'Completing a service mission', trigger: 'mission', requirements: 'All required objectives complete', reward: { xp: 120, coins: 0 }, repeatable: false },
  mission_integrity: { id: 'mission_integrity', description: 'Completing an integrity mission', trigger: 'mission', requirements: 'All required objectives complete', reward: { xp: 120, coins: 0 }, repeatable: false, note: 'The honest choice is not paid extra here — integrity sometimes costs.' },
  mission_evangelism: { id: 'mission_evangelism', description: 'Completing an evangelism storyline (any respectful outcome)', trigger: 'mission', requirements: 'Storyline reaches an outcome', reward: { xp: 200, coins: 0 }, repeatable: false },
  mission_discipleship: { id: 'mission_discipleship', description: 'Completing a discipleship mission', trigger: 'mission', requirements: 'All required objectives complete', reward: { xp: 180, coins: 0 }, repeatable: false },
  mission_generosity: { id: 'mission_generosity', description: 'Completing the borehole project', trigger: 'mission', requirements: 'Borehole funded or built', reward: { xp: 200, coins: 0 }, repeatable: false },
  mission_perseverance: { id: 'mission_perseverance', description: 'Completing a perseverance mission', trigger: 'mission', requirements: 'All required objectives complete', reward: { xp: 160, coins: 0 }, repeatable: false },
  mission_stewardship: { id: 'mission_stewardship', description: 'Completing a stewardship mission', trigger: 'mission', requirements: 'Savings and no arrears', reward: { xp: 150, coins: 0 }, repeatable: false },
  mission_history: { id: 'mission_history', description: 'Completing a historical scenario', trigger: 'mission', requirements: 'All required objectives complete', reward: { xp: 200, coins: 0 }, repeatable: false },
  achievement_crown: { id: 'achievement_crown', description: 'Earning a crown achievement', trigger: 'achievement', requirements: 'Achievement condition met', reward: { xp: 100, coins: 0 }, repeatable: false },
  achievement_badge: { id: 'achievement_badge', description: 'Earning a legacy badge', trigger: 'achievement', requirements: 'Achievement condition met', reward: { xp: 50, coins: 0 }, repeatable: false },
  work_shift: { id: 'work_shift', description: 'Working a shift', trigger: 'work_shift', requirements: 'Employed, at workplace, energy available', reward: { xp: 10 }, repeatable: true },
  study_session: { id: 'study_session', description: 'A study session', trigger: 'study', requirements: 'Enrolled', reward: { xp: 8 }, repeatable: true },
};
