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
  getNoticesByFlatId: async (flatId: string | number) => {
    try {
      const response = await api.get(`/Notices`, {
        params: { flatid: flatId }, // <--- Yahan 'flatId' ki jagah 'flatid' kar dein taaki C# controller se match ho jaye
      });
      return response?.data?.data || response?.data || [];
    } catch (error: any) {
      console.log(
        "Error fetching notices for flat:",
        error?.response?.data || error.message,
      );
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

  // Update an existing notice
  updateNotice: async (
    noticeId: string,
    payload: {
      title: string;
      description: string;
      flatId: string | null;
      isUrgent: boolean;
      sendNotification?: boolean;
      createdByAdminId: string;
    },
  ) => {
    try {
      const response = await api.put(`/Notices/${noticeId}`, payload);
      return response;
    } catch (error) {
      console.log("Error updating notice:", error);
      throw error;
    }
  },

  // Delete a notice by ID
  deleteNotice: async (noticeId: string) => {
    try {
      const response = await api.delete(`/Notices/${noticeId}`);
      return response;
    } catch (error) {
      console.log("Error deleting notice:", error);
      throw error;
    }
  },
};
