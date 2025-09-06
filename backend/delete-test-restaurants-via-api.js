// Script to delete test restaurants via API DELETE endpoint
const axios = require('axios');

const API_BASE_URL = 'https://project-h-zv5o.onrender.com';

// Test restaurant IDs to delete
const testRestaurantIds = [
  '68bc9e1495efca144f01ce4a', // Test Restaurant
  '68bc9f1e95efca144f01ce4c', // Test Restaurant 2
  '68bca10895efca144f01ce50', // Test Restaurant 3
  '68bca14195efca144f01ce52', // Test Restaurant 4
  '68bca1cf95efca144f01ce58', // Test Restaurant 5
  '68bca2be95efca144f01ce5b', // Test Restaurant 6
  '68bca32395efca144f01ce5d', // Test Restaurant 7
  '68bca40b95efca144f01ce63', // Test Restaurant 8
  '68bca4ad95efca144f01ce68', // Test Restaurant 9
  '68bca5d495efca144f01ce6c'  // Security Test
];

async function deleteTestRestaurants() {
  console.log('🗑️  Starting deletion of test restaurants...');
  console.log(`📊 Found ${testRestaurantIds.length} test restaurants to delete\n`);
  
  let deletedCount = 0;
  let failedCount = 0;
  
  for (let i = 0; i < testRestaurantIds.length; i++) {
    const id = testRestaurantIds[i];
    const restaurantNumber = i + 1;
    
    try {
      console.log(`[${restaurantNumber}/${testRestaurantIds.length}] Deleting restaurant ID: ${id}`);
      
      const response = await axios.delete(`${API_BASE_URL}/api/restaurants/${id}`);
      
      if (response.status === 200) {
        console.log(`✅ Successfully deleted: ${response.data.deletedRestaurant}`);
        deletedCount++;
      } else {
        console.log(`⚠️  Unexpected response: ${response.status}`);
        failedCount++;
      }
      
    } catch (error) {
      if (error.response) {
        if (error.response.status === 404) {
          console.log(`ℹ️  Restaurant not found (may already be deleted)`);
        } else {
          console.log(`❌ Error deleting restaurant: ${error.response.status} - ${error.response.data?.error || error.message}`);
          failedCount++;
        }
      } else {
        console.log(`❌ Network error: ${error.message}`);
        failedCount++;
      }
    }
    
    // Add a small delay between requests
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  console.log(`\n📊 Deletion Summary:`);
  console.log(`✅ Successfully deleted: ${deletedCount}`);
  console.log(`❌ Failed to delete: ${failedCount}`);
  console.log(`📋 Total processed: ${testRestaurantIds.length}`);
  
  if (deletedCount > 0) {
    console.log('\n🎉 Test restaurants have been removed!');
    console.log('🔄 Please refresh your frontend to see the changes.');
  }
}

// Run the deletion
deleteTestRestaurants();
