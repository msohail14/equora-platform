import authMiddleware from './auth.middleware.js';

const adminAuthMiddleware = (req, res, next) => {
  authMiddleware(req, res, () => {
    if (req.user?.type !== 'admin') {
      return res.status(403).json({ message: 'Admin access only.' });
    }
    return next();
  });
};

export default adminAuthMiddleware;
