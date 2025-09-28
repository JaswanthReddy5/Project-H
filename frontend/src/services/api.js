import axios from 'axios';

const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'https://project-h-zv5o.onrender.com';

export const itemsAPI = {
  fetchItems: async () => {
    try {
      const response = await axios.get(`${SERVER_URL}/api/items`);
      return response.data;
    } catch (error) {
      console.error("Error fetching items:", error);
      throw error;
    }
  },

  addItem: async (itemData) => {
    try {
      const response = await axios.post(`${SERVER_URL}/api/add`, itemData);
      return response.data;
    } catch (error) {
      console.error("Error adding item:", error);
      throw error;
    }
  },

};

export { SERVER_URL };