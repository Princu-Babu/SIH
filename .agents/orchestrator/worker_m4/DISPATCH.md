## 2026-08-30T11:50:27Z
You are Worker M4: Offline PWA & Resilient Sync Queue Specialist for NAWI-ReportPro.
Working directory: d:\sih\.agents\orchestrator\worker_m4
Original Request file: d:\sih\ORIGINAL_REQUEST.md
Project specification: d:\sih\PROJECT.md

Exclusive file ownership:
- `client/public/manifest.json`
- `client/public/sw.js`
- `client/src/services/offlineQueue.js`
- `client/src/hooks/useOfflineSync.js`
- `client/src/components/layout/TopBar.jsx`
- `client/src/main.jsx`
- `server/src/routes/sync.routes.js`
- `server/src/controllers/sync.controller.js`

Mission:
1. Offline PWA frontend foundation: manifest.json, sw.js, register in main.jsx.
2. Resilient Offline Queue in offlineQueue.js: IndexedDB/LocalStorage persistent store, idempotency keys, auto-drain manager.
3. Frontend Sync Hook & Status UI in useOfflineSync.js & TopBar.jsx: live status badge (Online/Offline Mode/Syncing).
4. Backend Batch Sync Endpoint in sync.routes.js & sync.controller.js: POST /api/sync/batch with idempotency key handling, transactional Prisma writes. Mount in server/src/index.js.
5. Verification & Handoff.
