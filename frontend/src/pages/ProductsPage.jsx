import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../hooks/useCart';
import { useAuth } from '../context/AuthContext';
import { ProductItemCard } from '../Components/items/ProductItemCard';
import { itemsAPI } from '../services/api';

export const ProductsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { cartItems, cartError, loading, fetchCartItems } = useCart();
  const [error, setError] = useState(null);

  // Clear any previous errors when component mounts
  useEffect(() => {
    setError(null);
  }, []);

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
            className="bg-cyan-400 text-black px-4 py-2 rounded hover:bg-cyan-300 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Loading state
  if (loading) {
    return (
      <div className="p-6 text-white">
        <div className="flex items-center justify-center h-64">
          <div className="text-cyan-400 text-xl">Loading products...</div>
        </div>
      </div>
    );
  }

  // Error state
  if (cartError) {
    return (
      <div className="p-6 text-white">
        <div className="flex flex-col items-center justify-center h-64">
          <div className="text-red-400 text-xl mb-4">Error loading products</div>
          <div className="text-gray-400 mb-4">{cartError}</div>
          <button 
            onClick={fetchCartItems}
            className="bg-cyan-400 text-black px-4 py-2 rounded hover:bg-cyan-300 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // No products state
  if (!cartItems || cartItems.length === 0) {
    return (
      <div className="p-6 text-white">
        <div className="flex flex-col items-center justify-center h-64">
          <div className="text-gray-400 text-xl mb-4">No products available</div>
          <button 
            onClick={() => navigate('/')}
            className="bg-cyan-400 text-black px-4 py-2 rounded hover:bg-cyan-300 transition-colors"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 text-white">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-cyan-400 mb-2">Products</h1>
        <p className="text-gray-400">Browse and contact sellers directly</p>
      </div>
      
      <div className="grid gap-4">
        {cartItems.map((item) => (
          <ProductItemCard 
            key={item._id} 
            item={item}
          />
        ))}
      </div>
    </div>
  );
};