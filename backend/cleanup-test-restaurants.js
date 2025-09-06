// Script to remove unauthorized test restaurants from the database
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

async function cleanupTestRestaurants() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB");

    // Find all restaurants with "Test Restaurant" in the name
    const testRestaurants = await Restaurant.find({
      name: { $regex: /^Test Restaurant/i }
    });

    console.log(`🔍 Found ${testRestaurants.length} test restaurants:`);
    testRestaurants.forEach(restaurant => {
      console.log(`  - ${restaurant.name} (ID: ${restaurant._id})`);
    });

    if (testRestaurants.length === 0) {
      console.log("✅ No test restaurants found to delete");
      return;
    }

    // Delete all test restaurants
    const deleteResult = await Restaurant.deleteMany({
      name: { $regex: /^Test Restaurant/i }
    });

    console.log(`🗑️  Deleted ${deleteResult.deletedCount} test restaurants`);
    console.log("✅ Database cleanup completed successfully");

    // Verify cleanup
    const remainingTestRestaurants = await Restaurant.find({
      name: { $regex: /^Test Restaurant/i }
    });

    if (remainingTestRestaurants.length === 0) {
      console.log("✅ Verification: All test restaurants have been removed");
    } else {
      console.log(`⚠️  Warning: ${remainingTestRestaurants.length} test restaurants still remain`);
    }

  } catch (error) {
    console.error("❌ Error during cleanup:", error);
  } finally {
    // Close the connection
    await mongoose.connection.close();
    console.log("🔌 Database connection closed");
  }
}

// Run the cleanup
cleanupTestRestaurants();
