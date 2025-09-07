const mongoose = require("mongoose");
require("dotenv").config();

// Emergency security script to remove sensitive data
async function emergencySecurity() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log("🔒 Connected to MongoDB for emergency security");

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

    // TEMPORARILY DEACTIVATE ALL RESTAURANTS
    const result = await Restaurant.updateMany(
      { isActive: true },
      { isActive: false }
    );

    console.log(`🚨 EMERGENCY: Deactivated ${result.modifiedCount} restaurants for security`);
    console.log("✅ All restaurant data is now hidden from public API");
    
    // Close connection
    await mongoose.connection.close();
    console.log("🔒 Database connection closed");
    
  } catch (error) {
    console.error("❌ Emergency security failed:", error);
  }
}

// Run the emergency security
emergencySecurity();
