import { CreateFlatDto } from "../types/pgManagement";
import api from "./api";

// 🟢 1. Create Flat with Rooms/Zones
export const createFlatApi = async (payload: CreateFlatDto) => {
  const response = await api.post("/Flats", payload);
  return response.data;
};

// 🟡 2. Update Flat & Rooms (Room Add/Edit karne ke liye)
export const updateFlatApi = async (id: string, payload: CreateFlatDto) => {
  const response = await api.put(`/Flats/${id}`, payload);
  return response.data;
};

// 🔵 3. Get Flat Details by ID
export const getFlatByIdApi = async (id: string) => {
  const response = await api.get(`/Flats/${id}`);
  return response.data;
};

// 🔴 4. Delete Flat
export const deleteFlatApi = async (id: string) => {
  const response = await api.delete(`/Flats/${id}`);
  return response.data;
};
