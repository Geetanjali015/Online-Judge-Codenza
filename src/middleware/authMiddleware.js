const jwt = require('jsonwebtoken');

/**
 * Verifies a Bearer JWT and exposes its trusted identity claims on req.user.
 */
const verifyToken = (req, res, next) => {
  const authorizationHeader = req.get('authorization');

  if (!authorizationHeader) {
    return res.status(401).json({ message: 'Authentication token is required' });
  }

  const bearerMatch = authorizationHeader.match(/^Bearer\s+(\S+)$/i);

  if (!bearerMatch) {
    return res.status(401).json({ message: 'Malformed authentication token' });
  }

  const token = bearerMatch[1];

  // A JWT must contain header, payload, and signature segments.
  if (token.split('.').length !== 3) {
    return res.status(401).json({ message: 'Malformed authentication token' });
  }

  if (!process.env.JWT_SECRET) {
    console.error('JWT_SECRET is not defined in the environment');
    return res.status(500).json({ message: 'Internal server error' });
  }

  try {
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);

    if (!decodedToken.userId || !decodedToken.role) {
      return res.status(401).json({ message: 'Invalid authentication token' });
    }

    req.user = {
      userId: decodedToken.userId,
      role: decodedToken.role,
    };

    return next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({ message: 'Authentication token has expired' });
    }

    if (error instanceof jwt.JsonWebTokenError && error.message === 'jwt malformed') {
      return res.status(401).json({ message: 'Malformed authentication token' });
    }

    return res.status(401).json({ message: 'Invalid authentication token' });
  }
};

/**
 * Restricts a route to one or more roles after verifyToken has authenticated it.
 */
const authorize = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return res.status(403).json({ message: 'Forbidden' });
  }

  return next();
};

module.exports = {
  authorize,
  verifyToken,
};
