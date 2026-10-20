// API tests against a real MongoDB-compatible database (MONGO_URL_TEST, default local).
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import { createApp } from '../src/app.js';
import { connectDb } from '../src/db.js';
import { Character, ActionRecord } from '../src/models/index.js';

const DB = process.env.MONGO_URL_TEST || `mongodb://127.0.0.1:27017/lfj_test_${Date.now()}`;
let app;

beforeAll(async () => {
  await connectDb(DB);
  app = createApp();
});

afterAll(async () => {
  await mongoose.connection.db.dropDatabase().catch(() => {});
  await mongoose.disconnect();
});

const CHAR = {
  name: 'Tolu Ade', gender: 'male', skin: 'chestnut', hair: 'afro', hairColor: 'black', outfit: 'ankara_green',
  startAge: 'student', background: 'tech_curious', difficulty: 'standard', mode: 'mission', endingMode: 'surprise', country: 'ng',
};

/** An agent that keeps cookies and sends the CSRF header automatically. */
async function client() {
  const agent = request.agent(app);
  const r = await agent.get('/api/auth/csrf');
  const token = r.body.csrfToken;
  const wrap = (method) => (url) => agent[method](url).set('x-csrf-token', token);
  return { agent, token, get: (u) => agent.get(u), post: wrap('post'), put: wrap('put'), del: wrap('delete') };
}

let n = 0;
async function registered() {
  const c = await client();
  n++;
  const r = await c.post('/api/auth/register').send({ email: `player${n}_${Date.now()}@example.com`, password: 'correct-horse-1', displayName: `Player ${n}` });
  expect(r.status).toBe(201);
  return c;
}

const key = () => `k${Math.random().toString(36).slice(2)}${Date.now()}`;

describe('auth', () => {
  it('rejects state-changing requests without the CSRF header', async () => {
    const r = await request(app).post('/api/auth/guest');
    expect(r.status).toBe(403);
    expect(r.body.error.code).toBe('csrf');
  });

  it('registers, logs out, logs in; never returns password hashes', async () => {
    const c = await client();
    const email = `a${Date.now()}@example.com`;
    const r = await c.post('/api/auth/register').send({ email, password: 'pass-word-99', displayName: 'Ada' });
    expect(r.status).toBe(201);
    expect(JSON.stringify(r.body)).not.toMatch(/hash/i);
    expect(r.headers['set-cookie'].join(';')).toMatch(/HttpOnly/);
    expect((await c.get('/api/auth/me')).body.user.displayName).toBe('Ada');
    await c.post('/api/auth/logout');
    expect((await c.get('/api/auth/me')).body.user).toBeNull();
    expect((await c.post('/api/auth/login').send({ email, password: 'wrong-pass-1' })).status).toBe(401);
    expect((await c.post('/api/auth/login').send({ email, password: 'pass-word-99' })).status).toBe(200);
    expect((await c.post('/api/auth/register').send({ email, password: 'pass-word-99', displayName: 'Ada2' })).status).toBe(409);
  });

  it('validates registration input', async () => {
    const c = await client();
    const r = await c.post('/api/auth/register').send({ email: 'not-an-email', password: 'short', displayName: '' });
    expect(r.status).toBe(400);
    expect(r.body.error.code).toBe('validation');
  });

  it('supports guest play and upgrading a guest to an account', async () => {
    const c = await client();
    expect((await c.post('/api/auth/guest')).status).toBe(201);
    const ch = await c.post('/api/characters').send(CHAR);
    expect(ch.status).toBe(201);
    const up = await c.post('/api/auth/upgrade').send({ email: `g${Date.now()}@example.com`, password: 'guest-upgrade-1' });
    expect(up.status).toBe(200);
    expect(up.body.user.isGuest).toBe(false);
    expect((await c.get('/api/characters')).body.characters).toHaveLength(1);
  });

  it('protects character endpoints', async () => {
    expect((await request(app).get('/api/characters')).status).toBe(401);
  });
});

describe('characters', () => {
  it('creates, lists and loads a character without leaking the trumpet schedule', async () => {
    const c = await registered();
    const r = await c.post('/api/characters').send(CHAR);
    expect(r.status).toBe(201);
    const body = JSON.stringify(r.body);
    expect(body).not.toMatch(/endAtMinutes|secret|"seed"/);
    expect(r.body.character.state.missions.active).toContain('first_steps');
    const list = await c.get('/api/characters');
    expect(list.body.characters).toHaveLength(1);
    const one = await c.get(`/api/characters/${r.body.character.id}`);
    expect(one.body.character.name).toBe('Tolu Ade');
    expect(JSON.stringify(one.body)).not.toMatch(/endAtMinutes|secret/);
  });

  it('rejects invalid character input', async () => {
    const c = await registered();
    const r = await c.post('/api/characters').send({ ...CHAR, gender: 'dragon', name: '' });
    expect(r.status).toBe(400);
  });

  it('enforces ownership — other users cannot read, act on or delete', async () => {
    const a = await registered();
    const b = await registered();
    const { body } = await a.post('/api/characters').send(CHAR);
    const id = body.character.id;
    expect((await b.get(`/api/characters/${id}`)).status).toBe(404);
    expect((await b.post(`/api/characters/${id}/actions`).send({ type: 'sleep', key: key() })).status).toBe(404);
    expect((await b.del(`/api/characters/${id}`)).status).toBe(404);
    expect((await b.get(`/api/characters/${id}/report`)).status).toBe(404);
    expect((await a.get(`/api/characters/${id}`)).status).toBe(200);
  });

  it('deletes one character without touching others', async () => {
    const c = await registered();
    const one = (await c.post('/api/characters').send(CHAR)).body.character.id;
    const two = (await c.post('/api/characters').send({ ...CHAR, name: 'Second One' })).body.character.id;
    expect((await c.del(`/api/characters/${one}`)).status).toBe(200);
    const list = (await c.get('/api/characters')).body.characters;
    expect(list.map((x) => x.id)).toEqual([two]);
  });
});

describe('authoritative actions', () => {
  async function withChar() {
    const c = await registered();
    const { body } = await c.post('/api/characters').send(CHAR);
    return { c, id: body.character.id, act: (type, payload = {}, k = key()) => c.post(`/api/characters/${body.character.id}/actions`).send({ type, payload, key: k }) };
  }

  it('buys food, eats, sleeps → completes a mission; persists to the database', async () => {
    const { c, id, act } = await withChar();
    const buy = await act('buy', { shopId: 'oja_food', itemId: 'jollof_plate', qty: 1 });
    expect(buy.status).toBe(200);
    const coins = buy.body.character.state.coins;
    expect((await act('use_item', { itemId: 'jollof_plate' })).status).toBe(200);
    // walk home: entering the house is a sync to the home map (same region)
    expect((await act('sync', { mapId: 'home', x: 6 * 32 + 16, y: 7 * 32 + 31, facing: 'up', elapsedMinutes: 1 })).status).toBe(200);
    const sleep = await act('sleep');
    expect(sleep.status).toBe(200);
    expect(sleep.body.character.state.missions.completed).toContain('first_steps');
    const reloaded = await c.get(`/api/characters/${id}`);
    expect(reloaded.body.character.state.coins).toBe(coins);
    expect(reloaded.body.character.state.location.mapId).toBe('home');
    const doc = await Character.findById(id);
    expect(doc.rev).toBe(4);
  });

  it('is idempotent: replaying the same key never charges twice', async () => {
    const { act } = await withChar();
    const k = key();
    const first = await act('buy', { shopId: 'oja_food', itemId: 'suya', qty: 1 }, k);
    const again = await act('buy', { shopId: 'oja_food', itemId: 'suya', qty: 1 }, k);
    expect(first.status).toBe(200);
    expect(again.status).toBe(200);
    expect(again.body.replayed).toBe(true);
    expect(again.body.character.state.coins).toBe(first.body.character.state.coins);
    expect(again.body.character.state.inventory.find((i) => i.itemId === 'suya').qty).toBe(1);
  });

  it('handles concurrent duplicate submissions safely', async () => {
    const { act, id } = await withChar();
    const k = key();
    const results = await Promise.all([1, 2, 3].map(() => act('buy', { shopId: 'oja_food', itemId: 'bread', qty: 1 }, k)));
    expect(results.filter((r) => r.status === 200).length).toBeGreaterThanOrEqual(1);
    const doc = await Character.findById(id);
    expect(doc.state.inventory.find((i) => i.itemId === 'bread').qty).toBe(2); // 1 starting + 1 bought
    expect(await ActionRecord.countDocuments({ characterId: id, key: k })).toBe(1);
  });

  it('rejects invalid currency transactions and leaves state unchanged', async () => {
    const { act, c, id } = await withChar();
    const before = (await c.get(`/api/characters/${id}`)).body.character;
    const r = await act('buy', { shopId: 'motors', itemId: 'car', qty: 1 });
    expect(r.status).toBe(400);
    expect(r.body.error.code).toBe('insufficient_funds');
    const neg = await act('bank', { op: 'withdraw', amount: -500 });
    expect(neg.status).toBe(400);
    const after = (await c.get(`/api/characters/${id}`)).body.character;
    expect(after.state.coins).toBe(before.state.coins);
    expect(after.rev).toBe(before.rev);
  });

  it('ignores client-submitted reward amounts and unknown actions', async () => {
    const { act } = await withChar();
    expect((await act('grant_coins', { amount: 1e9 })).status).toBe(400);
    const r = await act('use_item', { itemId: 'bread', coins: 1e9, xp: 1e9 });
    expect(r.status).toBe(200);
    expect(r.body.character.state.coins).toBeLessThan(10000);
    expect(r.body.character.state.stats.xp).toBeLessThan(1000);
  });

  it('validates request bodies', async () => {
    const { c, id } = await withChar();
    expect((await c.post(`/api/characters/${id}/actions`).send({ type: 'sleep' })).status).toBe(400); // no key
    expect((await c.post(`/api/characters/${id}/actions`).send({ type: 'sleep', key: 'bad key!' })).status).toBe(400);
    expect((await c.post(`/api/characters/${id}/actions`).set('content-type', 'application/json').send('{"oops"')).status).toBe(400);
    const big = 'x'.repeat(40_000);
    expect((await c.post(`/api/characters/${id}/actions`).send({ type: 'sleep', key: key(), payload: { big } })).status).toBe(413);
  });

  it('records prayer journal entries privately', async () => {
    const { act, c, id } = await withChar();
    await act('sync', { mapId: 'home', x: 6 * 32 + 16, y: 7 * 32 + 31, facing: 'up', elapsedMinutes: 0 });
    const r = await act('pray', { prayerType: 'thanksgiving', place: 'home', journal: 'Grateful for a new start.' });
    expect(r.status).toBe(200);
    const j = await c.get(`/api/characters/${id}/journal`);
    expect(j.body.items[0].text).toBe('Grateful for a new start.');
    const other = await registered();
    expect((await other.get(`/api/characters/${id}/journal`)).status).toBe(404);
  });
});

describe('ending (development trigger) and life report', () => {
  it('ends the story, locks the character, and produces a report; other characters are untouched', async () => {
    const c = await registered();
    const a = (await c.post('/api/characters').send(CHAR)).body.character.id;
    const b = (await c.post('/api/characters').send({ ...CHAR, name: 'Keeper' })).body.character.id;
    const end = await c.post(`/api/dev/characters/${a}/trigger-ending`);
    expect(end.status).toBe(200);
    expect(end.body.ended).toBe(true);
    expect(end.body.character.status).toBe('ended');
    const blocked = await c.post(`/api/characters/${a}/actions`).send({ type: 'sleep', key: key() });
    expect(blocked.status).toBe(409);
    const rep = await c.get(`/api/characters/${a}/report`);
    expect(rep.status).toBe(200);
    expect(rep.body.ended).toBe(true);
    expect(rep.body.report.disclaimer).toMatch(/simulated life/);
    expect(rep.body.report.highlights.some((h) => h.kind === 'ending')).toBe(true);
    const other = await c.get(`/api/characters/${b}`);
    expect(other.body.character.status).toBe('active');
  });
});

describe('scripture', () => {
  it('serves real WEB text for a reference and searches the full Bible', async () => {
    const r = await request(app).get('/api/scripture/passage').query({ ref: 'Matthew 6:6' });
    expect(r.status).toBe(200);
    expect(r.body.passage.verses[0].text).toMatch(/inner room/);
    expect(r.body.passage.translation.id).toBe('WEB');
    const s = await request(app).get('/api/scripture/search').query({ q: 'mustard seed' });
    expect(s.body.total).toBeGreaterThan(3);
    expect((await request(app).get('/api/scripture/passage').query({ ref: 'Hezekiah 3:1' })).status).toBe(404);
    const ch = await request(app).get('/api/scripture/chapter/psa/23');
    expect(ch.body.chapter.verses).toHaveLength(6);
  });

  it('saves favourites per user', async () => {
    const c = await registered();
    expect((await c.post('/api/scripture/favorites').send({ ref: 'Psalm 23:1' })).status).toBe(201);
    const f = await c.get('/api/scripture/favorites');
    expect(f.body.favorites[0].ref).toBe('Psalms 23:1');
    await c.del('/api/scripture/favorites').send({ ref: 'Psalms 23:1' });
    expect((await c.get('/api/scripture/favorites')).body.favorites).toHaveLength(0);
  });
});

describe('settings', () => {
  it('persists and validates audio/accessibility settings', async () => {
    const c = await registered();
    const r = await c.put('/api/settings').send({ musicVolume: 0.2, muted: true, reducedMotion: true });
    expect(r.body.settings).toMatchObject({ musicVolume: 0.2, muted: true, reducedMotion: true, sfxVolume: 0.7 });
    expect((await c.put('/api/settings').send({ musicVolume: 3 })).status).toBe(400);
    expect((await c.get('/api/settings')).body.settings.musicVolume).toBe(0.2);
  });
});
