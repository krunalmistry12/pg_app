import AsyncStorage from "@react-native-async-storage/async-storage";
import { Redirect } from "expo-router";
import { jwtDecode } from "jwt-decode";
import { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";

interface DecodedToken {
  role?: string;
  "http://schemas.microsoft.com/ws/2008/06/identity/claims/role"?: string;
  exp?: number;
}

export default function Index() {
  const [isLoading, setIsLoading] = useState(true);
  const [targetRoute, setTargetRoute] = useState<string>("/login");

  useEffect(() => {
    async function prepareApp() {
      try {
        // MultiGet for fast parallel fetching
        const values = await AsyncStorage.multiGet([
          "has_completed_onboarding",
          "isLoggedIn",
          "token",
          "userRole",
        ]);

        const onboardingVal = values[0][1];
        const isLoggedInVal = values[1][1];
        const token = values[2][1];
        let userRole = values[3][1];

        // 1. Check if user is Logged In and Token exists
        if (isLoggedInVal === "true" && token) {
          try {
            // Token Decode to extract Role
            const decoded: DecodedToken = jwtDecode(token);

            // Check for expiry (Security Check)
            const currentTime = Date.now() / 1000;
            if (decoded.exp && decoded.exp < currentTime) {
              // Token expired -> redirect to login
              await AsyncStorage.multiRemove([
                "isLoggedIn",
                "token",
                "userRole",
              ]);
              setTargetRoute("/login");
              return;
            }

            // Extract role from token claims if not present in AsyncStorage
            if (!userRole) {
              userRole =
                decoded.role ||
                decoded[
                  "http://schemas.microsoft.com/ws/2008/06/identity/claims/role"
                ] ||
                "User";
            }

            console.log("Login Error:", userRole);
            // 🚦 ROLE-BASED ROUTING LOGIC (FIXED TO MATCH YOUR FOLDERS) 🚦
            if (userRole === "Admin" || userRole === "Manager") {
              setTargetRoute("/(tabs)"); // 👈 Admin / Manager goes to (tabs)
            } else if (userRole === "User" || userRole === "Student") {
              setTargetRoute("/(tenant)"); // 👈 Tenant goes to (tenant)
            } else {
              setTargetRoute("/(tabs)"); // Fallback Default Tabs
            }
          } catch (jwtErr) {
            console.error("JWT Decode failed:", jwtErr);
            setTargetRoute("/login");
          }
        }
        // 2. Completed onboarding but not logged in -> Go to Login
        else if (onboardingVal === "true") {
          setTargetRoute("/login");
        }
        // 3. First time user -> Onboarding Screen
        else {
          setTargetRoute("/onboarding");
        }
      } catch (e) {
        console.error("Storage check error:", e);
        setTargetRoute("/login");
      } finally {
        setIsLoading(false);
      }
    }

    prepareApp();
  }, []);

  if (isLoading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#0F172A",
        }}
      >
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  return <Redirect href={targetRoute as any} />;
}
