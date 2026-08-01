import AsyncStorage from "@react-native-async-storage/async-storage";
import { Redirect } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";

export default function Index() {
  const [isLoading, setIsLoading] = useState(true);
  const [targetRoute, setTargetRoute] = useState<
    "/(tabs)" | "/login" | "/onboarding"
  >("/login");

  useEffect(() => {
    async function prepareApp() {
      try {
        // Fetch both keys at the exact same time
        const values = await AsyncStorage.multiGet([
          "has_completed_onboarding",
          "isLoggedIn",
        ]);

        const onboardingVal = values[0][1];
        const isLoggedInVal = values[1][1];

        // 1. If user is logged in -> Go straight to main app
        if (isLoggedInVal === "true") {
          setTargetRoute("/(tabs)");
        }
        // 2. If user completed onboarding but not logged in -> Go to Login
        else if (onboardingVal === "true") {
          setTargetRoute("/login");
        }
        // 3. Otherwise -> Show Onboarding
        else {
          setTargetRoute("/onboarding");
        }
      } catch (e) {
        console.error("Storage check error:", e);
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

  return <Redirect href={targetRoute} />;
}
