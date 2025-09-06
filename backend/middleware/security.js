const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const { body, validationResult } = require('express-validator');

// Rate limiting configurations
const createRateLimit = (windowMs, max, message) => {
  return rateLimit({
    windowMs,
    max,
    message: { error: message },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      res.status(429).json({
        error: message,
        retryAfter: Math.round(windowMs / 1000)
      });
    }
  });
};

// Different rate limits for different endpoints
const authRateLimit = createRateLimit(
  15 * 60 * 1000, // 15 minutes
  5, // 5 attempts per window
  'Too many authentication attempts, please try again later'
);

const apiRateLimit = createRateLimit(
  15 * 60 * 1000, // 15 minutes
  100, // 100 requests per window
  'Too many API requests, please try again later'
);

const strictRateLimit = createRateLimit(
  15 * 60 * 1000, // 15 minutes
  20, // 20 requests per window
  'Rate limit exceeded, please slow down'
);

// Security headers middleware
const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      connectSrc: ["'self'", "https://project-h-zv5o.onrender.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'self'", "https://drive.google.com"],
    },
  },
  crossOriginEmbedderPolicy: false,
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
});

// Input validation middleware
const validateInput = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Invalid input data',
      details: errors.array()
    });
  }
  next();
};

// Sanitize input to prevent XSS
const sanitizeInput = (req, res, next) => {
  const sanitize = (obj) => {
    if (typeof obj === 'string') {
      return obj
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/javascript:/gi, '')
        .replace(/on\w+\s*=/gi, '');
    }
    if (typeof obj === 'object' && obj !== null) {
      for (let key in obj) {
        obj[key] = sanitize(obj[key]);
      }
    }
    return obj;
  };

  req.body = sanitize(req.body);
  req.query = sanitize(req.query);
  req.params = sanitize(req.params);
  next();
};

// Request size limiter
const requestSizeLimit = (req, res, next) => {
  const contentLength = parseInt(req.get('content-length') || '0');
  const maxSize = 10 * 1024 * 1024; // 10MB

  if (contentLength > maxSize) {
    return res.status(413).json({
      error: 'Request entity too large',
      maxSize: '10MB'
    });
  }
  next();
};

// Origin validation middleware
const validateOrigin = (req, res, next) => {
  const allowedOrigins = [
    'https://magnificent-kringle-05c986.netlify.app',
    'https://project-h-zv5o.onrender.com'
  ];

  const origin = req.get('origin');
  
  // Allow requests without origin (like Postman, curl)
  if (!origin) {
    return next();
  }

  if (allowedOrigins.includes(origin)) {
    return next();
  }

  // Block unauthorized origins
  return res.status(403).json({
    error: 'Access denied: Unauthorized origin',
    allowedOrigins: allowedOrigins
  });
};

// API key protection middleware
const protectApiKey = (req, res, next) => {
  const apiKey = req.get('x-api-key');
  const validApiKey = process.env.API_KEY;

  // Skip API key check for public endpoints
  const publicEndpoints = ['/api/test', '/health', '/api/restaurants'];
  if (publicEndpoints.includes(req.path)) {
    return next();
  }

  if (!validApiKey) {
    console.warn('API_KEY not set in environment variables');
    return next(); // Allow if no API key is configured
  }

  if (!apiKey || apiKey !== validApiKey) {
    return res.status(401).json({
      error: 'Invalid or missing API key',
      message: 'This endpoint requires a valid API key'
    });
  }

  next();
};

// Validation schemas
const restaurantValidation = [
  body('name').trim().isLength({ min: 1, max: 100 }).escape(),
  body('description').trim().isLength({ max: 500 }).escape(),
  body('imageUrl').isURL().withMessage('Must be a valid URL'),
  body('menuUrl').isURL().withMessage('Must be a valid URL'),
  body('phoneNumber').isMobilePhone().withMessage('Must be a valid phone number'),
  body('category').trim().isLength({ min: 1, max: 50 }).escape()
];

const authValidation = [
  body('username').trim().isLength({ min: 3, max: 30 }).escape(),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
];

module.exports = {
  authRateLimit,
  apiRateLimit,
  strictRateLimit,
  securityHeaders,
  validateInput,
  sanitizeInput,
  requestSizeLimit,
  validateOrigin,
  protectApiKey,
  restaurantValidation,
  authValidation
};
