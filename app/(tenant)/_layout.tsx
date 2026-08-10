import Ionicons from "@expo/vector-icons/Ionicons";
import { Tabs } from "expo-router";
import React from "react";
import { Platform, StyleSheet, View } from "react-native";

export default function TenantLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: true,
        tabBarStyle: {
          backgroundColor: "#0F172A",
          borderTopColor: "#1E293B",
          borderTopWidth: 1,
          height: Platform.OS === "ios" ? 88 : 68,
          paddingBottom: Platform.OS === "ios" ? 28 : 10,
          paddingTop: 8,
          elevation: 10,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: -6 },
          shadowOpacity: 0.15,
          shadowRadius: 10,
        },
        tabBarActiveTintColor: "#38BDF8",
        tabBarInactiveTintColor: "#64748B",
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "600",
          marginTop: 2,
        },
      }}
    >
      {/* 1. Single Home / Dashboard Tab */}
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color, focused }) => (
            <View
              style={[styles.iconContainer, focused && styles.activeIconBg]}
            >
              <Ionicons
                name={focused ? "home" : "home-outline"}
                size={22}
                color={color}
              />
            </View>
          ),
        }}
      />

      {/* 2. Rent & Bills Tab */}
      <Tabs.Screen
        name="rent-payments"
        options={{
          title: "Rent & Bills",
          tabBarIcon: ({ color, focused }) => (
            <View
              style={[styles.iconContainer, focused && styles.activeIconBg]}
            >
              <Ionicons
                name={focused ? "wallet" : "wallet-outline"}
                size={22}
                color={color}
              />
            </View>
          ),
        }}
      />

      {/* 3. Support / Maintenance Tab */}
      <Tabs.Screen
        name="maintenance"
        options={{
          title: "Support",
          tabBarIcon: ({ color, focused }) => (
            <View
              style={[styles.iconContainer, focused && styles.activeIconBg]}
            >
              <Ionicons
                name={focused ? "construct" : "construct-outline"}
                size={22}
                color={color}
              />
            </View>
          ),
        }}
      />

      {/* 4. Profile Tab */}
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, focused }) => (
            <View
              style={[styles.iconContainer, focused && styles.activeIconBg]}
            >
              <Ionicons
                name={focused ? "person" : "person-outline"}
                size={22}
                color={color}
              />
            </View>
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  iconContainer: {
    alignItems: "center",
    justifyContent: "center",
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  activeIconBg: {
    backgroundColor: "rgba(56, 189, 248, 0.12)",
  },
});
