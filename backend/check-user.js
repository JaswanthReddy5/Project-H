const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

async function checkUser() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    const users = await User.find({});
    console.log('All users:', users.map(u => ({ username: u.username, id: u._id })));
    
    const testuser = await User.findOne({ username: 'testuser' });
    console.log('testuser found:', testuser ? testuser.username : 'not found');
    
    const testuserLower = await User.findOne({ username: 'testuser'.toLowerCase() });
    console.log('testuser lowercase found:', testuserLower ? testuserLower.username : 'not found');
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

checkUser();
