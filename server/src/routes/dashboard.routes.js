const express = require('express');
const router = express.Router();
const prisma = require('../lib/prisma');
const { verifyToken } = require('../middleware/auth');

/**
 * GET /api/dashboard/stats
 * Aggregate key metrics, KPI counts, and pass/fail distributions
 */
router.get('/stats', verifyToken, async (req, res, next) => {
  try {
    const [
      totalInstruments,
      activeInstruments,
      totalTestSessions,
      completedTests,
      inProgressTests,
      passedTests,
      failedTests,
      instrumentsByClass,
      instrumentsByType,
    ] = await Promise.all([
      prisma.instrument.count(),
      prisma.instrument.count({ where: { isActive: true } }),
      prisma.testSession.count(),
      prisma.testSession.count({ where: { status: 'COMPLETED' } }),
      prisma.testSession.count({ where: { status: 'IN_PROGRESS' } }),
      prisma.testSession.count({ where: { overallResult: 'PASS' } }),
      prisma.testSession.count({ where: { overallResult: 'FAIL' } }),
      prisma.instrument.groupBy({
        by: ['accuracyClass'],
        _count: { _all: true },
      }),
      prisma.instrument.groupBy({
        by: ['type'],
        _count: { _all: true },
      }),
    ]);

    const passRate = completedTests > 0 ? Number(((passedTests / completedTests) * 100).toFixed(1)) : 0;

    return res.json({
      success: true,
      stats: {
        totalInstruments,
        activeInstruments,
        totalTestSessions,
        completedTests,
        inProgressTests,
        passedTests,
        failedTests,
        passRate,
        instrumentsByClass: instrumentsByClass.map(c => ({
          accuracyClass: c.accuracyClass,
          count: c._count._all,
        })),
        instrumentsByType: instrumentsByType.map(t => ({
          type: t.type,
          count: t._count._all,
        })),
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/dashboard/recent
 * Retrieve last 20 test sessions and last 20 audit log entries
 */
router.get('/recent', verifyToken, async (req, res, next) => {
  try {
    const [recentSessions, recentAuditLogs] = await Promise.all([
      prisma.testSession.findMany({
        take: 20,
        orderBy: { createdAt: 'desc' },
        include: {
          instrument: {
            select: { id: true, name: true, serialNumber: true, accuracyClass: true },
          },
          conductedBy: {
            select: { id: true, name: true, email: true },
          },
        },
      }),
      prisma.auditLog.findMany({
        take: 20,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: { id: true, name: true, email: true, role: true },
          },
        },
      }),
    ]);

    return res.json({
      success: true,
      recentSessions,
      recentAuditLogs,
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
