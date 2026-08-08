import apiClient from "./apiClient";

export const authService = {
  // Step 1: Send OTP
  sendOtp: async (phoneNumber: string) => {
    try {
      const response = await apiClient.post("/Auth/send-otp-stateless", {
        phone: phoneNumber,
      });
      return response.data?.otpToken; // Temporary token return karega
    } catch (error: any) {
      console.log("Error in Send OTP:", error.response?.data || error.message);
      throw error;
    }
  },

  // Step 2: Verify OTP & Login
  verifyOtp: async (
    phoneNumber: string,
    enteredOtp: string,
    currentOtpToken: string,
  ) => {
    try {
      const response = await apiClient.post("/Auth/verify-otp-stateless", {
        phone: phoneNumber,
        otp: enteredOtp,
        otpToken: currentOtpToken,
      });
      return response.data; // Final user token & details
    } catch (error: any) {
      console.log(
        "Error in Verify OTP:",
        error.response?.data || error.message,
      );
      throw error;
    }
  },
};
