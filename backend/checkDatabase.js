const mongoose = require("mongoose");
require("dotenv").config();

// Check what's in the database
async function checkDatabase() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log("🔍 Connected to MongoDB to check data");

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

    // Check all restaurants
    const allRestaurants = await Restaurant.find({});
    console.log(`📊 Found ${allRestaurants.length} restaurants in database`);
    
    allRestaurants.forEach((restaurant, index) => {
      console.log(`${index + 1}. ${restaurant.name} - Active: ${restaurant.isActive}`);
    });

    // Check active restaurants
    const activeRestaurants = await Restaurant.find({ isActive: true });
    console.log(`✅ Found ${activeRestaurants.length} ACTIVE restaurants`);
    
    // Close connection
    await mongoose.connection.close();
    console.log("🔍 Database check complete");
    
  } catch (error) {
    console.error("❌ Database check failed:", error);
  }
}

// Run the check
checkDatabase();
