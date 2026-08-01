// app/_layout.tsx
import { Stack } from "expo-router";
import React from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: "#0F172A" }, // Matches theme background
        }}
      >
        {/* Main Tabs */}
        <Stack.Screen name="(tabs)" />

        {/* Auth & Initial Screens */}
        <Stack.Screen name="index" />
        <Stack.Screen name="login" />

        {/* Modal / Form Screens */}
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

        {/* 2BHK Bed Management Screens */}
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
