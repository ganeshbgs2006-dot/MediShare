import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { userModel } from '../models/userModel.js';

export async function authenticateToken(req, res, next) {
  try {
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required. No Bearer token provided.'
      });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required. Token is missing.'
      });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, env.jwt.secret);
    } catch (jwtErr) {
      if (jwtErr.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          error: 'Session expired. Please sign in again.',
          code: 'TOKEN_EXPIRED'
        });
      }
      return res.status(403).json({
        success: false,
        error: 'Invalid authentication token.',
        code: 'TOKEN_INVALID'
      });
    }

    // Verify user still exists in database
    const user = await userModel.findById(decoded.id);
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'User account associated with this token no longer exists.'
      });
    }

    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
}

export default authenticateToken;

