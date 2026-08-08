import Ionicons from "@expo/vector-icons/Ionicons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { router } from "expo-router";
import { jwtDecode } from "jwt-decode";
import React, { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

// Aapka ngrok ya server ka base URL
const BASE_URL = "https://7e37-43-241-144-62.ngrok-free.app/api";

export default function LoginScreen() {
  const [step, setStep] = useState<"PHONE" | "OTP">("PHONE");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [otpToken, setOtpToken] = useState(""); // Temporary token received from Send OTP
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // -------------------------------------------------------------
  // 1. STEP 1: Send OTP Handler
  // -------------------------------------------------------------
  const handleSendOtp = async () => {
    console.log("STEP 1: Sending OTP request");
    setError("");
    const trimmedPhone = phone.trim();

    if (!trimmedPhone || trimmedPhone.length !== 10) {
      setError("Please enter a valid 10-digit mobile number.");
      return;
    }

    setLoading(true);

    try {
      console.log("STEP 2: Calling API -> /Auth/send-otp-stateless");

      const response = await axios.post(
        `${BASE_URL}/Auth/send-otp-stateless`,
        {
          phone: trimmedPhone,
        },
        {
          timeout: 30000,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      console.log("STEP 3: OTP Sent Successfully");
      console.log(response.data);

      const tokenFromServer = response.data?.otpToken;

      if (tokenFromServer) {
        setOtpToken(tokenFromServer);
        setStep("OTP"); // Switch view to OTP input
      } else {
        setError("Failed to receive OTP token from server.");
      }
    } catch (e: any) {
      console.log("STEP 4: Error in Send OTP");
      console.log("Message:", e.message);
      console.log("Response Data:", e.response?.data);

      const serverMessage = e?.response?.data?.message;
      setError(
        serverMessage || "Mobile number not registered or account is inactive."
      );
    } finally {
      setLoading(false);
    }
  };

  // -------------------------------------------------------------
  // 2. STEP 2: Verify OTP & Login Handler
  // -------------------------------------------------------------
  const handleVerifyOtp = async () => {
    console.log("STEP 1: Verifying OTP");
    setError("");
    const trimmedOtp = otp.trim();

    if (!trimmedOtp || trimmedOtp.length < 4) {
      setError("Please enter a valid OTP.");
      return;
    }

    setLoading(true);

    try {
      console.log("STEP 2: Calling API -> /Auth/verify-otp-stateless");

      const response = await axios.post(
        `${BASE_URL}/Auth/verify-otp-stateless`,
        {
          phone: phone.trim(),
          otp: trimmedOtp,
          otpToken: otpToken, // Sending back the temporary token received in step 1
        },
        {
          timeout: 30000,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      console.log("STEP 3: Login Successful");
      const loginToken = response.data?.token;

      if (loginToken) {
        // Decode JWT token to extract role & user metadata
        const decoded: any = jwtDecode(loginToken);

        const userRole =
          decoded.role ??
          decoded[
            "http://schemas.microsoft.com/ws/2008/06/identity/claims/role"
          ] ??
          "";
        const userId =
          decoded.sub ??
          decoded[
            "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"
          ] ??
          response?.data?.user?.id ??
          "";

        // Save session locally in AsyncStorage
        await Promise.all([
          AsyncStorage.setItem("token", loginToken),
          AsyncStorage.setItem("isLoggedIn", "true"),
          AsyncStorage.setItem("userRole", userRole),
          AsyncStorage.setItem("userId", String(userId)),
        ]);

        console.log("STEP 4: Navigating based on Role:", userRole);

        // Role-based navigation redirect
        if(userRole === "Admin"){

        }
        else if (
          userRole === "Admin" ||
          userRole === "SuperAdmin" ||
          userRole === "Staff"
        ) {
          router.replace("/(tabs)" as any);
        } else if (userRole === "User") {
          router.replace("/(tenant)" as any);
        } else {
          router.replace("/(tabs)" as any);
        }
      } else {
        setError("Invalid response from server. Token missing.");
      }
    } catch (e: any) {
      console.log("STEP 4: Error in Verify OTP");
      console.log("Message:", e.message);
      console.log("Response Data:", e.response?.data);

      if (e.response) {
        setError(e.response.data?.message || "Invalid OTP entered.");
      } else {
        setError("Network error. Please check your connection.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0F172A" />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.logoCircle}>
              <Ionicons name="shield-checkmark" size={36} color="#38BDF8" />
            </View>
            <Text style={styles.title}>PG Manager</Text>
            <Text style={styles.subtitle}>
              Secure Mobile & OTP Authentication
            </Text>
          </View>

          {/* Form Card */}
          <View style={styles.card}>
            {step === "PHONE" ? (
              <>
                <Text style={styles.welcome}>Welcome Back 👋</Text>
                <Text style={styles.cardSub}>
                  Enter your registered mobile number
                </Text>

                <Text style={styles.label}>Mobile Number</Text>
                <View style={styles.inputContainer}>
                  <Text style={styles.countryCode}>+91</Text>
                  <TextInput
                    placeholder="9876543210"
                    placeholderTextColor="#94A3B8"
                    keyboardType="phone-pad"
                    maxLength={10}
                    value={phone}
                    onChangeText={(text) => {
                      setPhone(text);
                      if (error) setError("");
                    }}
                    style={styles.input}
                    returnKeyType="done"
                    onSubmitEditing={handleSendOtp}
                  />
                </View>

                {error ? (
                  <View style={styles.errorBox}>
                    <Ionicons
                      name="alert-circle-outline"
                      size={18}
                      color="#DC2626"
                    />
                    <Text style={styles.errorText}>{error}</Text>
                  </View>
                ) : null}

                <TouchableOpacity
                  style={[styles.loginButton, loading && styles.buttonDisabled]}
                  onPress={handleSendOtp}
                  disabled={loading}
                  activeOpacity={0.8}
                >
                  {loading ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text style={styles.loginText}>Get OTP</Text>
                  )}
                </TouchableOpacity>
              </>
            ) : (
              <>
                <View style={styles.otpHeaderRow}>
                  <TouchableOpacity
                    onPress={() => {
                      setStep("PHONE");
                      setOtp("");
                      setOtpToken("");
                      setError("");
                    }}
                  >
                    <Ionicons name="arrow-back" size={22} color="#0F172A" />
                  </TouchableOpacity>
                  <Text style={styles.welcome}>Verify OTP 🔐</Text>
                </View>
                <Text style={styles.cardSub}>
                  Code sent to{" "}
                  <Text style={{ fontWeight: "700", color: "#0F172A" }}>
                    +91 {phone}
                  </Text>
                </Text>

                <Text style={styles.label}>Enter OTP</Text>
                <View style={styles.inputContainer}>
                  <Ionicons name="key-outline" size={20} color="#64748B" />
                  <TextInput
                    placeholder="Enter 6-digit OTP"
                    placeholderTextColor="#94A3B8"
                    keyboardType="number-pad"
                    maxLength={6}
                    value={otp}
                    onChangeText={(text) => {
                      setOtp(text);
                      if (error) setError("");
                    }}
                    style={[styles.input, { marginLeft: 12 }]}
                    returnKeyType="done"
                    onSubmitEditing={handleVerifyOtp}
                  />
                </View>

                {error ? (
                  <View style={styles.errorBox}>
                    <Ionicons
                      name="alert-circle-outline"
                      size={18}
                      color="#DC2626"
                    />
                    <Text style={styles.errorText}>{error}</Text>
                  </View>
                ) : null}

                <TouchableOpacity
                  style={[styles.loginButton, loading && styles.buttonDisabled]}
                  onPress={handleVerifyOtp}
                  disabled={loading}
                  activeOpacity={0.8}
                >
                  {loading ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text style={styles.loginText}>Verify & Login</Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.resendBox}
                  onPress={handleSendOtp}
                  activeOpacity={0.7}
                >
                  <Text style={styles.resendText}>
                    Didn't receive code?{" "}
                    <Text style={styles.resendBold}>Resend OTP</Text>
                  </Text>
                </TouchableOpacity>
              </>
            )}

            <Text style={styles.footer}>PG Management System v1.0</Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0F172A",
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "space-between",
  },
  header: {
    alignItems: "center",
    paddingTop: 50,
    paddingBottom: 30,
    paddingHorizontal: 20,
  },
  logoCircle: {
    width: 72,
    height: 72,
    borderRadius: 22,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.15)",
    marginBottom: 12,
  },
  title: {
    color: "#FFFFFF",
    fontSize: 28,
    fontWeight: "800",
  },
  subtitle: {
    color: "#94A3B8",
    fontSize: 14,
    marginTop: 4,
  },
  card: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 24,
  },
  welcome: {
    fontSize: 26,
    fontWeight: "800",
    color: "#0F172A",
  },
  cardSub: {
    color: "#64748B",
    fontSize: 14,
    marginBottom: 20,
    marginTop: 4,
  },
  otpHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  label: {
    fontSize: 13,
    fontWeight: "700",
    color: "#334155",
    marginBottom: 6,
    marginTop: 6,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderRadius: 14,
    paddingHorizontal: 16,
    height: 54,
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    marginBottom: 10,
  },
  countryCode: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0F172A",
    marginRight: 8,
    borderRightWidth: 1,
    borderRightColor: "#CBD5E1",
    paddingRight: 8,
  },
  input: {
    flex: 1,
    color: "#0F172A",
    fontSize: 15,
  },
  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FEF2F2",
    borderColor: "#FCA5A5",
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 10,
    marginTop: 4,
  },
  errorText: {
    color: "#DC2626",
    fontSize: 13,
    fontWeight: "600",
    marginLeft: 8,
    flex: 1,
  },
  loginButton: {
    backgroundColor: "#2563EB",
    height: 54,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 12,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  loginText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  resendBox: {
    marginTop: 16,
    alignItems: "center",
  },
  resendText: {
    color: "#64748B",
    fontSize: 13,
  },
  resendBold: {
    color: "#2563EB",
    fontWeight: "700",
  },
  footer: {
    textAlign: "center",
    marginTop: 30,
    color: "#94A3B8",
    fontSize: 12,
  },
});