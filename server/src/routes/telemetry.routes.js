const express = require('express');
const router = express.Router();
const telemetryController = require('../controllers/telemetry.controller');

/**
 * RS-232 / USB Serial Telemetry Routes
 */

// SSE continuous telemetry stream
router.get('/stream', telemetryController.getTelemetryStream);

// Simulator status & configuration
router.get('/status', telemetryController.getTelemetryStatus);
router.post('/config', telemetryController.configureSimulator);

// Dynamic indicator controls
router.post('/set-weight', telemetryController.setTargetWeight);
router.post('/zero', telemetryController.zeroIndicator);
router.post('/tare', telemetryController.tareIndicator);
router.post('/clear-tare', telemetryController.clearTare);

module.exports = router;
