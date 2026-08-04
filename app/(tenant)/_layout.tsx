import { Stack } from "expo-router";

export default function TenantLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false, // Clean look without header
      }}
    >
      <Stack.Screen name="index" />
    </Stack>
  );
}
