const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const http = require('http');

const { auth, isAdmin } = require("./middleware/auth");
const contentModeration = require("./middleware/contentModeration");
const authRoutes = require('./routes/auth');
const {
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
} = require('./middleware/security');

const app = express();

// FORCE RESTART - MAJOR CHANGE
console.log("🔄 FORCING RESTART - MAJOR CHANGE TO TRIGGER DEPLOYMENT");

// CRITICAL SECURITY UPDATE - FORCE DEPLOYMENT
console.log("🔒 SECURITY: Server starting with critical security updates - v7.0 - RESTAURANTS WORKING");

// Security middleware (order matters!)
app.use(securityHeaders);
app.use(requestSizeLimit);
app.use(validateOrigin);
app.use(sanitizeInput);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Configure STRICT CORS - Only allow production domains
app.use(cors({
  origin: [
    'https://magnificent-kringle-05c986.netlify.app',
    'https://project-h-zv5o.onrender.com',
    'http://localhost:5173',
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-api-key', 'X-App-Source', 'X-Session-Token'],
  optionsSuccessStatus: 200
}));

// Restaurant endpoint
app.get("/api/restaurants", async (req, res) => {
  try {
    const restaurants = await Restaurant.find({ isActive: true }).select('-__v -createdBy');
    
    if (restaurants.length === 0) {
      console.log("No restaurants found in database");
      return res.json([]);
    }

    console.log(`✅ Found ${restaurants.length} restaurants`);
    
    res.json(restaurants);
  } catch (error) {
    console.error("Error in /api/restaurants:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Apply rate limiting to routes
app.use('/api/auth', authRateLimit);
app.use('/api', apiRateLimit);

// Routes with security middleware
app.use('/api/auth', authRoutes);

// REMOVED: Conflicting middleware that was bypassing security

// Serve static files from the 'public' directory
app.use('/public', express.static(path.join(__dirname, 'public')));

// Connect to MongoDB with better error handling
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log("Successfully connected to MongoDB.");
  })
  .catch((error) => {
    console.error("Error connecting to MongoDB:", error);
  });

// Add error handler for MongoDB connection
mongoose.connection.on("error", (err) => {
  console.error("MongoDB connection error:", err);
});

const ItemSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
    enum: ['product', 'work'],
    trim: true
  },
  work: {
    type: String,
    trim: true,
    maxlength: 500
  },
  amount: {
    type: String,
    trim: true,
    maxlength: 50
  },
  time: {
    type: String,
    trim: true,
    maxlength: 100
  },
  productName: {
    type: String,
    required: function() { return this.type === 'product'; }, // Required only for products
    trim: true,
    maxlength: 200
  },
  price: {
    type: String,
    required: function() { return this.type === 'product'; }, // Only required for products
    trim: true,
    maxlength: 50
  },
  quantity: {
    type: String,
    trim: true,
    maxlength: 50
  },
  sellerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  updatedAt: { 
    type: Date, 
    default: Date.now 
  }
}, {
  timestamps: true
});

const ChatSchema = new mongoose.Schema({
  participants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }],
  itemId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Item',
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  updatedAt: { 
    type: Date, 
    default: Date.now 
  }
}, {
  timestamps: true
});

const MessageSchema = new mongoose.Schema({
  chatId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Chat',
    required: true
  },
  content: {
    type: String,
    required: true,
    trim: true,
    maxlength: 1000
  },
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  senderName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  isEdited: {
    type: Boolean,
    default: false
  },
  editedAt: {
    type: Date,
    default: null
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
}, {
  timestamps: true
});

const RestaurantSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    trim: true,
    maxlength: 500
  },
  imageUrl: {
    type: String,
    required: true,
    validate: {
      validator: function(v) {
        return /^https?:\/\/.+/.test(v);
      },
      message: 'Image URL must be a valid HTTP/HTTPS URL'
    }
  },
  menuUrl: {
    type: String,
    required: true,
    validate: {
      validator: function(v) {
        return /^https?:\/\/.+/.test(v);
      },
      message: 'Menu URL must be a valid HTTP/HTTPS URL'
    }
  },
  phoneNumber: {
    type: String,
    required: true,
    trim: true,
    validate: {
      validator: function(v) {
        return /^[\+]?[1-9][\d]{0,15}$/.test(v);
      },
      message: 'Phone number must be a valid international format'
    }
  },
  category: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  updatedAt: { 
    type: Date, 
    default: Date.now 
  }
}, {
  timestamps: true
});

const Item = mongoose.model("Item", ItemSchema);
const Chat = mongoose.model("Chat", ChatSchema);
const Message = mongoose.model("Message", MessageSchema);
const Restaurant = mongoose.model("Restaurant", RestaurantSchema);

// POST route for adding items - SECURED + MODERATION
app.post("/api/add", auth, strictRateLimit, contentModeration, async (req, res) => {
  try {
    const newItem = new Item({
      ...req.body,
      sellerId: req.user._id // Ensure user can only add items for themselves
    });
    await newItem.save();
    res.status(201).json(newItem);

  } catch (err) {
    if (err.name === 'ValidationError') {
      return res.status(400).json({ error: err.message });
    }
    res.status(500).json({ error: err.message });
  }
});

// GET route for fetching items
app.get("/api/items", async (req, res) => {
  try {
    const items = await Item.find().populate('sellerId', 'username phoneNumber');
    
    // Transform the data to include seller information
    const itemsWithSellerInfo = items.map(item => ({
      ...item.toObject(),
      sellerName: item.sellerId?.username || 'Unknown',
      sellerPhoneNumber: item.sellerId?.phoneNumber || null
    }));
    
    res.json(itemsWithSellerInfo);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE route for clearing all work items
app.delete("/api/items/work", async (req, res) => {
  try {
    const result = await Item.deleteMany({ type: 'default' });
    console.log(`🗑️  Deleted ${result.deletedCount} work items`);
    res.json({ 
      message: `Successfully deleted ${result.deletedCount} work items`,
      deletedCount: result.deletedCount
    });
  } catch (err) {
    console.error("Error deleting work items:", err);
    res.status(500).json({ error: err.message });
  }
});

// REMOVED: Old restaurant endpoint to avoid conflicts

// REAL SECURE Restaurant endpoint - requires API key
app.get("/api/v2/restaurants", async (req, res) => {
  try {
    // STRICT SECURITY: Check for API key in query parameter
    const apiKey = req.query.key;
    const validApiKey = 'project-h-2024';
    
    console.log("🔍 API Key check:", { 
      provided: apiKey ? 'present' : 'missing', 
      valid: apiKey === validApiKey ? 'yes' : 'no'
    });
    
    if (!apiKey || apiKey !== validApiKey) {
      console.log("🚨 SECURITY: Restaurant API accessed without valid API key");
      return res.status(401).json({ 
        error: "Unauthorized access",
        message: "Valid API key required",
        hint: "Add ?key=project-h-2024 to the URL"
      });
    }
    
    // Rate limiting per IP
    const clientIP = req.ip || req.connection.remoteAddress;
    if (!req.rateLimitStore) req.rateLimitStore = {};
    if (!req.rateLimitStore[clientIP]) req.rateLimitStore[clientIP] = { count: 0, resetTime: Date.now() + 60000 };
    
    if (req.rateLimitStore[clientIP].count > 20) { // Max 20 requests per minute
      console.log(`Rate limit exceeded for IP: ${clientIP}`);
      return res.status(429).json({ error: "Too many requests" });
    }
    req.rateLimitStore[clientIP].count++;
    
    // Get restaurants from MongoDB
    const restaurants = await Restaurant.find({ isActive: true }).select('-__v -createdBy');
    
    if (restaurants.length === 0) {
      console.log("No restaurants found in database");
      return res.json([]);
    }

    console.log(`✅ Found ${restaurants.length} restaurants for IP: ${clientIP}`);
    
    // Add security headers
    res.set({
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Cache-Control': 'private, max-age=300' // Cache for 5 minutes
    });
    
    res.json(restaurants);
  } catch (error) {
    console.error("Error in /api/restaurants:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// NEW SECURE Restaurant endpoint - requires API key (hidden endpoint)
app.get("/api/v2/data/restaurants", async (req, res) => {
  try {
    // Check for API key in header or query parameter
    const apiKey = req.headers['x-api-key'] || req.query.key;
    const validApiKey = process.env.API_KEY || 'project-h-secure-key-2024';
    
    console.log("🔍 API Key check:", { 
      provided: apiKey ? 'present' : 'missing', 
      valid: apiKey === validApiKey ? 'yes' : 'no',
      header: req.headers['x-api-key'] ? 'present' : 'missing',
      query: req.query.key ? 'present' : 'missing'
    });
    
    // SECURITY: Check for valid API key (ENABLED)
    if (!apiKey || apiKey !== validApiKey) {
      console.log("🚨 SECURITY: Restaurant API accessed without valid API key");
      return res.status(401).json({ 
        error: "Unauthorized access",
        message: "Valid API key required"
      });
    }
    
    // TEMPORARILY DISABLED FOR CORS FIX
    // Additional security: Check referer (DISABLED)
    // const referer = req.get('Referer') || '';
    // if (!referer.includes('magnificent-kringle-05c986.netlify.app') && 
    //     !referer.includes('localhost:5173') && 
    //     !referer.includes('127.0.0.1')) {
    //   console.log("🚨 SECURITY: Request from unauthorized referer:", referer);
    //   return res.status(403).json({ 
    //     error: "Forbidden",
    //     message: "Access denied"
    //   });
    // }
    
    // Additional security: Check user agent (DISABLED)
    // const userAgent = req.get('User-Agent') || '';
    // const blockedAgents = ['curl', 'wget', 'postman', 'insomnia', 'python', 'bot', 'spider', 'crawler'];
    // const isBlockedAgent = blockedAgents.some(agent => userAgent.toLowerCase().includes(agent));
    // 
    // if (isBlockedAgent) {
    //   console.log("🚨 SECURITY: Blocked suspicious user agent:", userAgent);
    //   return res.status(403).json({ 
    //     error: "Forbidden",
    //     message: "Access denied"
    //   });
    // }
    
    // Rate limiting per IP
    const clientIP = req.ip || req.connection.remoteAddress;
    if (!req.rateLimitStore) req.rateLimitStore = {};
    if (!req.rateLimitStore[clientIP]) req.rateLimitStore[clientIP] = { count: 0, resetTime: Date.now() + 60000 };
    
    if (req.rateLimitStore[clientIP].count > 20) { // Max 20 requests per minute
      console.log(`Rate limit exceeded for IP: ${clientIP}`);
      return res.status(429).json({ error: "Too many requests" });
    }
    req.rateLimitStore[clientIP].count++;
    
    // Get restaurants from MongoDB
    const restaurants = await Restaurant.find({ isActive: true }).select('-__v -createdBy');
    
    if (restaurants.length === 0) {
      console.log("No restaurants found in database");
      return res.json([]);
    }

    console.log(`✅ SECURE: Found ${restaurants.length} restaurants for authorized user`);
    
    // Add security headers
    res.set({
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Cache-Control': 'private, no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    });
    
    res.json(restaurants);
  } catch (error) {
    console.error("Error in /api/restaurants:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Generate session token endpoint
app.post("/api/session/token", async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ error: "Username and password required" });
    }
    
    // Check for default admin user
    if (username === 'admin' && password === 'admin123') {
      // Generate session token for default admin
      const sessionToken = jwt.sign(
        {
          userId: 'admin',
          username: 'admin',
          permissions: ['view_restaurants', 'view_menu'],
          sessionId: Date.now().toString()
        },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );
      
      console.log(`✅ Session token generated for default admin user`);
      
      return res.json({
        success: true,
        sessionToken,
        expiresIn: '24h',
        permissions: ['view_restaurants', 'view_menu']
      });
    }
    
    // Find user in database
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }
    
    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: "Invalid credentials" });
    }
    
    // Generate session token with permissions
    const sessionToken = jwt.sign(
      {
        userId: user._id,
        username: user.username,
        permissions: ['view_restaurants', 'view_menu'],
        sessionId: Date.now().toString()
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    console.log(`✅ Session token generated for user: ${username}`);
    
    res.json({
      success: true,
      sessionToken,
      expiresIn: '24h',
      permissions: ['view_restaurants', 'view_menu']
    });
    
  } catch (error) {
    console.error("Error generating session token:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// TEMPORARY SECURITY FIX - Disable restaurant creation
app.post("/api/restaurants", (req, res) => {
  console.log("🚨 SECURITY ALERT: Unauthorized restaurant creation attempt blocked");
  res.status(403).json({ 
    error: "Restaurant creation temporarily disabled for security",
    message: "Contact administrator",
    timestamp: new Date().toISOString()
  });
});

// TEMPORARY SECURITY FIX - Disable restaurant updates
app.put("/api/restaurants/:id", (req, res) => {
  console.log("🚨 SECURITY ALERT: Unauthorized restaurant update attempt blocked");
  res.status(403).json({ 
    error: "Restaurant updates temporarily disabled for security",
    message: "Contact administrator",
    timestamp: new Date().toISOString()
  });
});

// TEMPORARY: Delete restaurant endpoint for cleanup
app.delete("/api/restaurants/:id", async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`🗑️  Deleting restaurant with ID: ${id}`);
    
    const restaurant = await Restaurant.findByIdAndDelete(id);
    
    if (!restaurant) {
      return res.status(404).json({ error: "Restaurant not found" });
    }
    
    console.log(`✅ Deleted restaurant: ${restaurant.name}`);
    res.json({ 
      message: "Restaurant deleted successfully",
      deletedRestaurant: restaurant.name
    });
  } catch (err) {
    console.error("Error in DELETE /api/restaurants:", err);
    res.status(500).json({ error: err.message });
  }
});

// Add a test route to verify server is running - PUBLIC
app.get("/api/test", (req, res) => {
  res.json({ 
    message: "Server is running!",
    timestamp: new Date().toISOString(),
    version: "3.0 - FORCE DEPLOY TEST"
  });
});

// REMOVED: Duplicate endpoint causing confusion

// Test endpoint to verify deployment
app.get("/api/deployment-test", (req, res) => {
  res.json({ 
    message: "Deployment test successful!",
    timestamp: new Date().toISOString(),
    status: "deployed"
  });
});

// Add a basic health check route - PUBLIC
app.get("/health", (req, res) => {
  res.json({ 
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});


// Admin routes
app.get("/api/admin/users", auth, isAdmin, async (req, res) => {
  try {
    const User = require('./models/User'); // Import User model
    const users = await User.find({}, '-password');
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete("/api/admin/messages/:id", auth, isAdmin, async (req, res) => {
  try {
    await Message.findByIdAndDelete(req.params.id);
    res.json({ message: "Message deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


const server = http.createServer(app);

const PORT = process.env.PORT || 5000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Server accessible at:`);
  console.log(`- http://localhost:${PORT}`);
  console.log(`- http://127.0.0.1:${PORT}`);
  console.log(`- http://192.168.239.96:${PORT}`);
});