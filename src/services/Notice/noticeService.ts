import api from "../api";

export const noticeService = {
  // Token-based notices fetch (No parameters needed, backend decodes adminId from token)
  getAdminNotices: async () => {
    try {
      const response = await api.get("/Notices/admin");
      return response?.data?.data || response?.data || [];
    } catch (error) {
      console.log("Error fetching admin notices:", error);
      throw error;
    }
  },

  createNotice: async (payload: any) => {
    try {
      console.log("=== SENDING NOTICE PAYLOAD ===", payload); // <--- Yeh check karein ki kya data ja raha hai
      const response = await api.post("/Notices", payload);
      console.log("=== NOTICE CREATED RESPONSE ===", response?.data);
      return response;
    } catch (error: any) {
      // Backend ka exact validation error dekhne ke liye response error print karein
      console.log(
        "Error posting notice:",
        error?.response?.data || error.message,
      );
      throw error;
    }
  },
};
