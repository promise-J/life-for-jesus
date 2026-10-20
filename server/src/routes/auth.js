import { Router } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'node:crypto';
import { z } from 'zod';
import { User } from '../models/index.js';
import { HttpError, validate, setSession, clearSession, issueCsrf, authLimiter, requireAuth } from '../middleware/http.js';

const router = Router();

const email = z.string().trim().toLowerCase().email().max(254);
const password = z.string().min(8, 'Password must be at least 8 characters.').max(200);
const displayName = z.string().trim().min(2).max(40).regex(/^[\p{L}\p{M}\p{N}' .-]+$/u, 'Use letters, numbers, spaces, apostrophes, dots or hyphens.');

const publicUser = (u) => ({ id: String(u._id), displayName: u.displayName, email: u.email || null, isGuest: !!u.isGuest });

router.get('/csrf', (req, res) => {
  res.json({ csrfToken: issueCsrf(req, res) });
});

router.get('/me', (req, res) => {
  res.json({ user: req.user ? publicUser(req.user) : null });
});

router.post('/register', authLimiter, validate(z.object({ email, password, displayName })), async (req, res, next) => {
  try {
    const { email: e, password: p, displayName: d } = req.valid.body;
    if (await User.exists({ email: e })) throw new HttpError(409, 'email_taken', 'An account with that email already exists.');
    const user = await User.create({ email: e, passwordHash: await bcrypt.hash(p, 12), displayName: d });
    setSession(res, user);
    res.status(201).json({ user: publicUser(user) });
  } catch (err) {
    if (err?.code === 11000) return next(new HttpError(409, 'email_taken', 'An account with that email already exists.'));
    next(err);
  }
});

router.post('/login', authLimiter, validate(z.object({ email, password: z.string().min(1).max(200) })), async (req, res, next) => {
  try {
    const { email: e, password: p } = req.valid.body;
    const user = await User.findOne({ email: e }).select('+passwordHash');
    const ok = user?.passwordHash && (await bcrypt.compare(p, user.passwordHash));
    if (!ok) throw new HttpError(401, 'bad_credentials', 'Email or password is incorrect.');
    setSession(res, user);
    res.json({ user: publicUser(user) });
  } catch (err) {
    next(err);
  }
});

// Guest play: a real (but credential-less) account so saves persist on this browser's session cookie.
router.post('/guest', authLimiter, async (req, res, next) => {
  try {
    const user = await User.create({ displayName: `Guest ${crypto.randomInt(1000, 9999)}`, isGuest: true });
    setSession(res, user);
    res.status(201).json({ user: publicUser(user) });
  } catch (err) {
    next(err);
  }
});

// Turn a guest into a registered account, keeping all characters.
router.post('/upgrade', authLimiter, requireAuth, validate(z.object({ email, password, displayName: displayName.optional() })), async (req, res, next) => {
  try {
    if (!req.user.isGuest) throw new HttpError(400, 'not_guest', 'This account is already registered.');
    const { email: e, password: p, displayName: d } = req.valid.body;
    if (await User.exists({ email: e })) throw new HttpError(409, 'email_taken', 'An account with that email already exists.');
    req.user.email = e;
    req.user.passwordHash = await bcrypt.hash(p, 12);
    req.user.isGuest = false;
    if (d) req.user.displayName = d;
    await req.user.save();
    setSession(res, req.user);
    res.json({ user: publicUser(req.user) });
  } catch (err) {
    next(err);
  }
});

router.post('/logout', (req, res) => {
  clearSession(res);
  res.json({ ok: true });
});

export default router;
