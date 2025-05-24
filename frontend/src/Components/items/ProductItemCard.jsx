/* eslint-disable react/prop-types */


export const ProductItemCard = ({ item, onStartChat }) => {
  const handleChatClick = () => {
    if (!item.sellerId && !item.seller && !item.ownerId) {
      console.error("No seller ID found for this item.");
      return;
    }
    onStartChat(item.sellerId || item.seller || item.ownerId, item.sellerName, item._id, item.productName);
  };

  return (
    <div className="bg-[#0a0f1e] text-white p-4 rounded-xl border border-cyan-400 shadow-md flex flex-col items-start mb-4">
      <div className="flex justify-between w-full mb-2">    
        <p className="font-bold text-lg">{item.productName}</p>
        <p className="text-cyan-400">
          Posted by: <span className="font-medium">{item.sellerName}</span>
        </p>
      </div>
      <p className="text-yellow-400 text-xl">${item.price}</p>
      <p className="text-gray-400">Quantity: {item.quantity}</p>
      <button 
        onClick={handleChatClick}
        className="bg-cyan-400 text-black px-4 py-2 rounded mt-4 hover:bg-cyan-500 transition-colors w-full text-center"
      >
        Chat with {item.sellerName}
      </button>
    </div>
  );
};