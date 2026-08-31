const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const {
  getCertificatePdf,
  getDatasheetPdf,
  verifyCertificate,
} = require('../controllers/reports.controller');

/**
 * Public Verification Route for QR and Market Inspection
 * GET /api/reports/verify/:certificateNo
 */
router.get('/verify/:certificateNo', verifyCertificate);

/**
 * GET /api/reports/:sessionId/certificate
 * Generate and return official Verification Certificate PDF (Protected)
 */
router.get('/:sessionId/certificate', verifyToken, getCertificatePdf);

/**
 * GET /api/reports/:sessionId/datasheet
 * Generate and return detailed Technical Data Sheet PDF (Protected)
 */
router.get('/:sessionId/datasheet', verifyToken, getDatasheetPdf);

module.exports = router;
