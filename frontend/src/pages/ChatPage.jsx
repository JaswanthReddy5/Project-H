/* eslint-disable react-hooks/rules-of-hooks */
/* eslint-disable no-unused-vars */
import React, { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { FaArrowLeft } from "react-icons/fa";
import { useAuth } from "../context/AuthContext";
import { useSocket, useSocketConnection } from "../contexts/SocketContext";

// Get the server URL from environment or use a fallback
const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://192.168.35.239:5000';

const ChatPage = () => {
  const { chatId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const socket = useSocket();
  const isConnected = useSocketConnection();
  
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [chatInfo, setChatInfo] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const [otherUserTyping, setOtherUserTyping] = useState(false);
  const [loading, setLoading] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState('connecting');
  const [messageQueue, setMessageQueue] = useState([]);
  const [retryCount, setRetryCount] = useState(0);
  
  // Get user ID consistently
  const userId = user?.id || user?.sub;

  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const isInitializedRef = useRef(false);
  const lastMessageIdRef = useRef(null);

  // Debug: Add error boundary and loading state
  const [error, setError] = useState(null);
  
  // Early return for debugging
  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-black text-white">
        <div className="text-center text-red-400">
          <h2 className="text-xl mb-2">Error</h2>
          <p>{error}</p>
          <button 
            onClick={() => setError(null)}
            className="mt-4 px-4 py-2 bg-cyan-400 text-black rounded"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen bg-black text-white">
        <div className="text-center">
          <p>Please log in to access chat</p>
          <button 
            onClick={() => navigate('/login')}
            className="mt-4 px-4 py-2 bg-cyan-400 text-black rounded"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  // Enhanced scroll to bottom function
  const scrollToBottom = useCallback(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ 
        behavior: "smooth",
        block: "end"
      });
    }
  }, []);

  // Connection status handler
  useEffect(() => {
    if (isConnected) {
      setConnectionStatus('connected');
      setRetryCount(0);
      // Process queued messages when reconnected
      if (messageQueue.length > 0) {
        messageQueue.forEach(msg => {
          if (socket) {
            socket.emit('sendMessage', msg);
          }
        });
        setMessageQueue([]);
      }
    } else {
      setConnectionStatus('disconnected');
    }
  }, [isConnected, messageQueue, socket]);

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
      setError(`Failed to load chat info: ${error.message}`);
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
      
      // Store last message ID for deduplication
      if (sortedMessages.length > 0) {
        lastMessageIdRef.current = sortedMessages[sortedMessages.length - 1].id;
      }
      
      setTimeout(scrollToBottom, 100);
    } catch (error) {
      console.error("Error fetching messages:", error);
      setError(`Failed to load messages: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }, [chatId, scrollToBottom]);

  // Enhanced message deduplication
  const isDuplicateMessage = useCallback((newMsg, existingMessages) => {
    return existingMessages.some(msg => {
      // Check by ID first
      if (msg.id && newMsg.id && msg.id === newMsg.id) {
        return true;
      }
      
      // Check by content, sender, and time proximity
      const timeDiff = Math.abs(new Date(msg.createdAt) - new Date(newMsg.createdAt));
      return (
        msg.content === newMsg.content &&
        msg.senderId === newMsg.senderId &&
        timeDiff < 2000 // 2 seconds tolerance
      );
    });
  }, []);

  // Socket event handlers
  const handleReceiveMessage = useCallback((messageData) => {
    console.log('📨 Received message:', messageData);
    
    // Ensure we have the required data
    if (!messageData || !messageData.content) {
      console.warn('Invalid message data received:', messageData);
      return;
    }

    const message = {
      id: messageData.id || Date.now() + Math.random(),
      content: messageData.content,
      senderId: messageData.senderId,
      senderName: messageData.senderName || 'Unknown',
      chatId: messageData.chatId || chatId,
      createdAt: messageData.createdAt || new Date().toISOString(),
      ...messageData
    };
    
    setMessages((prevMessages) => {
      // Check for duplicates
      if (isDuplicateMessage(message, prevMessages)) {
        console.log('🚫 Duplicate message detected, skipping');
        return prevMessages;
      }
      
      const updatedMessages = [...prevMessages, message];
      const sortedMessages = updatedMessages.sort((a, b) => 
        new Date(a.createdAt) - new Date(b.createdAt)
      );
      
      // Update last message ID
      lastMessageIdRef.current = message.id;
      
      console.log('✅ Message added to chat');
      return sortedMessages;
    });
    
    // Scroll to bottom after a short delay
    setTimeout(scrollToBottom, 50);
  }, [chatId, isDuplicateMessage, scrollToBottom]);

  const handleUserTyping = useCallback(({ userId: typingUserId, isTyping: typing, chatId: typingChatId }) => {
    // Only show typing indicator for other users in this chat
    if (typingUserId && typingUserId !== userId && typingChatId === chatId) {
      console.log(`👀 ${typingUserId} is ${typing ? 'typing' : 'not typing'}`);
      setOtherUserTyping(typing);
    }
  }, [userId, chatId]);

  const handleSocketError = useCallback((error) => {
    console.error('🔥 Socket error:', error);
    setConnectionStatus('error');
  }, []);

  const handleConnect = useCallback(() => {
    console.log('🔗 Socket connected');
    setConnectionStatus('connected');
    setRetryCount(0);
    
    // Rejoin room when reconnected
    if (socket && chatId && userId) {
      socket.emit('userJoin', userId);
      socket.emit('joinRoom', chatId);
    }
  }, [socket, chatId, userId]);

  const handleDisconnect = useCallback((reason) => {
    console.log('🔌 Socket disconnected:', reason);
    setConnectionStatus('disconnected');
    setOtherUserTyping(false);
  }, []);

  // Socket connection and event setup
  useEffect(() => {
    if (!socket || !chatId || !userId) {
      console.log('⏸️ Socket setup skipped:', { socket: !!socket, chatId, userId });
      return;
    }

    // Prevent multiple initializations
    if (isInitializedRef.current) {
      return;
    }

    console.log('🚀 Setting up socket connection for chat:', chatId);
    isInitializedRef.current = true;

    // Join room and user
    socket.emit('userJoin', userId);
    socket.emit('joinRoom', chatId);

    // Set up socket event listeners
    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('receiveMessage', handleReceiveMessage);
    socket.on('userTyping', handleUserTyping);
    socket.on('error', handleSocketError);
    socket.on('message', handleReceiveMessage); // Alternative event name
    socket.on('newMessage', handleReceiveMessage); // Another alternative

    // Cleanup function
    return () => {
      console.log('🧹 Cleaning up socket listeners');
      isInitializedRef.current = false;
      
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('receiveMessage', handleReceiveMessage);
      socket.off('userTyping', handleUserTyping);
      socket.off('error', handleSocketError);
      socket.off('message', handleReceiveMessage);
      socket.off('newMessage', handleReceiveMessage);
      
      // Leave room
      socket.emit('leaveRoom', chatId);
    };
  }, [socket, chatId, userId, handleConnect, handleDisconnect, handleReceiveMessage, handleUserTyping, handleSocketError]);

  // Fetch initial data
  useEffect(() => {
    if (chatId) {
      fetchChatInfo();
      fetchMessages();
    }
  }, [chatId, fetchChatInfo, fetchMessages]);

  // Handle typing indicator with debouncing
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
      console.log('⌨️ Started typing');
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
        console.log('⌨️ Stopped typing');
      }
    }, 2000);
  }, [socket, isConnected, chatId, userId, isTyping]);

  // Enhanced send message function
  const sendMessage = async (e) => {
    e.preventDefault();
    
    if (!newMessage.trim()) {
      return;
    }

    if (!socket || !chatId || !userId) {
      console.error('❌ Cannot send message: missing requirements');
      return;
    }

    const messageContent = newMessage.trim();
    const tempId = `temp_${Date.now()}_${Math.random()}`;
    const messageObj = {
      id: tempId,
      content: messageContent,
      senderId: userId,
      senderName: user?.username || user?.name || 'You',
      chatId,
      createdAt: new Date().toISOString(),
      isTemporary: true
    };

    try {
      console.log('📤 Sending message:', messageContent);
      
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
      setTimeout(scrollToBottom, 50);
      
      if (isConnected) {
        // Send message via socket
        socket.emit('sendMessage', { 
          chatId, 
          message: messageObj 
        });
        console.log('✅ Message sent via socket');
      } else {
        // Queue message for when connection is restored
        setMessageQueue(prev => [...prev, { chatId, message: messageObj }]);
        console.log('⏳ Message queued for later');
      }
      
    } catch (error) {
      console.error('❌ Error sending message:', error);
      // Restore message input on error
      setNewMessage(messageContent);
      
      // Remove the optimistic message
      setMessages(prev => prev.filter(msg => msg.id !== tempId));
    }
  };

  // Auto-retry connection
  useEffect(() => {
    if (!isConnected && retryCount < 5) {
      const timeout = setTimeout(() => {
        console.log(`🔄 Attempting to reconnect... (${retryCount + 1}/5)`);
        setRetryCount(prev => prev + 1);
        if (socket) {
          socket.connect();
        }
      }, Math.pow(2, retryCount) * 1000); // Exponential backoff
      
      reconnectTimeoutRef.current = timeout;
      
      return () => clearTimeout(timeout);
    }
  }, [isConnected, retryCount, socket]);

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

  const getConnectionStatusColor = () => {
    switch (connectionStatus) {
      case 'connected': return 'text-green-400';
      case 'connecting': return 'text-yellow-400';
      case 'disconnected': return 'text-red-400';
      case 'error': return 'text-red-500';
      default: return 'text-gray-400';
    }
  };

  const getConnectionStatusText = () => {
    switch (connectionStatus) {
      case 'connected': return '● Connected';
      case 'connecting': return '● Connecting...';
      case 'disconnected': return retryCount > 0 ? `● Reconnecting... (${retryCount}/5)` : '● Disconnected';
      case 'error': return '● Connection Error';
      default: return '● Unknown';
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
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
              <span className={isConnected ? 'text-green-400' : 'text-red-400'}>
                {isConnected ? '● Connected' : '● Disconnected'}
              </span>
              {!isConnected && (
                <span className="text-yellow-400">Reconnecting...</span>
              )}
              {messageQueue.length > 0 && (
                <span className="text-yellow-400">
                  • {messageQueue.length} queued
                </span>
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
              key={message.id || `msg-${index}`}
              className={`flex flex-col ${
                message.senderId === userId ? "items-end" : "items-start"
              }`}
            >
              <div className={`p-3 rounded-lg max-w-[70%] break-words relative ${
                message.senderId === userId
                  ? "bg-cyan-400 text-black"
                  : "bg-gray-700 text-white"
              } ${message.isTemporary ? 'opacity-70' : ''}`}>
                {message.content}
                {message.isTemporary && (
                  <div className="absolute -bottom-1 -right-1 w-3 h-3 animate-spin rounded-full border border-gray-400 border-t-transparent"></div>
                )}
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
            disabled={!userId}
            className="flex-1 bg-gray-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-400 disabled:opacity-50 disabled:cursor-not-allowed"
            maxLength={1000}
            autoComplete="off"
          />
          <button
            type="submit"
            disabled={!newMessage.trim() || !userId}
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