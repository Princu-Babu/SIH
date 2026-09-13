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
      testsByModule,
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
      // Individual OIML R-76 test modules actually executed, so the
      // "Tests Conducted by Category" chart reports real module counts rather
      // than a relabelled session-status breakdown.
      prisma.testResult.groupBy({
        by: ['testType'],
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
        testsByModule: testsByModule.map(m => ({
          testType: m.testType,
          count: m._count._all,
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
            select: {
              id: true,
              name: true,
              model: true,
              type: true,
              serialNumber: true,
              accuracyClass: true,
            },
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

/**
 * GET /api/dashboard/trends?months=6
 *
 * Genuine month-by-month verification outcomes for the compliance chart.
 * Previously the client derived this client-side from the 20 most recent
 * sessions and labelled the result "last 6 months", which is not the same
 * thing and silently under-reports whenever more than 20 sessions exist.
 *
 * A session is bucketed by the date it was concluded (completedAt), falling
 * back to when it started. Sessions still open are reported separately and are
 * never counted as compliant — an unfinished verification is not a pass.
 */
router.get('/trends', verifyToken, async (req, res, next) => {
  try {
    const requested = Number.parseInt(req.query.months, 10);
    const months = Number.isFinite(requested) ? Math.min(Math.max(requested, 1), 24) : 6;

    const now = new Date();
    // First instant of the month that begins the window (inclusive).
    const windowStart = new Date(now.getFullYear(), now.getMonth() - (months - 1), 1, 0, 0, 0, 0);

    const buckets = [];
    const indexByKey = new Map();
    for (let i = 0; i < months; i += 1) {
      const d = new Date(windowStart.getFullYear(), windowStart.getMonth() + i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      indexByKey.set(key, buckets.length);
      buckets.push({
        monthKey: key,
        month: d.toLocaleString('en-IN', { month: 'short' }),
        year: d.getFullYear(),
        passed: 0,
        failed: 0,
        inProgress: 0,
      });
    }

    const sessions = await prisma.testSession.findMany({
      where: { createdAt: { gte: windowStart } },
      orderBy: { createdAt: 'asc' },
    });

    for (const session of sessions) {
      const when = new Date(session.completedAt || session.startedAt || session.createdAt);
      if (Number.isNaN(when.getTime())) continue;

      const key = `${when.getFullYear()}-${String(when.getMonth() + 1).padStart(2, '0')}`;
      const idx = indexByKey.get(key);
      if (idx === undefined) continue;

      if (session.status === 'COMPLETED') {
        if (session.overallResult === 'FAIL') buckets[idx].failed += 1;
        else if (session.overallResult === 'PASS') buckets[idx].passed += 1;
      } else if (session.status === 'FAILED') {
        buckets[idx].failed += 1;
      } else {
        buckets[idx].inProgress += 1;
      }
    }

    const totalPassed = buckets.reduce((sum, b) => sum + b.passed, 0);
    const totalFailed = buckets.reduce((sum, b) => sum + b.failed, 0);
    const concluded = totalPassed + totalFailed;

    return res.json({
      success: true,
      months,
      from: windowStart.toISOString(),
      to: now.toISOString(),
      totals: {
        passed: totalPassed,
        failed: totalFailed,
        inProgress: buckets.reduce((sum, b) => sum + b.inProgress, 0),
        // Null (not 100) when nothing has concluded, so the UI can say
        // "no data" instead of claiming a perfect compliance record.
        passRate: concluded > 0 ? Number(((totalPassed / concluded) * 100).toFixed(1)) : null,
      },
      trends: buckets,
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;