import 'dotenv/config';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const env = process.env;
const isProd = env.NODE_ENV === 'production';
const isTest = env.NODE_ENV === 'test' || !!env.VITEST;

if (isProd && (!env.JWT_SECRET || env.JWT_SECRET.length < 32 || env.JWT_SECRET.startsWith('change-me'))) {
  throw new Error('JWT_SECRET must be set to a long random value in production.');
}

export const config = {
  root,
  env: env.NODE_ENV || 'development',
  isProd,
  isTest,
  port: Number(env.PORT) || 4000,
  mongoUrl: env.MONGO_URL || 'mongodb://127.0.0.1:27017/lifeforjesus',
  jwtSecret: env.JWT_SECRET || 'change-me-in-development-only',
  sessionDays: 7,
  corsOrigins: (env.CORS_ORIGIN || '').split(',').map((s) => s.trim()).filter(Boolean),
  cookieSecure: env.COOKIE_SECURE ? env.COOKIE_SECURE === 'true' : isProd,
  cookieSameSite: env.COOKIE_SAMESITE || 'lax',
  devTools: !isProd && env.DEV_TOOLS !== 'false',
  serveClient: env.SERVE_CLIENT !== 'false',
  clientDist: resolve(root, '..', 'client', 'dist'),
  bibleFile: resolve(root, env.BIBLE_DATA_FILE || 'data/web-bible.json'),
  logLevel: env.LOG_LEVEL || (isTest ? 'silent' : 'info'),
  maxCharactersPerUser: 10,
};
