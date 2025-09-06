/* eslint-disable no-unused-vars */
import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { FaPhone } from "react-icons/fa";
import DocumentViewer from "./DocumentViewer";

// Get the server URL from environment or use a fallback
const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://192.168.35.239:5000';

const extractGoogleDriveFileId = (url) => {
  const regex =
    /(?:https?:\/\/)?(?:drive\.google\.com\/(?:file\/d\/|open\?id=|uc\?id=|preview\/)|(?:docs|drive)\.google\.com\/.*?\/d\/)([a-zA-Z0-9_-]+)/;

  const match = url.match(regex);
  return match ? match[1] : null; // Return the file ID or null if not found
};

export const RestaurantList = () => {
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const [hasAddedSampleData, setHasAddedSampleData] = useState(false);
  const [selectedMenu, setSelectedMenu] = useState(null);
  const [scrollY, setScrollY] = useState(0);
  const containerRef = useRef(null);

  const fetchRestaurants = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get(`${SERVER_URL}/api/restaurants`);
      if (response.data && Array.isArray(response.data)) {
        setRestaurants(response.data);
      } else {
        setError("Invalid data format received from server");
      }
    } catch (error) {
      console.error("Error fetching restaurants:", error);
      setError(
        error.response
          ? `Server error: ${error.response.status} ${error.response.statusText}`
          : "Failed to connect to the server. Please make sure the backend server is running."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRestaurants();
    // Retry fetching every 3 seconds if there's an error, up to 3 times
    const retryInterval = setInterval(() => {
      if (error && retryCount < 3) {
        setRetryCount(prev => prev + 1);
        fetchRestaurants();
      }
    }, 3000);

    return () => clearInterval(retryInterval);
  }, [error, retryCount]);

  // Scroll effect for cards
  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleCall = (phone) => {
    window.location.href = `tel:${phone}`;
  };

  const handleMenuClick = (menuUrl) => {
    if (menuUrl) {
      const fileId = extractGoogleDriveFileId(menuUrl);
      if (fileId) {
        setSelectedMenu(fileId);
      } else if (menuUrl.startsWith('http')) {
        // For non-Google Drive URLs, open in new tab
        window.open(menuUrl, '_blank', 'noopener,noreferrer');
      } else {
        alert('Invalid menu URL format. Please use a Google Drive link or direct PDF URL.');
      }
    } else {
      alert('Menu not available');
    }
  };

  const closeMenu = () => {
    setSelectedMenu(null);
  };

  return (
    <div className="p-6 bg-black min-h-screen text-white relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Floating Food Icons */}
        <div className="absolute top-10 left-10 text-4xl opacity-20 animate-float-slow">🍕</div>
        <div className="absolute top-32 right-16 text-3xl opacity-15 animate-float-medium">🍔</div>
        <div className="absolute top-64 left-1/4 text-5xl opacity-10 animate-float-fast">🍜</div>
        <div className="absolute top-96 right-1/3 text-3xl opacity-20 animate-float-slow">🍰</div>
        <div className="absolute top-1/3 left-1/2 text-4xl opacity-15 animate-float-medium">🍖</div>
        <div className="absolute top-2/3 right-1/4 text-3xl opacity-10 animate-float-fast">🥘</div>
        <div className="absolute top-1/4 right-10 text-4xl opacity-20 animate-float-slow">🍝</div>
        <div className="absolute top-3/4 left-16 text-3xl opacity-15 animate-float-medium">🍤</div>
        
        {/* Kitchen Utensil Silhouettes */}
        <div className="absolute top-20 right-1/4 text-6xl opacity-5 animate-float-slow">🔪</div>
        <div className="absolute top-40 left-1/3 text-5xl opacity-8 animate-float-medium">🍴</div>
        <div className="absolute top-60 right-1/2 text-4xl opacity-6 animate-float-fast">🥄</div>
        <div className="absolute top-80 left-1/5 text-5xl opacity-7 animate-float-slow">🍽️</div>
        
        {/* Steam Effects */}
        <div className="absolute bottom-0 left-0 w-full h-32 pointer-events-none">
          <div className="absolute bottom-0 left-1/4 w-2 h-16 bg-gradient-to-t from-cyan-400/20 to-transparent rounded-full animate-steam-1"></div>
          <div className="absolute bottom-0 left-1/2 w-1 h-20 bg-gradient-to-t from-cyan-300/15 to-transparent rounded-full animate-steam-2"></div>
          <div className="absolute bottom-0 right-1/3 w-2 h-14 bg-gradient-to-t from-cyan-500/25 to-transparent rounded-full animate-steam-3"></div>
          <div className="absolute bottom-0 right-1/4 w-1 h-18 bg-gradient-to-t from-cyan-400/20 to-transparent rounded-full animate-steam-1"></div>
        </div>
      </div>
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="text-cyan-400 text-xl">Loading restaurants...</div>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center h-64">
          <div className="text-red-400 text-xl mb-4">{error}</div>
          <div className="text-gray-400 mb-4">
            {retryCount < 3 ? `Retrying... (${retryCount}/3)` : "Max retries reached"}
          </div>
          <button 
            onClick={() => {
              setRetryCount(0);
              fetchRestaurants();
            }}
            className="bg-cyan-400 text-black px-4 py-2 rounded-lg hover:bg-cyan-300"
          >
            Try Again
          </button>
        </div>
      ) : restaurants.length === 0 ? (
        <div className="flex justify-center items-center h-64">
          <div className="text-gray-400 text-xl">No restaurants found</div>
        </div>
      ) : (
        <div className="container mx-auto px-4 py-8">
          <div 
            ref={containerRef}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            style={{
              transform: `translateY(${scrollY * 0.1}px)`,
              transition: 'transform 0.1s ease-out'
            }}
          >
            {restaurants.map((restaurant) => (
              <div key={restaurant._id} className="bg-gray-800 rounded-lg overflow-hidden shadow-lg group relative hover:shadow-cyan-500/20 hover:shadow-2xl transition-all duration-300 hover:scale-105 hover:rotate-1">
                {/* Glowing orb effect on hover */}
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-400/0 via-cyan-400/10 to-cyan-400/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-lg"></div>
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-300/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg"></div>
                <img 
                  src={restaurant.imageUrl} 
                  alt={restaurant.name}
                  className="w-full h-48 object-cover object-center"
                  style={{ 
                    objectFit: 'cover',
                    objectPosition: 'center'
                  }}
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = "https://placehold.co/400x300/1a1a1a/ffffff?text=No+Image";
                  }}
                />
                <div className="p-4">
                  <h2 className="text-xl font-bold text-white mb-2">{restaurant.name}</h2>
                  <div className="flex space-x-4">
                    <button
                      onClick={() => handleCall(restaurant.phoneNumber)}
                      className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition-all duration-300 flex items-center gap-2 relative overflow-hidden group"
                    >
                      <span className="relative z-10 flex items-center gap-2">
                        <FaPhone /> Call
                      </span>
                      <div className="absolute inset-0 bg-green-400 opacity-0 group-hover:opacity-20 group-active:opacity-30 transition-opacity duration-200"></div>
                      <div className="absolute inset-0 bg-white opacity-0 group-active:opacity-20 group-active:animate-ripple"></div>
                    </button>
                    <button
                      onClick={() => handleMenuClick(restaurant.menuUrl)}
                      className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-all duration-300 relative overflow-hidden group"
                    >
                      <span className="relative z-10">Menu</span>
                      <div className="absolute inset-0 bg-blue-400 opacity-0 group-hover:opacity-20 group-active:opacity-30 transition-opacity duration-200"></div>
                      <div className="absolute inset-0 bg-white opacity-0 group-active:opacity-20 group-active:animate-ripple"></div>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Menu Modal */}
          {selectedMenu && (
            <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4 md:p-0">
              <div className="bg-gray-800 rounded-lg w-full md:w-[90vw] h-[90vh] relative">
                <button
                  onClick={closeMenu}
                  className="absolute -top-10 right-0 text-gray-400 hover:text-white text-2xl z-10 p-4 md:p-2"
                >
                  ✕
                </button>
                <div className="w-full h-full overflow-hidden rounded-lg">
                  <DocumentViewer documentId={selectedMenu} />
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}; 