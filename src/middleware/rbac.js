/**
 * Role-Based Access Control Middleware
 * Checks if the authenticated user has one of the allowed roles
 * Must be used AFTER the authenticate middleware
 * 
 * @param  {...string} roles - Allowed roles (e.g., 'ADMIN', 'USER')
 */
function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Autentikasi diperlukan.',
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Anda tidak memiliki izin untuk mengakses resource ini.',
      });
    }

    next();
  };
}

module.exports = { authorize };
