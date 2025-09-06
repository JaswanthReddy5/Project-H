// Security configuration for the application
const crypto = require('crypto');

const securityConfig = {
  // JWT Configuration
  jwt: {
    secret: process.env.JWT_SECRET || crypto.randomBytes(64).toString('hex'),
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
    issuer: 'project-h-api',
    audience: 'project-h-client',
    algorithm: 'HS256'
  },

  // API Key Configuration
  apiKey: {
    secret: process.env.API_KEY || crypto.randomBytes(32).toString('hex'),
    headerName: 'x-api-key'
  },

  // Rate Limiting Configuration
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
    authWindowMs: 15 * 60 * 1000, // 15 minutes
    authMaxAttempts: 5,
    strictWindowMs: 15 * 60 * 1000, // 15 minutes
    strictMaxAttempts: 20
  },

  // CORS Configuration
  cors: {
    allowedOrigins: process.env.ALLOWED_ORIGINS ? 
      process.env.ALLOWED_ORIGINS.split(',') : 
      [
        'https://magnificent-kringle-05c986.netlify.app',
        'https://project-h-zv5o.onrender.com'
      ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-api-key']
  },

  // Security Headers Configuration
  headers: {
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
      }
    },
    hsts: {
      maxAge: parseInt(process.env.HSTS_MAX_AGE) || 31536000,
      includeSubDomains: true,
      preload: true
    }
  },

  // Database Security
  database: {
    connectionTimeout: parseInt(process.env.DB_CONNECTION_TIMEOUT) || 30000,
    socketTimeout: parseInt(process.env.DB_SOCKET_TIMEOUT) || 45000,
    maxPoolSize: 10,
    minPoolSize: 2
  },

  // Password Security
  password: {
    minLength: 6,
    maxLength: 128,
    requireUppercase: false,
    requireLowercase: false,
    requireNumbers: false,
    requireSpecialChars: false,
    saltRounds: 12
  },

  // Account Lockout
  lockout: {
    maxAttempts: 5,
    lockoutDuration: 2 * 60 * 60 * 1000, // 2 hours
    resetAttemptsAfter: 24 * 60 * 60 * 1000 // 24 hours
  },

  // File Upload Security
  upload: {
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024, // 10MB
    allowedTypes: process.env.ALLOWED_FILE_TYPES ? 
      process.env.ALLOWED_FILE_TYPES.split(',') : 
      ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'],
    uploadPath: 'uploads/',
    tempPath: 'temp/'
  },

  // Session Security
  session: {
    secret: process.env.SESSION_SECRET || crypto.randomBytes(32).toString('hex'),
    maxAge: parseInt(process.env.SESSION_MAX_AGE) || 24 * 60 * 60 * 1000, // 24 hours
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'strict'
  },

  // Monitoring and Logging
  monitoring: {
    healthCheckInterval: parseInt(process.env.HEALTH_CHECK_INTERVAL) || 30000,
    metricsEnabled: process.env.METRICS_ENABLED === 'true',
    logLevel: process.env.LOG_LEVEL || 'info',
    logFile: process.env.LOG_FILE || 'logs/app.log'
  },

  // Input Validation
  validation: {
    maxStringLength: 1000,
    maxArrayLength: 100,
    maxObjectDepth: 10,
    sanitizeHtml: true,
    escapeHtml: true
  }
};

// Validate required environment variables
const validateEnvironment = () => {
  const required = ['MONGO_URI', 'JWT_SECRET'];
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    console.warn(`⚠️  Missing required environment variables: ${missing.join(', ')}`);
    console.warn('Using default values. This is NOT recommended for production!');
  }
  
  // Warn about weak secrets
  if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
    console.warn('⚠️  JWT_SECRET should be at least 32 characters long');
  }
  
  if (process.env.API_KEY && process.env.API_KEY.length < 16) {
    console.warn('⚠️  API_KEY should be at least 16 characters long');
  }
};

// Initialize security configuration
const initializeSecurity = () => {
  validateEnvironment();
  
  // Generate secure secrets if not provided
  if (!process.env.JWT_SECRET) {
    process.env.JWT_SECRET = crypto.randomBytes(64).toString('hex');
    console.warn('⚠️  Generated random JWT_SECRET. Set JWT_SECRET in environment for production!');
  }
  
  if (!process.env.API_KEY) {
    process.env.API_KEY = crypto.randomBytes(32).toString('hex');
    console.warn('⚠️  Generated random API_KEY. Set API_KEY in environment for production!');
  }
  
  console.log('🔒 Security configuration initialized');
  return securityConfig;
};

module.exports = {
  securityConfig,
  initializeSecurity,
  validateEnvironment
};
