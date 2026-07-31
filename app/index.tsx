import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { useEffect } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

export default function SplashScreen() {
  useEffect(() => {
    // Type the timer as ReturnType<typeof setTimeout> to support both Node and RN environments
    let timer: ReturnType<typeof setTimeout>;

    const checkLogin = async () => {
      try {
        const status = await AsyncStorage.getItem("isLoggedIn");

        timer = setTimeout(() => {
          if (status === "true") {
            router.replace("/(tabs)");
          } else {
            router.replace("/login");
          }
        }, 1500);
      } catch (error) {
        console.error("Failed to fetch login status:", error);
        router.replace("/login");
      }
    };

    checkLogin();

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>PG Management</Text>
      <ActivityIndicator size="large" color="#FFFFFF" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#0F172A",
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 20,
  },
});
