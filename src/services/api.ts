import AsyncStorage from "@react-native-async-storage/async-storage"; // Ya SecureStore
import axios from "axios";

const api = axios.create({
  baseURL: "https://caca-43-241-144-62.ngrok-free.app/api",
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
    "ngrok-skip-browser-warning": "69420",
  },
});

// 🔑 Request Interceptor: Automatically attach Auth Token
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem("token"); // Aapka token key name yahan rakhein
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error("Error reading token from storage:", error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// 🚨 Response Interceptor: Global Error Handling (e.g., 401 Session Expired)
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Session expired handle karein (e.g., clear storage or redirect to login)
      console.warn("Unauthorized access! Token might be expired.");
    }
    return Promise.reject(error);
  },
);

export default api;
