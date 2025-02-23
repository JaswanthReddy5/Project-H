import React, { useState, useEffect } from "react";
import { FaHome, FaChartBar, FaShoppingCart, FaUser, FaPlus, FaArrowLeft } from "react-icons/fa";
import axios from "axios";

export const Navbar = () => {
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

  useEffect(() => {
    fetchCartItems();
  }, []);

  const handleClick = (index) => {
    setActiveIndex(index);
  };

  const fetchCartItems = async () => {
    try {
      const response = await axios.get("http://localhost:5000/api/items");
      setCartItems(response.data);
    } catch (error) {
      console.error("Error fetching cart items:", error);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    try {
      await axios.post("http://localhost:5000/api/add", {
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

  return (
    <div>
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
              Default
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
        <div className="fixed bottom-0 left-0 w-full flex justify-around items-center bg-black py-4 rounded-t-2xl shadow-[0_-2.2rem_10px_rgba(0,255,255,0.5)]">
          {[{ icon: FaHome }, { icon: FaChartBar }, { icon: FaPlus, isAdd: true }, { icon: FaShoppingCart }, { icon: FaUser }].map(({ icon: Icon, isAdd }, index) => (
            <div key={index} className={`relative p-2 group ${isAdd ? "bg-cyan-400 p-3 rounded-full text-black shadow-lg" : ""}`} onClick={() => (isAdd ? setShowForm(true) : handleClick(index))}>
              <Icon className={`${isAdd ? "text-black text-3xl" : "text-cyan-400 text-[1.65rem]"} transition-transform duration-300 ${activeIndex === index ? "-translate-y-2 text-cyan-300" : ""} group-hover:-translate-y-1 group-hover:text-cyan-300`} />
            </div>
          ))}
        </div>
      )}
      {activeIndex === 0 && (
        <div className="p-6 bg-black min-h-screen text-white">
          {cartItems.filter(item => item.type === "default").map((item, index) => (
            <div key={index} className="bg-[#0a0f1e] text-white p-4 rounded-xl border border-cyan-400 shadow-md relative">
              <p className="font-bold">{item.work}</p>
              <p className="text-yellow-400">${item.amount}</p>
              <p className="text-gray-400">{item.time} hrs</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
