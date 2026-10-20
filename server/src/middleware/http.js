import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import rateLimit from 'express-rate-limit';
import { ZodError } from 'zod';
import { config } from '../config.js';
import { logger } from '../logger.js';
import { User } from '../models/index.js';

export class HttpError extends Error {
  constructor(status, code, message, details) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export const SESSION_COOKIE = 'lfj_session';
export const CSRF_COOKIE = 'lfj_csrf';

function cookieBase() {
  return { secure: config.cookieSecure, sameSite: config.cookieSameSite, path: '/' };
}

export function setSession(res, user) {
  const token = jwt.sign({ sub: String(user._id), guest: !!user.isGuest }, config.jwtSecret, { expiresIn: `${config.sessionDays}d` });
  res.cookie(SESSION_COOKIE, token, { ...cookieBase(), httpOnly: true, maxAge: config.sessionDays * 86400_000 });
}

export function clearSession(res) {
  res.clearCookie(SESSION_COOKIE, { ...cookieBase(), httpOnly: true });
}

export function issueCsrf(req, res) {
  let token = req.cookies?.[CSRF_COOKIE];
  if (!token || !/^[a-f0-9]{64}$/.test(token)) {
    token = crypto.randomBytes(32).toString('hex');
    res.cookie(CSRF_COOKIE, token, { ...cookieBase(), httpOnly: false, maxAge: config.sessionDays * 86400_000 });
  }
  return token;
}

/** Double-submit CSRF protection for every state-changing request. */
export function csrfProtection(req, res, next) {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();
  const cookie = req.cookies?.[CSRF_COOKIE];
  const header = req.get('x-csrf-token');
  if (!cookie || !header || cookie.length !== header.length || !crypto.timingSafeEqual(Buffer.from(cookie), Buffer.from(header))) {
    return next(new HttpError(403, 'csrf', 'Security token missing or invalid. Please refresh the page.'));
  }
  next();
}

export async function loadUser(req, _res, next) {
  const token = req.cookies?.[SESSION_COOKIE];
  if (!token) return next();
  try {
    const payload = jwt.verify(token, config.jwtSecret);
    const user = await User.findById(payload.sub);
    if (user) req.user = user;
  } catch {
    // invalid/expired token: treat as signed out
  }
  next();
}

export function requireAuth(req, _res, next) {
  if (!req.user) return next(new HttpError(401, 'unauthenticated', 'Please sign in or start as a guest.'));
  next();
}

export const validate = (schema, where = 'body') => (req, _res, next) => {
  const parsed = schema.safeParse(req[where]);
  if (!parsed.success) return next(new HttpError(400, 'validation', 'Some details are not valid.', parsed.error.issues.map((i) => ({ path: i.path.join('.'), message: i.message }))));
  req.valid = { ...(req.valid || {}), [where]: parsed.data };
  next();
};

const limiterOpts = { standardHeaders: 'draft-7', legacyHeaders: false, skip: () => config.isTest };
export const authLimiter = rateLimit({ ...limiterOpts, windowMs: 15 * 60_000, limit: 30, message: { error: { code: 'rate_limited', message: 'Too many attempts. Please wait a few minutes.' } } });
export const actionLimiter = rateLimit({ ...limiterOpts, windowMs: 60_000, limit: 240, message: { error: { code: 'rate_limited', message: 'Slow down a little.' } } });
export const apiLimiter = rateLimit({ ...limiterOpts, windowMs: 60_000, limit: 600, message: { error: { code: 'rate_limited', message: 'Too many requests.' } } });

export function notFound(_req, _res, next) {
  next(new HttpError(404, 'not_found', 'Not found.'));
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, _next) {
  let status = err.status || 500;
  let code = err.code || 'server_error';
  let message = err.message || 'Something went wrong.';
  let details = err.details;
  if (err instanceof ZodError) {
    status = 400;
    code = 'validation';
    message = 'Some details are not valid.';
    details = err.issues;
  } else if (err.type === 'entity.too.large') {
    status = 413;
    code = 'too_large';
    message = 'Request too large.';
  } else if (err.type === 'entity.parse.failed') {
    status = 400;
    code = 'bad_json';
    message = 'Malformed request.';
  } else if (err.name === 'CastError') {
    status = 404;
    code = 'not_found';
    message = 'Not found.';
  }
  if (status >= 500) {
    logger.error({ err: { message: err.message, stack: err.stack }, path: req.path }, 'request failed');
    message = 'Something went wrong on our side. Your progress is safe — please try again.';
    code = 'server_error';
    details = undefined;
  }
  res.status(status).json({ error: { code, message, ...(details ? { details } : {}) } });
}
