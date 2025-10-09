// eslint-disable-next-line no-unused-vars
import React from 'react';
import { useCart } from '../hooks/useCart';
import { WorkItemCard } from '../Components/items/WorkItemCard';

export const WorkPage = () => {
  const { cartItems, cartError, loading, fetchCartItems } = useCart();

  if (loading) {
    return (
      <div className="p-6 text-white">
        <div className="flex items-center justify-center h-64">
          <div className="text-cyan-400 text-xl">Loading work items...</div>
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

  const workItems = cartItems.filter(item => item.type === "work");

  return (
    <div className="p-6 text-white">
      <h1 className="text-2xl font-bold text-cyan-400 mb-6">Available Work</h1>
      {workItems.length === 0 ? (
        <div className="text-center text-gray-400 mt-8">
          <p>No work items available</p>
        </div>
      ) : (
        workItems.map((item, index) => (
          <WorkItemCard key={item._id || index} item={item} />
        ))
      )}
    </div>
  );
};