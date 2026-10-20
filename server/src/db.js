import mongoose from 'mongoose';
import { config } from './config.js';
import { logger } from './logger.js';

mongoose.set('strictQuery', true);

export async function connectDb(url = config.mongoUrl) {
  await mongoose.connect(url, { serverSelectionTimeoutMS: 8000 });
  logger.info({ db: mongoose.connection.name }, 'MongoDB connected');
  // Build indexes explicitly so uniqueness guarantees (idempotency keys, emails) are in place.
  await Promise.all(Object.values(mongoose.models).map((m) => m.syncIndexes().catch((e) => logger.warn({ err: e.message, model: m.modelName }, 'index sync failed'))));
  return mongoose.connection;
}

export async function disconnectDb() {
  await mongoose.disconnect();
}

export function dbReady() {
  return mongoose.connection.readyState === 1;
}
