import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StatusBar,
  Alert,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";

export default function Profile() {
  const logout = async () => {
    Alert.alert("Logout", "Kya aap sach mein logout karna chahte hain?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          await AsyncStorage.removeItem("isLoggedIn");
          router.replace("/login");
        },
      },
    ]);
  };

  const handleActionAlert = (title: string, message: string) => {
    Alert.alert(title, message, [{ text: "OK" }]);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#0F172A" />
      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        <Text style={styles.screenTitle}>Admin Account</Text>

        {/* Profile Card (Without Room/Beds Stats) */}
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>K</Text>
          </View>

          <Text style={styles.name}>Kunal Mistry</Text>
          <Text style={styles.role}>PG Owner & Administrator</Text>
          <Text style={styles.pg}>Kunal PG • Ahmedabad</Text>
        </View>

        {/* Core Directory */}
        <Text style={styles.sectionHeading}>Core Directory</Text>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => router.push("/tenants" as any)}
        >
          <View style={styles.menuLeft}>
            <View style={[styles.iconBg, { backgroundColor: "rgba(16, 185, 129, 0.12)" }]}>
              <Ionicons name="people-outline" size={16} color="#10B981" />
            </View>
            <Text style={styles.menuText}>Tenants Directory</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color="#64748B" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => router.push("/rent" as any)}
        >
          <View style={styles.menuLeft}>
            <View style={[styles.iconBg, { backgroundColor: "rgba(245, 158, 11, 0.12)" }]}>
              <Ionicons name="wallet-outline" size={16} color="#F59E0B" />
            </View>
            <Text style={styles.menuText}>Rent & Ledger Records</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color="#64748B" />
        </TouchableOpacity>

        {/* Advanced Admin Controls */}
        <Text style={styles.sectionHeading}>Advanced Admin Controls</Text>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => handleActionAlert("Download Report", "Monthly financial report generated successfully.")}
        >
          <View style={styles.menuLeft}>
            <View style={[styles.iconBg, { backgroundColor: "rgba(14, 165, 233, 0.12)" }]}>
              <Ionicons name="document-text-outline" size={16} color="#0EA5E9" />
            </View>
            <Text style={styles.menuText}>Export Monthly Report (PDF)</Text>
          </View>
          <Ionicons name="download-outline" size={16} color="#0EA5E9" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => handleActionAlert("Notice Board", "Broadcast panel opened.")}
        >
          <View style={styles.menuLeft}>
            <View style={[styles.iconBg, { backgroundColor: "rgba(236, 72, 153, 0.12)" }]}>
              <Ionicons name="megaphone-outline" size={16} color="#EC4899" />
            </View>
            <Text style={styles.menuText}>Broadcast Notice Board</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color="#64748B" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => handleActionAlert("Document Vault", "Secure documents vault opened.")}
        >
          <View style={styles.menuLeft}>
            <View style={[styles.iconBg, { backgroundColor: "rgba(139, 92, 246, 0.12)" }]}>
              <Ionicons name="folder-open-outline" size={16} color="#8B5CF6" />
            </View>
            <Text style={styles.menuText}>Digital Agreement & ID Vault</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color="#64748B" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => handleActionAlert("Visitor Log", "Visitor register accessed.")}
        >
          <View style={styles.menuLeft}>
            <View style={[styles.iconBg, { backgroundColor: "rgba(34, 197, 94, 0.12)" }]}>
              <Ionicons name="shield-checkmark-outline" size={16} color="#22C55E" />
            </View>
            <Text style={styles.menuText}>Visitor & Guest Logbook</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color="#64748B" />
        </TouchableOpacity>

        {/* Preferences */}
        <Text style={styles.sectionHeading}>Preferences</Text>

        <TouchableOpacity style={styles.menuItem}>
          <View style={styles.menuLeft}>
            <View style={[styles.iconBg, { backgroundColor: "rgba(100, 116, 139, 0.12)" }]}>
              <Ionicons name="settings-outline" size={16} color="#94A3B8" />
            </View>
            <Text style={styles.menuText}>App Settings</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color="#64748B" />
        </TouchableOpacity>

        {/* Logout Option */}
        <TouchableOpacity
          onPress={logout}
          style={styles.logoutItem}
          activeOpacity={0.7}
        >
          <View style={styles.menuLeft}>
            <View style={[styles.iconBg, { backgroundColor: "rgba(239, 68, 68, 0.12)" }]}>
              <Ionicons name="log-out-outline" size={16} color="#EF4444" />
            </View>
            <Text style={styles.logoutText}>Logout Account</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color="#EF4444" />
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#0F172A",
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 15,
  },
  screenTitle: {
    color: "#F8FAFC",
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 15,
  },
  profileCard: {
    backgroundColor: "#1E293B",
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#334155",
  },
  avatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "#2563EB",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
    borderWidth: 2,
    borderColor: "#3B82F6",
  },
  avatarText: {
    color: "#FFFFFF",
    fontSize: 26,
    fontWeight: "bold",
  },
  name: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "700",
  },
  role: {
    color: "#94A3B8",
    fontSize: 12,
    marginTop: 2,
  },
  pg: {
    color: "#64748B",
    fontSize: 11,
    marginTop: 2,
  },
  sectionHeading: {
    color: "#64748B",
    fontSize: 11,
    fontWeight: "600",
    marginBottom: 8,
    marginTop: 10,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  menuItem: {
    backgroundColor: "#1E293B",
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    marginBottom: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#334155",
  },
  logoutItem: {
    backgroundColor: "rgba(239, 68, 68, 0.05)",
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    marginTop: 10,
    marginBottom: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.2)",
  },
  menuLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconBg: {
    width: 30,
    height: 30,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  menuText: {
    color: "#F1F5F9",
    fontSize: 14,
    fontWeight: "500",
  },
  logoutText: {
    color: "#EF4444",
    fontWeight: "600",
    fontSize: 14,
  },
});