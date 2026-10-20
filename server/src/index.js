import { createApp } from './app.js';
import { connectDb } from './db.js';
import { config } from './config.js';
import { logger } from './logger.js';

async function main() {
  const app = createApp();
  const server = app.listen(config.port, () => logger.info(`Life for Jesus server listening on http://localhost:${config.port}`));
  // Keep retrying the database so the server comes up even if MongoDB starts later.
  for (let attempt = 1; ; attempt++) {
    try {
      await connectDb();
      break;
    } catch (e) {
      logger.error({ err: e.message, attempt }, 'MongoDB connection failed; retrying in 5s');
      await new Promise((r) => setTimeout(r, 5000));
    }
  }
  const shutdown = () => {
    logger.info('Shutting down');
    server.close(() => process.exit(0));
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

main();
