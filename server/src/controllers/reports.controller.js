const crypto = require('crypto');
const prisma = require('../lib/prisma');
const { generateCertificatePdf, generateDatasheetPdf } = require('../services/pdfGenerator');
const { createAuditLog, getClientIp } = require('../middleware/auditLog');
const { generateVerificationSeal, verifySealSignature, computeErrorCurvePoints } = require('../services/cryptoSeal');
const { getMPE } = require('../services/mpeCalculator');

/**
 * GET /api/reports/:sessionId/certificate
 * Generate and return official Verification Certificate PDF (authenticated)
 */
async function getCertificatePdf(req, res, next) {
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

    if (req.user) {
      const clientIp = getClientIp(req);
      await createAuditLog({
        userId: req.user.id,
        action: 'GENERATE_CERTIFICATE_PDF',
        entityType: 'TestSession',
        entityId: sessionId,
        details: `Generated official certificate PDF for ${session.certificateNo}`,
        ipAddress: clientIp,
      });
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="Certificate_${session.certificateNo}.pdf"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    return res.send(pdfBuffer);
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/reports/:sessionId/datasheet
 * Generate and return detailed Technical Data Sheet PDF (authenticated)
 */
async function getDatasheetPdf(req, res, next) {
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

    if (req.user) {
      const clientIp = getClientIp(req);
      await createAuditLog({
        userId: req.user.id,
        action: 'GENERATE_DATASHEET_PDF',
        entityType: 'TestSession',
        entityId: sessionId,
        details: `Generated technical data sheet PDF for ${session.certificateNo}`,
        ipAddress: clientIp,
      });
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="Datasheet_${session.certificateNo}.pdf"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    return res.send(pdfBuffer);
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/reports/verify/:certificateNo
 * Public endpoint for QR verification lookup conforming to OIML R-76 and Legal Metrology standard
 */
async function verifyCertificate(req, res, next) {
  try {
    const { certificateNo } = req.params;

    let session = null;
    try {
      if (prisma && prisma.testSession) {
        session = await prisma.testSession.findUnique({
          where: { certificateNo },
          include: {
            instrument: true,
            conductedBy: { select: { id: true, name: true, email: true, role: true } },
            testResults: true,
          },
        });
      }
    } catch (dbErr) {
      session = null;
    }

    if (!session) {
      return res.status(404).json({
        valid: false,
        success: false,
        message: `Certificate with reference '${certificateNo}' was not found in the national registry.`,
      });
    }

    const inst = session.instrument || {};
    const e = Number(inst.verificationInterval || 1);
    const accClass = inst.accuracyClass || 'CLASS_III';

    // Extract or compute error curve data from WEIGHING_PERFORMANCE test results
    const weighingTest = session.testResults?.find(
      (t) => t.testType === 'WEIGHING_PERFORMANCE' || t.testType === 'WEIGHING'
    );

    let errorCurveData = [];
    if (weighingTest && weighingTest.data && Array.isArray(weighingTest.data.points)) {
      errorCurveData = computeErrorCurvePoints(weighingTest.data.points, inst, false);
    } else {
      // Default standard envelope points
      errorCurveData = computeErrorCurvePoints([], inst, false);
    }

    // Determine verification and expiry dates
    const rawDate = session.completedAt || session.createdAt || new Date();
    const verificationDate = rawDate instanceof Date ? rawDate.toISOString() : new Date(rawDate).toISOString();

    const vDateObj = new Date(verificationDate);
    const expDateObj = new Date(vDateObj);
    expDateObj.setFullYear(vDateObj.getFullYear() + 1);
    const expiryDate = expDateObj.toISOString();

    // Check expiration status
    const isExpired = Date.now() > expDateObj.getTime();

    // Status resolution
    let finalStatus = session.status || (session.overallResult === 'PASS' ? 'VERIFIED_LEGAL' : 'REJECTED');
    if (isExpired && finalStatus === 'VERIFIED_LEGAL') {
      finalStatus = 'EXPIRED';
    }

    const officerName = session.conductedBy?.name || (typeof session.conductedBy === 'string' ? session.conductedBy : 'Inspector Vikramaditya Sharma');

    // Build canonical seal payload
    const sealPayload = {
      certificateNo: session.certificateNo,
      instrumentId: inst.id || inst.serialNumber,
      status: session.status || (session.overallResult === 'PASS' ? 'VERIFIED_LEGAL' : 'REJECTED'),
      verificationDate,
      officerId: officerName,
      maxCapacity: inst.maxCapacity,
      verificationInterval: inst.verificationInterval,
    };

    // Generate cryptographic HMAC-SHA256 seal signature
    const computedSeal = generateVerificationSeal(sealPayload);
    let sealSignature = session.verificationSeal || computedSeal;
    let sealVerified = true;

    // SEC-CRIT-05: Verify stored seal using timingSafeEqual against canonical payload
    if (session.verificationSeal) {
      try {
        const storedBuf = Buffer.from(session.verificationSeal.toLowerCase(), 'hex');
        const computedBuf = Buffer.from(computedSeal.toLowerCase(), 'hex');
        if (storedBuf.length === 32 && computedBuf.length === 32 && crypto.timingSafeEqual(storedBuf, computedBuf)) {
          sealVerified = true;
        } else {
          sealVerified = false;
          finalStatus = 'TAMPERED';
        }
      } catch (err) {
        sealVerified = false;
        finalStatus = 'TAMPERED';
      }
    }

    // Check optional incoming seal header or query parameter from QR scanner
    const incomingSeal = req.query.seal || req.headers['x-verify-seal'];
    if (incomingSeal) {
      try {
        const incomingBuf = Buffer.from(String(incomingSeal).toLowerCase(), 'hex');
        const expectedBuf = Buffer.from(sealSignature.toLowerCase(), 'hex');
        if (incomingBuf.length !== 32 || !crypto.timingSafeEqual(incomingBuf, expectedBuf)) {
          sealVerified = false;
        }
      } catch (err) {
        sealVerified = false;
      }
    }

    const isOfficiallyValid =
      (finalStatus === 'VERIFIED_LEGAL' || session.overallResult === 'PASS') &&
      !isExpired &&
      session.status !== 'REJECTED' &&
      sealVerified;

    const responsePayload = {
      valid: isOfficiallyValid,
      success: true,
      certificateNumber: session.certificateNo,
      certificateNo: session.certificateNo,
      instrument: {
        id: inst.id,
        name: inst.name || 'Digital Scale',
        model: inst.model || 'Unknown',
        serialNumber: inst.serialNumber || 'N/A',
        accuracyClass: inst.accuracyClass || 'CLASS_III',
        maxCapacity: Number(inst.maxCapacity || 0),
        minCapacity: Number(inst.minCapacity || 0),
        verificationInterval: Number(inst.verificationInterval || 1),
        actualInterval: Number(inst.actualInterval || inst.verificationInterval || 1),
        unit: inst.unit || 'kg',
        location: inst.location,
        ranges: inst.ranges || inst.multiIntervalRanges,
      },
      verificationDate,
      expiryDate,
      status: finalStatus,
      overallResult: session.overallResult || (finalStatus === 'VERIFIED_LEGAL' ? 'PASS' : 'FAIL'),
      verificationOfficer: {
        name: officerName,
        designation: 'Senior Inspector of Legal Metrology',
        jurisdiction: inst.location || 'Northern Division, Ludhiana Zone',
        email: session.conductedBy?.email,
      },
      conductedBy: officerName,
      sealSignature,
      sealedAt: session.sealedAt || session.completedAt || null,
      sealVerified,
      errorCurveData,
      testResults: session.testResults,
      verifiedAt: new Date().toISOString(),
    };

    return res.json(responsePayload);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getCertificatePdf,
  getDatasheetPdf,
  verifyCertificate,
};
