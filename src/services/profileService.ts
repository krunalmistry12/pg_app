import api from "./api";
export interface UpdateProfilePayload {
  userId: string;
  fullName: string;
  email: string;
  phone: string;
  pgName: string;
  address: string;
  city: string;
}

export const profileService = {
  async updateProfile(payload: UpdateProfilePayload) {
    try {
      const response = await api.put("/User/update-profile", payload);
      return response.data;
    } catch (error) {
      console.log("Error updating profile on server:", error);
      throw error;
    }
  },

  async fetchUserProfile(userId: string) {
    try {
      const response = await api.get(`/User/${userId}`);
      return response.data;
    } catch (error) {
      console.log("Error fetching profile from API:", error);
      throw error;
    }
  },
};
