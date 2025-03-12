import React, { useState, useEffect } from "react";
import axios from "axios";
import { FaPhone } from "react-icons/fa";

export const RestaurantList = () => {
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const [hasAddedSampleData, setHasAddedSampleData] = useState(false);
  const [selectedMenu, setSelectedMenu] = useState(null);

  const fetchRestaurants = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get("http://localhost:5000/api/restaurants");
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

  const handleCall = (phone) => {
    window.location.href = `tel:${phone}`;
  };

  const handleMenuClick = (menuUrl) => {
    if (menuUrl) {
      window.open(menuUrl, '_blank');
    } else {
      alert('Menu not available');
    }
  };

  const closeMenu = () => {
    setSelectedMenu(null);
  };

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
              <div key={restaurant._id} className="bg-gray-800 rounded-lg overflow-hidden shadow-lg">
                <img 
                  src={restaurant.imageUrl} 
                  alt={restaurant.name}
                  className="w-full h-48 object-cover"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = "https://via.placeholder.com/400x300?text=Image+Not+Found";
                  }}
                />
                <div className="p-4">
                  <h2 className="text-xl font-bold text-white mb-2">{restaurant.name}</h2>
                  <div className="flex space-x-4">
                    <button
                      onClick={() => handleCall(restaurant.phoneNumber)}
                      className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition-colors flex items-center gap-2"
                    >
                      <FaPhone /> Call
                    </button>
                    <button
                      onClick={() => handleMenuClick(restaurant.menuUrl)}
                      className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
                    >
                      Menu
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Menu Modal */}
          {selectedMenu && (
            <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
              <div className="bg-gray-800 p-6 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-auto">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-white">{selectedMenu.name} - Menu</h2>
                  <button
                    onClick={closeMenu}
                    className="text-gray-400 hover:text-white text-2xl"
                  >
                    ✕
                  </button>
                </div>
                <div className="grid gap-4">
                  {selectedMenu.menuItems.map((item, index) => (
                    <div key={index} className="bg-gray-700 p-4 rounded-lg">
                      <div className="flex justify-between items-center">
                        <div>
                          <h3 className="text-lg font-semibold text-white">{item.name}</h3>
                          {item.description && (
                            <p className="text-gray-400 mt-1">{item.description}</p>
                          )}
                        </div>
                        <div className="text-cyan-400 font-bold">
                          ${item.price.toFixed(2)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}; 