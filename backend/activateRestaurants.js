const mongoose = require('mongoose');
require('dotenv').config();

// Restaurant Schema
const restaurantSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  imageUrl: { type: String, required: true },
  menuUrl: { type: String, required: true },
  phoneNumber: { type: String },
  category: { type: String, required: true },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  createdBy: { type: String, default: 'system' }
});

const Restaurant = mongoose.model('Restaurant', restaurantSchema);

async function activateRestaurants() {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Update all restaurants to be active
    const result = await Restaurant.updateMany(
      {}, 
      { $set: { isActive: true } }
    );

    console.log(`✅ Activated ${result.modifiedCount} restaurants`);

    // Check how many active restaurants we have
    const activeCount = await Restaurant.countDocuments({ isActive: true });
    console.log(`📊 Total active restaurants: ${activeCount}`);

    // Show some sample restaurants
    const sampleRestaurants = await Restaurant.find({ isActive: true }).limit(3);
    console.log('🍽️ Sample restaurants:');
    sampleRestaurants.forEach(restaurant => {
      console.log(`- ${restaurant.name} (${restaurant.category})`);
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔄 Database connection closed');
  }
}

activateRestaurants();
