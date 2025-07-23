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
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const validate = () => {
    const newErrors = {};
    if (selectedOption === "default") {
      // Work: must be at least 5 characters, contain at least one letter, and not be just numbers or repeated characters
      if (!formData.work.trim()) {
        newErrors.work = "Work is required.";
      } else if (formData.work.trim().length < 5) {
        newErrors.work = "Please provide a more detailed description.";
      } else if (!/[a-zA-Z]/.test(formData.work)) {
        newErrors.work = "Description must contain at least one letter.";
      } else if (/^(.)\\1{4,}$/.test(formData.work.trim())) {
        newErrors.work = "Please enter a meaningful description, not repeated characters.";
      } else if (/^\\d+$/.test(formData.work.trim())) {
        newErrors.work = "Description cannot be only numbers.";
      }
      // Amount: only numbers, less than 100000
      if (!formData.amount.trim()) {
        newErrors.amount = "Amount is required.";
      } else if (!/^\d+$/.test(formData.amount)) {
        newErrors.amount = "Amount should be a number.";
      } else if (parseInt(formData.amount, 10) >= 100000) {
        newErrors.amount = "Amount should be less than 100000.";
      }
      // Time: must be in format like '24 hrs', '2 days', '30 min'
      if (!formData.time.trim()) {
        newErrors.time = "Time is required.";
      } else if (
        !/^\d+\s*(min|mins|minutes|hr|hrs|hours|day|days)$/i.test(formData.time.trim())
      ) {
        newErrors.time = "Time should be like '24 hrs', '2 days', or '30 min'.";
      }
    } else if (selectedOption === "product") {
      // Product Name: same as work validation
      if (!formData.productName.trim()) {
        newErrors.productName = "Product name is required.";
      } else if (formData.productName.trim().length < 5) {
        newErrors.productName = "Please provide a more detailed product name.";
      } else if (!/[a-zA-Z]/.test(formData.productName)) {
        newErrors.productName = "Product name must contain at least one letter.";
      } else if (/^(.)\1{4,}$/.test(formData.productName.trim())) {
        newErrors.productName = "Please enter a meaningful product name, not repeated characters.";
      } else if (/^\d+$/.test(formData.productName.trim())) {
        newErrors.productName = "Product name cannot be only numbers.";
      }
      // Price: same as amount validation
      if (!formData.price.trim()) {
        newErrors.price = "Price is required.";
      } else if (!/^\d+$/.test(formData.price)) {
        newErrors.price = "Price should be a number.";
      } else if (parseInt(formData.price, 10) >= 100000) {
        newErrors.price = "Price should be less than 100000.";
      }
      // Description: at least 5 characters
      if (!formData.quantity.trim()) {
        newErrors.quantity = "Description is required.";
      } else if (formData.quantity.trim().length < 5) {
        newErrors.quantity = "Please provide a more detailed description.";
      }
    }
    return newErrors;
  };
  
  const handleSubmit = async () => {
    const validationErrors = validate();
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

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
          {errors.work && <div className="text-red-400 text-sm ml-2">{errors.work}</div>}
          <input 
            type="text" 
            name="amount" 
            placeholder="Amount" 
            value={formData.amount} 
            onChange={handleChange} 
            className="h-15 bg-gradient-to-b from-white to-cyan-400 p-4 rounded-lg text-black w-full" 
          />
          {errors.amount && <div className="text-red-400 text-sm ml-2">{errors.amount}</div>}
          <input 
            type="text" 
            name="time" 
            placeholder="Within How much Time (e.g., 24 hrs, 2 days, 30 min)" 
            value={formData.time} 
            onChange={handleChange} 
            className="h-15 bg-gradient-to-b from-white to-cyan-400 p-4 rounded-lg text-black w-full" 
          />
          {errors.time && <div className="text-red-400 text-sm ml-2">{errors.time}</div>}
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
          {errors.productName && <div className="text-red-400 text-sm ml-2">{errors.productName}</div>}
          <input 
            type="text" 
            name="price" 
            placeholder="Price" 
            value={formData.price} 
            onChange={handleChange} 
            className="h-15 bg-gradient-to-b from-white to-cyan-400 p-4 rounded-lg text-black w-full" 
          />
          {errors.price && <div className="text-red-400 text-sm ml-2">{errors.price}</div>}
          <input 
            type="text" 
            name="quantity" 
            placeholder="Description about the Product" 
            value={formData.quantity} 
            onChange={handleChange} 
            className="h-15 bg-gradient-to-b from-white to-cyan-400 p-4 rounded-lg text-black w-full" 
          />
          {errors.quantity && <div className="text-red-400 text-sm ml-2">{errors.quantity}</div>}
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