import React, { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import { FaArrowLeft } from "react-icons/fa";
import { useAuth } from "../context/AuthContext";
import { useSocket, useSocketConnection } from "../contexts/SocketContext";

// Get the server URL from environment or use a fallback
const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://192.168.35.239:5000';

const ChatPage = () => {
  const { chatId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const socket = useSocket();
  const isConnected = useSocketConnection();
  
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [chatInfo, setChatInfo] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const [otherUserTyping, setOtherUserTyping] = useState(false);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Get user ID consistently
  const userId = user?.id || user?.sub;

  // Scroll to bottom function
  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  }, []);

  // Fetch initial data
  const fetchChatInfo = useCallback(async () => {
    if (!chatId) return;
    
    try {
      const response = await axios.get(`${SERVER_URL}/api/chat/${chatId}/info`);
      setChatInfo(response.data);
      
      // If the response contains a different chatId, navigate to it
      if (response.data.chatId && response.data.chatId !== chatId) {
        navigate(`/chat/${response.data.chatId}`, { replace: true });
      }
    } catch (error) {
      console.error("Error fetching chat info:", error);
    }
  }, [chatId, navigate]);

  const fetchMessages = useCallback(async () => {
    if (!chatId) return;
    
    try {
      setLoading(true);
      const response = await axios.get(`${SERVER_URL}/api/chat/${chatId}/messages`);
      
      // Sort messages by timestamp to ensure proper order
      const sortedMessages = response.data.sort((a, b) => 
        new Date(a.createdAt) - new Date(b.createdAt)
      );
      
      setMessages(sortedMessages);
      scrollToBottom();
    } catch (error) {
      console.error("Error fetching messages:", error);
    } finally {
      setLoading(false);
    }
  }, [chatId, scrollToBottom]);

  // Socket event handlers
  const handleReceiveMessage = useCallback((message) => {
    console.log('Received message:', message);
    
    // Prevent duplicate messages
    setMessages((prevMessages) => {
      const messageExists = prevMessages.some(
        msg => msg.id === message.id || 
        (msg.content === message.content && 
         msg.senderId === message.senderId && 
         Math.abs(new Date(msg.createdAt) - new Date(message.createdAt)) < 1000)
      );
      
      if (messageExists) {
        return prevMessages;
      }
      
      const updatedMessages = [...prevMessages, message];
      return updatedMessages.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    });
    
    scrollToBottom();
  }, [scrollToBottom]);

  const handleUserTyping = useCallback(({ userId: typingUserId, isTyping }) => {
    // Only show typing indicator for other users
    if (typingUserId && typingUserId !== userId) {
      setOtherUserTyping(isTyping);
    }
  }, [userId]);

  const handleSocketError = useCallback((error) => {
    console.error('Socket error:', error);
  }, []);

  // Socket connection and event setup
  useEffect(() => {
    if (!socket || !chatId || !userId || !isConnected) {
      console.log('Socket setup skipped:', { socket: !!socket, chatId, userId, isConnected });
      return;
    }

    console.log('Setting up socket connection for chat:', chatId);

    // Join room and user
    socket.emit('userJoin', userId);
    socket.emit('joinRoom', chatId);

    // Set up socket event listeners
    socket.on('receiveMessage', handleReceiveMessage);
    socket.on('userTyping', handleUserTyping);
    socket.on('error', handleSocketError);

    // Cleanup function
    return () => {
      console.log('Cleaning up socket listeners');
      socket.off('receiveMessage', handleReceiveMessage);
      socket.off('userTyping', handleUserTyping);
      socket.off('error', handleSocketError);
    };
  }, [socket, chatId, userId, isConnected, handleReceiveMessage, handleUserTyping, handleSocketError]);

  // Fetch initial data
  useEffect(() => {
    if (chatId) {
      fetchChatInfo();
      fetchMessages();
    }
  }, [chatId, fetchChatInfo, fetchMessages]);

  // Handle typing indicator
  const handleTyping = useCallback(() => {
    if (!socket || !isConnected || !chatId || !userId) return;
    
    // Only emit typing if not already typing
    if (!isTyping) {
      setIsTyping(true);
      socket.emit('typing', { 
        chatId, 
        userId, 
        isTyping: true 
      });
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout to stop typing
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      if (socket && isConnected) {
        socket.emit('typing', { 
          chatId, 
          userId, 
          isTyping: false 
        });
      }
    }, 2000);
  }, [socket, isConnected, chatId, userId, isTyping]);

  // Send message
  const sendMessage = async (e) => {
    e.preventDefault();
    
    if (!newMessage.trim() || !socket || !isConnected || !chatId || !userId) {
      console.log('Send message blocked:', { 
        message: newMessage.trim(), 
        socket: !!socket, 
        isConnected, 
        chatId, 
        userId 
      });
      return;
    }

    const messageContent = newMessage.trim();
    const messageObj = {
      content: messageContent,
      senderId: userId,
      senderName: user?.username || user?.name || 'Unknown',
      chatId,
      createdAt: new Date().toISOString(),
      // Add a temporary ID for deduplication
      tempId: Date.now() + Math.random()
    };

    try {
      console.log('Sending message:', messageObj);
      
      // Clear the input immediately for better UX
      setNewMessage("");
      
      // Clear typing status
      setIsTyping(false);
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      socket.emit('typing', { 
        chatId, 
        userId, 
        isTyping: false 
      });
      
      // Add message optimistically to UI
      setMessages(prev => [...prev, messageObj]);
      scrollToBottom();
      
      // Send message via socket
      socket.emit('sendMessage', { 
        chatId, 
        message: messageObj 
      });
      
    } catch (error) {
      console.error('Error sending message:', error);
      // Restore message input on error
      setNewMessage(messageContent);
    }
  };

  // Navigation
  const handleBack = () => {
    navigate("/", { state: { activeIndex: 3 } });
  };

  // Helper functions
  const getCurrentUserRole = () => {
    if (!chatInfo || !userId) return null;
    return chatInfo.sellerId === userId ? 'seller' : 'buyer';
  };

  const getOtherUserName = () => {
    if (!chatInfo) return 'Loading...';
    const userRole = getCurrentUserRole();
    return userRole === 'seller' ? 
      (chatInfo.buyerName || 'Buyer') : 
      (chatInfo.sellerName || 'Seller');
  };

  const formatMessageTime = (timestamp) => {
    try {
      return new Date(timestamp).toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } catch {
      return '';
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  if (!chatId || !userId) {
    return (
      <div className="flex items-center justify-center h-screen bg-black text-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto mb-4"></div>
          <p>Loading chat...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-black text-white">
      {/* Header */}
      <div className="p-4 border-b border-cyan-400 bg-gray-900">
        <div className="flex items-center">
          <button 
            onClick={handleBack}
            className="mr-4 text-cyan-400 hover:text-cyan-300 transition-colors"
          >
            <FaArrowLeft className="text-xl" />
          </button>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-cyan-400">{getOtherUserName()}</h1>
            {chatInfo?.productName && (
              <p className="text-sm text-gray-400">
                About: {chatInfo.productName}
              </p>
            )}
            <div className="flex items-center space-x-2 text-xs">
              <span className={`${isConnected ? 'text-green-400' : 'text-red-400'}`}>
                {isConnected ? '● Connected' : '● Disconnected'}
              </span>
              {!isConnected && (
                <span className="text-yellow-400">Reconnecting...</span>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {loading ? (
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400"></div>
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center text-gray-500 mt-8">
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((message, index) => (
            <div
              key={message.id || message.tempId || index}
              className={`flex flex-col ${
                message.senderId === userId ? "items-end" : "items-start"
              }`}
            >
              <div className={`p-3 rounded-lg max-w-[70%] break-words ${
                message.senderId === userId
                  ? "bg-cyan-400 text-black"
                  : "bg-gray-700 text-white"
              }`}>
                {message.content}
              </div>
              <div className="flex items-center space-x-2 text-xs text-gray-500 mt-1">
                <span>
                  {message.senderId === userId
                    ? 'You'
                    : (message.senderName || 'Unknown')}
                </span>
                {message.createdAt && (
                  <>
                    <span>•</span>
                    <span>{formatMessageTime(message.createdAt)}</span>
                  </>
                )}
              </div>
            </div>
          ))
        )}
        
        {/* Typing indicator */}
        {otherUserTyping && (
          <div className="flex items-start">
            <div className="bg-gray-700 p-3 rounded-lg">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
              </div>
            </div>
            <span className="text-xs text-gray-500 ml-2 mt-1">
              {getOtherUserName()} is typing...
            </span>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="p-4 border-t border-cyan-400 bg-gray-900">
        <form onSubmit={sendMessage} className="flex space-x-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => {
              setNewMessage(e.target.value);
              handleTyping();
            }}
            placeholder={isConnected ? "Type a message..." : "Reconnecting..."}
            disabled={!isConnected}
            className="flex-1 bg-gray-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-400 disabled:opacity-50 disabled:cursor-not-allowed"
            maxLength={1000}
          />
          <button
            type="submit"
            disabled={!newMessage.trim() || !isConnected}
            className="bg-cyan-400 text-black px-6 py-2 rounded-lg hover:bg-cyan-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatPage;