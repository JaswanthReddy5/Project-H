// Script to list all restaurants in the database
const mongoose = require('mongoose');
require('dotenv').config();

// Restaurant schema
const RestaurantSchema = new mongoose.Schema({
  name: String,
  description: String,
  imageUrl: String,
  menuUrl: String,
  phoneNumber: String,
  category: String,
  createdAt: { type: Date, default: Date.now }
});

const Restaurant = mongoose.model("Restaurant", RestaurantSchema);

async function listAllRestaurants() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB");

    // Get all restaurants
    const restaurants = await Restaurant.find({}).sort({ createdAt: -1 });

    console.log(`📊 Total restaurants in database: ${restaurants.length}`);
    console.log("\n📋 All restaurants:");
    
    restaurants.forEach((restaurant, index) => {
      console.log(`${index + 1}. ${restaurant.name}`);
      console.log(`   ID: ${restaurant._id}`);
      console.log(`   Created: ${restaurant.createdAt}`);
      console.log(`   Category: ${restaurant.category || 'N/A'}`);
      console.log("");
    });

    // Check for any restaurants with "test" in the name (case insensitive)
    const testRestaurants = await Restaurant.find({
      name: { $regex: /test/i }
    });

    if (testRestaurants.length > 0) {
      console.log(`🔍 Found ${testRestaurants.length} restaurants with "test" in the name:`);
      testRestaurants.forEach(restaurant => {
        console.log(`  - ${restaurant.name} (ID: ${restaurant._id})`);
      });
    } else {
      console.log("✅ No restaurants with 'test' in the name found");
    }

  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    // Close the connection
    await mongoose.connection.close();
    console.log("🔌 Database connection closed");
  }
}

// Run the script
listAllRestaurants();
