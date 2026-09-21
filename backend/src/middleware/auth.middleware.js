const jwt = require('jsonwebtoken');

function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: { message: 'Access denied. No authentication token provided.' },
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'blueneedle_super_secure_jwt_token_key_waleed_8956_production');
    req.user = decoded;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: { message: 'Session expired. Please log in again.' },
      });
    }
    return res.status(401).json({
      success: false,
      error: { message: 'Invalid authentication token.' },
    });
  }
}

module.exports = {
  requireAuth,
};
