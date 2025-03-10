import React, { useState, useEffect } from "react";
import axios from "axios";
import { FaPhone } from "react-icons/fa";

export const RestaurantList = () => {
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hasAddedSampleData, setHasAddedSampleData] = useState(false);
  const [selectedMenu, setSelectedMenu] = useState(null);

  const fetchRestaurants = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get("http://localhost:5000/api/restaurants");
      setRestaurants(response.data);
      
      // If no restaurants exist and we haven't added sample data yet, add it
      if (response.data.length === 0 && !hasAddedSampleData) {
        const sampleRestaurants = [
          {
            name: "Tasty Bites",
            image: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4",
            phone: "+1 234-567-8900"
          },
          {
            name: "Pizza Paradise",
            image: "https://images.unsplash.com/photo-1513104890138-7c749659a591",
            phone: "+1 234-567-8901"
          }
        ];
        
        // Add sample restaurants to the database
        for (const restaurant of sampleRestaurants) {
          await axios.post("http://localhost:5000/api/restaurants", restaurant);
        }
        
        setHasAddedSampleData(true);
        
        // Fetch the updated list
        const updatedResponse = await axios.get("http://localhost:5000/api/restaurants");
        setRestaurants(updatedResponse.data);
      }
    } catch (error) {
      console.error("Error fetching restaurants:", error);
      setError("Failed to connect to the server. Please make sure the backend server is running.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRestaurants();
  }, []);

  const handleCall = (phone) => {
    window.location.href = `tel:${phone}`;
  };

  const handleMenuClick = (menuUrl) => {
    setSelectedMenu(menuUrl);
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
          <button 
            onClick={fetchRestaurants}
            className="bg-cyan-400 text-black px-4 py-2 rounded-lg hover:bg-cyan-300"
          >
            Retry
          </button>
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
                />
                <div className="p-4">
                  <h2 className="text-xl font-bold text-white mb-2">{restaurant.name}</h2>
                  <div className="flex space-x-4">
                    <button
                      onClick={() => handleCall(restaurant.phoneNumber)}
                      className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition-colors"
                    >
                      Call
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
              <div className="bg-white p-4 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-auto">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-2xl font-bold text-gray-800">Menu</h2>
                  <button
                    onClick={closeMenu}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    ✕
                  </button>
                </div>
                <img
                  src={selectedMenu}
                  alt="Restaurant Menu"
                  className="w-full h-auto"
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}; 