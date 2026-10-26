import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { userModel } from '../models/userModel.js';

export const authController = {
  /**
   * Register a new user (Seeker, Owner, or Admin)
   */
  async register(req, res, next) {
    try {
      const {
        fullName,
        email,
        password,
        phone,
        role = 'seeker',
        organizationName,
        serviceArea
      } = req.body;

      // 1. Force strict role boundary - public self-registration cannot create administrators
      const sanitizedRole = role === 'owner' ? 'owner' : 'seeker';

      // 2. Check if user already exists
      const existingUser = await userModel.findByEmail(email);
      if (existingUser) {
        return res.status(409).json({
          success: false,
          error: 'An account with this email address already exists. Please sign in instead.'
        });
      }

      // 3. Hash password securely using bcrypt with 10 salt rounds
      const saltRounds = 10;
      const passwordHash = await bcrypt.hash(password, saltRounds);

      // 4. Create user in database (Seekers start active; owners require admin verification)
      const newUser = await userModel.create({
        fullName,
        email,
        passwordHash,
        phone,
        role: sanitizedRole,
        organizationName: sanitizedRole === 'owner' ? (organizationName || fullName) : null,
        serviceArea: sanitizedRole === 'owner' ? serviceArea : null
      });

      // 5. Generate signed JWT token
      const token = jwt.sign(
        {
          id: newUser.id,
          email: newUser.email,
          role: newUser.role
        },
        env.jwt.secret,
        { expiresIn: env.jwt.expiresIn }
      );

      const message = sanitizedRole === 'owner'
        ? 'Partner registration submitted successfully. Your account is currently pending administrator verification before equipment can be published.'
        : 'Account created successfully.';

      return res.status(201).json({
        success: true,
        message,
        token,
        user: {
          ...newUser,
          approvalStatus: newUser.approvalStatus
        }
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * Authenticate user credentials and return JWT session token
   */
  async login(req, res, next) {
    try {
      const { email, password } = req.body;

      // 1. Lookup user by email
      const user = await userModel.findByEmail(email);
      if (!user) {
        return res.status(401).json({
          success: false,
          error: 'Invalid email or password.'
        });
      }

      // 2. Compare supplied password against stored bcrypt hash
      const isMatch = await bcrypt.compare(password, user.password_hash);
      if (!isMatch) {
        return res.status(401).json({
          success: false,
          error: 'Invalid email or password.'
        });
      }

      // Check account active state
      if (!user.is_active) {
        return res.status(403).json({
          success: false,
          error: 'Your account has been deactivated or suspended: ' + (user.status_reason || 'Please contact platform administration.'),
          code: 'ACCOUNT_SUSPENDED'
        });
      }

      // 3. Generate signed JWT token
      const token = jwt.sign(
        {
          id: user.id,
          email: user.email,
          role: user.role
        },
        env.jwt.secret,
        { expiresIn: env.jwt.expiresIn }
      );

      // 4. Sanitize user object (omit password_hash)
      const sanitizedUser = {
        id: user.id,
        fullName: user.full_name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        organizationName: user.organization_name,
        serviceArea: user.service_area,
        isVerified: Boolean(user.is_verified),
        approvalStatus: user.approval_status || 'approved',
        approvalReason: user.approval_reason,
        createdAt: user.created_at
      };

      return res.status(200).json({
        success: true,
        message: 'Signed in successfully.',
        token,
        user: sanitizedUser
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * Return currently authenticated user profile
   */
  async me(req, res) {
    const user = req.user;
    return res.status(200).json({
      success: true,
      user: {
        id: user.id,
        fullName: user.full_name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        organizationName: user.organization_name,
        serviceArea: user.service_area,
        isVerified: Boolean(user.is_verified),
        approvalStatus: user.approval_status || 'approved',
        approvalReason: user.approval_reason,
        createdAt: user.created_at
      }
    });
  },

  /**
   * Client-side logout acknowledgment
   */
  async logout(req, res) {
    return res.status(200).json({
      success: true,
      message: 'Signed out successfully. Token discarded.'
    });
  }
};

export default authController;

