const mongoose = require("mongoose");
require("dotenv").config();

// EMERGENCY: Remove all restaurant data to secure it immediately
async function emergencyRemoveData() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log("🚨 EMERGENCY: Connected to MongoDB to remove sensitive data");

    // Get the Restaurant model
    const Restaurant = mongoose.model('Restaurant', new mongoose.Schema({
      name: String,
      description: String,
      imageUrl: String,
      menuUrl: String,
      phoneNumber: String,
      category: String,
      isActive: { type: Boolean, default: true },
      createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
    }));

    // EMERGENCY: Delete all restaurant data
    const result = await Restaurant.deleteMany({});
    console.log(`🚨 EMERGENCY: DELETED ${result.deletedCount} restaurants from database`);
    console.log("✅ All sensitive restaurant data has been removed");
    
    // Close connection
    await mongoose.connection.close();
    console.log("🔒 Database connection closed");
    
  } catch (error) {
    console.error("❌ Emergency data removal failed:", error);
  }
}

// Run the emergency data removal
emergencyRemoveData();
