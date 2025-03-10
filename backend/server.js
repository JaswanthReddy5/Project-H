const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const app = express();
app.use(express.json());
app.use(cors());

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
  createdAt: { type: Date, default: Date.now },
});

const RestaurantSchema = new mongoose.Schema({
  name: String,
  description: String,
  menu: [{
    item: String,
    price: String
  }],
  image: String,
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
    console.log("Fetching restaurants...");
    const restaurants = await Restaurant.find().sort({ createdAt: -1 });
    console.log("Found restaurants:", restaurants.length);
    // Add sample data if no restaurants exist
    if (restaurants.length === 0) {
      const sampleRestaurants = [
        {
          name: "Tasty Bites",
          description: "Delicious food at great prices",
          menuItems: [
            { name: "Burger", price: 12.99 },
            { name: "Pizza", price: 15.99 },
            { name: "Pasta", price: 13.99 }
          ],
          imageUrl: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=1000&auto=format&fit=crop",
          category: "Fast Food",
          phoneNumber: "+1234567890",
          menuUrl: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=1000&auto=format&fit=crop"
        },
        {
          name: "Pizza Paradise",
          description: "Best pizza in town",
          menuItems: [
            { name: "Margherita", price: 14.99 },
            { name: "Pepperoni", price: 16.99 },
            { name: "Vegetarian", price: 15.99 }
          ],
          imageUrl: "https://images.unsplash.com/photo-1513104890138-7c749659a591?q=80&w=1000&auto=format&fit=crop",
          category: "Italian",
          phoneNumber: "+1987654321",
          menuUrl: "https://images.unsplash.com/photo-1513104890138-7c749659a591?q=80&w=1000&auto=format&fit=crop"
        }
      ];
    }
    res.json(restaurants);
  } catch (err) {
    console.error("Error in GET /api/restaurants:", err);
    res.status(500).json({ error: err.message });
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
  res.json({ message: "Server is running!" });
});

// Start server with better error handling
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log("Available routes:");
  console.log("- GET /api/restaurants");
  console.log("- POST /api/restaurants");
  console.log("- GET /api/test");
});
