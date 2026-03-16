import adminAuthMiddleware from './admin-auth.middleware.js';

const superAdminOnly = (req, res, next) => {
  adminAuthMiddleware(req, res, () => {
    if (req.user?.role !== 'super_admin') {
      return res.status(403).json({ message: 'Super admin access required.' });
    }
    return next();
  });
};

export default superAdminOnly;
