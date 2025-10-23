import { useState } from 'react';
import { FaArrowLeft, FaImage, FaTimes } from "react-icons/fa";
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
    productTime: "", // Add expiration time for products
  });
  const [images, setImages] = useState([]);
  const [imageErrors, setImageErrors] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [lastSubmission, setLastSubmission] = useState(0);

  // Input sanitization to prevent XSS
  const sanitizeInput = (input) => {
    if (typeof input !== 'string') return input;
    return input
      .replace(/[<>]/g, '') // Remove < and > characters
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .replace(/on\w+=/gi, '') // Remove event handlers
      .trim();
  };

  const handleChange = (e) => {
    const sanitizedValue = sanitizeInput(e.target.value);
    setFormData({ ...formData, [e.target.name]: sanitizedValue });
  };

  // Image handling functions
  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    setImageErrors("");
    
    // Check if adding these files would exceed the limit
    if (images.length + files.length > 4) {
      setImageErrors("Maximum 4 images allowed");
      return;
    }

    // Validate file types and sizes
    const validFiles = [];
    const invalidFiles = [];

    files.forEach(file => {
      if (!file.type.startsWith('image/')) {
        invalidFiles.push(`${file.name} is not an image`);
      } else if (file.size > 5 * 1024 * 1024) { // 5MB limit
        invalidFiles.push(`${file.name} is too large (max 5MB)`);
      } else {
        validFiles.push(file);
      }
    });

    if (invalidFiles.length > 0) {
      setImageErrors(invalidFiles.join(', '));
    }

    if (validFiles.length > 0) {
      // Content moderation for each valid file
      validFiles.forEach(file => {
        validateImageContent(file);
      });
    }
  };

  // Content moderation function
  const validateImageContent = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        // Basic content analysis
        const isInappropriate = analyzeImageContent(img, file.name);
        
        if (isInappropriate) {
          setImageErrors("Inappropriate content detected. Please upload only product images.");
          return;
        }
        
        // If content is appropriate, add to images
        setImages(prev => [...prev, {
          file: file,
          preview: e.target.result,
          name: file.name
        }]);
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  };

  // Image content analysis function
  const analyzeImageContent = (img, fileName) => {
    // Check filename for inappropriate keywords
    const inappropriateKeywords = [
      'porn', 'xxx', 'sex', 'nude', 'naked', 'adult', 'explicit',
      'woman', 'girl', 'female', 'lady', 'bikini', 'lingerie',
      'selfie', 'portrait', 'face', 'person', 'people'
    ];
    
    const fileNameLower = fileName.toLowerCase();
    const hasInappropriateKeyword = inappropriateKeywords.some(keyword => 
      fileNameLower.includes(keyword)
    );
    
    if (hasInappropriateKeyword) {
      return true;
    }

    // Basic image analysis
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = img.width;
    canvas.height = img.height;
    ctx.drawImage(img, 0, 0);
    
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    
    // Analyze image characteristics
    const analysis = analyzeImagePixels(data, canvas.width, canvas.height);
    
    // Flag potential inappropriate content
    if (analysis.skinToneRatio > 0.3 || analysis.faceLikePatterns > 0.1) {
      return true;
    }
    
    return false;
  };

  // Analyze image pixels for inappropriate content
  const analyzeImagePixels = (data, width, height) => {
    let skinTonePixels = 0;
    let faceLikePatterns = 0;
    let totalPixels = width * height;
    
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      
      // Detect skin tone colors
      if (isSkinTone(r, g, b)) {
        skinTonePixels++;
      }
      
      // Detect face-like patterns (simplified)
      if (isFaceLikePattern(r, g, b)) {
        faceLikePatterns++;
      }
    }
    
    return {
      skinToneRatio: skinTonePixels / totalPixels,
      faceLikePatterns: faceLikePatterns / totalPixels
    };
  };

  // Detect skin tone colors
  const isSkinTone = (r, g, b) => {
    // Skin tone detection based on RGB ranges
    return (
      r > 95 && g > 40 && b > 20 &&
      r > g && r > b &&
      Math.abs(r - g) > 15 &&
      r > 30 && g > 30 && b > 30
    );
  };

  // Detect face-like patterns (simplified)
  const isFaceLikePattern = (r, g, b) => {
    // Very basic pattern detection
    return (
      r > 100 && g > 80 && b > 60 &&
      r < 200 && g < 180 && b < 160
    );
  };

  const removeImage = (index) => {
    setImages(prev => prev.filter((_, i) => i !== index));
    setImageErrors("");
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
        !/^\d+\s*(min|mins|minutes|hr|hrs|hours|day|days|week|weeks)$/i.test(formData.time.trim())
      ) {
        newErrors.time = "Time should be like '24 hrs', '2 days', '30 min', or '1 week'.";
      }
    } else if (selectedOption === "product") {
      // Product Name: enhanced validation
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
      } else if (formData.productName.trim().length > 200) {
        newErrors.productName = "Product name must be less than 200 characters.";
      }
      // Price: enhanced validation with range checks
      if (!formData.price.trim()) {
        newErrors.price = "Price is required.";
      } else if (!/^\d+$/.test(formData.price)) {
        newErrors.price = "Price should be a number.";
      } else if (parseInt(formData.price, 10) < 1) {
        newErrors.price = "Price must be at least ₹1.";
      } else if (parseInt(formData.price, 10) >= 100000) {
        newErrors.price = "Price should be less than ₹100,000.";
      }
      // Description: enhanced validation
      if (!formData.quantity.trim()) {
        newErrors.quantity = "Product description is required.";
      } else if (formData.quantity.trim().length < 5) {
        newErrors.quantity = "Please provide a more detailed product description.";
      } else if (formData.quantity.trim().length > 500) {
        newErrors.quantity = "Product description must be less than 500 characters.";
      } else if (!/[a-zA-Z]/.test(formData.quantity)) {
        newErrors.quantity = "Description must contain at least one letter.";
      }
      // Product Time: optional expiration time
      if (formData.productTime.trim() && 
          !/^\d+\s*(min|mins|minutes|hr|hrs|hours|day|days|week|weeks)$/i.test(formData.productTime.trim())) {
        newErrors.productTime = "Time should be like '24 hrs', '2 days', '30 min', or '1 week'.";
      }
    }
    return newErrors;
  };
  
  const handleSubmit = async () => {
    // Rate limiting: prevent rapid submissions (minimum 2 seconds between submissions)
    const now = Date.now();
    if (now - lastSubmission < 2000) {
      alert("Please wait a moment before submitting again.");
      return;
    }

    const validationErrors = validate();
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    try {
      setLoading(true);
      setLastSubmission(now);
      
      if (!user) {
        alert("Please log in to add items");
        return;
      }

      let itemData;
      if (selectedOption === "default") {
        itemData = {
          type: "work",
          sellerId: user.id || user.sub,
          sellerName: user.username,
          work: formData.work,
          amount: formData.amount,
          time: formData.time,
        };
      } else {
        itemData = {
          type: "product",
          sellerId: user.id || user.sub,
          sellerName: user.username,
          productName: formData.productName,
          price: formData.price,
          quantity: formData.quantity,
          time: formData.productTime, // Add expiration time for products
          images: images.map(img => img.preview), // Include base64 images
        };
      }

      console.log("Sending item data:", itemData);

      await itemsAPI.addItem(itemData);
      alert("Item added successfully!");
      setFormData({ work: "", amount: "", time: "", productName: "", price: "", quantity: "", productTime: "" });
      setImages([]);
      setImageErrors("");
      onSuccess();
    } catch (error) {
      console.error("Error adding item:", error);
      const serverMessage = error?.response?.data?.error || error.message || "Failed to add item.";
      alert(serverMessage);
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
          
          {/* Quick time presets */}
          <div className="flex flex-wrap gap-2 mt-2">
            <span className="text-gray-400 text-sm">Quick select:</span>
            {['30 min', '1 hr', '2 hrs', '4 hrs', '8 hrs', '1 day', '2 days'].map(preset => (
              <button
                key={preset}
                type="button"
                onClick={() => setFormData({...formData, time: preset})}
                className="px-3 py-1 bg-gray-700 text-cyan-400 rounded text-sm hover:bg-gray-600 transition-colors"
              >
                {preset}
              </button>
            ))}
          </div>
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
          <input 
            type="text" 
            name="productTime" 
            placeholder="Expiration Time (optional, e.g., 24 hrs, 2 days, 30 min)" 
            value={formData.productTime} 
            onChange={handleChange} 
            className="h-15 bg-gradient-to-b from-white to-cyan-400 p-4 rounded-lg text-black w-full" 
          />
          {errors.productTime && <div className="text-red-400 text-sm ml-2">{errors.productTime}</div>}
          
          {/* Image Upload Section */}
          <div className="space-y-3">
            <label className="block text-cyan-400 text-sm font-medium">
              Product Images (Max 4 images, 5MB each)
            </label>
            <div className="bg-yellow-900 bg-opacity-30 border border-yellow-600 rounded-lg p-3">
              <p className="text-yellow-300 text-xs">
                <strong>Content Policy:</strong> Only product images are allowed. 
                No inappropriate content, pornography, or personal photos (including female photos) will be accepted.
                Uploads are automatically screened for compliance.
              </p>
            </div>
            
            {/* Image Upload Button */}
            <div className="relative">
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageUpload}
                className="hidden"
                id="image-upload"
                disabled={images.length >= 4}
              />
              <label
                htmlFor="image-upload"
                className={`flex items-center justify-center p-4 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
                  images.length >= 4
                    ? 'border-gray-600 text-gray-500 cursor-not-allowed'
                    : 'border-cyan-400 text-cyan-400 hover:bg-cyan-400 hover:text-black'
                }`}
              >
                <FaImage className="mr-2" />
                {images.length >= 4 ? 'Maximum images reached' : 'Choose Images'}
              </label>
            </div>
            
            {/* Image Preview Grid */}
            {images.length > 0 && (
              <div className="grid grid-cols-2 gap-3">
                {images.map((image, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={image.preview}
                      alt={`Preview ${index + 1}`}
                      className="w-full h-32 object-cover rounded-lg border border-gray-600"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <FaTimes size={12} />
                    </button>
                    <div className="absolute bottom-1 left-1 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                      {image.name.length > 15 ? `${image.name.substring(0, 15)}...` : image.name}
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {/* Image Error Messages */}
            {imageErrors && (
              <div className="text-red-400 text-sm">{imageErrors}</div>
            )}
            
            {/* Image Count Indicator */}
            <div className="text-gray-400 text-sm">
              {images.length}/4 images uploaded
            </div>
          </div>
          
          {/* Quick time presets for products */}
          <div className="flex flex-wrap gap-2 mt-2">
            <span className="text-gray-400 text-sm">Quick select:</span>
            {['30 min', '1 hr', '2 hrs', '4 hrs', '8 hrs', '1 day', '2 days', '1 week'].map(preset => (
              <button
                key={preset}
                type="button"
                onClick={() => setFormData({...formData, productTime: preset})}
                className="px-3 py-1 bg-gray-700 text-cyan-400 rounded text-sm hover:bg-gray-600 transition-colors"
              >
                {preset}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setFormData({...formData, productTime: ""})}
              className="px-3 py-1 bg-red-700 text-white rounded text-sm hover:bg-red-600 transition-colors"
            >
              No expiration
            </button>
          </div>
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