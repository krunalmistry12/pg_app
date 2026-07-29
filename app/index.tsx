import { useEffect } from "react";
import { View, Text, ActivityIndicator } from "react-native";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function SplashScreen() {

  useEffect(() => {

    const checkLogin = async () => {

      const status =
        await AsyncStorage.getItem(
          "isLoggedIn"
        );

      setTimeout(() => {

        if (status === "true") {
          router.replace("/(tabs)");
        } else {
          router.replace("/onboarding");
        }

      }, 1500);
    };

    checkLogin();

  }, []);

  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#2563EB",
      }}
    >
      <Text
        style={{
          fontSize: 32,
          fontWeight: "bold",
          color: "white",
          marginBottom: 20,
        }}
      >
        PG Management
      </Text>

      <ActivityIndicator
        size="large"
        color="white"
      />
    </View>
  );
}