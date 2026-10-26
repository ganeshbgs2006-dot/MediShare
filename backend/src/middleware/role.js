/**
 * Role-based authorization middleware
 * @param  {...string} allowedRoles Allowed user roles ('seeker', 'owner', 'admin')
 */
export function authorizeRoles(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized: User authentication is required.'
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: `Forbidden: Access restricted to [${allowedRoles.join(', ')}]. Your current role is '${req.user.role}'.`,
        code: 'ROLE_FORBIDDEN'
      });
    }

    next();
  };
}

/**
 * Equipment Owner verification middleware:
 * Admins bypass check.
 * Owners must have approval_status === 'approved' to list equipment or accept bookings.
 */
export function requireApprovedOwner(req, res, next) {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized: User authentication is required.'
    });
  }

  if (req.user.role === 'admin') {
    return next();
  }

  if (req.user.role !== 'owner') {
    return res.status(403).json({
      success: false,
      error: 'Forbidden: Equipment listing and management is restricted to verified Equipment Owners and Administrators.',
      code: 'ROLE_FORBIDDEN'
    });
  }

  if (req.user.approval_status === 'pending') {
    return res.status(403).json({
      success: false,
      error: 'Your equipment owner account is currently pending administrator verification. You cannot publish equipment listings until approved.',
      code: 'ACCOUNT_PENDING_APPROVAL'
    });
  }

  if (req.user.approval_status === 'rejected') {
    return res.status(403).json({
      success: false,
      error: `Your equipment owner account verification was rejected: ${req.user.approval_reason || 'Please contact platform administration.'}`,
      code: 'ACCOUNT_REJECTED'
    });
  }

  next();
}

export default authorizeRoles;


