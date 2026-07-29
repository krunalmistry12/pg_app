import { Stack } from "expo-router";

export default function RootLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="login" />
      <Stack.Screen name="add-room" />
      <Stack.Screen name="add-tenant" />
      <Stack.Screen name="(tabs)" />
    </Stack>
  );
}
