import axios from "axios";

const api = axios.create({
  baseURL: "https://08d0-103-249-233-123.ngrok-free.app/api",
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
});

export default api;
