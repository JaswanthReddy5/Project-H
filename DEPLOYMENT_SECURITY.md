# 🚀 Secure Deployment Guide

## ⚠️ CRITICAL: Before Deploying

### 1. **Environment Variables Setup**

#### For Render.com (Backend):
```bash
# REQUIRED - Set these in Render Dashboard
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/project-h
JWT_SECRET=your-super-secure-jwt-secret-key-here-minimum-32-characters
API_KEY=your-secure-api-key-for-external-access
PORT=5000
NODE_ENV=production
```

#### For Netlify (Frontend):
```bash
# REQUIRED - Set these in Netlify Dashboard
VITE_SERVER_URL=https://project-h-zv5o.onrender.com
```

### 2. **Generate Secure Secrets**

#### Generate JWT Secret (32+ characters):
```bash
# Use this command to generate a secure JWT secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

#### Generate API Key (16+ characters):
```bash
# Use this command to generate a secure API key
node -e "console.log(require('crypto').randomBytes(16).toString('hex'))"
```

## 🔒 Security Features Implemented

### ✅ **CORS Protection**
- Only allows requests from your production domains
- Removed all localhost and development URLs
- Secure credential handling

### ✅ **Rate Limiting**
- Authentication: 5 attempts per 15 minutes
- API calls: 100 requests per 15 minutes
- Strict endpoints: 20 requests per 15 minutes

### ✅ **Input Validation**
- XSS prevention with HTML sanitization
- SQL injection protection
- Request size limits (10MB max)
- Data type validation

### ✅ **Authentication Security**
- JWT with 24-hour expiration
- Account lockout after 5 failed attempts
- Strong password requirements
- Secure token validation

### ✅ **Security Headers**
- Content Security Policy (CSP)
- HTTP Strict Transport Security (HSTS)
- X-Frame-Options protection
- X-Content-Type-Options

### ✅ **API Protection**
- API key authentication for sensitive endpoints
- Admin-only access controls
- Secure error handling

## 🚀 Deployment Steps

### Backend (Render.com)

1. **Push Code to GitHub**
```bash
git add .
git commit -m "Implement comprehensive security measures"
git push origin main
```

2. **Set Environment Variables in Render**
   - Go to your Render dashboard
   - Navigate to your backend service
   - Go to Environment tab
   - Add all required environment variables

3. **Deploy**
   - Render will automatically deploy from your GitHub repo
   - Monitor the deployment logs for any errors

### Frontend (Netlify)

1. **Set Environment Variables in Netlify**
   - Go to your Netlify dashboard
   - Navigate to Site settings
   - Go to Environment variables
   - Add `VITE_SERVER_URL=https://project-h-zv5o.onrender.com`

2. **Redeploy**
   - Go to Deploys tab
   - Click "Trigger deploy" → "Deploy site"

## 🔍 Security Testing

### Test CORS Protection
```bash
# This should be BLOCKED (403 error)
curl -H "Origin: https://malicious-site.com" https://project-h-zv5o.onrender.com/api/restaurants

# This should be ALLOWED (200 OK)
curl -H "Origin: https://magnificent-kringle-05c986.netlify.app" https://project-h-zv5o.onrender.com/api/restaurants
```

### Test Rate Limiting
```bash
# Make multiple rapid requests - should get rate limited
for i in {1..10}; do curl https://project-h-zv5o.onrender.com/api/restaurants; done
```

### Test API Key Protection
```bash
# This should be BLOCKED (401 error)
curl https://project-h-zv5o.onrender.com/api/test

# This should be ALLOWED (200 OK)
curl -H "x-api-key: your-api-key" https://project-h-zv5o.onrender.com/api/test
```

## 🛡️ Security Monitoring

### Check Security Headers
```bash
curl -I https://project-h-zv5o.onrender.com/api/restaurants
```

Look for these headers:
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `Strict-Transport-Security: max-age=31536000`
- `Content-Security-Policy: ...`

### Monitor Logs
- Check Render logs for failed authentication attempts
- Monitor Netlify logs for CORS violations
- Watch for unusual traffic patterns

## ⚠️ Security Warnings

### NEVER Do These:
- ❌ Use default or weak secrets
- ❌ Allow localhost origins in production
- ❌ Disable rate limiting
- ❌ Skip input validation
- ❌ Use HTTP in production
- ❌ Store secrets in code

### ALWAYS Do These:
- ✅ Use strong, unique secrets (32+ characters)
- ✅ Validate all inputs
- ✅ Use HTTPS in production
- ✅ Monitor security logs
- ✅ Keep dependencies updated
- ✅ Test security measures

## 🆘 Emergency Response

### If Security Breach Suspected:
1. **Immediate**: Change all secrets and API keys
2. **Investigate**: Check logs for suspicious activity
3. **Assess**: Determine scope of potential breach
4. **Fix**: Address the vulnerability
5. **Monitor**: Increase monitoring

### Quick Secret Rotation:
```bash
# Generate new secrets
JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
API_KEY=$(node -e "console.log(require('crypto').randomBytes(16).toString('hex'))")

# Update in Render dashboard immediately
```

## 📊 Security Checklist

### Pre-Deployment:
- [ ] Strong JWT_SECRET set (32+ characters)
- [ ] Secure API_KEY set (16+ characters)
- [ ] CORS origins updated to production only
- [ ] NODE_ENV=production set
- [ ] All environment variables configured
- [ ] HTTPS enabled
- [ ] Security headers configured

### Post-Deployment:
- [ ] CORS protection working
- [ ] Rate limiting active
- [ ] Authentication secure
- [ ] API key protection working
- [ ] Security headers present
- [ ] No sensitive data in logs
- [ ] Monitoring active

## 🔗 Useful Commands

### Check Server Status:
```bash
curl https://project-h-zv5o.onrender.com/health
```

### Test Authentication:
```bash
curl -X POST https://project-h-zv5o.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"test","password":"test123"}'
```

### Verify Security Headers:
```bash
curl -I https://project-h-zv5o.onrender.com/api/restaurants
```

---

**🚨 REMEMBER**: Security is an ongoing process. Regularly review and update your security measures!

**Last Updated**: January 2025
**Status**: Production Ready ✅
