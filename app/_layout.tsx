import AsyncStorage from "@react-native-async-storage/async-storage";
import { Stack, useRouter, useSegments } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";

export default function RootLayout() {
  const [isInitializing, setIsInitializing] = useState(true);
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    const checkAuthAndRedirect = async () => {
      try {
        const isLoggedIn = await AsyncStorage.getItem("isLoggedIn");
        const token = await AsyncStorage.getItem("token");
        const userId = await AsyncStorage.getItem("userId");
        const userRole = await AsyncStorage.getItem("userRole");

        // Check if user is currently on the login screen or root/index
        const inAuthGroup =
          segments[0] === "login" || (segments[0] as string) === "index";

        if (!isLoggedIn || !token || !userId) {
          await AsyncStorage.multiRemove([
            "token",
            "isLoggedIn",
            "userRole",
            "userId",
          ]);
          if (!inAuthGroup) {
            router.replace("/login" as any);
          }
        } else {
          if (inAuthGroup) {
            if (userRole === "SuperAdmin") {
              router.replace("/(Superadmin)" as any);
            } else if (userRole === "Admin" || userRole === "Staff") {
              router.replace("/(tabs)" as any);
            } else if (userRole === "Tenant") {
              router.replace("/(tenant)" as any);
            }
          }
        }
      } catch (error) {
        console.log("Auth check error:", error);
        router.replace("/login" as any);
      } finally {
        setIsInitializing(false);
      }
    };

    checkAuthAndRedirect();
  }, [segments]);

  if (isInitializing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#38BDF8" />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: "#0F172A" },
        }}
      >
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="index" />
        <Stack.Screen name="login" />
        <Stack.Screen
          name="add-tenant"
          options={{
            presentation: "modal",
            animation: "slide_from_bottom",
          }}
        />
        <Stack.Screen
          name="add-room"
          options={{
            presentation: "modal",
            animation: "slide_from_bottom",
          }}
        />
        <Stack.Screen
          name="flat-manager"
          options={{
            animation: "slide_from_right",
          }}
        />
        <Stack.Screen
          name="add-2bhk-flat"
          options={{
            animation: "slide_from_bottom",
            presentation: "modal",
          }}
        />
      </Stack>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#0F172A",
  },
});
