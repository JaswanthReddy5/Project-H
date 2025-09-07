// Script to bulk delete test restaurants using direct MongoDB connection
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

async function bulkDeleteTestRestaurants() {
  try {
    console.log('🔌 Connecting to production database...');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to production MongoDB');

    // First, let's see what we have
    const allRestaurants = await Restaurant.find({});
    console.log(`📊 Total restaurants in database: ${allRestaurants.length}`);
    
    // Find test restaurants
    const testRestaurants = await Restaurant.find({
      name: { $regex: /test/i }
    });
    
    console.log(`🔍 Found ${testRestaurants.length} test restaurants:`);
    testRestaurants.forEach(restaurant => {
      console.log(`  - ${restaurant.name} (ID: ${restaurant._id})`);
    });
    
    if (testRestaurants.length === 0) {
      console.log('✅ No test restaurants found to delete');
      return;
    }
    
    // Delete all test restaurants using bulk operation
    console.log('\n🗑️  Deleting test restaurants...');
    
    const testRestaurantIds = testRestaurants.map(r => r._id);
    const deleteResult = await Restaurant.deleteMany({
      _id: { $in: testRestaurantIds }
    });
    
    console.log(`✅ Successfully deleted ${deleteResult.deletedCount} test restaurants`);
    
    // Verify deletion
    const remainingTestRestaurants = await Restaurant.find({
      name: { $regex: /test/i }
    });
    
    if (remainingTestRestaurants.length === 0) {
      console.log('✅ Verification: All test restaurants have been removed');
    } else {
      console.log(`⚠️  Warning: ${remainingTestRestaurants.length} test restaurants still remain`);
    }
    
    // Show remaining restaurants
    const remainingRestaurants = await Restaurant.find({});
    console.log(`\n📊 Remaining restaurants: ${remainingRestaurants.length}`);
    console.log('✅ Legitimate restaurants:');
    remainingRestaurants.forEach((restaurant, index) => {
      console.log(`  ${index + 1}. ${restaurant.name}`);
    });
    
  } catch (error) {
    console.error('❌ Error during bulk deletion:', error);
  } finally {
    // Close the connection
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
  }
}

// Run the bulk deletion
bulkDeleteTestRestaurants();
