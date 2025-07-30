const jwt = require('jsonwebtoken');

/**
 * Middleware to authenticate JWT tokens
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {Function} next - Express next function
 */
const authenticateToken = (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ 
        message: 'Access token required',
        error: 'NO_TOKEN'
      });
    }

    // Verify token
    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
      if (err) {
        if (err.name === 'TokenExpiredError') {
          return res.status(401).json({ 
            message: 'Token has expired',
            error: 'TOKEN_EXPIRED'
          });
        } else if (err.name === 'JsonWebTokenError') {
          return res.status(401).json({ 
            message: 'Invalid token',
            error: 'INVALID_TOKEN'
          });
        } else {
          return res.status(401).json({ 
            message: 'Token verification failed',
            error: 'TOKEN_VERIFICATION_FAILED'
          });
        }
      }

      // Add user info to request object
      req.user = {
        userId: decoded.userId,
        email: decoded.email
      };

      next();
    });
  } catch (error) {
    console.error('Authentication middleware error:', error);
    res.status(500).json({ 
      message: 'Server error during authentication',
      error: 'AUTH_SERVER_ERROR'
    });
  }
};

/**
 * Optional authentication middleware - continues even without token
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {Function} next - Express next function
 */
const optionalAuth = (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      req.user = null;
      return next();
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
      if (err) {
        req.user = null;
      } else {
        req.user = {
          userId: decoded.userId,
          email: decoded.email
        };
      }
      next();
    });
  } catch (error) {
    console.error('Optional auth middleware error:', error);
    req.user = null;
    next();
  }
};

module.exports = {
  authenticateToken,
  optionalAuth
};
