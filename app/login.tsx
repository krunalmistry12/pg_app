import Ionicons from "@expo/vector-icons/Ionicons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { jwtDecode } from "jwt-decode"; // 👈 FIX 1: Named import fixed
import React, { useRef, useState } from "react";
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
import api from "../src/services/api";

export default function LoginScreen() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [focusedInput, setFocusedInput] = useState<
    "username" | "password" | null
  >(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const passwordRef = useRef<TextInput>(null);

  // -------------------------------------------------------------
  // Validation Helper
  // -------------------------------------------------------------
  const validateForm = (): boolean => {
    const trimmedUsername = username.trim();

    if (!trimmedUsername) {
      setError("Please enter your username.");
      return false;
    }

    if (!password) {
      setError("Please enter your password.");
      return false;
    }

    return true;
  };

  // -------------------------------------------------------------
  // Login Action
  // -------------------------------------------------------------
  const handleLogin = async () => {
    setError("");

    // 1. Front-end Validation Check
    if (!validateForm()) return;

    setLoading(true);

    try {
      // 2. Call API
      const response = await api.post("/User/login", {
        name: username.trim(),
        password: password,
      });

      // 3. Extract Token & Data
      const token = response?.data?.token;

      if (token) {
        // Decode Token to find user role
        const decoded: any = jwtDecode(token);

        // Backend claims me role field check karein (Default to "Admin" or "Tenant")
        const userRole =
          decoded.role ??
          decoded[
            "http://schemas.microsoft.com/ws/2008/06/identity/claims/role"
          ] ??
          "";

        // Multi-save in AsyncStorage
        await Promise.all([
          AsyncStorage.setItem("token", token),
          AsyncStorage.setItem("isLoggedIn", "true"),
          AsyncStorage.setItem("userRole", userRole),
        ]);
        console.log("Login Error:", userRole);
        // 🚦 ROLE BASED ROUTING 🚦
        // 👈 FIX 2: Added 'as any' casting to prevent Expo Router type issues
        if (userRole === "Admin" || userRole === "Manager") {
          router.replace("/(tabs)" as any);
        } else if (userRole === "User") {
          router.replace("/(tenant)" as any);
        } else {
          router.replace("/(tabs)" as any);
        }
      } else {
        setError("Invalid response from server. Token missing.");
      }
    } catch (err: any) {
      // Production Error Handling Strategy
      if (err.response) {
        const status = err.response.status;
        const serverMessage = err.response.data?.message;

        if (status === 401 || status === 400) {
          setError(serverMessage || "Invalid username or password.");
        } else if (status >= 500) {
          setError("Server is temporarily down. Please try again later.");
        } else {
          setError(serverMessage || "An error occurred during login.");
        }
      } else if (err.request) {
        setError("Network error. Please check your internet connection.");
      } else {
        setError("Something went wrong. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  // Quick helper for Demo / Staging environment
  const handleDemoFill = () => {
    setUsername("kunal");
    setPassword("123456");
    setError("");
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
              <Ionicons name="business" size={36} color="#38BDF8" />
            </View>
            <Text style={styles.title}>PG Manager</Text>
            <Text style={styles.subtitle}>
              Manage your PG smarter and faster
            </Text>
          </View>

          {/* Login Card */}
          <View style={styles.card}>
            <Text style={styles.welcome}>Welcome Back 👋</Text>
            <Text style={styles.cardSub}>Sign in to continue</Text>

            {/* Username Input */}
            <Text style={styles.label}>Username</Text>
            <View
              style={[
                styles.inputContainer,
                focusedInput === "username" && styles.inputFocused,
              ]}
            >
              <Ionicons
                name="person-outline"
                size={20}
                color={focusedInput === "username" ? "#2563EB" : "#64748B"}
              />
              <TextInput
                placeholder="e.g. kunal_admin"
                placeholderTextColor="#94A3B8"
                value={username}
                onChangeText={(text) => {
                  setUsername(text);
                  if (error) setError("");
                }}
                onFocus={() => setFocusedInput("username")}
                onBlur={() => setFocusedInput(null)}
                autoCapitalize="none"
                autoCorrect={false}
                style={styles.input}
                returnKeyType="next"
                onSubmitEditing={() => passwordRef.current?.focus()}
              />
            </View>

            {/* Password Input */}
            <Text style={styles.label}>Password</Text>
            <View
              style={[
                styles.inputContainer,
                focusedInput === "password" && styles.inputFocused,
              ]}
            >
              <Ionicons
                name="lock-closed-outline"
                size={20}
                color={focusedInput === "password" ? "#2563EB" : "#64748B"}
              />
              <TextInput
                ref={passwordRef}
                placeholder="Minimum 6 characters"
                placeholderTextColor="#94A3B8"
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  if (error) setError("");
                }}
                onFocus={() => setFocusedInput("password")}
                onBlur={() => setFocusedInput(null)}
                style={styles.input}
                returnKeyType="done"
                onSubmitEditing={handleLogin}
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons
                  name={!showPassword ? "eye-off-outline" : "eye-outline"}
                  size={20}
                  color="#64748B"
                />
              </TouchableOpacity>
            </View>

            {/* Error Notification */}
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

            {/* Submit Button */}
            <TouchableOpacity
              style={[styles.loginButton, loading && styles.buttonDisabled]}
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.loginText}>Login</Text>
              )}
            </TouchableOpacity>

            {/* Demo Helper Button */}
            {__DEV__ && (
              <TouchableOpacity
                style={styles.demoBox}
                onPress={handleDemoFill}
                activeOpacity={0.7}
              >
                <Ionicons name="flash-outline" size={16} color="#2563EB" />
                <Text style={styles.demoText}>
                  Demo Login:{" "}
                  <Text style={styles.demoBold}>kunal / 123456</Text> (Tap to
                  fill)
                </Text>
              </TouchableOpacity>
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
  inputFocused: {
    borderColor: "#2563EB",
    backgroundColor: "#FFFFFF",
  },
  input: {
    flex: 1,
    marginLeft: 12,
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
  demoBox: {
    marginTop: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EFF6FF",
    borderWidth: 1,
    borderColor: "#BFDBFE",
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
  },
  demoText: {
    color: "#2563EB",
    fontSize: 13,
    marginLeft: 6,
  },
  demoBold: {
    fontWeight: "700",
  },
  footer: {
    textAlign: "center",
    marginTop: 20,
    color: "#94A3B8",
    fontSize: 12,
  },
});
