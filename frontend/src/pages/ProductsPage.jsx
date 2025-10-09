import React from 'react';
import { useCart } from '../hooks/useCart';
import { ProductItemCard } from '../Components/items/ProductItemCard';

export const ProductsPage = () => {
  const { cartItems, cartError, loading, fetchCartItems } = useCart();

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
            onClick={fetchCartItems}
            className="bg-cyan-400 text-black px-4 py-2 rounded-lg hover:bg-cyan-300"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const productItems = cartItems.filter(item => item.type === "product");

  return (
    <div className="p-6 text-white">
      <h1 className="text-2xl font-bold text-cyan-400 mb-6">Available Products</h1>
      {productItems.length === 0 ? (
        <div className="text-center text-gray-400 mt-8">
          <p>No products available</p>
        </div>
      ) : (
        productItems.map((item, index) => (
          <ProductItemCard key={item._id || index} item={item} />
        ))
      )}
    </div>
  );
};