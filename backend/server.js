const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const { auth, isAdmin } = require("./middleware/auth");
const contentModeration = require("./middleware/contentModeration");
const authRoutes = require('./routes/auth');

const app = express();
app.use(express.json());

// Configure CORS with proper origin handling
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Routes
app.use('/api/auth', authRoutes);

// Serve static files from the 'public' directory
app.use('/public', express.static(path.join(__dirname, 'public')));

// Connect to MongoDB with better error handling
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/Project-H')
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
    const chat = new Chat({
      participants: [sellerId, userId],
      itemId,
    });
    await chat.save();
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
    // Check if restaurants exist
    let restaurants = await Restaurant.find();
    
    // Only add sample data if no restaurants exist
    if (restaurants.length === 0) {
      // Clear any existing restaurants first
      await Restaurant.deleteMany({});
      console.log("Cleared existing restaurants");

      // Add sample data
      const sampleRestaurants = [
        {
          name: "Andra Tiffins&Snakes",
          description: "Authentic Hyderabadi Biryani and Indian cuisine",
          imageUrl: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
          menuUrl: "https://drive.google.com/file/d/1hkMRslqFPQ76LrfJ4UNvfErongZ6_ZH3/view?usp=sharing",
          category: "Indian",
          phoneNumber: "9059937090"
        },
        {
          name: "Sunny Days",
          description: "Authentic Hyderabadi Biryani and Indian cuisine",
          imageUrl: "https://drive.google.com/file/d/1mdM-vRwzpDbmNH-ibWU1iMbCp4eeQwwy/view?usp=sharing",
          menuUrl: "https://drive.google.com/file/d/1hG9vdTpduY-CYbWtJgu2pAMwhdQCAPiU/view?usp=sharing",
          category: "Indian",
          phoneNumber: "9381878144"
        },
        {
          name: "Butty",
          description: "Authentic Chinese cuisine",
          imageUrl: "https://images.unsplash.com/photo-1552566626-52f8b828add9?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
          menuUrl: "https://drive.google.com/file/d/1h0JKN3MjiK0jGc9mjusumERr-JT1dh3p/view",
          category: "Chinese",
          phoneNumber: "7200318905"
        },
        {
          name: "Milan",
          description: "Authentic Hyderabadi Biryani and Indian cuisine",
          imageUrl: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
          menuUrl: "https://drive.google.com/file/d/1hh3c9Do16vpuK-Z1PYPu7B48zd9dHJRX/view?usp=sharing",
          category: "Indian",
          phoneNumber: "9363467122"
        },
        {
          name: "google+",
          description: "Authentic Hyderabadi Biryani and Indian cuisine",
          imageUrl: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
          menuUrl: "https://drive.google.com/file/d/1hjWV0mtwOWq_I37ntFQ1LsKPEU9-QIY7/view?usp=sharing",
          category: "Indian",
          phoneNumber: "9940383952"
        },
        
        {
          name: "Chocomans Cakes",
          description: "Authentic Hyderabadi Biryani and Indian cuisine",
          imageUrl: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
          menuUrl: "https://drive.google.com/file/d/1hlI-R4sQoXKbaV5CzCyIL-kYTIonUspw/view?usp=sharing",
          category: "Indian",
        },
        {
          name: "Sohana Biryani House",
          description: "Authentic Hyderabadi Biryani and Indian cuisine",
          imageUrl: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
          menuUrl: "https://drive.google.com/file/d/1hlB_Pe4PqzhiD8TYoMzKJ7hTuQYC1nxT/view?usp=sharing",
          category: "Indian",
          phoneNumber: "6379887543"
        },
        {
          name: "Kings Plaza",
          description: "Authentic Hyderabadi Biryani and Indian cuisine",
          imageUrl: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
          menuUrl: "https://drive.google.com/file/d/1iQmYbTPBYi20-nlcJvUF3K57aCZOTCPf/view?usp=sharing",
          category: "Indian",
          phoneNumber: "9176160631"
        }
      ];

      restaurants = await Restaurant.create(sampleRestaurants);
      console.log("Added sample restaurants:", restaurants.map(r => r.name).join(", "));
    }

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

// Start server with better error handling
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log("Available routes:");
  console.log("- GET /api/restaurants");
  console.log("- POST /api/restaurants");
  console.log("- GET /api/test");
  console.log("- GET /health");
  console.log("- POST /api/auth/register");
  console.log("- POST /api/auth/login");
});

// Handle server errors
server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use`);
  } else {
    console.error('Server error:', error);
  }
});
