import crypto from 'node:crypto';
import mongoose from 'mongoose';
import {
  createInitialState, bootstrapState, validateCreation, applyAction, ActionError, scheduleEnding, buildLifeReport,
  levelOf, formatDate, getMap, YEAR,
} from '@lfj/shared';
import { Character, ActionRecord, LifeEvent, JournalEntry } from '../models/index.js';
import { HttpError } from '../middleware/http.js';
import { config } from '../config.js';
import { logger } from '../logger.js';

function summarize(state) {
  return {
    level: levelOf(state.stats.xp),
    age: Math.floor((state.time.minutes - state.profile.birthMinutes) / YEAR),
    coins: state.coins,
    mapId: getMap(state.location.mapId)?.name || state.location.mapId,
    date: formatDate(state.time.minutes),
  };
}

/** What the client may see. Never includes the trumpet schedule or RNG seed. */
export function publicCharacter(doc) {
  const { seed, rngCounter, ...state } = doc.state;
  return {
    id: String(doc._id),
    name: doc.name,
    status: doc.status,
    mode: doc.mode,
    rev: doc.rev,
    summary: doc.summary,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
    state,
  };
}

export async function listCharacters(userId) {
  const docs = await Character.find({ userId }).select('name status mode summary rev createdAt updatedAt').sort({ updatedAt: -1 }).lean();
  return docs.map((d) => ({ id: String(d._id), name: d.name, status: d.status, mode: d.mode, summary: d.summary, updatedAt: d.updatedAt, createdAt: d.createdAt }));
}

export async function createCharacter(userId, input) {
  const errors = validateCreation(input);
  if (errors.length) throw new HttpError(400, 'validation', errors.join(' '));
  const count = await Character.countDocuments({ userId });
  if (count >= config.maxCharactersPerUser) throw new HttpError(409, 'limit', `You can have up to ${config.maxCharactersPerUser} characters. Delete one to make room.`);
  const seed = crypto.randomBytes(12).toString('hex');
  const secret = crypto.randomBytes(16).toString('hex');
  const state = bootstrapState(createInitialState(input, seed));
  const endAtMinutes = scheduleEnding({ secret, endingMode: state.settings.endingMode, startMinutes: state.time.startMinutes, birthMinutes: state.profile.birthMinutes });
  const doc = await Character.create({ userId, name: state.profile.name, mode: state.mode, state, secret, endAtMinutes, summary: summarize(state) });
  await LifeEvent.create({ characterId: doc._id, at: state.time.minutes, date: formatDate(state.time.minutes), kind: 'start', title: `${state.profile.name} arrived in Udoka`, detail: 'A new life begins.', weight: 2, tags: ['life'] });
  return publicCharacter(doc);
}

export async function getOwnedCharacter(userId, id, { withSecrets = false } = {}) {
  if (!mongoose.isValidObjectId(id)) throw new HttpError(404, 'not_found', 'Character not found.');
  const q = Character.findOne({ _id: id, userId });
  if (withSecrets) q.select('+endAtMinutes +secret');
  const doc = await q;
  if (!doc) throw new HttpError(404, 'not_found', 'Character not found.');
  return doc;
}

export async function deleteCharacter(userId, id) {
  const doc = await getOwnedCharacter(userId, id);
  await Promise.all([
    LifeEvent.deleteMany({ characterId: doc._id }),
    JournalEntry.deleteMany({ characterId: doc._id }),
    ActionRecord.deleteMany({ characterId: doc._id }),
  ]);
  await Character.deleteOne({ _id: doc._id, userId });
}

const KEY_RE = /^[A-Za-z0-9_-]{8,64}$/;

/**
 * Apply one authoritative action with idempotency and optimistic concurrency.
 * The same key returns the original result without re-applying (no double rewards or purchases).
 */
export async function performAction(userId, id, { type, payload, key }, extraCtx = {}) {
  if (!KEY_RE.test(key)) throw new HttpError(400, 'validation', 'Invalid request key.');
  const owned = await getOwnedCharacter(userId, id);
  let record;
  try {
    record = await ActionRecord.create({ characterId: owned._id, key, type, status: 'pending' });
  } catch (e) {
    if (e?.code !== 11000) throw e;
    const existing = await ActionRecord.findOne({ characterId: owned._id, key });
    if (existing?.status === 'applied') {
      const doc = await getOwnedCharacter(userId, id);
      return { ...existing.result, replayed: true, character: publicCharacter(doc) };
    }
    throw new HttpError(409, 'in_progress', 'That action is already being processed.');
  }

  try {
    let result;
    let updated;
    for (let attempt = 0; attempt < 4 && !updated; attempt++) {
      const doc = await getOwnedCharacter(userId, id, { withSecrets: true });
      if (doc.status === 'ended') throw new HttpError(409, 'ended', 'This character’s story has ended.');
      const ctx = {
        endAtMinutes: doc.endAtMinutes,
        realElapsedMs: type === 'sync' ? Date.now() - new Date(doc.lastSyncAt).getTime() : undefined,
        ...extraCtx,
      };
      try {
        result = applyAction(doc.state, { type, payload }, ctx);
      } catch (e) {
        if (e instanceof ActionError) throw new HttpError(e.status || 400, e.code, e.message);
        throw e;
      }
      const set = { state: result.state, summary: summarize(result.state) };
      if (type === 'sync') set.lastSyncAt = new Date();
      if (result.ended) {
        set.status = 'ended';
        set.endedAt = new Date();
      }
      // Compare-and-set on `rev` (plain updateOne works on MongoDB and Mongo-compatible servers).
      const w = await Character.updateOne({ _id: doc._id, userId, rev: doc.rev, status: 'active' }, { $set: set, $inc: { rev: 1 } });
      if (w.modifiedCount === 1) updated = await Character.findById(doc._id);
    }
    if (!updated) throw new HttpError(409, 'conflict', 'Your game was updated elsewhere. Please try again.');

    if (result.logs.length) {
      await LifeEvent.insertMany(result.logs.map((l) => ({ ...l, characterId: updated._id })));
    }
    if (result.journal) {
      const st = result.state;
      await JournalEntry.create({ ...result.journal, characterId: updated._id, userId, at: st.time.minutes, date: formatDate(st.time.minutes) });
    }
    const response = {
      messages: result.messages,
      events: result.events.filter((e) => !['flag', 'visit'].includes(e.type)).slice(0, 50),
      ended: result.ended,
    };
    record.status = 'applied';
    record.coinsDelta = result.ledger.reduce((a, l) => a + l.delta, 0);
    record.ledger = result.ledger.slice(0, 40);
    record.result = response;
    await record.save();
    return { ...response, character: publicCharacter(updated) };
  } catch (e) {
    await ActionRecord.deleteOne({ _id: record._id }).catch((err) => logger.warn({ err: err.message }, 'could not release action key'));
    throw e;
  }
}

export async function lifeReport(userId, id) {
  const doc = await getOwnedCharacter(userId, id);
  const events = await LifeEvent.find({ characterId: doc._id }).sort({ weight: -1, at: 1 }).limit(400).lean();
  return { ended: doc.status === 'ended', report: buildLifeReport(doc.state, events) };
}

export async function lifeEvents(userId, id, { page = 1, pageSize = 50 }) {
  const doc = await getOwnedCharacter(userId, id);
  const [items, total] = await Promise.all([
    LifeEvent.find({ characterId: doc._id }).sort({ at: -1, _id: -1 }).skip((page - 1) * pageSize).limit(pageSize).select('-__v -characterId').lean(),
    LifeEvent.countDocuments({ characterId: doc._id }),
  ]);
  return { items, total, page, pageSize };
}

export async function journal(userId, id, { page = 1, pageSize = 20 }) {
  const doc = await getOwnedCharacter(userId, id);
  const [items, total] = await Promise.all([
    JournalEntry.find({ characterId: doc._id, userId }).sort({ at: -1, _id: -1 }).skip((page - 1) * pageSize).limit(pageSize).select('-__v -userId -characterId').lean(),
    JournalEntry.countDocuments({ characterId: doc._id, userId }),
  ]);
  return { items, total, page, pageSize };
}
