import Ionicons from "@expo/vector-icons/Ionicons";
import { Tabs } from "expo-router";
import React from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";

export default function TabLayout() {
  return (
    // Wrap the ENTIRE navigator with GestureHandlerRootView
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            backgroundColor: "#111827",
            height: 75,
          },
          tabBarActiveTintColor: "#2563EB",
          tabBarInactiveTintColor: "#9CA3AF",
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "Home",
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="home" size={size} color={color} />
            ),
          }}
        />

        <Tabs.Screen
          name="tenants"
          options={{
            title: "Tenants",
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="people" size={size} color={color} />
            ),
          }}
        />

        <Tabs.Screen
          name="flat-manager"
          options={{
            title: "Flats",
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="business" size={size} color={color} />
            ),
          }}
        />

        <Tabs.Screen
          name="rent"
          options={{
            title: "Rent",
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="cash" size={size} color={color} />
            ),
          }}
        />

        <Tabs.Screen
          name="profile"
          options={{
            title: "Profile",
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="person" size={size} color={color} />
            ),
          }}
        />
      </Tabs>
    </GestureHandlerRootView>
  );
}
