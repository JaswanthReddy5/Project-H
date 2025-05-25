import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../hooks/useCart';
import { useAuth } from '../context/AuthContext';
import { ProductItemCard } from '../Components/items/ProductItemCard';
import { itemsAPI } from '../services/api';
import { useSocket } from '../contexts/SocketContext';

export const ProductsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { cartItems, cartError, loading, fetchCartItems } = useCart();
  const socket = useSocket();
  const [chatLoading, setChatLoading] = useState(false);
  const [error, setError] = useState(null);

  // Clear any previous errors when component mounts
  useEffect(() => {
    setError(null);
  }, []);

  const startChat = async (sellerId, sellerName, itemId, productName) => {
    try {
      setChatLoading(true);
      setError(null);

      const userId = user?.id || user?.sub;
      if (!userId) {
        setError('Please login to start a chat');
        return;
      }

      // Validate required parameters
      if (!sellerId || !itemId) {
        setError('Missing required information to start chat');
        return;
      }

      const payload = { 
        sellerId, 
        userId, 
        itemId,
        productName: productName || 'Unknown Product',
        buyerName: user?.username || user?.name || 'Anonymous',
        sellerName: sellerName || 'Unknown Seller'
      };
      
      console.log('Starting chat with payload:', payload);
      
      const response = await itemsAPI.startChat(payload);
      
      if (response && response.chatId) {
        // Handle socket connection safely
        try {
          if (socket) {
            // Ensure socket is connected before using it
            if (!socket.connected) {
              socket.connect();
            }
            
            // Wait a moment for connection to establish
            setTimeout(() => {
              if (socket.connected) {
                socket.emit('joinRoom', response.chatId);
                socket.emit('userJoin', userId);
              }
            }, 100);
          }
        } catch (socketError) {
          console.warn('Socket operation failed, but continuing to chat:', socketError);
          // Don't prevent navigation if socket fails
        }
        
        navigate(`/chat/${response.chatId}`);
      } else {
        console.error('No chatId in response:', response);
        setError('Failed to start chat: No chat ID received');
      }
    } catch (error) {
      console.error("Error starting chat:", error);
      const errorMessage = error.response?.data?.error || 
                          error.response?.data?.message || 
                          error.message || 
                          'Unknown error occurred';
      setError(`Failed to start chat: ${errorMessage}`);
    } finally {
      setChatLoading(false);
    }
  };

  // Error boundary fallback
  if (error) {
    return (
      <div className="p-6 text-white">
        <div className="flex flex-col items-center justify-center h-64">
          <div className="text-red-400 text-xl mb-4">{error}</div>
          <button 
            onClick={() => {
              setError(null);
              fetchCartItems();
            }}
            className="bg-cyan-400 text-black px-4 py-2 rounded-lg hover:bg-cyan-300"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-6 text-white">
        <div className="flex items-center justify-center h-64">
          <div className="text-cyan-400 text-xl">Loading products...</div>
        </div>
      </div>
    );
  }

  if (cartError) {
    return (
      <div className="p-6 text-white">
        <div className="flex flex-col items-center justify-center h-64">
          <div className="text-red-400 text-xl mb-4">{cartError}</div>
          <button 
            onClick={() => {
              setError(null);
              fetchCartItems();
            }}
            className="bg-cyan-400 text-black px-4 py-2 rounded-lg hover:bg-cyan-300"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Safely filter products
  const productItems = Array.isArray(cartItems) 
    ? cartItems.filter(item => item && item.type === "product")
    : [];

  return (
    <div className="p-6 text-white">
      <h1 className="text-2xl font-bold text-cyan-400 mb-6">Available Products</h1>
      
      {chatLoading && (
        <div className="fixed top-4 right-4 bg-cyan-400 text-black px-4 py-2 rounded-lg">
          Starting chat...
        </div>
      )}
      
      {productItems.length === 0 ? (
        <div className="text-center text-gray-400 mt-8">
          <p>No products available</p>
          <button 
            onClick={fetchCartItems}
            className="mt-4 bg-cyan-400 text-black px-4 py-2 rounded-lg hover:bg-cyan-300"
          >
            Refresh Products
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {productItems.map((item, index) => (
            <ProductItemCard 
              key={item._id || `product-${index}`} 
              item={item} 
              onStartChat={startChat}
            />
          ))}
        </div>
      )}
    </div>
  );
};