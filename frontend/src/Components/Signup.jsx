/* eslint-disable no-unused-vars */
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from '../utils/axios';

const Signup = () => {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    phoneNumber: ''
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await axios.post('/api/auth/register', {
        username: formData.username,
        password: formData.password,
        phoneNumber: formData.phoneNumber
      });
      
      if (response.data.token) {
        login(response.data.token, response.data.user);
        navigate('/');
      }
    } catch (err) {
      console.error('Signup error:', err);
      if (err.code === 'ERR_NETWORK') {
        setError('Unable to connect to server. Please check your internet connection and try again.');
      } else if (err.response) {
        setError(err.response.data.message || 'Failed to sign up. Please try again.');
      } else {
        setError('An unexpected error occurred. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="bg-gray-800 p-8 rounded-lg shadow-lg w-96">
        <h2 className="text-2xl text-cyan-400 font-bold mb-6 text-center">Sign Up</h2>
        
        {error && (
          <div className="bg-red-500 text-white p-3 rounded mb-4 text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              placeholder=" New Username"
              className="w-full bg-gray-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-400"
              required
              disabled={isLoading}
            />
          </div>
          <div>
            <input
              type="tel"
              name="phoneNumber"
              value={formData.phoneNumber}
              onChange={handleChange}
              placeholder="Phone Number (e.g., +1234567890)"
              className="w-full bg-gray-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-400"
              required
              disabled={isLoading}
            />
          </div>
          
          <div>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="new Password(Atleast 6 characters)"
              className="w-full bg-gray-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-400"
              required
              disabled={isLoading}
            />
          </div>

          <button
            type="submit"
            className={`w-full ${
              isLoading 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-cyan-400 hover:bg-cyan-300'
            } text-black py-2 px-4 rounded-lg transition-colors`}
            disabled={isLoading}
          >
            {isLoading ? 'Signing up...' : 'Sign Up'}
          </button>
        </form>

        <p className="text-gray-400 text-center mt-4">
          Already have an account?{' '}
          <button
            onClick={() => navigate('/login')}
            className="text-cyan-400 hover:text-cyan-300"
            disabled={isLoading}
          >
            Login
          </button>
        </p>
      </div>
    </div>
  );
};

export default Signup; 