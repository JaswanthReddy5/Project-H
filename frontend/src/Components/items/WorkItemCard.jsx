/* eslint-disable react/prop-types */

export const WorkItemCard = ({ item }) => {
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
      <p className="text-yellow-400 text-xl">${item.amount}</p>
      <p className="text-gray-400">Time: {item.time}</p>
      
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