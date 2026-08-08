import axios from "axios";
//ngrok http https://localhost:7180 --host-header=rewrite
const api = axios.create({
  baseURL: "https://7e37-43-241-144-62.ngrok-free.app/api",
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
});

export default api;
