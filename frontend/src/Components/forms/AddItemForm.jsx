import { useState } from 'react';
import { FaArrowLeft } from "react-icons/fa";
import { useAuth } from '../../context/AuthContext';
import { itemsAPI } from '../../services/api';

// eslint-disable-next-line react/prop-types
export const AddItemForm = ({ onCancel, onSuccess }) => {
  const { user } = useAuth();
  const [selectedOption, setSelectedOption] = useState("default");
  const [formData, setFormData] = useState({
    work: "",
    amount: "",
    time: "",
    productName: "",
    price: "",
    quantity: "",
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      
      if (!user) {
        alert("Please log in to add items");
        return;
      }

      const itemData = {
        type: selectedOption,
        sellerId: user.id || user.sub,
        sellerName: user.username,
        ...formData,
      };

      console.log("Sending item data:", itemData);

      await itemsAPI.addItem(itemData);
      alert("Item added successfully!");
      setFormData({ work: "", amount: "", time: "", productName: "", price: "", quantity: "" });
      onSuccess();
    } catch (error) {
      console.error("Error adding item:", error);
      alert("Failed to add item. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-black min-h-screen text-white">
      <button onClick={onCancel} className="flex items-center text-cyan-400 mb-4">
        <FaArrowLeft className="mr-2" /> Back
      </button>
      
      <div className="flex justify-center items-center space-x-4 mb-6">
        <button
          onClick={() => setSelectedOption("default")}
          className={`px-4 py-2 rounded-lg ${
            selectedOption === "default" 
              ? "bg-cyan-400 text-black" 
              : "bg-gray-700 text-white"
          }`}
        >
          Work
        </button>
        <span className="text-cyan-400">|</span>
        <button
          onClick={() => setSelectedOption("product")}
          className={`px-4 py-2 rounded-lg ${
            selectedOption === "product" 
              ? "bg-cyan-400 text-black" 
              : "bg-gray-700 text-white"
          }`}
        >
          Product 
        </button>
      </div> 

      {selectedOption === "default" ? (
        <div className="space-y-4">
          <input 
            type="text" 
            name="work" 
            placeholder="Work to be Done" 
            value={formData.work} 
            onChange={handleChange} 
            className="h-15 bg-gradient-to-b from-white to-cyan-400 p-4 rounded-lg text-black w-full" 
          />
          <input 
            type="text" 
            name="amount" 
            placeholder="Amount" 
            value={formData.amount} 
            onChange={handleChange} 
            className="h-15 bg-gradient-to-b from-white to-cyan-400 p-4 rounded-lg text-black w-full" 
          />
          <input 
            type="text" 
            name="time" 
            placeholder="Within How much Time" 
            value={formData.time} 
            onChange={handleChange} 
            className="h-15 bg-gradient-to-b from-white to-cyan-400 p-4 rounded-lg text-black w-full" 
          />
          <button 
            onClick={handleSubmit} 
            disabled={loading}
            className="h-15 bg-gradient-to-b from-white to-cyan-400 p-4 rounded-lg text-black w-full disabled:opacity-50"
          >
            {loading ? "Adding..." : "ADD"}
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <input 
            type="text" 
            name="productName" 
            placeholder="Product Name" 
            value={formData.productName} 
            onChange={handleChange} 
            className="h-15 bg-gradient-to-b from-white to-cyan-400 p-4 rounded-lg text-black w-full" 
          />
          <input 
            type="text" 
            name="price" 
            placeholder="Price" 
            value={formData.price} 
            onChange={handleChange} 
            className="h-15 bg-gradient-to-b from-white to-cyan-400 p-4 rounded-lg text-black w-full" 
          />
          <input 
            type="text" 
            name="quantity" 
            placeholder="Quantity" 
            value={formData.quantity} 
            onChange={handleChange} 
            className="h-15 bg-gradient-to-b from-white to-cyan-400 p-4 rounded-lg text-black w-full" 
          />
          <button 
            onClick={handleSubmit} 
            disabled={loading}
            className="h-15 bg-gradient-to-b from-white to-cyan-400 p-4 rounded-lg text-black w-full disabled:opacity-50"
          >
            {loading ? "Adding..." : "ADD"}
          </button>
        </div>
      )}
    </div>
  );
};