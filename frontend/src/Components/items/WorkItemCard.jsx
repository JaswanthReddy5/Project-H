/* eslint-disable react/prop-types */
import { useState, useEffect } from 'react';

export const WorkItemCard = ({ item }) => {
  const [remainingTime, setRemainingTime] = useState(null);

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

  const handleCallClick = () => {
    if (item.sellerPhoneNumber) {
      // Create a tel: link to initiate phone call
      window.location.href = `tel:${item.sellerPhoneNumber}`;
    } else {
      alert("No phone number available for this seller.");
    }
  };

  return (
    <div className="bg-[#0a0f1e] text-white p-4 rounded-xl border border-cyan-400 shadow-md flex flex-col items-start mb-4">
      <div className="flex justify-between w-full mb-2">    
        <p className="font-bold text-lg">{item.work}</p>
      </div>
      <p className="text-yellow-400 text-xl">₹{item.amount}</p>
      <p className="text-gray-400">Duration: {item.time}</p>
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
        <p className="text-sm text-gray-300">Contact:</p>
        <p className="text-cyan-400 font-mono">{item.sellerName || 'Unknown'}</p>
        {item.sellerPhoneNumber ? (
          <p className="text-gray-400 text-sm mt-1">{item.sellerPhoneNumber}</p>
        ) : (
          <p className="text-red-400 text-sm mt-1">No phone number available</p>
        )}
      </div>
      
      <button 
        onClick={handleCallClick}
        className="bg-green-500 text-white px-4 py-2 rounded mt-4 hover:bg-green-600 transition-colors w-full text-center flex items-center justify-center gap-2 disabled:bg-gray-500 disabled:cursor-not-allowed"
        disabled={!item.sellerPhoneNumber}
      >
        📞 Call {item.sellerName ? `(${item.sellerName})` : ''}
      </button>
    </div>
  );
};