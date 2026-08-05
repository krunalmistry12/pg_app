import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import {
  AuthResponse,
  CreateFlatDto,
  CreateUserDto,
  LoginDto,
  UserResponseDto,
} from "../types/pgManagement";

// Backend Base URL
const API_BASE_URL = "https://ac18-43-241-144-62.ngrok-free.app/api";

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
    // Ngrok ke HTML warning page ko bypass karne ke liye header:
    "ngrok-skip-browser-warning": "69420",
  },
});

// Interceptor: Async storage se Bearer Token attach karne ke liye
apiClient.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error("Error reading token from AsyncStorage:", error);
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// ==========================================
// USER & AUTH SERVICES
// ==========================================
export const registerUser = async (
  data: CreateUserDto,
): Promise<AuthResponse> => {
  const response = await apiClient.post<AuthResponse>("/users/register", data);
  return response.data;
};

export const loginUser = async (data: LoginDto): Promise<AuthResponse> => {
  const response = await apiClient.post<AuthResponse>("/users/login", data);
  if (response.data.token) {
    // React Native AsyncStorage method:
    await AsyncStorage.setItem("token", response.data.token);
  }
  return response.data;
};

export const getAllUsers = async (): Promise<UserResponseDto[]> => {
  const response = await apiClient.get<{
    success: boolean;
    data: UserResponseDto[];
  }>("/users");
  return response.data.data;
};

// ==========================================
// FLAT MANAGEMENT SERVICES
// ==========================================
export const createFlatApi = async (payload: CreateFlatDto) => {
  const response = await apiClient.post("/flats", payload);
  return response.data;
};

export const getFlatByIdApi = async (flatId: string) => {
  const response = await apiClient.get(`/flats/${flatId}`);
  return response.data;
};

export const updateFlatApi = async (flatId: string, payload: CreateFlatDto) => {
  const response = await apiClient.put(`/flats/${flatId}`, payload);
  return response.data;
};

export const deleteFlatApi = async (flatId: string) => {
  const response = await apiClient.delete(`/flats/${flatId}`);
  return response.data;
};

export default apiClient;
