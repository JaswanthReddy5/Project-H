const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

async function createUser() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Create a test user
    const user = new User({
      username: 'testuser',
      password: 'test123',
      phoneNumber: '1234567890'
    });

    await user.save();
    console.log('User created successfully:', user.username);
    
    // Generate token
    const token = user.generateAuthToken();
    console.log('Token:', token);
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

createUser();
