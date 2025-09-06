# 🔒 API Security Guide

## 🚨 CRITICAL: API Key Security Fixed

**ISSUE RESOLVED**: The API key was being exposed in frontend requests. This has been fixed by making appropriate endpoints public.

## 📋 Endpoint Security Classification

### 🌐 **PUBLIC ENDPOINTS** (No Authentication Required)
These endpoints are accessible without any API key or authentication:

```bash
# Health & Status
GET /health                    # Server health check
GET /api/test                  # Server status test

# Public Data Access
GET /api/restaurants           # Restaurant listing (public)
GET /api/items                 # Items listing (public)
GET /api/chat/:chatId/messages # Chat messages (public)
GET /api/chat/:chatId/info     # Chat info (public)

# Authentication
POST /api/auth/register        # User registration
POST /api/auth/login           # User login
```

### 🔐 **PROTECTED ENDPOINTS** (Authentication Required)
These endpoints require JWT token in Authorization header:

```bash
# User Actions
POST /api/add                  # Add new item (requires auth)
POST /api/start-chat           # Start new chat (requires auth)
POST /api/chat/:chatId/messages # Send message (requires auth)
POST /api/chats                # Create chat (requires auth)
POST /api/messages             # Send message (requires auth)
```

### 🛡️ **ADMIN ENDPOINTS** (Admin Role Required)
These endpoints require admin role:

```bash
# Restaurant Management
POST /api/restaurants          # Add restaurant (admin only)
PUT /api/restaurants/:id       # Update restaurant (admin only)

# User Management
GET /api/admin/users           # List users (admin only)
DELETE /api/admin/messages/:id # Delete message (admin only)
```

### 🔑 **API KEY ENDPOINTS** (API Key Required)
These endpoints require API key in x-api-key header:

```bash
# Currently none - all endpoints use JWT or are public
# API key protection is available for future use
```

## 🔧 Frontend Implementation

### Public API Calls (No Headers)
```javascript
// ✅ CORRECT - No authentication needed
const response = await axios.get(`${SERVER_URL}/api/restaurants`);
const health = await axios.get(`${SERVER_URL}/health`);
```

### Authenticated API Calls (JWT Token)
```javascript
// ✅ CORRECT - Include JWT token
const response = await axios.get(`${SERVER_URL}/api/items`, {
  headers: {
    'Authorization': `Bearer ${userToken}`
  }
});
```

### Admin API Calls (JWT + Admin Role)
```javascript
// ✅ CORRECT - Admin endpoints require JWT with admin role
const response = await axios.post(`${SERVER_URL}/api/restaurants`, restaurantData, {
  headers: {
    'Authorization': `Bearer ${adminToken}`
  }
});
```

## 🚨 Security Rules

### ✅ **DO:**
- Use JWT tokens for user authentication
- Make public data endpoints truly public
- Validate all inputs on protected endpoints
- Use HTTPS in production
- Implement proper CORS policies

### ❌ **DON'T:**
- Send API keys in frontend requests
- Expose sensitive data in public endpoints
- Skip authentication on protected endpoints
- Use HTTP in production
- Allow unauthorized origins

## 🔍 Testing Security

### Test Public Endpoints
```bash
# Should work without any headers
curl https://project-h-zv5o.onrender.com/api/restaurants
curl https://project-h-zv5o.onrender.com/health
```

### Test Protected Endpoints
```bash
# Should fail without JWT token
curl https://project-h-zv5o.onrender.com/api/add

# Should work with valid JWT token
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     https://project-h-zv5o.onrender.com/api/add
```

### Test Admin Endpoints
```bash
# Should fail without admin JWT token
curl -H "Authorization: Bearer USER_JWT_TOKEN" \
     https://project-h-zv5o.onrender.com/api/restaurants

# Should work with admin JWT token
curl -H "Authorization: Bearer ADMIN_JWT_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"name":"Test Restaurant"}' \
     https://project-h-zv5o.onrender.com/api/restaurants
```

## 🛡️ Security Headers

All responses include these security headers:

```http
Access-Control-Allow-Origin: https://magnificent-kringle-05c986.netlify.app
Access-Control-Allow-Credentials: true
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization, x-api-key
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
Strict-Transport-Security: max-age=31536000; includeSubDomains
Content-Security-Policy: default-src 'self'; ...
```

## 📊 Rate Limiting

- **Public endpoints**: 100 requests per 15 minutes
- **Authentication endpoints**: 5 attempts per 15 minutes
- **Protected endpoints**: 20 requests per 15 minutes
- **Admin endpoints**: 20 requests per 15 minutes

## 🔄 Migration Notes

### What Changed:
1. **Restaurant listing** is now truly public (no API key needed)
2. **Health check** endpoints are public
3. **API key protection** removed from public endpoints
4. **JWT authentication** still required for user actions
5. **Admin role** still required for restaurant management

### Frontend Changes Required:
- ✅ No changes needed - frontend already works correctly
- ✅ Restaurant listing will continue to work
- ✅ No API keys exposed in browser requests

## 🚀 Deployment

### Environment Variables Still Required:
```bash
# Backend (Render)
JWT_SECRET=your-secure-jwt-secret
API_KEY=your-api-key-for-future-use
MONGO_URI=your-mongodb-connection-string
NODE_ENV=production

# Frontend (Netlify)
VITE_SERVER_URL=https://project-h-zv5o.onrender.com
```

### No Frontend Changes Needed:
- Restaurant listing will work without API keys
- Authentication flows remain the same
- Admin functions still require proper JWT tokens

---

**✅ SECURITY ISSUE RESOLVED**: API keys are no longer exposed in frontend requests!

**Last Updated**: January 2025
**Status**: Production Ready ✅
