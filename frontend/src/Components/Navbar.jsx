import React, { useState, useEffect } from "react";
import { FaHome, FaChartBar, FaShoppingCart, FaUser, FaPlus, FaArrowLeft, FaSignOutAlt } from "react-icons/fa";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { RestaurantList } from "./RestaurantList";
import { useAuth } from "../context/AuthContext";

// Get the server URL from environment or use a fallback
const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://192.168.35.239:5000';

export const Navbar = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [activeIndex, setActiveIndex] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [selectedOption, setSelectedOption] = useState("default");
  const [formData, setFormData] = useState({
    work: "",
    amount: "",
    time: "",
    productName: "",
    price: "",
    quantity: "",
  });
  const [cartItems, setCartItems] = useState([]);
  const [cartError, setCartError] = useState(null);
  const [showProfile, setShowProfile] = useState(false);

  useEffect(() => {
    fetchCartItems();
  }, []);

  const handleClick = (index) => {
    setActiveIndex(index);
    setShowProfile(false);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const fetchCartItems = async () => {
    try {
      setCartError(null);
      const response = await axios.get(`${SERVER_URL}/api/items`);
      setCartItems(response.data);
    } catch (error) {
      console.error("Error fetching cart items:", error);
      setCartError("Failed to connect to the server. Please make sure the backend server is running.");
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    try {
      await axios.post(`${SERVER_URL}/api/add`, {
        type: selectedOption,
        ...formData,
      });
      alert("Item added successfully!");
      fetchCartItems();
      setShowForm(false);
      setFormData({ work: "", amount: "", time: "", productName: "", price: "", quantity: "" });
    } catch (error) {
      console.error("Error adding item:", error);
    }
  };

  // Function to start chat
  const startChat = async (sellerId, itemId) => {
    try {
      const userId = user?.sub || "currentUserId"; // Use Google ID if available
      const response = await axios.post(`${SERVER_URL}/api/start-chat`, { sellerId, userId, itemId });

      if (response.data.chatId) {
        navigate(`/chat/${response.data.chatId}`);
      }
    } catch (error) {
      console.error("Error starting chat:", error);
      alert("Failed to start chat");
    }
  };

  return (
    <div className="min-h-screen bg-black">
      {showForm ? (
        <div className="p-6 bg-black min-h-screen text-white">
          <button onClick={() => setShowForm(false)} className="flex items-center text-cyan-400 mb-4">
            <FaArrowLeft className="mr-2" /> Back
          </button>
          <div className="flex justify-center items-center space-x-4 mb-6">
            <button
              onClick={() => setSelectedOption("default")}
              className={`px-4 py-2 rounded-lg ${selectedOption === "default" ? "bg-cyan-400 text-black" : "bg-gray-700 text-white"}`}
            >
              Work
            </button>
            <span className="text-cyan-400">|</span>
            <button
              onClick={() => setSelectedOption("product")}
              className={`px-4 py-2 rounded-lg ${selectedOption === "product" ? "bg-cyan-400 text-black" : "bg-gray-700 text-white"}`}
            >
              Product 
            </button>
          </div> 

          {selectedOption === "default" ? (
            <div className="space-y-4">
              <input type="text" name="work" placeholder="Work to be Done" value={formData.work} onChange={handleChange} className="h-15 bg-gradient-to-b from-white to-cyan-400 p-4 rounded-lg text-black w-full" />
              <input type="text" name="amount" placeholder="Amount" value={formData.amount} onChange={handleChange} className="h-15 bg-gradient-to-b from-white to-cyan-400 p-4 rounded-lg text-black w-full" />
              <input type="text" name="time" placeholder="Within How much Time" value={formData.time} onChange={handleChange} className="h-15 bg-gradient-to-b from-white to-cyan-400 p-4 rounded-lg text-black w-full" />
              <button onClick={handleSubmit} className="h-15 bg-gradient-to-b from-white to-cyan-400 p-4 rounded-lg text-black w-full">ADD</button>
            </div>
          ) : (
            <div className="space-y-4">
              <input type="text" name="productName" placeholder="Product Name" value={formData.productName} onChange={handleChange} className="h-15 bg-gradient-to-b from-white to-cyan-400 p-4 rounded-lg text-black w-full" />
              <input type="text" name="price" placeholder="Price" value={formData.price} onChange={handleChange} className="h-15 bg-gradient-to-b from-white to-cyan-400 p-4 rounded-lg text-black w-full" />
              <input type="text" name="quantity" placeholder="Quantity" value={formData.quantity} onChange={handleChange} className="h-15 bg-gradient-to-b from-white to-cyan-400 p-4 rounded-lg text-black w-full" />
              <button onClick={handleSubmit} className="h-15 bg-gradient-to-b from-white to-cyan-400 p-4 rounded-lg text-black w-full">ADD</button>
            </div>
          )}
        </div>
      ) : (
        <>
          <div className="pb-20">
            {activeIndex === 0 && (
              <div className="p-6 text-white">
                {cartError ? (
                  <div className="flex flex-col items-center justify-center h-64">
                    <div className="text-red-400 text-xl mb-4">{cartError}</div>
                    <button 
                      onClick={fetchCartItems}
                      className="bg-cyan-400 text-black px-4 py-2 rounded-lg hover:bg-cyan-300"
                    >
                      Retry
                    </button>
                  </div>
                ) : (
                  cartItems.filter(item => item.type === "default").map((item, index) => (
                    <div key={index} className="bg-[#0a0f1e] text-white p-4 rounded-xl border border-cyan-400 shadow-md flex flex-col items-start mb-4">
                      <p className="font-bold">{item.work}</p>
                      <p className="text-yellow-400">${item.amount}</p>
                      <p className="text-gray-400">{item.time}</p>
                    </div>
                  ))
                )}
              </div>
            )}
            {activeIndex === 1 && <RestaurantList />}
            {activeIndex === 3 && (
              <div className="p-6 text-white">
                {cartItems.filter(item => item.type === "product").map((item, index) => (
                  <div key={index} className="bg-[#0a0f1e] text-white p-4 rounded-xl border border-cyan-400 shadow-md flex flex-col items-start mb-4">
                    <p className="font-bold">{item.productName}</p>
                    <p className="text-yellow-400">${item.price}</p>
                    <p className="text-gray-400">Quantity: {item.quantity}</p>
                    <button 
                      onClick={() => startChat(item.sellerId, item._id)} 
                      className="bg-cyan-400 text-black px-4 py-2 rounded mt-4"
                    >
                      Accept
                    </button>
                  </div>
                ))}
              </div>
            )}
            {activeIndex === 4 && (
              <div className="p-6 text-white">
                {showProfile ? (
                  <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
                    <div className="flex items-center mb-6">
                      {user?.picture ? (
                        <img src={user.picture} alt="Profile" className="w-16 h-16 rounded-full mr-4" />
                      ) : (
                        <div className="w-16 h-16 rounded-full bg-cyan-400 flex items-center justify-center text-black text-2xl font-bold mr-4">
                          {user?.name?.charAt(0) || 'U'}
                        </div>
                      )}
                      <div>
                        <h2 className="text-xl font-bold">{user?.name || 'User'}</h2>
                        <p className="text-gray-400">{user?.email || 'No email'}</p>
                      </div>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="w-full bg-red-500 text-white py-2 px-4 rounded-lg flex items-center justify-center space-x-2 hover:bg-red-600 transition-colors"
                    >
                      <FaSignOutAlt />
                      <span>Logout</span>
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-64">
                    <div className="text-cyan-400 text-xl mb-4">Welcome, {user?.name || 'User'}!</div>
                    <button
                      onClick={() => setShowProfile(true)}
                      className="bg-cyan-400 text-black px-4 py-2 rounded-lg hover:bg-cyan-300"
                    >
                      View Profile
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
          <div className="fixed bottom-0 left-0 w-full flex justify-around items-center bg-black py-4 rounded-t-2xl shadow-[0_-2.2rem_10px_rgba(0,255,255,0.5)]">
            {[{ icon: FaHome }, { icon: FaChartBar }, { icon: FaPlus, isAdd: true }, { icon: FaShoppingCart }, { icon: FaUser }].map(({ icon: Icon, isAdd }, index) => (
              <div key={index} className={`relative p-2 group ${isAdd ? "bg-cyan-400 p-3 rounded-full text-black shadow-lg" : ""}`} onClick={() => (isAdd ? setShowForm(true) : handleClick(index))}>
                <Icon className={`${isAdd ? "text-black text-3xl" : "text-cyan-400 text-[1.65rem]"} transition-transform duration-300 ${activeIndex === index ? "-translate-y-2 text-cyan-300" : ""} group-hover:-translate-y-1 group-hover:text-cyan-300`} />
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};
