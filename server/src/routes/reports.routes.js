const express = require('express');
const router = express.Router();
const prisma = require('../lib/prisma');
const { verifyToken } = require('../middleware/auth');
const { createAuditLog, getClientIp } = require('../middleware/auditLog');
const { generateCertificatePdf, generateDatasheetPdf } = require('../services/pdfGenerator');

/**
 * GET /api/reports/:sessionId/certificate
 * Generate and return official Verification Certificate PDF
 */
router.get('/:sessionId/certificate', verifyToken, async (req, res, next) => {
  try {
    const { sessionId } = req.params;

    const session = await prisma.testSession.findUnique({
      where: { id: sessionId },
      include: {
        instrument: true,
        conductedBy: { select: { id: true, name: true, email: true, role: true } },
        testResults: true,
      },
    });

    if (!session) {
      return res.status(404).json({ success: false, message: 'Test session not found' });
    }

    const pdfBuffer = await generateCertificatePdf(session);

    const clientIp = getClientIp(req);
    await createAuditLog({
      userId: req.user.id,
      action: 'GENERATE_CERTIFICATE_PDF',
      entityType: 'TestSession',
      entityId: sessionId,
      details: `Generated official certificate PDF for ${session.certificateNo}`,
      ipAddress: clientIp,
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="Certificate_${session.certificateNo}.pdf"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    return res.send(pdfBuffer);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/reports/:sessionId/datasheet
 * Generate and return detailed Technical Data Sheet PDF
 */
router.get('/:sessionId/datasheet', verifyToken, async (req, res, next) => {
  try {
    const { sessionId } = req.params;

    const session = await prisma.testSession.findUnique({
      where: { id: sessionId },
      include: {
        instrument: true,
        conductedBy: { select: { id: true, name: true, email: true, role: true } },
        testResults: true,
      },
    });

    if (!session) {
      return res.status(404).json({ success: false, message: 'Test session not found' });
    }

    const pdfBuffer = await generateDatasheetPdf(session);

    const clientIp = getClientIp(req);
    await createAuditLog({
      userId: req.user.id,
      action: 'GENERATE_DATASHEET_PDF',
      entityType: 'TestSession',
      entityId: sessionId,
      details: `Generated technical data sheet PDF for ${session.certificateNo}`,
      ipAddress: clientIp,
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="Datasheet_${session.certificateNo}.pdf"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    return res.send(pdfBuffer);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/reports/verify/:certificateNo
 * Public or authenticated endpoint for QR verification lookup
 */
router.get('/verify/:certificateNo', async (req, res, next) => {
  try {
    const { certificateNo } = req.params;

    const session = await prisma.testSession.findUnique({
      where: { certificateNo },
      include: {
        instrument: {
          select: { name: true, model: true, serialNumber: true, accuracyClass: true, maxCapacity: true, unit: true, location: true },
        },
        conductedBy: { select: { name: true } },
        testResults: { select: { testType: true, result: true } },
      },
    });

    if (!session) {
      return res.status(404).json({
        success: false,
        message: `Certificate with reference '${certificateNo}' was not found in the national registry.`,
      });
    }

    return res.json({
      success: true,
      verified: true,
      certificateNo: session.certificateNo,
      status: session.status,
      overallResult: session.overallResult,
      instrument: session.instrument,
      conductedBy: session.conductedBy?.name,
      verifiedAt: session.completedAt || session.createdAt,
      testResults: session.testResults,
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
