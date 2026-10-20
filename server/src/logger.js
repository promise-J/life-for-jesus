import pino from 'pino';
import { config } from './config.js';

export const logger = pino({
  level: config.logLevel,
  redact: {
    paths: ['req.headers.cookie', 'req.headers["x-csrf-token"]', 'res.headers["set-cookie"]', 'password', '*.password', 'passwordHash', '*.passwordHash', 'token'],
    censor: '[redacted]',
  },
});
