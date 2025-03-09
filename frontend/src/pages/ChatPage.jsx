import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";

const ChatPage = () => {
  const { chatId } = useParams();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  
  useEffect(() => {
    // Fetch chat messages when component mounts
    fetchMessages();
  }, [chatId]);

  const fetchMessages = async () => {
    try {
      const response = await axios.get(`http://localhost:5000/api/chat/${chatId}/messages`);
      setMessages(response.data);
    } catch (error) {
      console.error("Error fetching messages:", error);
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      await axios.post(`http://localhost:5000/api/chat/${chatId}/messages`, {
        content: newMessage,
        senderId: "currentUserId" // Replace with actual user ID
      });
      setNewMessage("");
      fetchMessages();
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-black text-white">
      <div className="p-4 border-b border-cyan-400">
        <h1 className="text-xl font-bold">Chat #{chatId}</h1>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`p-3 rounded-lg max-w-[70%] ${
              message.senderId === "currentUserId"
                ? "bg-cyan-400 text-black ml-auto"
                : "bg-gray-700"
            }`}
          >
            {message.content}
          </div>
        ))}
      </div>

      <form onSubmit={sendMessage} className="p-4 border-t border-cyan-400">
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
