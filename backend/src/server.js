import http from 'http';
import app from './app.js';
import { connectDB } from './config/db.js';

const PORT = process.env.PORT ?? 5000;

const server = http.createServer(app);

const start = async () => {
  try {
    await connectDB();
    server.listen(PORT, () => {
      console.log(`[server] running on http://localhost:${PORT}`);
      console.log(`[server] env: ${process.env.NODE_ENV ?? 'development'}`);
    });
  } catch (err) {
    console.error('[server] failed to start:', err.message);
    process.exit(1);
  }
};

// ── Graceful shutdown ────────────────────────────────────────
const shutdown = (signal) => {
  console.log(`[server] ${signal} received — shutting down`);
  server.close(() => {
    console.log('[server] closed');
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 10_000);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT',  () => shutdown('SIGINT'));
process.on('uncaughtException',  (err) => { console.error('[uncaughtException]', err); process.exit(1); });
process.on('unhandledRejection', (err) => { console.error('[unhandledRejection]', err); process.exit(1); });

start();
