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

export default authorizeRoles;
