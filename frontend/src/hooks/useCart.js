/* eslint-disable no-unused-vars */
import { useState, useEffect } from 'react';
import { itemsAPI } from '../services/api';
import { useSocket } from '../contexts/SocketContext'; // ✅ Use SocketContext instead

export const useCart = () => {
  const [cartItems, setCartItems] = useState([]);
  const [cartError, setCartError] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // ✅ Get socket from context with safety checks
  const { socket, connected } = useSocket();

  const fetchCartItems = async () => {
    try {
      setCartError(null);
      setLoading(true);
      const items = await itemsAPI.fetchItems();
      setCartItems(items);
    } catch (error) {
      setCartError("Failed to connect to the server. Please make sure the backend server is running.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCartItems();
    
    // ✅ SAFE: Check if socket exists and is connected before using it
    if (!socket || !connected) {
      console.log('Socket not ready yet...');
      return;
    }

    // ✅ SAFE: Now you can use socket.on()
    const handleProductAdded = (newProduct) => {
      console.log('Product added:', newProduct);
      fetchCartItems();
    };

    socket.on('productAdded', handleProductAdded);

    // Cleanup
    return () => {
      if (socket) {
        socket.off('productAdded', handleProductAdded);
      }
    };
  }, [socket, connected]); // ✅ Include both socket and connected in dependencies

  // ✅ Additional cart functions with safety checks
  const addToCart = (item) => {
    if (socket && connected) {
      socket.emit('addToCart', item);
    } else {
      console.warn('Socket not connected, cannot add to cart');
      // Optional: Store in local state or show error message
    }
  };

  const removeFromCart = (itemId) => {
    if (socket && connected) {
      socket.emit('removeFromCart', itemId);
    } else {
      console.warn('Socket not connected, cannot remove from cart');
    }
  };

  const updateCartItem = (itemId, quantity) => {
    if (socket && connected) {
      socket.emit('updateCartItem', { itemId, quantity });
    } else {
      console.warn('Socket not connected, cannot update cart item');
    }
  };

  return { 
    cartItems, 
    cartError, 
    loading, 
    fetchCartItems,
    addToCart,
    removeFromCart,
    updateCartItem,
    // Socket status for UI feedback
    socketConnected: connected
  };
};