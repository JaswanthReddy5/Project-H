// Script to remove the latest test restaurant
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

async function removeLatestTest() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB");

    // Find and remove the latest test restaurant
    const testRestaurant = await Restaurant.findOneAndDelete({
      name: "Security Test"
    });

    if (testRestaurant) {
      console.log(`🗑️  Removed: ${testRestaurant.name} (ID: ${testRestaurant._id})`);
    } else {
      console.log("✅ No 'Security Test' restaurant found");
    }

    // Also remove any other test restaurants that might exist
    const deleteResult = await Restaurant.deleteMany({
      name: { $regex: /test|Test/i }
    });

    console.log(`🗑️  Total test restaurants removed: ${deleteResult.deletedCount}`);

  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    // Close the connection
    await mongoose.connection.close();
    console.log("🔌 Database connection closed");
  }
}

// Run the script
removeLatestTest();
