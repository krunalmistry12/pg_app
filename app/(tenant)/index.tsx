import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import TenantDashboard from "./TenantDashboard";

export default function HomeScreen() {
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRole = async () => {
      try {
        const savedRole = await AsyncStorage.getItem("userRole");
        setRole(savedRole);
      } catch (error) {
        console.error("Failed to fetch user role", error);
      } finally {
        setLoading(false);
      }
    };

    fetchRole();
  }, []);

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#38BDF8" />
      </View>
    );
  }

  if (role === "Tenant") {
    return <TenantDashboard />;
  }

  // Fallback if role is missing or unrecognized
  return <TenantDashboard />;
}

const styles = StyleSheet.create({
  loaderContainer: {
    flex: 1,
    backgroundColor: "#0F172A",
    alignItems: "center",
    justifyContent: "center",
  },
});
