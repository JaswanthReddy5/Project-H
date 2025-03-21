const mongoose = require("mongoose");
require("dotenv").config();

async function clearAllData() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB");

    // Clear all collections
    await mongoose.connection.collection('items').deleteMany({});
    await mongoose.connection.collection('chats').deleteMany({});
    await mongoose.connection.collection('messages').deleteMany({});
    await mongoose.connection.collection('restaurants').deleteMany({});

    console.log("All data has been cleared successfully!");
    
    // Close the connection
    await mongoose.connection.close();
    console.log("MongoDB connection closed");
  } catch (error) {
    console.error("Error clearing data:", error);
  }
}

clearAllData(); 