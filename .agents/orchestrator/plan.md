# Orchestration Plan — NAWI-ReportPro

## Phase 0: Survey & Discovery
1. Establish directories `.agents/orchestrator/survey_explorer_1`, `.../survey_explorer_2`, `.../survey_explorer_3`.
2. Dispatch 3 parallel Explorers to investigate:
   - Explorer 1 (Client & UI & Offline PWA): Explore frontend architecture, routes, offline storage, error curves, telemetry UI.
   - Explorer 2 (Server, DB, Telemetry & Public Portal): Explore backend routes, DB schemas, serial protocol simulation, public verification route.
   - Explorer 3 (Metrological Engine & Test Infrastructure): Explore existing metrological calculations, OIML R-76 rules, unit/E2E test setup, build scripts.
3. Collect Explorer handoffs, synthesize findings into `d:\sih\PROJECT.md`.

## Phase 1: Architecture, Feature Inventory & Milestone Decomposition
1. Create `PROJECT.md` at project root with Feature Inventory mapping R1, R2, R3, R4 and test coverage.
2. Define interface contracts between frontend, backend, metrological calculations, telemetry, and offline sync.

## Phase 2: Dual Track Execution
- **Track 1: E2E Testing Orchestrator**
  - Designs opaque-box test runner and test suites (Tier 1: Feature Coverage, Tier 2: Boundary/Corner Cases, Tier 3: Cross-Feature Interactions, Tier 4: Real-World Workload Scenarios).
  - Publishes `TEST_INFRA.md` and signals `TEST_READY.md`.
- **Track 2: Implementation Sub-Orchestrators**
  - **M1**: Metrological & OIML R-76 Hardening (multi-interval/range, tare, expanded uncertainty, boundary load testing).
  - **M2**: Live RS-232/USB Serial Telemetry & Batch CSV Import/Export.
  - **M3**: Dynamic Error Envelope Curves & Public Verification Portal (`/verify/:certificateNo`).
  - **M4**: Offline PWA IndexedDB caching & PostgreSQL reconnect sync queue.
  - **M5**: Final E2E Test Suite Pass (100%) & Tier 5 Adversarial Coverage Hardening.

## Phase 3: Forensic Audit, Verification & Final Delivery
1. Reviewers, Challengers, and Forensic Auditor verify all deliverables with zero tolerance for shortcuts.
2. Verify full client & server builds and test executions pass cleanly.
3. Synthesize final results and deliver completion handoff to Sentinel.
