// Test authentication middleware
const { auth } = require('./middleware/auth');

// Mock request and response
const mockReq = {
  header: (name) => {
    if (name === 'Authorization') {
      return 'Bearer invalid-token';
    }
    return undefined;
  }
};

const mockRes = {
  status: (code) => ({
    json: (data) => {
      console.log(`Status: ${code}, Response:`, data);
      return mockRes;
    }
  })
};

const mockNext = () => {
  console.log('Next called - authentication passed');
};

console.log('Testing authentication middleware...');
auth(mockReq, mockRes, mockNext);
