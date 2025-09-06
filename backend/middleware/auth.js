const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        error: 'Access denied. No token provided.',
        code: 'NO_TOKEN'
      });
    }

    const token = authHeader.replace('Bearer ', '');
    
    if (!token || token.length < 10) {
      return res.status(401).json({ 
        error: 'Invalid token format.',
        code: 'INVALID_TOKEN'
      });
    }

    // Verify JWT with additional security checks
    const decoded = jwt.verify(token, process.env.JWT_SECRET, {
      algorithms: ['HS256'], // Only allow HS256 algorithm
      clockTolerance: 30 // Allow 30 seconds clock skew
    });

    // Check if token has required fields
    if (!decoded.id || !decoded.iat) {
      return res.status(401).json({ 
        error: 'Invalid token payload.',
        code: 'INVALID_PAYLOAD'
      });
    }

    // Check token expiration manually (additional security)
    const now = Math.floor(Date.now() / 1000);
    if (decoded.exp && decoded.exp < now) {
      return res.status(401).json({ 
        error: 'Token has expired.',
        code: 'TOKEN_EXPIRED'
      });
    }

    // Find user and verify they still exist
    const user = await User.findOne({ _id: decoded.id }).select('-password');
    if (!user) {
      return res.status(401).json({ 
        error: 'User not found.',
        code: 'USER_NOT_FOUND'
      });
    }

    // Check if user is still active (you can add isActive field to User model)
    if (user.isActive === false) {
      return res.status(401).json({ 
        error: 'Account is deactivated.',
        code: 'ACCOUNT_DEACTIVATED'
      });
    }

    req.user = user;
    req.token = token;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error.message);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        error: 'Invalid token.',
        code: 'INVALID_TOKEN'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        error: 'Token has expired.',
        code: 'TOKEN_EXPIRED'
      });
    }
    
    res.status(401).json({ 
      error: 'Authentication failed.',
      code: 'AUTH_FAILED'
    });
  }
};

const isAdmin = async (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ error: 'Access denied. Admin only.' });
  }
};

module.exports = { auth, isAdmin }; 