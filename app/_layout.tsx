import { Stack } from "expo-router";

export default function RootLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: "#0F172A" }, // Matches theme background
      }}
    >
      {/* Existing App Screens */}
      <Stack.Screen name="index" />
      <Stack.Screen name="login" />
      <Stack.Screen name="add-room" />
      <Stack.Screen name="add-tenant" />
      <Stack.Screen name="(tabs)" />

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
          animation: "slide_from_bottom", // Modal-style presentation for adding new flat
          presentation: "modal",
        }}
      />
    </Stack>
  );
}
