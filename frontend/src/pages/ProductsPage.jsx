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

  const startChat = async (sellerId, sellerName, itemId, productName) => {
    try {
      const userId = user?.id || user?.sub;
      if (!userId) {
        alert('Please login to start a chat');
        return;
      }

      const payload = { 
        sellerId, 
        userId, 
        itemId,
        productName,
        buyerName: user?.username || user?.name,
        sellerName
      };
      
      console.log('Starting chat with payload:', payload);
      const response = await itemsAPI.startChat(payload);
      
      if (response.chatId) {
        // Ensure socket is connected before navigating
        if (!socket.connected) {
          socket.connect();
        }
        
        // Join the chat room before navigating
        socket.emit('joinRoom', response.chatId);
        socket.emit('userJoin', userId);
        
        navigate(`/chat/${response.chatId}`);
      } else {
        console.error('No chatId in response:', response);
        alert('Failed to start chat: No chat ID received');
      }
    } catch (error) {
      console.error("Error starting chat:", error);
      alert("Failed to start chat: " + (error.response?.data?.error || error.message));
    }
  };

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
          <ProductItemCard 
            key={item._id || index} 
            item={item} 
            onStartChat={startChat}
          />
        ))
      )}
    </div>
  );
};