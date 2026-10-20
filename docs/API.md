# API reference

Base path: `/api`. JSON in, JSON out. Errors always look like:

```json
{ "error": { "code": "insufficient_funds", "message": "You need 1,200 LC but have 300 LC.", "details": [] } }
```

**Sessions:** an httpOnly `lfj_session` cookie (JWT, 7 days). **CSRF:** every `POST/PUT/PATCH/DELETE` must send header `x-csrf-token` equal to the `lfj_csrf` cookie; get it from `GET /api/auth/csrf`. **Rate limits:** auth 30 / 15 min, actions 240 / min, everything else 600 / min. **Body limit:** 32 KB.

## Health & config

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/health` | – | `{ ok, db }` |
| GET | `/config` | – | `{ devTools, translation, version }` |

## Auth

| Method | Path | Body | Description |
|---|---|---|---|
| GET | `/auth/csrf` | – | `{ csrfToken }` and sets the CSRF cookie |
| GET | `/auth/me` | – | `{ user }` or `{ user: null }` |
| POST | `/auth/register` | `{ email, password (8+), displayName }` | Creates an account and signs in (409 if the email exists) |
| POST | `/auth/login` | `{ email, password }` | Signs in (401 on bad credentials) |
| POST | `/auth/guest` | – | Creates a guest account (no credentials) and signs in |
| POST | `/auth/upgrade` | `{ email, password, displayName? }` | Turns the current guest into a registered account; characters are kept |
| POST | `/auth/logout` | – | Clears the session |

`user` = `{ id, displayName, email, isGuest }`. Passwords are hashed with bcrypt (cost 12) and never returned.

## Characters (signed in; you can only ever see your own)

| Method | Path | Description |
|---|---|---|
| GET | `/characters` | List your characters (max 10): `{ characters: [{ id, name, status, mode, summary, updatedAt }] }` |
| POST | `/characters` | Create. Body: `{ name, gender, skin, hair, hairColor, outfit, startAge, background, difficulty, mode, endingMode, country }` (ids from `shared/content/character.js`) |
| GET | `/characters/:id` | `{ character: { id, name, status, mode, rev, summary, state } }` — `state` is the full save minus the RNG seed. The trumpet schedule is never included. |
| DELETE | `/characters/:id` | Delete this character and its events, journal and action records |
| POST | `/characters/:id/actions` | Apply one action (below) |
| GET | `/characters/:id/report` | `{ ended, report }` — the life report (works mid-life as “life so far”) |
| GET | `/characters/:id/events?page=` | Life events, newest first, 50 per page |
| GET | `/characters/:id/journal?page=` | Prayer journal entries, 20 per page |

### Actions

`POST /characters/:id/actions` with `{ type, payload, key }`. `key` is a client-generated idempotency key (8–64 chars `[A-Za-z0-9_-]`): repeating a key returns the original result with `replayed: true` and never applies twice. Response:

```json
{ "messages": [{ "kind": "info|reward|warn|story|decision|mission|achievement|calm", "text": "…" }],
  "events": [{ "type": "work_shift", "...": "..." }],
  "ended": false,
  "character": { "...": "updated character" } }
```

The server decides every outcome — amounts in the payload (coins, XP, rewards) are ignored. Errors: `400` invalid/not allowed (with a code such as `insufficient_funds`, `wrong_location`, `too_tired`, `not_eligible`, `closed`, `choice_locked`, `inventory_full`), `404` not your character, `409` `ended` / `in_dialogue` / `conflict` / `in_progress`.

| Type | Payload | Notes |
|---|---|---|
| `sync` | `{ mapId, x, y, facing, elapsedMinutes }` | Saves position; free-roam minutes are clamped by real elapsed time and 180 per call; same region only; position must be walkable |
| `sleep` / `nap` | – | At home |
| `wait` | `{ hours: 1–12 }` | |
| `live_month` | – | At home; fast-forwards a month of routine (work, business, bills, a life event) |
| `use_item` | `{ itemId }` | Food/gifts |
| `buy` / `sell` | `{ shopId, itemId, qty }` | At the shop’s map; buy 1–10 |
| `apply_job` / `quit_job` | `{ jobId }` / – | Requirements checked |
| `work_shift` | – | At the workplace, during opening hours, with enough energy |
| `volunteer` | `{ mapId: "shop" }` | Unpaid store-room help |
| `enroll` / `drop_course` / `study` | `{ courseId }` / – / – | Registrar at the Learning Centre; study there or at home with a laptop |
| `start_business` / `restock` / `run_business` / `close_business` | `{ type }` / `{ qty }` / – / – | |
| `bank` | `{ op: deposit\|withdraw\|pay_arrears, amount }` | |
| `donate` | `{ cause, amount }` | `church_offering`, `food_bank`, `community_projects`, `borehole` |
| `borehole_labour` | – | In Nkwo, once a day |
| `buy_property` | `{ propertyId }` | |
| `clinic` | – | |
| `pray` | `{ prayerType, place, target?, journal? }` | Never awards coins |
| `read_scripture` | `{ ref }` | |
| `bible_study` | – | Grace Chapel, 16:00–22:00, once a day |
| `service` | `{ service: food_bank\|youth_tutoring }` | Once a day each |
| `talk_start` / `talk_choose` / `talk_end` | `{ npcId }` / `{ choiceId }` / – | NPC must be present now; choice must exist and be unlocked |
| `resolve_scenario` | `{ scenarioId, choiceId }` | Only pending decisions |
| `accept_mission` | `{ missionId }` | Notice-board missions |
| `travel` | `{ to }` | From Udoka or Nkwo exterior |
| `enter_history` / `exit_history` | `{ eraId }` / – | Your own timeline is frozen inside |
| `update_appearance` | `{ hair?, hairColor?, outfit? }` | At home |

## Scripture (public)

| Method | Path | Description |
|---|---|---|
| GET | `/scripture/info` | Translation info |
| GET | `/scripture/books` | 66 books with chapter counts |
| GET | `/scripture/chapter/:bookId/:chapter` | A whole chapter |
| GET | `/scripture/passage?ref=John 3:16` | A passage (`404` if the reference doesn’t exist) |
| GET | `/scripture/search?q=&page=&testament=` | Full-text search (all words must match), 20 per page; if `q` is a reference, `reference` holds that passage |
| GET | `/scripture/entries?topic=` | Curated, topic-tagged references with context notes |
| GET / POST / DELETE | `/scripture/favorites` | Saved passages (signed in); body `{ ref }` |

## Settings (signed in)

| Method | Path | Body |
|---|---|---|
| GET | `/settings` | – |
| PUT | `/settings` | any of `{ musicVolume 0–1, sfxVolume 0–1, muted, reducedMotion, textScale 0.85–1.5, touchControls auto\|on\|off }` |

## Development only (`DEV_TOOLS=true` and `NODE_ENV` ≠ `production`)

| Method | Path | Description |
|---|---|---|
| GET | `/dev/characters/:id/inspect` | Full save including `endAtMinutes` |
| POST | `/dev/characters/:id/trigger-ending` | Sounds the trumpet now |
| POST | `/dev/characters/:id/advance` | `{ hours: 1–12 }` |
