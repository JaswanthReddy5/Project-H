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

async function testConnection() {
  try {
    console.log('🔄 Testing database connection...');
    await mongoose.connect(process.env.MONGO_URI || 'mongodb+srv://kanumurujaswanthreddy:123@cluster0.lnpjrwj.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0/project-h');
    console.log('✅ Connected to MongoDB');

    // Test the exact query used in the API
    const restaurants = await Restaurant.find({ isActive: true }).select('-__v -createdBy');
    console.log(`🔍 Found ${restaurants.length} restaurants`);
    
    if (restaurants.length > 0) {
      console.log('🍽️ First restaurant:', restaurants[0].name);
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔄 Database connection closed');
  }
}

testConnection();
