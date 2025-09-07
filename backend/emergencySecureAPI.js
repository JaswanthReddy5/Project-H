const mongoose = require("mongoose");
require("dotenv").config();

// EMERGENCY: Secure the API by modifying the database directly
async function emergencySecureAPI() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log("🔒 EMERGENCY: Connected to MongoDB to secure API");

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

    // EMERGENCY: Deactivate all restaurants to hide them from public API
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
emergencySecureAPI();
