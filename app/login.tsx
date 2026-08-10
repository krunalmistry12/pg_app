import Ionicons from "@expo/vector-icons/Ionicons";
import AsyncStorage from "@react-native-async-storage/async-storage";
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

import api from "@/src/services/api";
export default function LoginScreen() {
  const [step, setStep] = useState<"INPUT" | "OTP">("INPUT");
  // Channel selection: WHATSAPP or EMAIL
  const [otpChannel, setOtpChannel] = useState<"WHATSAPP" | "EMAIL">(
    "WHATSAPP",
  );

  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [otpToken, setOtpToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // -------------------------------------------------------------
  // 1. STEP 1: Send OTP Handler (Mobile Number input only)
  // -------------------------------------------------------------
  const handleSendOtp = async () => {
    setError("");

    const trimmedPhone = phone.trim();

    if (!trimmedPhone || trimmedPhone.length !== 10) {
      setError("Please enter a valid 10-digit mobile number.");
      return;
    }

    const payload = {
      phone: trimmedPhone,
      channel: otpChannel === "WHATSAPP" ? "whatsapp" : "email",
    };

    setLoading(true);

    try {
      console.log("Calling API -> /Auth/send-otp-stateless", payload);

      const response = await api.post("/Auth/send-otp-stateless", payload, {
        timeout: 150000,
        headers: {
          "Content-Type": "application/json",
        },
      });

      console.log("OTP API RESPONSE:", response.data);

      const tokenFromServer = response.data?.otpToken;
      const debugOtp = response.data?.debugOtp;

      if (response.data?.success && tokenFromServer) {
        // OTP token save karo
        setOtpToken(tokenFromServer);

        // Backend se aaya OTP automatically fill karo
        if (debugOtp) {
          setOtp(String(debugOtp));
        }

        // OTP screen open karo
        setStep("OTP");

        setError("");
      } else {
        setError(
          response.data?.message || "Failed to receive OTP token from server.",
        );
      }
    } catch (e: any) {
      console.log("========== API ERROR ==========");
      console.log("Message:", e?.message);
      console.log("Code:", e?.code);
      console.log("Status:", e?.response?.status);
      console.log("Response:", e?.response?.data);
      console.log("Request:", e?.request);

      setError(
        e?.response?.data?.message ||
          e?.message ||
          "Network error. Please check your connection.",
      );
    } finally {
      setLoading(false);
    }
  };

  // -------------------------------------------------------------
  // 2. STEP 2: Verify OTP Handler
  // -------------------------------------------------------------
  const handleVerifyOtp = async () => {
    setError("");
    const trimmedOtp = otp.trim();

    if (!trimmedOtp || trimmedOtp.length < 4) {
      setError("Please enter a valid OTP.");
      return;
    }

    setLoading(true);

    try {
      const payload = {
        phone: phone.trim(),
        otp: trimmedOtp,
        otpToken: otpToken,
      };

      const response = await api.post("/Auth/verify-otp-stateless", payload, {
        timeout: 30000,
        headers: { "Content-Type": "application/json" },
      });

      const loginToken = response.data?.token;

      if (loginToken) {
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

        await Promise.all([
          AsyncStorage.setItem("token", loginToken),
          AsyncStorage.setItem("isLoggedIn", "true"),
          AsyncStorage.setItem("userRole", userRole),
          AsyncStorage.setItem("userId", String(userId)),
        ]);
        console.log(userRole);
        if (userRole === "SuperAdmin") {
          router.replace("/(Superadmin)" as any);
        } else if (userRole === "Admin" || userRole === "Staff") {
          router.replace("/(tabs)" as any);
        } else if (userRole === "Tenant") {
          router.replace("/(tenant)" as any);
        }
      } else {
        setError("Invalid response from server. Token missing.");
      }
    } catch (e: any) {
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
            <Text style={styles.subtitle}>Secure OTP Authentication</Text>
          </View>

          {/* Form Card */}
          <View style={styles.card}>
            {step === "INPUT" ? (
              <>
                <Text style={styles.welcome}>Welcome Back 👋</Text>
                <Text style={styles.cardSub}>
                  Choose where to receive your OTP
                </Text>

                {/* WhatsApp vs Email OTP Switcher */}
                <View style={styles.tabContainer}>
                  <TouchableOpacity
                    style={[
                      styles.tab,
                      otpChannel === "WHATSAPP" && styles.activeTab,
                    ]}
                    onPress={() => {
                      setOtpChannel("WHATSAPP");
                      setError("");
                    }}
                  >
                    <Ionicons
                      name="logo-whatsapp"
                      size={18}
                      color={otpChannel === "WHATSAPP" ? "#2563EB" : "#64748B"}
                    />
                    <Text
                      style={[
                        styles.tabText,
                        otpChannel === "WHATSAPP" && styles.activeTabText,
                      ]}
                    >
                      WhatsApp OTP
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.tab,
                      otpChannel === "EMAIL" && styles.activeTab,
                    ]}
                    onPress={() => {
                      setOtpChannel("EMAIL");
                      setError("");
                    }}
                  >
                    <Ionicons
                      name="mail-outline"
                      size={18}
                      color={otpChannel === "EMAIL" ? "#2563EB" : "#64748B"}
                    />
                    <Text
                      style={[
                        styles.tabText,
                        otpChannel === "EMAIL" && styles.activeTabText,
                      ]}
                    >
                      Email OTP
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Always Mobile Number Input */}
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
                      setStep("INPUT");
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
                  Code sent via{" "}
                  <Text style={{ fontWeight: "700", color: "#0F172A" }}>
                    {otpChannel === "WHATSAPP" ? "WhatsApp" : "Email"}
                  </Text>{" "}
                  to{" "}
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
  container: { flex: 1, backgroundColor: "#0F172A" },
  keyboardView: { flex: 1 },
  scrollContent: { flexGrow: 1, justifyContent: "space-between" },
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
  title: { color: "#FFFFFF", fontSize: 28, fontWeight: "800" },
  subtitle: { color: "#94A3B8", fontSize: 14, marginTop: 4 },
  card: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 24,
  },
  welcome: { fontSize: 26, fontWeight: "800", color: "#0F172A" },
  cardSub: { color: "#64748B", fontSize: 14, marginBottom: 16, marginTop: 4 },
  tabContainer: {
    flexDirection: "row",
    backgroundColor: "#F1F5F9",
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
  },
  activeTab: {
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  tabText: { fontSize: 13, fontWeight: "600", color: "#64748B" },
  activeTabText: { color: "#2563EB", fontWeight: "700" },
  otpHeaderRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  label: { fontSize: 13, fontWeight: "700", color: "#334155", marginBottom: 6 },
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
  input: { flex: 1, color: "#0F172A", fontSize: 15 },
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
  buttonDisabled: { opacity: 0.7 },
  loginText: { color: "#FFFFFF", fontSize: 16, fontWeight: "700" },
  resendBox: { marginTop: 16, alignItems: "center" },
  resendText: { color: "#64748B", fontSize: 13 },
  resendBold: { color: "#2563EB", fontWeight: "700" },
  footer: {
    textAlign: "center",
    marginTop: 30,
    color: "#94A3B8",
    fontSize: 12,
  },
});
