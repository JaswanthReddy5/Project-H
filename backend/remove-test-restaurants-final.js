// Final script to remove ALL test restaurants from the database
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

async function removeAllTestRestaurants() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB");

    // First, list all restaurants to see what we have
    const allRestaurants = await Restaurant.find({});
    console.log(`📊 Total restaurants before cleanup: ${allRestaurants.length}`);
    
    allRestaurants.forEach((restaurant, index) => {
      console.log(`${index + 1}. ${restaurant.name} (ID: ${restaurant._id})`);
    });

    // Remove ALL restaurants with "Test" in the name (case insensitive)
    const deleteResult = await Restaurant.deleteMany({
      name: { $regex: /test/i }
    });

    console.log(`\n🗑️  Deleted ${deleteResult.deletedCount} test restaurants`);

    // List remaining restaurants
    const remainingRestaurants = await Restaurant.find({});
    console.log(`\n📊 Total restaurants after cleanup: ${remainingRestaurants.length}`);
    
    console.log("\n✅ Remaining legitimate restaurants:");
    remainingRestaurants.forEach((restaurant, index) => {
      console.log(`${index + 1}. ${restaurant.name}`);
    });

    if (remainingRestaurants.length === 0) {
      console.log("\n⚠️  WARNING: No restaurants remaining in database!");
    }

  } catch (error) {
    console.error("❌ Error during cleanup:", error);
  } finally {
    // Close the connection
    await mongoose.connection.close();
    console.log("\n🔌 Database connection closed");
  }
}

// Run the cleanup
removeAllTestRestaurants();
