import { Router } from 'express';
import { z } from 'zod';
import { SCRIPTURE_ENTRIES, TOPICS, parseReference } from '@lfj/shared';
import { PlayerSettings, ScriptureFavorite } from '../models/index.js';
import { HttpError, requireAuth, validate } from '../middleware/http.js';
import { getPassage, getChapter, listBooks, search, translationInfo } from '../services/bible.js';
import { config } from '../config.js';

// ───────── Scripture ─────────
export const scripture = Router();

scripture.get('/info', (_req, res) => res.json({ translation: translationInfo() }));
scripture.get('/books', (_req, res) => res.json({ books: listBooks(), translation: translationInfo() }));

scripture.get('/passage', validate(z.object({ ref: z.string().min(3).max(60) }), 'query'), (req, res, next) => {
  const p = getPassage(req.valid.query.ref);
  if (!p) return next(new HttpError(404, 'not_found', 'That reference was not found.'));
  res.json({ passage: p });
});

scripture.get('/chapter/:bookId/:chapter', (req, res, next) => {
  const ch = getChapter(String(req.params.bookId), Number(req.params.chapter));
  if (!ch) return next(new HttpError(404, 'not_found', 'Chapter not found.'));
  res.json({ chapter: ch });
});

scripture.get(
  '/search',
  validate(z.object({ q: z.string().trim().min(2).max(80), page: z.coerce.number().int().min(1).max(500).default(1), testament: z.enum(['OT', 'NT']).optional() }), 'query'),
  (req, res) => {
    const { q, page, testament } = req.valid.query;
    // A reference typed into the search box goes straight to the passage.
    const asRef = parseReference(q) ? getPassage(q) : null;
    res.json({ reference: asRef, ...search(q, { page, testament }) });
  },
);

scripture.get('/entries', validate(z.object({ topic: z.string().max(30).optional() }), 'query'), (req, res) => {
  const { topic } = req.valid.query;
  res.json({ topics: TOPICS, entries: SCRIPTURE_ENTRIES.filter((e) => !topic || e.topics.includes(topic)) });
});

scripture.get('/favorites', requireAuth, async (req, res, next) => {
  try {
    const favs = await ScriptureFavorite.find({ userId: req.user._id }).sort({ createdAt: -1 }).limit(200).lean();
    res.json({ favorites: favs.map((f) => ({ ref: f.ref, note: f.note, createdAt: f.createdAt })) });
  } catch (e) {
    next(e);
  }
});

scripture.post('/favorites', requireAuth, validate(z.object({ ref: z.string().min(3).max(60), note: z.string().max(300).optional() })), async (req, res, next) => {
  try {
    const { ref, note = '' } = req.valid.body;
    const passage = getPassage(ref);
    if (!passage) throw new HttpError(404, 'not_found', 'That reference was not found.');
    const count = await ScriptureFavorite.countDocuments({ userId: req.user._id });
    if (count >= 200) throw new HttpError(409, 'limit', 'You can save up to 200 passages.');
    await ScriptureFavorite.updateOne({ userId: req.user._id, ref: passage.reference }, { $set: { note } }, { upsert: true });
    res.status(201).json({ ok: true, ref: passage.reference });
  } catch (e) {
    next(e);
  }
});

scripture.delete('/favorites', requireAuth, validate(z.object({ ref: z.string().min(3).max(60) })), async (req, res, next) => {
  try {
    await ScriptureFavorite.deleteOne({ userId: req.user._id, ref: req.valid.body.ref });
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

// ───────── Player settings ─────────
export const settings = Router();
settings.use(requireAuth);

const settingsSchema = z.object({
  musicVolume: z.number().min(0).max(1),
  sfxVolume: z.number().min(0).max(1),
  muted: z.boolean(),
  reducedMotion: z.boolean(),
  textScale: z.number().min(0.85).max(1.5),
  touchControls: z.enum(['auto', 'on', 'off']),
}).partial();

const pickSettings = (s) => ({ musicVolume: s.musicVolume, sfxVolume: s.sfxVolume, muted: s.muted, reducedMotion: s.reducedMotion, textScale: s.textScale, touchControls: s.touchControls });

settings.get('/', async (req, res, next) => {
  try {
    const s = (await PlayerSettings.findOne({ userId: req.user._id }).lean()) || new PlayerSettings({ userId: req.user._id }).toObject();
    res.json({ settings: pickSettings(s) });
  } catch (e) {
    next(e);
  }
});

settings.put('/', validate(settingsSchema), async (req, res, next) => {
  try {
    const s = await PlayerSettings.findOneAndUpdate({ userId: req.user._id }, { $set: req.valid.body }, { upsert: true, new: true, setDefaultsOnInsert: true, runValidators: true });
    res.json({ settings: pickSettings(s) });
  } catch (e) {
    next(e);
  }
});

// ───────── Public config ─────────
export const publicConfig = Router();
publicConfig.get('/', (_req, res) => {
  res.json({ devTools: config.devTools, translation: translationInfo(), version: '1.0.0' });
});
