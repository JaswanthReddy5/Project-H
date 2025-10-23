/* eslint-disable no-unused-vars */
import React, { useState, useEffect, memo, useCallback } from "react";
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

// Memoized Restaurant Card Component
const RestaurantCard = memo(({ restaurant, onCall, onMenuClick }) => (
  <div className="bg-gray-800 rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-200">
    <img 
      src={restaurant.imageUrl} 
      alt={restaurant.name}
      className="w-full h-48 object-cover"
      loading="lazy"
      onError={(e) => {
        e.target.onerror = null;
        e.target.src = "https://placehold.co/400x300/1a1a1a/ffffff?text=No+Image";
      }}
    />
    <div className="p-4">
      <h2 className="text-xl font-bold text-white mb-2">{restaurant.name}</h2>
      <div className="flex space-x-4">
        {restaurant.name !== "Zinger" && restaurant.name !== "Shakes and Desserts" && (
          <button
            onClick={() => onCall(restaurant.phoneNumber)}
            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition-colors duration-200 flex items-center gap-2"
          >
            <FaPhone /> Call
          </button>
        )}
        <button
          onClick={() => onMenuClick(restaurant.menuUrl)}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors duration-200"
        >
          Menu
        </button>
      </div>
    </div>
  </div>
));

RestaurantCard.displayName = 'RestaurantCard';

export const RestaurantList = memo(() => {
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sessionToken, setSessionToken] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const [hasAddedSampleData, setHasAddedSampleData] = useState(false);
  const [selectedMenu, setSelectedMenu] = useState(null);

  const fetchRestaurants = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Check if we already have data in localStorage
      const cachedData = localStorage.getItem('restaurants_cache');
      const cacheTime = localStorage.getItem('restaurants_cache_time');
      const now = Date.now();
      
      // Use cached data if it's less than 5 minutes old
      if (cachedData && cacheTime && (now - parseInt(cacheTime)) < 300000) {
        setRestaurants(JSON.parse(cachedData));
        setLoading(false);
        return;
      }
      
      const response = await axios.get(`${SERVER_URL}/api/restaurants`);
      
      if (response.data && Array.isArray(response.data) && response.data.length > 0) {
        setRestaurants(response.data);
        // Cache the data
        localStorage.setItem('restaurants_cache', JSON.stringify(response.data));
        localStorage.setItem('restaurants_cache_time', now.toString());
      } else {
        // If API returns empty array, use sample data
        console.log("API returned empty data, using sample restaurants");
        const sampleRestaurants = [
          {
            _id: "68b210a9f97f57721f40fd00",
            name: "Andra Tiffins&Snakes",
            description: "Authentic Hyderabadi Biryani and Indian cuisine",
            imageUrl: "https://drive.google.com/thumbnail?id=1uH2xPK0n2DE1jIxH3cr9ML_CM0LjovLw",
            menuUrl: "https://drive.google.com/file/d/1hkMRslqFPQ76LrfJ4UNvfErongZ6_ZH3/view?usp=sharing",
            phoneNumber: "9059937090",
            category: "Indian"
          },
          {
            _id: "68b210a9f97f57721f40fd02",
            name: "Butty",
            description: "Authentic Chinese cuisine",
            imageUrl: "https://drive.google.com/thumbnail?id=1yqr0YzQEa_ZEvS_K9qDPpoR-dgsjZJ3P",
            menuUrl: "https://drive.google.com/file/d/1h0JKN3MjiK0jGc9mjusumERr-JT1dh3p/view",
            phoneNumber: "7200318905",
            category: "Chinese"
          },
          {
            _id: "68b210a9f97f57721f40fd01",
            name: "Sunny Days",
            description: "Authentic Hyderabadi Biryani and Indian cuisine",
            imageUrl: "https://drive.google.com/thumbnail?id=1yd1V_jk-XHlISUutbsTmRHaO-Jt4lU7A",
            menuUrl: "https://drive.google.com/file/d/1hG9vdTpduY-CYbWtJgu2pAMwhdQCAPiU/view?usp=sharing",
            phoneNumber: "9381878144",
            category: "Indian"
          },
          {
            _id: "68b210a9f97f57721f40fd05",
            name: "Chocomans Cakes",
            description: "Authentic Hyderabadi Biryani and Indian cuisine",
            imageUrl: "https://drive.google.com/thumbnail?id=1ygO9Dnsbelc_4pm6lcmDOoEJAt5nuBLD",
            menuUrl: "https://drive.google.com/file/d/1hlI-R4sQoXKbaV5CzCyIL-kYTIonUspw/view?usp=sharing",
            category: "Indian"
          },
          {
            _id: "68b210a9f97f57721f40fd07",
            name: "Kings Plaza",
            description: "Authentic Hyderabadi Biryani and Indian cuisine",
            imageUrl: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
            menuUrl: "https://drive.google.com/file/d/1iQmYbTPBYi20-nlcJvUF3K57aCZOTCPf/view?usp=sharing",
            phoneNumber: "9176160631",
            category: "Indian"
          },
          {
            _id: "68b210a9f97f57721f40fd06",
            name: "Sohana Biryani House",
            description: "Authentic Hyderabadi Biryani and Indian cuisine",
            imageUrl: "https://drive.google.com/thumbnail?id=1y_Ew7TnmOqPE1QqgSILqQiH0TNkOiAr2",
            menuUrl: "https://drive.google.com/file/d/1hlB_Pe4PqzhiD8TYoMzKJ7hTuQYC1nxT/view?usp=sharing",
            phoneNumber: "6379887543",
            category: "Indian"
          },
          {
            _id: "68b210a9f97f57721f40fd03",
            name: "Milan",
            description: "Authentic Hyderabadi Biryani and Indian cuisine",
            imageUrl: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
            menuUrl: "https://drive.google.com/file/d/1hh3c9Do16vpuK-Z1PYPu7B48zd9dHJRX/view?usp=sharing",
            phoneNumber: "9363467122",
            category: "Indian"
          },
          {
            _id: "68b210a9f97f57721f40fd04",
            name: "Google+",
            description: "Authentic Hyderabadi Biryani and Indian cuisine",
            imageUrl: "https://drive.google.com/thumbnail?id=1yXz-uOKA8K-wjn3FIg03XGVQTeOrYHpZ",
            menuUrl: "https://drive.google.com/file/d/1hjWV0mtwOWq_I37ntFQ1LsKPEU9-QIY7/view?usp=sharing",
            phoneNumber: "9940383952",
            category: "Indian"
          },
          {
            _id: "68bc4f21a2844f7ad89374b6",
            name: "Zinger",
            description: "Famous Hyderabadi biryani with authentic taste",
            imageUrl: "https://drive.google.com/thumbnail?id=1lQt315Y24SpUpnUdCRdvlIb-3Q2qW_ph",
            menuUrl: "https://drive.google.com/file/d/1-6Fe48xkumNYYf3oTzo8BWmFGk4CDVnf/view?usp=sharing",
            category: "Indian"
          },
          {
            _id: "68bc52e8a2844f7ad89374b8",
            name: "Masaledar",
            description: "Famous Hyderabadi biryani with authentic taste",
            imageUrl: "https://drive.google.com/thumbnail?id=1-EXRlGBBi6PBF2R6mdPxXS2U368P8FpB",
            menuUrl: "https://drive.google.com/file/d/1-RSIRR896iIRhAsSvfmsibHUyYzD0OfT/view?usp=sharing",
            phoneNumber: "9102770111",
            category: "Indian"
          },
          {
            _id: "68bc52f6a2844f7ad89374ba",
            name: "EVERGREEN",
            description: "Famous Hyderabadi biryani with authentic taste",
            imageUrl: "https://drive.google.com/thumbnail?id=1-EYAV5SIZXdDn2gSECkb9wWuS14dgbFP",
            menuUrl: "https://drive.google.com/file/d/xyz123/view",
            phoneNumber: "9962372887",
            category: "Indian"
          },
          {
            _id: "68bc5300a2844f7ad89374bc",
            name: "Shakes and Desserts",
            description: "Famous Hyderabadi biryani with authentic taste",
            imageUrl: "https://drive.google.com/thumbnail?id=1-F1AM50T7WFuam-5hdhJn30HJJkTg1RV",
            menuUrl: "https://drive.google.com/file/d/1-VcH6ja7-yw4_1AP0aF69GIcjVsNEup1/view?usp=sharing",
            phoneNumber: "9876543210",
            category: "Indian"
          },
          {
            _id: "68bd1ceea2844f7ad89374e6",
            name: "Classic Chettinadu Restaurent",
            description: "Famous Hyderabadi biryani with authentic taste",
            imageUrl: "https://drive.google.com/thumbnail?id=1-iHK8z4UBFMU2BN5AwtMSaxV-tOWdQ-k",
            menuUrl: "https://drive.google.com/file/d/1-fFAHBxHuP4l-sFxNKXNu2dVyzj-bRjL/view?usp=sharing",
            phoneNumber: "7358751201",
            category: "Indian"
          }
        ];
        setRestaurants(sampleRestaurants);
        // Cache the sample data too
        localStorage.setItem('restaurants_cache', JSON.stringify(sampleRestaurants));
        localStorage.setItem('restaurants_cache_time', now.toString());
      }
    } catch (error) {
      console.error("Error fetching restaurants:", error);
      
      // Try to use cached data on error
      const cachedData = localStorage.getItem('restaurants_cache');
      if (cachedData) {
        setRestaurants(JSON.parse(cachedData));
        setError(null);
      } else {
        if (error.response?.status === 401 || error.response?.status === 403) {
          setError("Access denied. Please contact administrator.");
        } else if (error.response?.status === 404) {
          setError("Service temporarily unavailable. Please try again later.");
        } else {
          setError("Failed to fetch restaurants. Please try again later.");
        }
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRestaurants();
  }, []); // Only run once on mount

  // Separate effect for retry logic
  useEffect(() => {
    if (error && retryCount < 3) {
      const retryTimeout = setTimeout(() => {
        setRetryCount(prev => prev + 1);
        fetchRestaurants();
      }, 3000);
      
      return () => clearTimeout(retryTimeout);
    }
  }, [error, retryCount]);

  const handleCall = useCallback((phone) => {
    window.location.href = `tel:${phone}`;
  }, []);

  const handleMenuClick = useCallback((menuUrl) => {
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
  }, []);

  const closeMenu = useCallback(() => {
    setSelectedMenu(null);
  }, []);

  return (
    <div className="p-6 bg-black min-h-screen text-white">
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {restaurants.map((restaurant) => (
              <RestaurantCard
                key={restaurant._id}
                restaurant={restaurant}
                onCall={handleCall}
                onMenuClick={handleMenuClick}
              />
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
});

RestaurantList.displayName = 'RestaurantList'; 