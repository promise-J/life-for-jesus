// Development-only tools. Mounted only when DEV_TOOLS is enabled AND NODE_ENV is not production.
import { Router } from 'express';
import crypto from 'node:crypto';
import { z } from 'zod';
import { requireAuth, validate } from '../middleware/http.js';
import { getOwnedCharacter, performAction } from '../services/characters.js';
import { logger } from '../logger.js';

const router = Router();
router.use(requireAuth);

const key = () => `dev-${crypto.randomUUID()}`;

router.get('/characters/:id/inspect', async (req, res, next) => {
  try {
    const doc = await getOwnedCharacter(req.user._id, req.params.id, { withSecrets: true });
    res.json({ rev: doc.rev, status: doc.status, endAtMinutes: doc.endAtMinutes, minutes: doc.state.time.minutes, state: doc.state });
  } catch (e) {
    next(e);
  }
});

router.post('/characters/:id/trigger-ending', async (req, res, next) => {
  try {
    logger.info({ character: req.params.id }, 'dev: forcing ending');
    res.json(await performAction(req.user._id, req.params.id, { type: 'talk_end', payload: {}, key: key() }, { forceEnding: true }));
  } catch (e) {
    next(e);
  }
});

router.post('/characters/:id/advance', validate(z.object({ hours: z.number().int().min(1).max(12) })), async (req, res, next) => {
  try {
    res.json(await performAction(req.user._id, req.params.id, { type: 'wait', payload: { hours: req.valid.body.hours }, key: key() }));
  } catch (e) {
    next(e);
  }
});

export default router;
