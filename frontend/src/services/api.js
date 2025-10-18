import axiosInstance from '../utils/axios';

const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:5000';

export const itemsAPI = {
  fetchItems: async () => {
    try {
      const response = await axiosInstance.get('/api/items');
      return response.data;
    } catch (error) {
      console.error("Error fetching items:", error);
      throw error;
    }
  },

  addItem: async (itemData) => {
    try {
      const response = await axiosInstance.post('/api/add', itemData);
      return response.data;
    } catch (error) {
      console.error("Error adding item:", error);
      throw error;
    }
  },

  deleteAllWorkItems: async () => {
    try {
      const response = await axiosInstance.delete('/api/items/work');
      return response.data;
    } catch (error) {
      console.error("Error deleting work items:", error);
      throw error;
    }
  },

  showInterest: async (itemId) => {
    try {
      const response = await axiosInstance.post(`/api/items/${itemId}/interest`);
      return response.data;
    } catch (error) {
      console.error("Error showing interest:", error);
      throw error;
    }
  },

  releaseContact: async (itemId) => {
    try {
      const response = await axiosInstance.post(`/api/items/${itemId}/release`);
      return response.data;
    } catch (error) {
      console.error("Error releasing contact:", error);
      throw error;
    }
  },

};

export { SERVER_URL };