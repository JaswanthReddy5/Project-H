const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

async function createFreshUser() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Delete existing testuser if exists
    await User.deleteOne({ username: 'testuser' });
    console.log('Deleted existing testuser');

    // Create a fresh test user
    const user = new User({
      username: 'testuser',
      password: 'test123',
      phoneNumber: '1234567890'
    });

    await user.save();
    console.log('Fresh user created successfully:', user.username);
    
    // Generate token
    const token = user.generateAuthToken();
    console.log('Fresh Token:', token);
    
    // Test the token by making a request
    const testData = {
      type: 'default',
      work: 'test work item',
      amount: '100',
      time: '1 hour'
    };
    
    console.log('Test data:', testData);
    console.log('User ID:', user._id);
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

createFreshUser();
