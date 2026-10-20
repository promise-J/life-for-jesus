import { Router } from 'express';
import { z } from 'zod';
import { ACTION_TYPES } from '@lfj/shared';
import { requireAuth, validate, actionLimiter } from '../middleware/http.js';
import {
  listCharacters, createCharacter, getOwnedCharacter, publicCharacter, deleteCharacter, performAction, lifeReport, lifeEvents, journal,
} from '../services/characters.js';

const router = Router();
router.use(requireAuth);

const pageQuery = z.object({ page: z.coerce.number().int().min(1).max(1000).default(1) });

router.get('/', async (req, res, next) => {
  try {
    res.json({ characters: await listCharacters(req.user._id) });
  } catch (e) {
    next(e);
  }
});

const createSchema = z.object({
  name: z.string().max(40),
  gender: z.string().max(20),
  skin: z.string().max(20),
  hair: z.string().max(20),
  hairColor: z.string().max(20),
  outfit: z.string().max(30),
  startAge: z.string().max(30),
  background: z.string().max(30),
  difficulty: z.string().max(20),
  mode: z.string().max(20),
  endingMode: z.string().max(20),
  country: z.string().max(10),
  city: z.string().max(20).optional(),
});

router.post('/', validate(createSchema), async (req, res, next) => {
  try {
    res.status(201).json({ character: await createCharacter(req.user._id, req.valid.body) });
  } catch (e) {
    next(e);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    res.json({ character: publicCharacter(await getOwnedCharacter(req.user._id, req.params.id)) });
  } catch (e) {
    next(e);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    await deleteCharacter(req.user._id, req.params.id);
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

const actionSchema = z.object({
  type: z.enum(ACTION_TYPES),
  payload: z.record(z.unknown()).optional().default({}),
  key: z.string().min(8).max(64),
});

router.post('/:id/actions', actionLimiter, validate(actionSchema), async (req, res, next) => {
  try {
    res.json(await performAction(req.user._id, req.params.id, req.valid.body));
  } catch (e) {
    next(e);
  }
});

router.get('/:id/report', async (req, res, next) => {
  try {
    res.json(await lifeReport(req.user._id, req.params.id));
  } catch (e) {
    next(e);
  }
});

router.get('/:id/events', validate(pageQuery, 'query'), async (req, res, next) => {
  try {
    res.json(await lifeEvents(req.user._id, req.params.id, req.valid.query));
  } catch (e) {
    next(e);
  }
});

router.get('/:id/journal', validate(pageQuery, 'query'), async (req, res, next) => {
  try {
    res.json(await journal(req.user._id, req.params.id, req.valid.query));
  } catch (e) {
    next(e);
  }
});

export default router;
