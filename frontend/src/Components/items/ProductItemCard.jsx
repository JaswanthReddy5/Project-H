/* eslint-disable react/prop-types */

export const ProductItemCard = ({ item }) => {
  const handleCallClick = () => {
    if (item.sellerPhoneNumber) {
      // Create a tel: link to initiate phone call
      window.location.href = `tel:${item.sellerPhoneNumber}`;
    } else {
      console.error("No phone number found for this seller.");
    }
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
      
      {/* Phone number display */}
      {item.sellerPhoneNumber && (
        <div className="w-full mt-2 p-2 bg-gray-800 rounded">
          <p className="text-sm text-gray-300">Contact:</p>
          <p className="text-cyan-400 font-mono">{item.sellerPhoneNumber}</p>
        </div>
      )}
      
      <button 
        onClick={handleCallClick}
        className="bg-green-500 text-white px-4 py-2 rounded mt-4 hover:bg-green-600 transition-colors w-full text-center flex items-center justify-center gap-2"
        disabled={!item.sellerPhoneNumber}
      >
        📞 Call {item.sellerName}
      </button>
    </div>
  );
};