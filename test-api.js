const axios = require('axios');

async function testAPI() {
  try {
    console.log('Testing API...');
    const response = await axios.get('https://project-h-zv5o.onrender.com/api/restaurants');
    console.log('Status:', response.status);
    console.log('Data length:', response.data ? response.data.length : 'No data');
    console.log('Data:', JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.error('Error:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    }
  }
}

testAPI();
