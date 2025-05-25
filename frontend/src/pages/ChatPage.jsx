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
  const socket = useSocket();
  
  // Safe check for socket connection
  const isConnected = socket && typeof socket.connected === 'boolean' ? socket.connected : false;
  
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

  // Enhanced message deduplication
  const isDuplicateMessage = useCallback((newMsg, existingMessages) => {
    return existingMessages.some(msg => {
      // Check by ID first (most reliable)
      if (msg.id && newMsg.id && msg.id === newMsg.id) {
        return true;
      }
      
      // Check by content, sender, and time proximity for temporary IDs
      const timeDiff = Math.abs(new Date(msg.createdAt) - new Date(newMsg.createdAt));
      return (
        msg.content === newMsg.content &&
        msg.senderId === newMsg.senderId &&
        timeDiff < 3000 // 3 seconds tolerance
      );
    });
  }, []);

  // Enhanced message receiving handler
  const handleReceiveMessage = useCallback((messageData) => {
    console.log('📨 Received message:', messageData);
    
    // Validate message data
    if (!messageData || !messageData.content || !messageData.senderId) {
      console.warn('⚠️ Invalid message data received:', messageData);
      return;
    }

    // Skip messages from the same user (to prevent echo)
    if (messageData.senderId === userId) {
      console.log('🔄 Skipping own message echo');
      return;
    }

    const message = {
      id: messageData.id || `recv_${Date.now()}_${Math.random()}`,
      content: messageData.content,
      senderId: messageData.senderId,
      senderName: messageData.senderName || 'Unknown',
      chatId: messageData.chatId || chatId,
      createdAt: messageData.createdAt || new Date().toISOString(),
      status: MESSAGE_STATUS.DELIVERED,
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
      
      console.log('✅ New message added to chat');
      return sortedMessages;
    });
    
    // Scroll to bottom and play notification sound
    setTimeout(() => {
      scrollToBottom();
      // You can add notification sound here
      // new Audio('/notification.mp3').play().catch(() => {});
    }, 50);
  }, [chatId, isDuplicateMessage, scrollToBottom, userId]);

  // Handle typing indicator
  const handleUserTyping = useCallback(({ userId: typingUserId, isTyping: typing, chatId: typingChatId, userName }) => {
    // Only show typing indicator for other users in this chat
    if (typingUserId && typingUserId !== userId && typingChatId === chatId) {
      console.log(`👀 ${userName || typingUserId} is ${typing ? 'typing' : 'not typing'}`);
      setOtherUserTyping(typing);
      
      // Auto-hide typing indicator after 5 seconds
      if (typing) {
        setTimeout(() => setOtherUserTyping(false), 5000);
      }
    }
  }, [userId, chatId]);

  // Handle user online status
  const handleUserOnlineStatus = useCallback(({ userId: statusUserId, isOnline, lastSeen: userLastSeen }) => {
    if (statusUserId && statusUserId !== userId) {
      setOtherUserOnline(isOnline);
      if (userLastSeen) {
        setLastSeen(userLastSeen);
      }
    }
  }, [userId]);

  // Socket error handler
  const handleSocketError = useCallback((error) => {
    console.error('🔥 Socket error:', error);
    setConnectionStatus(CONNECTION_STATUS.ERROR);
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

    // Join room and register user
    safeSocketEmit('userJoin', { 
      userId, 
      userName: user?.username || user?.name || 'User',
      chatId 
    });
    safeSocketEmit('joinRoom', { 
      roomId: chatId, 
      userId 
    });

    // Set up socket event listeners
    safeSocketOn('connect', handleConnect);
    safeSocketOn('disconnect', handleDisconnect);
    safeSocketOn('receiveMessage', handleReceiveMessage);
    safeSocketOn('newMessage', handleReceiveMessage);
    safeSocketOn('message', handleReceiveMessage);
    safeSocketOn('userTyping', handleUserTyping);
    safeSocketOn('typing', handleUserTyping);
    safeSocketOn('userOnline', handleUserOnlineStatus);
    safeSocketOn('userOffline', handleUserOnlineStatus);
    safeSocketOn('error', handleSocketError);
    safeSocketOn('connect_error', handleSocketError);

    // Cleanup function
    return () => {
      console.log('🧹 Cleaning up socket listeners');
      isInitializedRef.current = false;
      
      // Remove all event listeners
      safeSocketOff('connect', handleConnect);
      safeSocketOff('disconnect', handleDisconnect);
      safeSocketOff('receiveMessage', handleReceiveMessage);
      safeSocketOff('newMessage', handleReceiveMessage);
      safeSocketOff('message', handleReceiveMessage);
      safeSocketOff('userTyping', handleUserTyping);
      safeSocketOff('typing', handleUserTyping);
      safeSocketOff('userOnline', handleUserOnlineStatus);
      safeSocketOff('userOffline', handleUserOnlineStatus);
      safeSocketOff('error', handleSocketError);
      safeSocketOff('connect_error', handleSocketError);
      
      // Leave room
      safeSocketEmit('leaveRoom', { roomId: chatId, userId });
    };
  }, [socket, chatId, userId, user?.username, user?.name, handleConnect, handleDisconnect, handleReceiveMessage, handleUserTyping, handleUserOnlineStatus, handleSocketError, safeSocketEmit, safeSocketOn, safeSocketOff]);

  // Fetch initial data
  useEffect(() => {
    if (chatId) {
      fetchChatInfo();
      fetchMessages();
    }
  }, [chatId, fetchChatInfo, fetchMessages]);

  // Handle typing with enhanced debouncing
  const handleTyping = useCallback(() => {
    if (!chatId || !userId) return;
    
    // Only emit typing if not already typing
    if (!isTyping) {
      setIsTyping(true);
      const success = safeSocketEmit('typing', { 
        chatId, 
        userId, 
        userName: user?.username || user?.name || 'User',
        isTyping: true 
      });
      if (success) {
        console.log('⌨️ Started typing');
      }
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout to stop typing
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      safeSocketEmit('typing', { 
        chatId, 
        userId, 
        userName: user?.username || user?.name || 'User',
        isTyping: false 
      });
      console.log('⌨️ Stopped typing');
    }, 1500); // Reduced timeout for more responsive experience
  }, [chatId, userId, isTyping, user?.username, user?.name, safeSocketEmit]);

  // Enhanced send message function
  const sendMessage = useCallback(async (e) => {
    e.preventDefault();
    
    const messageContent = newMessage.trim();
    if (!messageContent) {
      return;
    }

    if (!chatId || !userId) {
      console.error('❌ Cannot send message: missing requirements');
      return;
    }

    const tempId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const messageObj = {
      id: tempId,
      content: messageContent,
      senderId: userId,
      senderName: user?.username || user?.name || 'You',
      chatId,
      createdAt: new Date().toISOString(),
      status: MESSAGE_STATUS.SENDING,
      isTemporary: true
    };

    try {
      console.log('📤 Sending message:', messageContent);
      
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
      
      // Add message optimistically to UI
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
      
    } catch (error) {
      console.error('❌ Error sending message:', error);
      
      // Restore message input on error
      setNewMessage(messageContent);
      
      // Update message status to failed
      setMessages(prev => prev.map(msg => 
        msg.id === tempId 
          ? { ...msg, status: MESSAGE_STATUS.FAILED }
          : msg
      ));
    }
  }, [newMessage, chatId, userId, user?.username, user?.name, isConnected, scrollToBottom, safeSocketEmit]);

  // Auto-retry connection with exponential backoff
  useEffect(() => {
    if (!isConnected && retryCount < 5 && socket && typeof socket.connect === 'function') {
      const backoffTime = Math.min(1000 * Math.pow(2, retryCount), 30000); // Max 30 seconds
      
      const timeout = setTimeout(() => {
        console.log(`🔄 Attempting to reconnect... (${retryCount + 1}/5)`);
        setRetryCount(prev => prev + 1);
        setConnectionStatus(CONNECTION_STATUS.RECONNECTING);
        
        try {
          socket.connect();
        } catch (error) {
          console.error('❌ Reconnection failed:', error);
        }
      }, backoffTime);
      
      reconnectTimeoutRef.current = timeout;
      
      return () => clearTimeout(timeout);
    }
  }, [isConnected, retryCount, socket]);

  // Navigation handler
  const handleBack = useCallback(() => {
    navigate("/", { state: { activeIndex: 3 } });
  }, [navigate]);

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
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
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
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2">
              <h1 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
                {otherUserName}
              </h1>
              {getConnectionStatusIcon()}
            </div>
            
            <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-2 text-xs text-gray-500 dark:text-gray-400">
              {chatInfo?.productName && (
                <span className="truncate">About: {chatInfo.productName}</span>
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
          messages.map((message, index) => {
            const isOwnMessage = message.senderId === userId;
            const showTime = index === 0 || 
              new Date(message.createdAt) - new Date(messages[index - 1].createdAt) > 300000; // 5 minutes
            
            return (
              <div key={message.id || `msg-${index}`} className="space-y-1">
                {showTime && (
                  <div className="text-center">
                    <span className="text-xs text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 px-2 py-1 rounded-full">
                      {formatMessageTime(message.createdAt)}
                    </span>
                  </div>
                )}
                
                <div className={`flex ${isOwnMessage ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[85%] sm:max-w-[70%] ${isOwnMessage ? "order-2" : "order-1"}`}>
                    <div className={`relative px-4 py-2 rounded-2xl shadow-sm ${
                      isOwnMessage
                        ? "bg-blue-500 text-white rounded-br-md"
                        : "bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-bl-md border border-gray-200 dark:border-gray-700"
                    }`}>
                      <p className="text-sm leading-relaxed break-words">{message.content}</p>
                      
                      {isOwnMessage && (
                        <div className="flex items-center justify-end mt-1 space-x-1">
                          <span className="text-xs opacity-75">
                            {formatMessageTime(message.createdAt)}
                          </span>
                          {getMessageStatusIcon(message.status)}
                        </div>
                      )}
                    </div>
                    
                    {!isOwnMessage && (
                      <div className="mt-1 ml-2">
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {formatMessageTime(message.createdAt)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
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
      <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-4 py-3">
        {/* Connection status warning */}
        {!isConnected && (
          <div className="mb-3 p-2 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
            <div className="flex items-center space-x-2 text-sm text-yellow-800 dark:text-yellow-200">
              <FaExclamationTriangle className="text-yellow-500" />
              <span>
                {connectionStatus === CONNECTION_STATUS.RECONNECTING 
                  ? `Reconnecting... (${retryCount}/5)`
                  : 'Connection lost. Messages will be sent when reconnected.'
                }
              </span>
            </div>
          </div>
        )}
        
        <form onSubmit={sendMessage} className="flex items-end space-x-2">
          <div className="flex-1">
            <textarea
              ref={messageInputRef}
              value={newMessage}
              onChange={(e) => {
                setNewMessage(e.target.value);
                handleTyping();
              }}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage(e);
                }
                handleTyping();
              }}
              placeholder="Type a message..."
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-full resize-none bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent max-h-32"
              rows={1}
              style={{
                minHeight: '40px',
                maxHeight: '120px',
                overflowY: newMessage.split('\n').length > 3 ? 'scroll' : 'hidden'
              }}
              disabled={!chatId || !userId}
            />
          </div>
          
          <button
            type="submit"
            disabled={!newMessage.trim() || !chatId || !userId}
            className={`p-2 rounded-full transition-all duration-200 ${
              newMessage.trim() && chatId && userId
                ? 'bg-blue-500 hover:bg-blue-600 text-white shadow-lg hover:shadow-xl transform hover:scale-105'
                : 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
            }`}
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