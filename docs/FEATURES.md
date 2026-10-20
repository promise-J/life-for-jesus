# Features — implemented, limited, and deferred

## Implemented (and covered by tests)

**Accounts & saves**
- Registration, login, logout, guest play, guest → account upgrade; bcrypt hashing, httpOnly JWT cookie, CSRF double-submit, rate limits, Helmet CSP, request validation, centralised errors (no stack traces to clients), ownership checks on every character route.
- Up to 10 characters per account; create, continue, delete one without touching others; ended characters keep their report.
- Server-authoritative save after every action; position/time autosave every ~20 s while walking, on every doorway, before every action, and on tab hide; save indicator in the HUD; manual “Save now”; retry on failure. Closing the browser never fast-forwards time.
- Idempotent actions and compare-and-set revisions (no duplicate purchases/rewards, no lost updates).

**World**
- Phaser top-down world with 4-direction movement (most recent key wins), smooth camera, walk animations, facing, collision with buildings/furniture/water, interaction outlines and prompts, fade transitions, day/night lighting with street-lamp glow.
- Udoka (64×44 tiles): Amaka Close homes, Grace Chapel, Udoka University & Learning Centre, Udoka Clinic, Oja Market, Mama Ngozi’s shop, Cooperative Bank, Brightwell Logistics & Tech, Community Centre, town square & football pitch, motor park, estate agent. Seven enterable interiors (home, shop, office, church, Learning Centre, clinic, community centre). Nkwo village (farmland, borehole site, village church). Philippi c. AD 50 (historical).
- 15 story NPCs with schedules by hour and day of week, plus ambient neighbours; NPCs wander locally, stop and face you when you talk.
- Keyboard + mobile touch controls (d-pad, action button), responsive HUD and bottom-sheet panels.

**Life simulation**
- Clock (1 game minute per real second while roaming; actions take time), 30-day months, ageing and five life stages, monthly bills with arrears, savings interest, “Live the next month” fast-forward with random life events.
- 15 jobs (with requirements, schedules, skill-scaled pay, performance and promotions), 9 courses with fees and hours, 4 businesses (stock-based market stall, tailoring, keke, farm), 29 items across food, books, clothing, tools, furniture, vehicles and keepsakes; 5 shops with buy/sell; 3 properties; energy, health and wellbeing; clinic; bank.
- 9 branching moral scenarios with immediate and delayed consequences (falsified report, heavy scale, family fees, betting, mockery in class, threatening note, promise vs concert, adulterated stock, windfall).

**Faith life**
- Prayer: 10 types, 5 places, prayer for named people, praying before decisions, private journal with history.
- Bible Explorer: book/chapter reading of the full WEB, full-text search with pagination, reference lookup, 15 topics with curated passages and context notes, saved passages (stored per user).
- Evangelism & discipleship storylines: Chidi (sceptic; conversion or friendship ending; Bible-study discipleship), Emeka (betting debt; budget, accountability, fellowship, service), Aisha (respectful interfaith friendship), Nneka (practical care), Tobi Vibes (fictional celebrity; no automatic crowns). Bible study circle, food bank, homework club, giving, borehole labour.
- 15 data-driven missions with prerequisites, optional objectives, branching outcomes; Mission Mode chain and Free Life notice boards.
- 9 crowns and 10 legacy badges, all labelled as gameplay recognitions; central reward configuration.

**Ending**
- Hidden, server-only trumpet schedule from a controlled mixture distribution (“Unexpected trumpet”, “Short journey”, or “Open sandbox”); never during a historical scenario; ends exactly at the scheduled minute even mid-month; atomically saved.
- Cinematic: music cut, synthesised trumpet, screen shake (unless reduced motion), golden flash → Scripture → life review (highlights and roads not taken) → accountability & grace with labelled commentary → full life report → new life / report page / Scripture / menu.

**Audio & accessibility**
- Original synthesised music per location, ambience, SFX, prayer music, tension music for decisions; music ducks during conversations. Music/SFX volume, mute, reduced motion, text size, on-screen controls setting — saved to the account.
- Keyboard shortcuts, focus outlines, labelled controls, ARIA dialogs, meters with values, nothing relies on sound or colour alone.

**Developer tools** (dev only): state overlay, time skip, save inspector (incl. hidden ending time), trumpet trigger, action logging.

## Known limitations

- **One country.** Nigeria (Udoka + Nkwo) only. The world map lists “Other countries” as planned.
- **One historical era.** Philippi is playable; Antioch and Wittenberg are listed as locked “planned” entries.
- **NPC routines** switch location at schedule boundaries rather than walking across the city with pathfinding.
- **Relationships** are friendships; marriage, children and family life events are not yet simulated (family appears through Uncle Obi, Nne Adaeze and story events).
- **Appearance** doesn’t visibly age; there are no body-type options yet.
- **Vehicles** don’t drive; a car halves travel fares and is a possession.
- **Business** hiring of NPCs isn’t implemented.
- **Guest accounts** live on a 7-day session cookie; register (upgrade) to keep progress beyond that or across devices.
- **Screen readers:** menus and panels are accessible, but the Phaser world itself is visual (prompts and the HUD are announced).
- **Database testing:** in the build sandbox, tests ran against FerretDB 1.24 (Mongo-wire compatible) because MongoDB binaries couldn’t be downloaded there. Run `npm test` against MongoDB 6/7 in your environment before release.
- **Headless browsers** with software WebGL are slow; e2e tests use `?renderer=canvas`. Real browsers use WebGL by default.

## Suggested next steps

1. A second Nigerian city and a first non-Nigerian country, using the existing location data model.
2. Antioch (Acts 11) as the next historical scenario, following the Philippi pattern.
3. Marriage/children/family storylines and visible ageing.
4. NPC pathfinding between buildings and more ambient life.
5. Localisation (Igbo, Yoruba, Hausa, Pidgin) — all UI text is in components and content files.
6. A content editor for missions/dialogue with the governance checks built in.
