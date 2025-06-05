/* eslint-disable react-hooks/rules-of-hooks */
/* eslint-disable no-unused-vars */
import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { FaArrowLeft, FaPaperPlane, FaWifi, FaExclamationTriangle } from "react-icons/fa";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../contexts/SocketContext";

// Get the server URL from environment or use a fallback
const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://192.168.35.239:5000';

// Message status constants
const MESSAGE_STATUS = {
  SENDING: 'sending',
  SENT: 'sent',
  DELIVERED: 'delivered',
  FAILED: 'failed'
};

// Connection status constants
const CONNECTION_STATUS = {
  CONNECTING: 'connecting',
  CONNECTED: 'connected',
  DISCONNECTED: 'disconnected',
  RECONNECTING: 'reconnecting',
  ERROR: 'error'
};

const ChatPage = () => {
  const { chatId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { socket, connected } = useSocket();
  
  // Safe check for socket connection
  const isConnected = connected;
  
  // State management
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [chatInfo, setChatInfo] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const [otherUserTyping, setOtherUserTyping] = useState(false);
  const [otherUserOnline, setOtherUserOnline] = useState(false);
  const [loading, setLoading] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState(CONNECTION_STATUS.CONNECTING);
  const [messageQueue, setMessageQueue] = useState([]);
  const [retryCount, setRetryCount] = useState(0);
  const [error, setError] = useState(null);
  const [lastSeen, setLastSeen] = useState(null);
  const [socketReady, setSocketReady] = useState(false);

  // Get user ID consistently
  const userId = user?.id || user?.sub;

  // Refs
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const isInitializedRef = useRef(false);
  const lastMessageIdRef = useRef(null);
  const messageInputRef = useRef(null);
  const containerRef = useRef(null);
  const currentChatIdRef = useRef(null);
  const socketInitializedRef = useRef(false);

  // Safe socket emit function
  const safeSocketEmit = useCallback((event, data) => {
    if (socket && typeof socket.emit === 'function' && isConnected) {
      try {
        socket.emit(event, data);
        return true;
      } catch (error) {
        console.error(`Failed to emit ${event}:`, error);
        return false;
      }
    } else {
      console.warn(`Cannot emit ${event}: Socket not available or not connected`);
      return false;
    }
  }, [socket, isConnected]);

  // Safe socket event listener management
  const safeSocketOn = useCallback((event, handler) => {
    if (socket && typeof socket.on === 'function') {
      socket.on(event, handler);
    }
  }, [socket]);

  const safeSocketOff = useCallback((event, handler) => {
    if (socket && typeof socket.off === 'function') {
      socket.off(event, handler);
    }
  }, [socket]);

  // Memoized values
  const currentUserRole = useMemo(() => {
    if (!chatInfo || !userId) return null;
    return chatInfo.sellerId === userId ? 'seller' : 'buyer';
  }, [chatInfo, userId]);

  const otherUserName = useMemo(() => {
    if (!chatInfo) return 'Loading...';
    const userRole = currentUserRole;
    return userRole === 'seller' ? 
      (chatInfo.buyerName || 'Buyer') : 
      (chatInfo.sellerName || 'Seller');
  }, [chatInfo, currentUserRole]);

  // Early return for error state
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900 px-4">
        <div className="text-center bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg max-w-md w-full">
          <FaExclamationTriangle className="text-red-500 text-4xl mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Connection Error</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-4">{error}</p>
          <button 
            onClick={() => {
              setError(null);
              setRetryCount(0);
              fetchChatInfo();
              fetchMessages();
            }}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-lg transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Authentication check
  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900 px-4">
        <div className="text-center bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg max-w-md w-full">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Authentication Required</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-4">Please log in to access the chat</p>
          <button 
            onClick={() => navigate('/login')}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-lg transition-colors"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  // Enhanced scroll to bottom function
  const scrollToBottom = useCallback((behavior = "smooth") => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ 
        behavior,
        block: "end"
      });
    }
  }, []);

  // Connection status management
  useEffect(() => {
    if (isConnected) {
      setConnectionStatus(CONNECTION_STATUS.CONNECTED);
      setRetryCount(0);
      
      // Process queued messages when reconnected
      if (messageQueue.length > 0) {
        console.log(`📨 Processing ${messageQueue.length} queued messages`);
        messageQueue.forEach((queuedMessage, index) => {
          setTimeout(() => {
            safeSocketEmit('sendMessage', queuedMessage);
          }, index * 100); // Stagger messages to prevent overwhelming
        });
        setMessageQueue([]);
      }
    } else {
      setConnectionStatus(retryCount > 0 ? CONNECTION_STATUS.RECONNECTING : CONNECTION_STATUS.DISCONNECTED);
    }
  }, [isConnected, messageQueue, safeSocketEmit, retryCount]);

  // Fetch chat information
  const fetchChatInfo = useCallback(async () => {
    if (!chatId) return;
    
    try {
      const response = await axios.get(`${SERVER_URL}/api/chat/${chatId}/info`, {
        timeout: 10000,
        headers: {
          'Authorization': `Bearer ${user?.token || ''}`
        }
      });
      
      setChatInfo(response.data);
      
      // If the response contains a different chatId, navigate to it
      if (response.data.chatId && response.data.chatId !== chatId) {
        navigate(`/chat/${response.data.chatId}`, { replace: true });
        return;
      }
    } catch (error) {
      console.error("❌ Error fetching chat info:", error);
      setError(`Failed to load chat information: ${error.response?.data?.message || error.message}`);
    }
  }, [chatId, navigate, user?.token]);

  // Fetch messages with enhanced error handling
  const fetchMessages = useCallback(async () => {
    if (!chatId) return;
    
    try {
      setLoading(true);
      const response = await axios.get(`${SERVER_URL}/api/chat/${chatId}/messages`, {
        timeout: 15000,
        headers: {
          'Authorization': `Bearer ${user?.token || ''}`
        }
      });
      
      // Sort messages by timestamp and add status
      const sortedMessages = response.data
        .map(msg => ({
          ...msg,
          status: msg.senderId === userId ? MESSAGE_STATUS.DELIVERED : undefined
        }))
        .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
      
      setMessages(sortedMessages);
      
      // Store last message ID for deduplication
      if (sortedMessages.length > 0) {
        lastMessageIdRef.current = sortedMessages[sortedMessages.length - 1].id;
      }
      
      // Scroll to bottom after messages load
      setTimeout(() => scrollToBottom("auto"), 100);
    } catch (error) {
      console.error("❌ Error fetching messages:", error);
      setError(`Failed to load messages: ${error.response?.data?.message || error.message}`);
    } finally {
      setLoading(false);
    }
  }, [chatId, scrollToBottom, userId, user?.token]);

  // Initialize socket connection for chat
  const initializeSocket = useCallback(() => {
    if (!socket || !chatId || !userId || !isConnected || socketInitializedRef.current) {
      return;
    }

    console.log('Initializing socket for chat:', chatId, 'User:', userId);
    
    // Store current chat ID
    currentChatIdRef.current = chatId;
    socketInitializedRef.current = true;

    // Leave any previous rooms first
    socket.emit('leaveAllRooms');
    
    // Join as user and join the specific chat room
    socket.emit('userJoin', {
      userId: userId,
      username: user?.username || user?.name || 'Unknown User'
    });
    
    // Join the chat room
    socket.emit('joinRoom', {
      chatId: chatId,
      userId: userId
    });

    setSocketReady(true);
    console.log('Socket initialized for chat:', chatId);
  }, [socket, chatId, userId, isConnected, user]);

  // Socket event handlers - FIXED VERSION
  const handleReceiveMessage = useCallback((data) => {
    console.log('📩 Received message:', data);
    
    const message = data.message || data;
    
    // Only process messages for the current chat
    if (message.chatId && message.chatId !== currentChatIdRef.current) {
      console.log('Ignoring message for different chat:', message.chatId);
      return;
    }
    
    setMessages((prevMessages) => {
      // If this message has a tempId and matches an existing message, replace it
      if (message.tempId) {
        const existingIndex = prevMessages.findIndex(msg => msg.tempId === message.tempId);
        if (existingIndex !== -1) {
          console.log('Replacing temporary message with server message');
          const updatedMessages = [...prevMessages];
          updatedMessages[existingIndex] = { ...message, tempId: undefined };
          return updatedMessages.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        }
      }
      
      // For messages from the current user, check if we can replace a temp message
      if (message.senderId === userId) {
        // Check if this server message can replace a temporary message
        const tempMsgIndex = prevMessages.findIndex(msg => 
          msg.tempId && 
          msg.content === message.content && 
          msg.senderId === message.senderId &&
          Math.abs(new Date(msg.createdAt) - new Date(message.createdAt)) < 10000 // 10 second window
        );
        
        if (tempMsgIndex !== -1) {
          console.log('Replacing temp message with server message for current user');
          const updatedMessages = [...prevMessages];
          updatedMessages[tempMsgIndex] = { ...message, tempId: undefined };
          return updatedMessages.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        }
        
        // Check for exact duplicate (content, sender, and recent timestamp)
        const isDuplicate = prevMessages.some(existingMsg => 
          existingMsg.content === message.content && 
          existingMsg.senderId === message.senderId && 
          !existingMsg.tempId && // Don't consider temp messages as duplicates for replacement
          Math.abs(new Date(existingMsg.createdAt) - new Date(message.createdAt)) < 5000
        );
        
        if (isDuplicate) {
          console.log('Duplicate message from current user ignored');
          return prevMessages;
        }
      } else {
        // For messages from other users, use the original logic
        const isDuplicate = prevMessages.some(existingMsg => {
          // Exact ID match
          if (existingMsg.id && message.id && existingMsg.id === message.id) {
            return true;
          }
          
          // Content and sender match within a reasonable time window
          if (existingMsg.content === message.content && 
              existingMsg.senderId === message.senderId && 
              Math.abs(new Date(existingMsg.createdAt) - new Date(message.createdAt)) < 5000) {
            return true;
          }
          
          return false;
        });
        
        if (isDuplicate) {
          console.log('Duplicate message from other user ignored');
          return prevMessages;
        }
      }
      
      const newMessages = [...prevMessages, message].sort((a, b) => 
        new Date(a.createdAt) - new Date(b.createdAt)
      );
      
      console.log('✅ Message added to chat. Total messages:', newMessages.length);
      return newMessages;
    });
    
    scrollToBottom();
  }, [scrollToBottom, userId]);

  const handleUserTyping = useCallback((data) => {
    console.log('👀 Typing event received:', data);
    
    // Only show typing for other users in current chat
    if (data.userId !== userId && data.chatId === currentChatIdRef.current) {
      setOtherUserTyping(data.isTyping);
      console.log('Other user typing status:', data.isTyping);
    }
  }, [userId]);

  // Socket error handler
  const handleSocketError = useCallback((error) => {
    console.error('❌ Socket error:', error);
  }, []);

  // Socket connect handler
  const handleConnect = useCallback(() => {
    console.log('🔗 Socket connected successfully');
    setConnectionStatus(CONNECTION_STATUS.CONNECTED);
    setRetryCount(0);
    
    // Rejoin room when reconnected
    if (chatId && userId) {
      safeSocketEmit('userJoin', { userId, userName: user?.username || user?.name });
      safeSocketEmit('joinRoom', { roomId: chatId, userId });
      console.log('🏠 Rejoined chat room');
    }
  }, [chatId, userId, user?.username, user?.name, safeSocketEmit]);

  // Socket disconnect handler
  const handleDisconnect = useCallback((reason) => {
    console.log('🔌 Socket disconnected:', reason);
    setConnectionStatus(CONNECTION_STATUS.DISCONNECTED);
    setOtherUserTyping(false);
    setOtherUserOnline(false);
  }, []);

  const handleRoomJoined = useCallback((data) => {
    console.log('✅ Successfully joined room:', data);
  }, []);

  const handleUserJoined = useCallback((data) => {
    console.log('👋 User joined chat:', data);
  }, []);

  // Main socket effect
  useEffect(() => {
    if (!socket || !isConnected) {
      setSocketReady(false);
      socketInitializedRef.current = false;
      return;
    }

    // Reset socket state when chat changes
    if (currentChatIdRef.current !== chatId) {
      socketInitializedRef.current = false;
      setSocketReady(false);
    }

    // Set up socket event listeners
    socket.on('receiveMessage', handleReceiveMessage);
    socket.on('messageReceived', handleReceiveMessage); // Alternative event name
    socket.on('userTyping', handleUserTyping);
    socket.on('typing', handleUserTyping); // Alternative event name
    socket.on('error', handleSocketError);
    socket.on('roomJoined', handleRoomJoined);
    socket.on('userJoined', handleUserJoined);

    // Initialize socket connection
    initializeSocket();

    return () => {
      console.log('🧹 Cleaning up socket listeners');
      socket.off('receiveMessage', handleReceiveMessage);
      socket.off('messageReceived', handleReceiveMessage);
      socket.off('userTyping', handleUserTyping);
      socket.off('typing', handleUserTyping);
      socket.off('error', handleSocketError);
      socket.off('roomJoined', handleRoomJoined);
      socket.off('userJoined', handleUserJoined);
    };
  }, [socket, isConnected, chatId, handleReceiveMessage, handleUserTyping, handleSocketError, handleRoomJoined, handleUserJoined, initializeSocket]);

  // Fetch initial data when chat changes
  useEffect(() => {
    if (chatId) {
      setMessages([]); // Clear messages when switching chats
      fetchChatInfo();
      fetchMessages();
    }
  }, [chatId, fetchChatInfo, fetchMessages]);

  // Handle typing with enhanced debouncing
  const handleTyping = useCallback(() => {
    if (!socket || !isConnected || !chatId || !userId || !socketReady) return;
    
    if (!isTyping) {
      setIsTyping(true);
      const success = safeSocketEmit('typing', { 
        chatId, 
        userId, 
        userName: user?.username || user?.name || 'User',
        isTyping: true 
      });
      console.log('📝 Started typing');
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout to stop typing
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      if (socket && isConnected && socketReady) {
        socket.emit('typing', { 
          chatId, 
          userId, 
          isTyping: false 
        });
        console.log('✏️ Stopped typing');
      }
    }, 2000);
  }, [socket, isConnected, chatId, userId, isTyping, socketReady]);

  // Enhanced send message function
  const sendMessage = useCallback(async (e) => {
    e.preventDefault();
    
    if (!newMessage.trim() || !socket || !isConnected || !chatId || !userId || !socketReady) {
      console.log('❌ Send message blocked:', { 
        hasMessage: !!newMessage.trim(), 
        hasSocket: !!socket, 
        isConnected, 
        chatId, 
        userId,
        socketReady
      });
      return;
    }

    const messageContent = newMessage.trim();
    const tempId = `temp_${Date.now()}_${Math.random()}`;
    const timestamp = new Date().toISOString();
    
    const messageObj = {
      tempId,
      content: messageContent,
      senderId: userId,
      senderName: user?.username || user?.name || 'You',
      chatId,
      createdAt: timestamp
    };

    try {
      console.log('📤 Sending message:', messageObj);
      
      // Clear the input immediately for better UX
      setNewMessage("");
      
      // Clear typing status immediately
      setIsTyping(false);
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      safeSocketEmit('typing', { 
        chatId, 
        userId, 
        userName: user?.username || user?.name || 'User',
        isTyping: false 
      });
      
      // Add message optimistically to UI (only for sender)
      setMessages(prev => [...prev, messageObj]);
      setTimeout(() => scrollToBottom(), 50);
      
      if (isConnected) {
        // Send message via socket
        const success = safeSocketEmit('sendMessage', { 
          chatId, 
          message: messageObj,
          userId,
          userName: user?.username || user?.name || 'User'
        });
        
        if (success) {
          // Update message status to sent
          setTimeout(() => {
            setMessages(prev => prev.map(msg => 
              msg.id === tempId 
                ? { ...msg, status: MESSAGE_STATUS.SENT, isTemporary: false }
                : msg
            ));
          }, 500);
          
          console.log('✅ Message sent via socket');
        } else {
          throw new Error('Failed to send message via socket');
        }
      } else {
        // Queue message for when connection is restored
        const queuedMessage = { 
          chatId, 
          message: messageObj,
          userId,
          userName: user?.username || user?.name || 'User'
        };
        setMessageQueue(prev => [...prev, queuedMessage]);
        
        // Update message status to failed (will retry when connected)
        setMessages(prev => prev.map(msg => 
          msg.id === tempId 
            ? { ...msg, status: MESSAGE_STATUS.FAILED }
            : msg
        ));
        
        console.log('⏳ Message queued for later delivery');
      }
      
      console.log('✅ Message sent successfully');
      
    } catch (error) {
      console.error('❌ Error sending message:', error);
      // Restore message input on error
      setNewMessage(messageContent);
      
      // Remove the optimistic message on error
      setMessages(prev => prev.filter(msg => msg.tempId !== tempId));
    }
  }, [newMessage, chatId, userId, user?.username, user?.name, isConnected, scrollToBottom, safeSocketEmit]);

  // Navigation
  const handleBack = () => {
    // Leave room when navigating away
    if (socket && chatId) {
      socket.emit('leaveRoom', { chatId, userId });
    }
  };

  // Utility functions
  const formatMessageTime = useCallback((timestamp) => {
    try {
      const date = new Date(timestamp);
      const now = new Date();
      const diffInHours = (now - date) / (1000 * 60 * 60);
      
      if (diffInHours < 24) {
        return date.toLocaleTimeString([], { 
          hour: '2-digit', 
          minute: '2-digit' 
        });
      } else {
        return date.toLocaleDateString([], {
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
      }
    } catch {
      return '';
    }
  }, []);

  const getConnectionStatusIcon = useCallback(() => {
    switch (connectionStatus) {
      case CONNECTION_STATUS.CONNECTED:
        return <FaWifi className="text-green-500" />;
      case CONNECTION_STATUS.CONNECTING:
      case CONNECTION_STATUS.RECONNECTING:
        return <div className="animate-spin rounded-full h-4 w-4 border-2 border-yellow-500 border-t-transparent" />;
      case CONNECTION_STATUS.DISCONNECTED:
      case CONNECTION_STATUS.ERROR:
        return <FaWifi className="text-red-500" />;
      default:
        return <FaWifi className="text-gray-400" />;
    }
  }, [connectionStatus]);

  const getMessageStatusIcon = useCallback((status) => {
    switch (status) {
      case MESSAGE_STATUS.SENDING:
        return <div className="w-3 h-3 rounded-full border-2 border-gray-400 border-t-transparent animate-spin" />;
      case MESSAGE_STATUS.SENT:
        return <div className="text-gray-400">✓</div>;
      case MESSAGE_STATUS.DELIVERED:
        return <div className="text-blue-500">✓✓</div>;
      case MESSAGE_STATUS.FAILED:
        return <div className="text-red-500">!</div>;
      default:
        return null;
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      // Leave room when component unmounts
      if (socket && chatId && userId) {
        socket.emit('leaveRoom', { chatId, userId });
      }
      socketInitializedRef.current = false;
    };
  }, []);

  // Loading state
  if (!chatId || !userId) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Loading chat...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-900" ref={containerRef}>
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3 shadow-sm">
        <div className="flex items-center space-x-3">
          <button 
            onClick={handleBack}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <FaArrowLeft className="text-gray-600 dark:text-gray-300 text-lg" />
          </button>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-cyan-400">{otherUserName}</h1>
            {chatInfo?.productName && (
              <p className="text-sm text-gray-400">
                About: {chatInfo.productName}
              </p>
            )}
            <div className="flex items-center space-x-2 text-xs">
              <span className={`${isConnected && socketReady ? 'text-green-400' : 'text-red-400'}`}>
                {isConnected && socketReady ? '● Connected' : '● Connecting...'}
              </span>
              {currentUserRole && (
                <span className="text-blue-400">
                  ({currentUserRole})
                </span>
              )}
              <div className="flex items-center space-x-2">
                {otherUserTyping ? (
                  <span className="text-green-500 animate-pulse">typing...</span>
                ) : otherUserOnline ? (
                  <span className="text-green-500">online</span>
                ) : lastSeen ? (
                  <span>last seen {formatMessageTime(lastSeen)}</span>
                ) : null}
                
                {messageQueue.length > 0 && (
                  <span className="bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 px-2 py-1 rounded-full text-xs">
                    {messageQueue.length} queued
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {loading ? (
          <div className="flex justify-center items-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent"></div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
              <p className="text-gray-500 dark:text-gray-400 mb-2">No messages yet</p>
              <p className="text-sm text-gray-400 dark:text-gray-500">Start the conversation!</p>
            </div>
          </div>
        ) : (
          messages.map((message, index) => (
            <div
              key={message.id || message.tempId || `msg-${index}`}
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
                    : (message.senderName || 'Other User')}
                </span>
                {message.createdAt && (
                  <>
                    <span>•</span>
                    <span>{formatMessageTime(message.createdAt)}</span>
                  </>
                )}
                {message.tempId && !message.id && (
                  <>
                    <span>•</span>
                    <span className="text-yellow-500">Sending...</span>
                  </>
                )}
              </div>
            </div>
          ))
        )}
        
        {/* Typing indicator */}
        {otherUserTyping && (
          <div className="flex justify-start">
            <div className="bg-white dark:bg-gray-800 rounded-2xl rounded-bl-md px-4 py-2 shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
              </div>
            </div>
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
            placeholder={isConnected && socketReady ? "Type a message..." : "Connecting..."}
            disabled={!isConnected || !socketReady}
            className="flex-1 bg-gray-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-400 disabled:opacity-50 disabled:cursor-not-allowed"
            maxLength={1000}
          />
          <button
            type="submit"
            disabled={!newMessage.trim() || !isConnected || !socketReady}
            className="bg-cyan-400 text-black px-6 py-2 rounded-lg hover:bg-cyan-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FaPaperPlane className="text-sm" />
          </button>
        </form>
        
        {/* Debug info (remove in production) */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-2 text-xs text-gray-400 space-y-1">
            <div>Status: {connectionStatus} | Queue: {messageQueue.length} | Retry: {retryCount}/5</div>
            <div>Chat: {chatId} | User: {userId} | Socket: {socket ? 'Available' : 'Not Available'}</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatPage;