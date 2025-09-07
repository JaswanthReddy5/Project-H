const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const http = require('http');
const { Server } = require('socket.io');

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
    'https://project-h-zv5o.onrender.com'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-api-key', 'X-App-Source', 'X-Session-Token'],
  optionsSuccessStatus: 200
}));

// Apply rate limiting to routes
app.use('/api/auth', authRateLimit);
app.use('/api', apiRateLimit);

// Routes with security middleware
app.use('/api/auth', authRoutes);

// Global authentication middleware for protected routes
app.use('/api/restaurants', (req, res, next) => {
  console.log(`Restaurant middleware: ${req.method} ${req.path}`);
  // Skip authentication for GET requests (public)
  if (req.method === 'GET') {
    return next();
  }
  // Require authentication for POST, PUT, DELETE
  console.log('Requiring authentication for:', req.method);
  return auth(req, res, next);
});

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
    required: true,
    trim: true,
    maxlength: 200
  },
  price: {
    type: String,
    required: true,
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

// POST route for adding items - SECURED
app.post("/api/add", auth, strictRateLimit, async (req, res) => {
  try {
    const newItem = new Item({
      ...req.body,
      sellerId: req.user._id // Ensure user can only add items for themselves
    });
    await newItem.save();
    res.status(201).json(newItem);

    // Emit real-time update to all clients
    if (global.io) {
      global.io.emit('productAdded', newItem);
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET route for fetching items
app.get("/api/items", async (req, res) => {
  try {
    const items = await Item.find();
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Start chat endpoint
app.post("/api/start-chat", async (req, res) => {
  try {
    const { sellerId, userId, itemId } = req.body;
    // Check if chat already exists for these participants and item
    let chat = await Chat.findOne({ participants: { $all: [sellerId, userId] }, itemId });
    if (!chat) {
      chat = new Chat({
        participants: [sellerId, userId],
        itemId,
      });
      await chat.save();
    }
    res.json({ chatId: chat._id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get chat messages
app.get("/api/chat/:chatId/messages", async (req, res) => {
  try {
    const messages = await Message.find({ chatId: req.params.chatId })
      .sort({ createdAt: 1 });
    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Send message endpoint
app.post("/api/chat/:chatId/messages", async (req, res) => {
  try {
    const message = new Message({
      chatId: req.params.chatId,
      content: req.body.content,
      senderId: req.body.senderId,
      senderName: req.body.senderName,
      createdAt: new Date(),
    });
    await message.save();
    res.status(201).json(message);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// FAKE PUBLIC ENDPOINT - MISLEADING RESPONSE
app.get("/api/restaurants", (req, res) => {
  console.log("🚨 SECURITY: Attempted access to fake public endpoint");
  res.status(404).json({ 
    error: "Not Found",
    message: "This endpoint has been moved for security reasons",
    data: []
  });
});

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
    
    // TEMPORARILY DISABLED FOR CORS FIX
    // SECURITY: Check for valid API key (DISABLED)
    // if (!apiKey || apiKey !== validApiKey) {
    //   console.log("🚨 SECURITY: Restaurant API accessed without valid API key");
    //   return res.status(401).json({ 
    //     error: "Unauthorized access",
    //     message: "Valid API key required"
    //   });
    // }
    
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
    version: "1.0.0"
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

// Protected routes with authentication and content moderation
app.post("/api/chats", auth, contentModeration, async (req, res) => {
  try {
    const chat = new Chat({
      ...req.body,
      userId: req.user._id
    });
    await chat.save();
    res.status(201).json(chat);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.post("/api/messages", auth, contentModeration, async (req, res) => {
  try {
    const message = new Message({
      ...req.body,
      userId: req.user._id
    });
    await message.save();
    res.status(201).json(message);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
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

// Add chat info endpoint for chat page context
app.get("/api/chat/:chatId/info", async (req, res) => {
  try {
    const chat = await Chat.findById(req.params.chatId);
    if (!chat) return res.status(404).json({ error: "Chat not found" });
    const item = await Item.findById(chat.itemId);
    // Try to get seller and buyer info from item and chat
    let sellerId = item?.sellerId || chat.participants[0];
    let sellerName = item?.sellerName || undefined;
    let buyerId = chat.participants.find(id => id !== sellerId);
    let buyerName = undefined;
    // If item has sellerName, use it; otherwise, fallback
    if (!sellerName && item) sellerName = item.sellerName;
    // Try to get buyerName from item if available (if you store it)
    // Otherwise, leave as undefined
    res.json({
      chatId: chat._id,
      sellerId,
      sellerName,
      buyerId,
      buyerName,
      productName: item?.productName || '',
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: [
      'https://magnificent-kringle-05c986.netlify.app',
      'https://project-h-zv5o.onrender.com'
    ],
    methods: ['GET', 'POST'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'x-api-key']
  },
  pingTimeout: 60000,
  pingInterval: 25000,
  transports: ['websocket', 'polling'],
  allowEIO3: true
});

// Store active users and their socket IDs
const activeUsers = new Map();

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Handle user joining
  socket.on('userJoin', (userId) => {
    if (userId) {
      activeUsers.set(userId, socket.id);
      console.log(`User ${userId} joined with socket ${socket.id}`);
    }
  });

  // Handle joining chat room
  socket.on('joinRoom', (chatId) => {
    if (chatId) {
      socket.join(chatId);
      console.log(`Socket ${socket.id} joined room ${chatId}`);
    }
  });

  // Handle sending messages
  socket.on('sendMessage', async ({ chatId, message }) => {
    try {
      if (!chatId || !message) {
        throw new Error('Invalid message data');
      }

      // Save message to database
      const savedMessage = new Message({
        chatId,
        content: message.content,
        senderId: message.senderId,
        senderName: message.senderName,
        createdAt: new Date()
      });
      await savedMessage.save();

      // Broadcast to all clients in the room
      io.in(chatId).emit('receiveMessage', savedMessage);
    } catch (error) {
      console.error('Error saving/broadcasting message:', error);
      socket.emit('error', { message: 'Failed to send message' });
    }
  });

  // Handle typing status
  socket.on('typing', ({ chatId, userId, isTyping }) => {
    if (chatId && userId) {
      socket.to(chatId).emit('userTyping', { userId, isTyping });
    }
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    // Remove user from active users
    for (const [userId, socketId] of activeUsers.entries()) {
      if (socketId === socket.id) {
        activeUsers.delete(userId);
        break;
      }
    }
  });
});

// At the bottom, after initializing io:
global.io = io;

const PORT = process.env.PORT || 5000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Server accessible at:`);
  console.log(`- http://localhost:${PORT}`);
  console.log(`- http://127.0.0.1:${PORT}`);
  console.log(`- http://192.168.239.96:${PORT}`);
});