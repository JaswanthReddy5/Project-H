import axios from 'axios';

// Create axios instance with default config
const getBaseURL = () => {
  // Check if we're in production (Netlify)
  if (window.location.hostname === 'magnificent-kringle-05c986.netlify.app') {
    return 'https://project-h-zv5o.onrender.com';
  }
  // Use environment variable or fallback to localhost
  return import.meta.env.VITE_SERVER_URL || 'http://localhost:5000';
};

const baseURL = getBaseURL();
console.log('🌐 Axios baseURL:', baseURL);
console.log('🌐 Current hostname:', window.location.hostname);

const instance = axios.create({
  baseURL: baseURL,
  timeout: 10000, // Increased timeout for mobile networks
  headers: {
    'Content-Type': 'application/json',
  }
});

// Add a request interceptor
instance.interceptors.request.use(
  (config) => {
    // Get the token from localStorage
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor
instance.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('Axios error:', error);
    console.error('Error config:', error.config);
    console.error('Error response:', error.response);
    
    if (error.response?.status === 401) {
      // Handle unauthorized access
      localStorage.removeItem('token');
      localStorage.removeItem('userData');
      window.location.href = '/login';
    }
    
    // Add more specific error information
    if (error.code === 'NETWORK_ERROR' || error.message === 'Network Error') {
      error.userMessage = 'Network error. Please check your internet connection.';
    } else if (error.code === 'ECONNREFUSED') {
      error.userMessage = 'Cannot connect to server. Please make sure the server is running.';
    } else if (error.code === 'ETIMEDOUT') {
      error.userMessage = 'Request timed out. Please try again.';
    }
    
    return Promise.reject(error);
  }
);

export default instance; 