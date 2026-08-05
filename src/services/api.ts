import axios from "axios";

const api = axios.create({
  baseURL: "https://ac18-43-241-144-62.ngrok-free.app/api",
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
});

export default api;
