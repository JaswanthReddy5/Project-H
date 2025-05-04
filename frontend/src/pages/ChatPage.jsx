import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import { FaArrowLeft } from "react-icons/fa";
import { useAuth } from "../context/AuthContext";
import { io } from "socket.io-client";

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
  const messagesEndRef = useRef(null);
  const socketRef = useRef(null);

  useEffect(() => {
    fetchMessages();
    fetchChatInfo();

    // Connect and join room
    socketRef.current = io(SERVER_URL, { autoConnect: true });
    socketRef.current.emit('joinRoom', chatId);

    // Listen for incoming messages
    socketRef.current.on('receiveMessage', (message) => {
      if (message.chatId === chatId) {
        setMessages((prev) => [...prev, message]);
      }
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.off('receiveMessage');
        socketRef.current.disconnect();
      }
    };
  }, [chatId]);

  useEffect(() => {
    // Scroll to bottom on new message
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

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

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const messageObj = {
      content: newMessage,
      senderId: user?.id || user?.sub,
      senderName: user?.username || user?.name,
      chatId,
      createdAt: new Date().toISOString()
    };

    // Save to backend (for persistence)
    await axios.post(`${SERVER_URL}/api/chat/${chatId}/messages`, messageObj);

    // Emit to socket
    if (socketRef.current) {
      socketRef.current.emit('sendMessage', { chatId, message: messageObj });
    }

    setMessages((prev) => [...prev, messageObj]);
    setNewMessage("");
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
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={sendMessage} className="p-4 border-t-2 border-cyan-400 bg-gray-900">
        <div className="flex space-x-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
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
