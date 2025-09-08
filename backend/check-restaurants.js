const mongoose = require('mongoose');

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

async function checkRestaurants() {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect('mongodb+srv://kanumurujaswanthreddy:123@cluster0.lnpjrwj.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0/project-h');
    console.log('✅ Connected to MongoDB');

    // Count all restaurants
    const totalCount = await Restaurant.countDocuments({});
    console.log(`📊 Total restaurants in database: ${totalCount}`);

    // Count active restaurants
    const activeCount = await Restaurant.countDocuments({ isActive: true });
    console.log(`📊 Active restaurants: ${activeCount}`);

    // Get all restaurants
    const allRestaurants = await Restaurant.find({}).limit(5);
    console.log('🍽️ Sample restaurants:');
    allRestaurants.forEach(restaurant => {
      console.log(`- ${restaurant.name} (${restaurant.category}) - Active: ${restaurant.isActive}`);
    });

    // Test the exact query used in the API
    const apiQuery = await Restaurant.find({ isActive: true }).select('-__v -createdBy');
    console.log(`🔍 API query result: ${apiQuery.length} restaurants`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔄 Database connection closed');
  }
}

checkRestaurants();
