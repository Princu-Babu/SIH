const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const prisma = require('../lib/prisma');
const { verifyToken } = require('../middleware/auth');
const { createAuditLog, getClientIp } = require('../middleware/auditLog');

const JWT_SECRET = process.env.JWT_SECRET || 'nawi_reportpro_super_secure_jwt_secret_key_2026';

/**
 * POST /api/auth/login
 * Authenticate user, issue JWT, and create audit log
 */
router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const { email, password } = req.body;
      const clientIp = getClientIp(req);

      const user = await prisma.user.findUnique({
        where: { email: email.toLowerCase().trim() },
      });

      if (!user) {
        await createAuditLog({
          action: 'LOGIN_FAILED',
          details: `Failed login attempt for non-existent email: ${email}`,
          ipAddress: clientIp,
        });
        return res.status(401).json({ success: false, message: 'Invalid credentials' });
      }

      if (!user.isActive) {
        await createAuditLog({
          userId: user.id,
          action: 'LOGIN_BLOCKED',
          details: `Deactivated user attempted login: ${email}`,
          ipAddress: clientIp,
        });
        return res.status(403).json({ success: false, message: 'Account is deactivated. Contact Administrator.' });
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        await createAuditLog({
          userId: user.id,
          action: 'LOGIN_FAILED',
          details: `Invalid password attempt for email: ${email}`,
          ipAddress: clientIp,
        });
        return res.status(401).json({ success: false, message: 'Invalid credentials' });
      }

      const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      await createAuditLog({
        userId: user.id,
        action: 'LOGIN',
        entityType: 'User',
        entityId: user.id,
        details: `User ${user.email} (${user.role}) logged in successfully`,
        ipAddress: clientIp,
      });

      return res.json({
        success: true,
        message: 'Authentication successful',
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/auth/logout
 * Log user out and write audit record
 */
router.post('/logout', verifyToken, async (req, res, next) => {
  try {
    const clientIp = getClientIp(req);
    await createAuditLog({
      userId: req.user.id,
      action: 'LOGOUT',
      entityType: 'User',
      entityId: req.user.id,
      details: `User ${req.user.email} logged out`,
      ipAddress: clientIp,
    });

    return res.json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/auth/me
 * Return profile of authenticated user
 */
router.get('/me', verifyToken, async (req, res) => {
  return res.json({
    success: true,
    user: {
      id: req.user.id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
      isActive: req.user.isActive,
    },
  });
});

module.exports = router;
