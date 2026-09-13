/**
 * Deterministic demo launcher.
 *
 * Forces the in-memory demo database regardless of what is installed on the
 * machine, then boots the normal server. Cross-platform (no shell env syntax),
 * so `npm run demo` behaves identically on Windows, macOS and Linux.
 *
 * Use this for evaluation / offline demos. Use `npm run dev` / `npm start`
 * for the PostgreSQL-backed path.
 */
process.env.NAWI_DB_MODE = 'memory';
if (!process.env.NODE_ENV) {
  process.env.NODE_ENV = 'development';
}
require('./src/index.js').startServer();
