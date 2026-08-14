import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import {
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function NotFoundScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Ionicons name="construct-outline" size={48} color="#06B6D4" />
        </View>
        <Text style={styles.title}>Under Maintenance</Text>
        <Text style={styles.subtitle}>
          This featured is currently under maintenance or coming
          soon. Please check back later!
        </Text>

        <TouchableOpacity style={styles.button} onPress={() => router.back()}>
          <Text style={styles.buttonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0B0F19", // Dark theme background matching your app
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    padding: 24,
    alignItems: "center",
    maxWidth: 400,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#1E293B",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#334155",
  },
  title: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#F1F5F9", // Light text for dark mode
    marginBottom: 12,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 15,
    color: "#94A3B8", // Muted text for dark mode
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 30,
  },
  button: {
    backgroundColor: "#06B6D4", // Accent color matching your other screens
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  buttonText: {
    color: "#0B0F19",
    fontWeight: "bold",
    fontSize: 16,
  },
});
