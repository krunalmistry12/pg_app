import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import CreateUserScreen from "./CreateUserScreen";

export default function HomeScreen() {
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true); // 👈 Loading state add ki

  useEffect(() => {
    const fetchRole = async () => {
      try {
        const savedRole = await AsyncStorage.getItem("userRole");
        setRole(savedRole);
      } catch (error) {
        console.error("Failed to load user role", error);
      } finally {
        setLoading(false); // 👈 Role milne ke baad loading band
      }
    };

    fetchRole();
  }, []);

  // Jab tak AsyncStorage se data aa raha hai, loader dikhayein
  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text style={{ marginTop: 10 }}>Loading...</Text>
      </View>
    );
  }

  // Agar role SuperAdmin hai toh CreateUserScreen dikhayein
  if (role === "SuperAdmin") {
    return <CreateUserScreen />;
  }

  // 👈 Default fallback: Agar role match na ho ya koi aur user ho
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Welcome! Role: {role || "Unknown"}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  text: {
    fontSize: 16,
    fontWeight: "600",
  },
});
