// Script to remove test restaurants from production database
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

async function removeTestRestaurantsFromProduction() {
  try {
    console.log('🔌 Connecting to production database...');
    
    // Connect to MongoDB using the same connection string as your production server
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to production MongoDB');

    // List all restaurants first
    const allRestaurants = await Restaurant.find({});
    console.log(`📊 Total restaurants in production database: ${allRestaurants.length}`);
    
    // Find test restaurants
    const testRestaurants = await Restaurant.find({
      name: { $regex: /test/i }
    });
    
    console.log(`🔍 Found ${testRestaurants.length} test restaurants:`);
    testRestaurants.forEach(restaurant => {
      console.log(`  - ${restaurant.name} (ID: ${restaurant._id})`);
    });
    
    if (testRestaurants.length === 0) {
      console.log('✅ No test restaurants found to remove');
      return;
    }
    
    // Remove all test restaurants
    console.log('\n🗑️  Removing test restaurants...');
    const deleteResult = await Restaurant.deleteMany({
      name: { $regex: /test/i }
    });
    
    console.log(`✅ Successfully deleted ${deleteResult.deletedCount} test restaurants`);
    
    // Verify removal
    const remainingTestRestaurants = await Restaurant.find({
      name: { $regex: /test/i }
    });
    
    if (remainingTestRestaurants.length === 0) {
      console.log('✅ Verification: All test restaurants have been removed');
    } else {
      console.log(`⚠️  Warning: ${remainingTestRestaurants.length} test restaurants still remain`);
    }
    
    // List remaining legitimate restaurants
    const remainingRestaurants = await Restaurant.find({});
    console.log(`\n📊 Remaining restaurants: ${remainingRestaurants.length}`);
    console.log('✅ Legitimate restaurants:');
    remainingRestaurants.forEach((restaurant, index) => {
      console.log(`  ${index + 1}. ${restaurant.name}`);
    });
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
  } finally {
    // Close the connection
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
  }
}

// Run the cleanup
removeTestRestaurantsFromProduction();
