/* eslint-disable no-unused-vars */
import { useAuth } from '../context/AuthContext';
import { useState } from 'react';
import { 
  FaSignOutAlt, 
  FaCog
} from "react-icons/fa";


export const ProfilePage = () => {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-cyan-900 via-blue-900 to-gray-900 p-6">
      <div className="bg-gradient-to-br from-cyan-400 to-blue-500 rounded-full w-28 h-28 flex items-center justify-center shadow-2xl mb-6">
        <span className="text-5xl font-bold text-white">
          {user?.username?.[0]?.toUpperCase() || user?.name?.[0] || 'U'}
        </span>
      </div>
      <h2 className="text-3xl font-extrabold text-cyan-300 mb-2 drop-shadow-lg">
        {user?.username || user?.name || 'Student'}
      </h2>
      <p className="text-lg text-blue-200 mb-8 font-medium tracking-wide">University Student</p>
      <div className="flex flex-col space-y-4 w-full max-w-xs">
        <button
          className="flex items-center justify-center w-full py-3 rounded-xl bg-gradient-to-r from-purple-400 via-pink-400 to-red-400 text-white font-semibold text-lg shadow-lg hover:from-purple-500 hover:to-red-500 transition-all"
        >
          <FaCog className="mr-2 text-xl" />
          Settings
        </button>
        <button
          onClick={handleLogout}
          className="flex items-center justify-center w-full py-3 rounded-xl bg-gradient-to-r from-red-500 to-pink-500 text-white font-semibold text-lg shadow-lg hover:from-red-600 hover:to-pink-600 transition-all"
        >
          <FaSignOutAlt className="mr-2 text-xl" />
          Logout
        </button>
      </div>
    </div>
  );
};