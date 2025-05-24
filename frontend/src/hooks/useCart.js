/* eslint-disable no-unused-vars */
import { useState, useEffect } from 'react';
import { itemsAPI } from '../services/api';
import { socket } from '../services/socket';

export const useCart = () => {
  const [cartItems, setCartItems] = useState([]);
  const [cartError, setCartError] = useState(null);
  const [loading, setLoading] = useState(true);

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
    
    socket.on('productAdded', (newProduct) => {
      fetchCartItems();
    });

    return () => {
      socket.off('productAdded');
    };
  }, []);

  return { 
    cartItems, 
    cartError, 
    loading, 
    fetchCartItems 
  };
};