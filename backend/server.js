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

const app = express();
app.use(express.json());

// Configure CORS with proper origin handling - Updated to include your IP
app.use(cors({
  origin: [
    'http://localhost:5173', 
    'http://localhost:5174',
    'http://192.168.239.96:5173',
    'http://192.168.239.96:5174',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:5174',
    'https://magnificent-kringle-05c986.netlify.app'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Routes
app.use('/api/auth', authRoutes);

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
  type: String,
  work: String,
  amount: String,
  time: String,
  productName: String,
  price: String,
  quantity: String,
  sellerId: String,
});

const ChatSchema = new mongoose.Schema({
  participants: [String],
  itemId: String,
  createdAt: { type: Date, default: Date.now },
});

const MessageSchema = new mongoose.Schema({
  chatId: String,
  content: String,
  senderId: String,
  senderName: String,
  createdAt: { type: Date, default: Date.now },
});

const RestaurantSchema = new mongoose.Schema({
  name: String,
  description: String,
  imageUrl: String,
  menuUrl: String,
  phoneNumber: String,
  category: String,
  createdAt: { type: Date, default: Date.now }
});

const Item = mongoose.model("Item", ItemSchema);
const Chat = mongoose.model("Chat", ChatSchema);
const Message = mongoose.model("Message", MessageSchema);
const Restaurant = mongoose.model("Restaurant", RestaurantSchema);

// POST route for adding items
app.post("/api/add", async (req, res) => {
  try {
    const newItem = new Item(req.body);
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

// Restaurant routes with better error handling
app.get("/api/restaurants", async (req, res) => {
  try {
    // Get restaurants from MongoDB only - no more hardcoded sample data
    const restaurants = await Restaurant.find();
    
    if (restaurants.length === 0) {
      console.log("No restaurants found in database");
      return res.json([]);
    }

    console.log(`Found ${restaurants.length} restaurants in database`);
    res.json(restaurants);
  } catch (error) {
    console.error("Error in /api/restaurants:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.post("/api/restaurants", async (req, res) => {
  try {
    console.log("Adding new restaurant:", req.body);
    const restaurant = new Restaurant(req.body);
    await restaurant.save();
    console.log("Restaurant added successfully");
    res.status(201).json(restaurant);
  } catch (err) {
    console.error("Error in POST /api/restaurants:", err);
    res.status(500).json({ error: err.message });
  }
});

// Add a test route to verify server is running
app.get("/api/test", (req, res) => {
  res.json({ 
    message: "Server is running!",
    timestamp: new Date().toISOString(),
    ip: req.ip
  });
});

// Add a basic health check route
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
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
      'http://localhost:5173', 
      'http://localhost:5174', 
      'http://192.168.35.239:5173', 
      'http://192.168.35.239:5174',
      'http://192.168.239.96:5173',
      'http://192.168.239.96:5174',
      'http://127.0.0.1:5173',
      'http://127.0.0.1:5174',
      'https://magnificent-kringle-05c986.netlify.app'
    ],
    methods: ['GET', 'POST'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization']
  },
  pingTimeout: 60000,
  pingInterval: 25000,
  transports: ['websocket', 'polling']
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