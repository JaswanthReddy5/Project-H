// Script to remove test restaurants via API calls
const axios = require('axios');

const API_BASE_URL = 'https://project-h-zv5o.onrender.com';

async function removeTestRestaurants() {
  try {
    console.log('🔍 Fetching all restaurants from API...');
    
    // Get all restaurants
    const response = await axios.get(`${API_BASE_URL}/api/restaurants`);
    const restaurants = response.data;
    
    console.log(`📊 Found ${restaurants.length} total restaurants`);
    
    // Find test restaurants
    const testRestaurants = restaurants.filter(restaurant => 
      restaurant.name.toLowerCase().includes('test')
    );
    
    console.log(`🔍 Found ${testRestaurants.length} test restaurants:`);
    testRestaurants.forEach(restaurant => {
      console.log(`  - ${restaurant.name} (ID: ${restaurant._id})`);
    });
    
    if (testRestaurants.length === 0) {
      console.log('✅ No test restaurants found to remove');
      return;
    }
    
    console.log('\n🗑️  Attempting to remove test restaurants...');
    
    // Note: Since the API doesn't have a DELETE endpoint, we'll need to use a different approach
    // For now, let's just list what needs to be removed
    console.log('\n⚠️  The following test restaurants need to be manually removed from the database:');
    testRestaurants.forEach(restaurant => {
      console.log(`  - ${restaurant.name} (ID: ${restaurant._id})`);
    });
    
    console.log('\n📋 Manual removal required:');
    console.log('1. Go to your MongoDB Atlas dashboard');
    console.log('2. Find the "restaurants" collection');
    console.log('3. Delete documents with the IDs listed above');
    console.log('4. Or use MongoDB Compass to delete them');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Run the script
removeTestRestaurants();
