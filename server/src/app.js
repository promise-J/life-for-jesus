import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import pinoHttp from 'pino-http';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { config } from './config.js';
import { logger } from './logger.js';
import { dbReady } from './db.js';
import { loadUser, csrfProtection, notFound, errorHandler, apiLimiter, HttpError } from './middleware/http.js';
import authRoutes from './routes/auth.js';
import characterRoutes from './routes/characters.js';
import devRoutes from './routes/dev.js';
import { scripture, settings, publicConfig } from './routes/misc.js';
import { loadBible } from './services/bible.js';

export function createApp() {
  loadBible();
  const app = express();
  app.disable('x-powered-by');
  app.set('trust proxy', 1);
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", 'data:', 'blob:'],
          fontSrc: ["'self'", 'data:'],
          connectSrc: ["'self'"],
          mediaSrc: ["'self'", 'data:', 'blob:'],
          workerSrc: ["'self'", 'blob:'],
        },
      },
      crossOriginEmbedderPolicy: false,
    }),
  );
  if (config.corsOrigins.length) app.use(cors({ origin: config.corsOrigins, credentials: true }));
  if (!config.isTest) app.use(pinoHttp({ logger, autoLogging: { ignore: (req) => req.url.startsWith('/assets') } }));
  app.use(express.json({ limit: '32kb' }));
  app.use(cookieParser());

  app.get('/api/health', (_req, res) => res.json({ ok: true, db: dbReady() }));
  app.use('/api', apiLimiter);
  app.use('/api', (req, _res, next) => (dbReady() || req.path === '/config' ? next() : next(new HttpError(503, 'db_unavailable', 'The game server cannot reach its database right now. Please try again shortly.'))));
  app.use('/api', loadUser, csrfProtection);
  app.use('/api/config', publicConfig);
  app.use('/api/auth', authRoutes);
  app.use('/api/characters', characterRoutes);
  app.use('/api/scripture', scripture);
  app.use('/api/settings', settings);
  if (config.devTools) {
    app.use('/api/dev', devRoutes);
    logger.warn('Development tools are ENABLED (/api/dev). They are never mounted when NODE_ENV=production.');
  }
  app.use('/api', notFound);

  if (config.serveClient && existsSync(join(config.clientDist, 'index.html'))) {
    app.use(express.static(config.clientDist, { maxAge: '7d', index: false, setHeaders: (res, path) => path.endsWith('.html') && res.setHeader('Cache-Control', 'no-cache') }));
    app.get('*', (_req, res) => res.sendFile(join(config.clientDist, 'index.html')));
  }
  app.use(notFound);
  app.use(errorHandler);
  return app;
}
