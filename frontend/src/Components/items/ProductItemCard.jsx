/* eslint-disable react/prop-types */
import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { itemsAPI } from '../../services/api';

export const ProductItemCard = ({ item }) => {
  const { user } = useAuth();
  const [remainingTime, setRemainingTime] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [contactInfo, setContactInfo] = useState(null);
  const [contactTimeout, setContactTimeout] = useState(null);
  const [isReleasing, setIsReleasing] = useState(false);

  // Calculate remaining time
  const getRemainingTime = () => {
    if (!item.expiresAt) return null;
    
    const now = new Date();
    const expiration = new Date(item.expiresAt);
    const diffMs = expiration - now;
    
    if (diffMs <= 0) return "Expired";
    
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays > 0) {
      return `${diffDays} day${diffDays > 1 ? 's' : ''} left`;
    } else if (diffHours > 0) {
      return `${diffHours} hour${diffHours > 1 ? 's' : ''} left`;
    } else {
      return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} left`;
    }
  };

  // Calculate contact timeout remaining time
  const getContactTimeout = () => {
    if (!item.contactedAt) return null;
    
    const now = new Date();
    const contactedTime = new Date(item.contactedAt);
    const thirtyMinutes = 30 * 60 * 1000; // 30 minutes in milliseconds
    const timeLeft = thirtyMinutes - (now - contactedTime);
    
    if (timeLeft <= 0) return "Expired";
    
    const minutesLeft = Math.floor(timeLeft / (1000 * 60));
    return `${minutesLeft} min left`;
  };

  // Update remaining time every minute
  useEffect(() => {
    if (item.expiresAt) {
      setRemainingTime(getRemainingTime());
      
      const interval = setInterval(() => {
        setRemainingTime(getRemainingTime());
      }, 60000); // Update every minute
      
      return () => clearInterval(interval);
    }
  }, [item.expiresAt]);

  // Update contact timeout every minute
  useEffect(() => {
    if (item.contactedAt) {
      setContactTimeout(getContactTimeout());
      
      const interval = setInterval(() => {
        setContactTimeout(getContactTimeout());
      }, 60000); // Update every minute
      
      return () => clearInterval(interval);
    }
  }, [item.contactedAt]);

  const handleShowPhone = () => {
    if (!user) {
      alert("Please log in to see contact details.");
      return;
    }

    if (item.sellerId === user.id || item.sellerId === user.sub) {
      alert("You cannot contact yourself.");
      return;
    }

    // Show phone number directly
    if (item.sellerPhoneNumber) {
      setContactInfo({
        phoneNumber: item.sellerPhoneNumber,
        name: item.sellerName
      });
      alert(`Seller: ${item.sellerName}\nPhone: ${item.sellerPhoneNumber}`);
    } else {
      alert("Phone number not available for this seller.");
    }
  };

  const handleCallClick = () => {
    if (contactInfo?.phoneNumber) {
      window.location.href = `tel:${contactInfo.phoneNumber}`;
    } else {
      alert("No phone number available for this seller.");
    }
  };

  const handleReleaseContact = async () => {
    if (!confirm("Are you sure you want to release this contact? The item will become available for others.")) {
      return;
    }

    try {
      setIsReleasing(true);
      await itemsAPI.releaseContact(item._id);
      alert("Contact released successfully! Item is now available for others.");
      // Refresh the page or update state to reflect the change
      window.location.reload();
    } catch (error) {
      const errorMessage = error?.response?.data?.error || "Failed to release contact.";
      alert(errorMessage);
    } finally {
      setIsReleasing(false);
    }
  };

  return (
    <div className="bg-[#0a0f1e] text-white p-4 rounded-xl border border-cyan-400 shadow-md flex flex-col items-start mb-4">
      <div className="flex justify-between w-full mb-2">    
        <p className="font-bold text-lg">{item.productName}</p>
      </div>
      <p className="text-yellow-400 text-xl">₹{item.price}</p>
      <p className="text-gray-400">Description: {item.quantity}</p>
      {remainingTime && (
        <p className={`text-sm font-medium ${
          remainingTime === "Expired" 
            ? "text-red-400" 
            : remainingTime.includes("minute") 
              ? "text-orange-400" 
              : "text-green-400"
        }`}>
          ⏰ {remainingTime}
        </p>
      )}
      
      {/* Contact display */}
      <div className="w-full mt-2 p-2 bg-gray-800 rounded">
        <p className="text-sm text-gray-300">Seller:</p>
        <p className="text-cyan-400 font-mono">{item.sellerName || 'Unknown'}</p>
        
        {/* Show contact status */}
        {item.isContacted ? (
          <div className="mt-2">
            {item.contactedByName ? (
              <div>
                <p className="text-orange-400 text-sm">
                  📞 Contacted by: {item.contactedByName}
                </p>
                {contactTimeout && (
                  <p className={`text-xs mt-1 ${
                    contactTimeout === "Expired" 
                      ? "text-red-400" 
                      : "text-yellow-400"
                  }`}>
                    ⏰ {contactTimeout}
                  </p>
                )}
              </div>
            ) : (
              <p className="text-orange-400 text-sm">
                📞 Already contacted by someone
              </p>
            )}
          </div>
        ) : (
          <p className="text-green-400 text-sm mt-1">
            ✅ Available for contact
          </p>
        )}
      </div>
      
      {/* Show appropriate button based on contact status */}
      {item.isContacted ? (
        <div className="w-full mt-4 space-y-2">
          {item.contactedBy === user?.id || item.contactedBy === user?.sub ? (
            // User who contacted - show call and release buttons
            <div className="space-y-2">
              <button 
                onClick={handleCallClick}
                className="bg-green-500 text-white px-4 py-2 rounded w-full text-center flex items-center justify-center gap-2 hover:bg-green-600 transition-colors"
              >
                📞 Call {item.sellerName}
              </button>
              <button 
                onClick={handleReleaseContact}
                disabled={isReleasing}
                className="bg-red-500 text-white px-4 py-2 rounded w-full text-center flex items-center justify-center gap-2 hover:bg-red-600 transition-colors disabled:bg-gray-500 disabled:cursor-not-allowed"
              >
                {isReleasing ? "Releasing..." : "🔄 Release Contact"}
              </button>
            </div>
          ) : (
            // Other users - show disabled button
            <button 
              disabled
              className="bg-gray-500 text-white px-4 py-2 rounded w-full text-center flex items-center justify-center gap-2 cursor-not-allowed"
            >
              📞 Already Contacted
            </button>
          )}
        </div>
      ) : contactInfo ? (
        <button 
          onClick={handleCallClick}
          className="bg-green-500 text-white px-4 py-2 rounded mt-4 hover:bg-green-600 transition-colors w-full text-center flex items-center justify-center gap-2"
        >
          📞 Call {contactInfo.name}
        </button>
      ) : (
        <button
          onClick={handleShowPhone}
          disabled={!user || item.sellerId === user?.id || item.sellerId === user?.sub}
          className="bg-blue-500 text-white px-4 py-2 rounded mt-4 hover:bg-blue-600 transition-colors w-full text-center flex items-center justify-center gap-2 disabled:bg-gray-500 disabled:cursor-not-allowed"
        >
          📞 Show Phone Number
        </button>
      )}
    </div>
  );
};