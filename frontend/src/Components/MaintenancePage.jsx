import React from 'react';
import { FaTools, FaClock, FaExclamationTriangle } from 'react-icons/fa';

export const MaintenancePage = ({ pageName = "Page" }) => {
  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-6">
      <div className="text-center max-w-md">
        <div className="mb-8">
          <FaTools className="text-cyan-400 text-6xl mx-auto mb-4" />
          <FaClock className="text-yellow-400 text-4xl mx-auto mb-4" />
          <FaExclamationTriangle className="text-orange-400 text-3xl mx-auto" />
        </div>
        
        <h1 className="text-3xl font-bold text-cyan-400 mb-4">
          Under Maintenance
        </h1>
        
        <p className="text-gray-300 text-lg mb-6">
          {pageName} is currently being updated and improved. 
          We're working hard to bring you a better experience.
        </p>
        
        <div className="bg-gray-800 rounded-lg p-4 mb-6">
          <p className="text-gray-400 text-sm">
            <strong>What we're working on:</strong>
          </p>
          <ul className="text-gray-400 text-sm mt-2 text-left">
            <li>• Enhanced user interface</li>
            <li>• Better performance</li>
            <li>• New features</li>
            <li>• Bug fixes</li>
          </ul>
        </div>
        
        <p className="text-cyan-300 text-sm">
          Check back soon for updates!
        </p>
      </div>
    </div>
  );
};


