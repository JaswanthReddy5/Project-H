import axios from 'axios';

const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'https://project-h-zv5o.onrender.com';

// Create axios instance with custom headers
const apiClient = axios.create({
  headers: {
    'X-App-Source': 'project-h-frontend'
  }
});

export const itemsAPI = {
  fetchItems: async () => {
    try {
      const response = await apiClient.get(`${SERVER_URL}/api/items`);
      return response.data;
    } catch (error) {
      console.error("Error fetching items:", error);
      throw error;
    }
  },

  addItem: async (itemData) => {
    try {
      const response = await apiClient.post(`${SERVER_URL}/api/add`, itemData);
      return response.data;
    } catch (error) {
      console.error("Error adding item:", error);
      throw error;
    }
  },

  startChat: async (payload) => {
    try {
      const response = await apiClient.post(`${SERVER_URL}/api/start-chat`, payload);
      return response.data;
    } catch (error) {
      console.error("Error starting chat:", error);
      throw error;
    }
  }
};

export { SERVER_URL };