import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import { FaArrowLeft } from "react-icons/fa";
import { useAuth } from "../context/AuthContext";
import { socket } from "../services/socket";

// Get the server URL from environment or use a fallback
const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://192.168.35.239:5000';

const ChatPage = () => {
  const { chatId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [chatInfo, setChatInfo] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const [otherUserTyping, setOtherUserTyping] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('connecting');
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    // Join room and set up socket listeners
    socket.emit('userJoin', user?.id || user?.sub);
    socket.emit('joinRoom', chatId);

    const handleReceiveMessage = (message) => {
      setMessages((prev) => [...prev, message]);
      // Scroll to bottom when new message arrives
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    const handleUserTyping = ({ userId, isTyping }) => {
      if (userId !== (user?.id || user?.sub)) {
        setOtherUserTyping(isTyping);
      }
    };

    const handleConnect = () => {
      setConnectionStatus('connected');
      // Re-join room after reconnection
      socket.emit('userJoin', user?.id || user?.sub);
      socket.emit('joinRoom', chatId);
    };

    const handleDisconnect = () => {
      setConnectionStatus('disconnected');
    };

    const handleError = (error) => {
      console.error('Socket error:', error);
      setConnectionStatus('error');
    };

    // Set up socket event listeners
    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('receiveMessage', handleReceiveMessage);
    socket.on('userTyping', handleUserTyping);
    socket.on('error', handleError);

    // Fetch initial messages and chat info
    fetchMessages();
    fetchChatInfo();

    return () => {
      // Clean up socket listeners
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('receiveMessage', handleReceiveMessage);
      socket.off('userTyping', handleUserTyping);
      socket.off('error', handleError);
    };
  }, [chatId, user]);

  const handleTyping = () => {
    if (!isTyping) {
      setIsTyping(true);
      socket.emit('typing', { chatId, userId: user?.id || user?.sub, isTyping: true });
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      socket.emit('typing', { chatId, userId: user?.id || user?.sub, isTyping: false });
    }, 2000);
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || connectionStatus !== 'connected') return;

    const messageObj = {
      content: newMessage,
      senderId: user?.id || user?.sub,
      senderName: user?.username || user?.name,
      chatId,
      createdAt: new Date().toISOString()
    };

    try {
      // Emit to socket first for instant delivery
      socket.emit('sendMessage', { chatId, message: messageObj });
      
      // Clear typing status
      setIsTyping(false);
      socket.emit('typing', { chatId, userId: user?.id || user?.sub, isTyping: false });
      
      setNewMessage("");
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const fetchChatInfo = async () => {
    try {
      const response = await axios.get(`${SERVER_URL}/api/chat/${chatId}/info`);
      setChatInfo(response.data);
      if (response.data.chatId) {
        navigate(`/chat/${response.data.chatId}`);
      }
    } catch (error) {
      console.error("Error fetching chat info:", error);
    }
  };

  const fetchMessages = async () => {
    try {
      const response = await axios.get(`${SERVER_URL}/api/chat/${chatId}/messages`);
      setMessages(response.data);
    } catch (error) {
      console.error("Error fetching messages:", error);
    }
  };

  const handleBack = () => {
    // Go to the product page (cart tab)
    navigate("/", { state: { activeIndex: 3 } });
  };

  const getCurrentUserRole = () => {
    if (!chatInfo) return null;
    return chatInfo.sellerId === (user?.id || user?.sub) ? 'seller' : 'buyer';
  };

  const getOtherUserName = () => {
    if (!chatInfo) return 'Loading...';
    const userRole = getCurrentUserRole();
    return userRole === 'seller' ? chatInfo.buyerName : chatInfo.sellerName;
  };

  return (
    <div className="flex flex-col h-screen bg-black text-white">
      <div className="p-4 border-b border-cyan-400">
        <div className="flex items-center mb-2">
          <button 
            onClick={handleBack}
            className="mr-4 text-cyan-400 hover:text-cyan-300 transition-colors"
          >
            <FaArrowLeft className="text-xl" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-cyan-400">{getOtherUserName()}</h1>
            {chatInfo && (
              <p className="text-sm text-gray-400">
                {chatInfo.productName && `About: ${chatInfo.productName}`}
              </p>
            )}
            <p className={`text-xs ${
              connectionStatus === 'connected' ? 'text-green-400' : 
              connectionStatus === 'connecting' ? 'text-yellow-400' : 
              'text-red-400'
            }`}>
              {connectionStatus === 'connected' ? 'Connected' :
               connectionStatus === 'connecting' ? 'Connecting...' :
               'Disconnected - Trying to reconnect...'}
            </p>
          </div>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex flex-col ${
              message.senderId === (user?.id || user?.sub) ? "items-end" : "items-start"
            }`}
          >
            <div className={`p-3 rounded-lg max-w-[70%] ${
              message.senderId === (user?.id || user?.sub)
                ? "bg-cyan-400 text-black"
                : "bg-gray-700"
            }`}>
              {message.content}
            </div>
            <span className="text-xs text-gray-500 mt-1">
              {message.senderName
                ? message.senderName
                : message.senderId === (user?.id || user?.sub)
                  ? 'You'
                  : 'Unknown'}
            </span>
          </div>
        ))}
        {otherUserTyping && (
          <div className="text-sm text-gray-400 italic">
            {getOtherUserName()} is typing...
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={sendMessage} className="p-4 border-t border-cyan-400">
        <div className="flex space-x-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => {
              setNewMessage(e.target.value);
              handleTyping();
            }}
            placeholder="Type a message..."
            className="flex-1 bg-gray-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-400"
          />
          <button
            type="submit"
            className="bg-cyan-400 text-black px-6 py-2 rounded-lg hover:bg-cyan-500 transition-colors"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
};

export default ChatPage;
