import axios from "axios";

// Base URL ko alag define kar sakte hain bar-bar likhne se bachne ke liye
const BASE_URL = "https://caca-43-241-144-62.ngrok-free.app/api";

// State variables (Aapke React component ke andar rahenge)
// const [phone, setPhone] = useState("");
// const [otp, setOtp] = useState("");
// const [otpToken, setOtpToken] = useState(""); // Temporary token store karne ke liye

// ==========================================
// 1. STEP 1: Send OTP Function
// ==========================================
const handleSendOtp = async (phoneNumber: string) => {
  console.log("STEP 1: Sending OTP request");

  try {
    console.log("STEP 2: Calling API");

    const response = await axios.post(
      `${BASE_URL}/Auth/send-otp-stateless`,
      {
        phone: phoneNumber,
      },
      {
        timeout: 30000,
        headers: {
          "Content-Type": "application/json",
        },
      },
    );

    console.log("STEP 3: OTP Sent Successfully");
    console.log(response.data);

    // Server se jo temporary otpToken milega use save kar lein
    const tokenFromServer = response.data?.otpToken;
    // setOtpToken(tokenFromServer);
    // setStep("OTP"); // Screen ko OTP input par switch kar dein

    return tokenFromServer;
  } catch (e: any) {
    console.log("STEP 4: Error in Send OTP");
    console.log("Message:", e.message);
    console.log("Response Data:", e.response?.data);
  }
};

// ==========================================
// 2. STEP 2: Verify OTP & Login Function
// ==========================================
const handleVerifyOtp = async (
  phoneNumber: string,
  enteredOtp: string,
  currentOtpToken: string,
) => {
  console.log("STEP 1: Verifying OTP");

  try {
    console.log("STEP 2: Calling Verify API");

    const response = await axios.post(
      `${BASE_URL}/Auth/verify-otp-stateless`, // 👈 Aapke naye controller ka verify endpoint
      {
        phone: phoneNumber,
        otp: enteredOtp,
        otpToken: currentOtpToken, // 👈 Step 1 wala temporary token yahan pass hoga
      },
      {
        timeout: 30000,
        headers: {
          "Content-Type": "application/json",
        },
      },
    );

    console.log("STEP 3: Login Successful");
    console.log("Final Login Token:", response.data?.token);
    console.log("User Data:", response.data?.user);

    // Yahan AsyncStorage mein token save karke dashboard par navigate kara sakte hain
    return response.data;
  } catch (e: any) {
    console.log("STEP 4: Error in Verify OTP");
    console.log("Message:", e.message);
    console.log("Response Data:", e.response?.data);
  }
};
