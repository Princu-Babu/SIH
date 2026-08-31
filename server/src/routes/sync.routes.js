const express = require('express');
const router = express.Router();
const { verifyTokenOptional } = require('../middleware/auth');
const syncController = require('../controllers/sync.controller');

/**
 * GET /api/sync/status
 * Public heartbeat to check central server connectivity and time
 */
router.get('/status', syncController.getSyncStatus);

/**
 * POST /api/sync/batch
 * Process offline inspection batches with transactional deduplication
 */
router.post('/batch', verifyTokenOptional, syncController.syncBatch);

/**
 * POST /api/sync/verify-keys
 * Verify whether specific idempotency keys have already been processed
 */
router.post('/verify-keys', verifyTokenOptional, syncController.verifyKeys);

module.exports = router;
