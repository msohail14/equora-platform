import jwt from 'jsonwebtoken';

const PASSWORD_CHANGE_PATHS = ['/users/change-password', '/users/force-change-password'];

const authMiddleware = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Authorization token is required.' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET, { issuer: 'equora-api', audience: 'equora-mobile' });
    req.user = decoded;

    // Block all endpoints except password-change when forced change is required
    if (decoded.must_change_password && !PASSWORD_CHANGE_PATHS.includes(req.baseUrl + req.path)) {
      return res.status(403).json({ message: 'Password change required. Please set a new password before continuing.' });
    }

    return next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid or expired token.' });
  }
};

export default authMiddleware;
