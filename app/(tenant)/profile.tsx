import Ionicons from "@expo/vector-icons/Ionicons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { jwtDecode } from "jwt-decode";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import api from "../../src/services/api";

interface ProfileData {
  name: string;
  email?: string;
  phone?: string;
  roomNumber?: string;
  rentAmount?: number;
  dueDate: string;
  pgName?: string;
  joiningDate?: string;
}

export default function ProfileScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [profile, setProfile] = useState<ProfileData | null>(null);

  const getTenantId = async () => {
    try {
      const storedId =
        (await AsyncStorage.getItem("tenantId")) ||
        (await AsyncStorage.getItem("userId")) ||
        (await AsyncStorage.getItem("id"));
      if (storedId) return storedId;

      const token = await AsyncStorage.getItem("token");
      if (token) {
        const decoded: any = jwtDecode(token);
        return (
          decoded.id ||
          decoded.tenantId ||
          decoded.sub ||
          decoded.UserId ||
          "18"
        );
      }
    } catch (e) {
      console.log("Error getting tenant ID:", e);
    }
    return "18";
  };

  const fetchProfileData = async () => {
    try {
      const tenantId = await getTenantId();
      const response = await api.get(`/Tenants/${tenantId}`);
      const resData = response.data?.data || response.data;

      if (resData) {
        setProfile({
          name: resData.name || "Tenant",
          email: resData.email || "Not Provided",
          phone: resData.phone || resData.phoneNumber || "N/A",
          roomNumber: `Flat ${resData.flatNumber || "N/A"} - ${resData.roomName || ""} (${resData.bedName || ""})`,
          rentAmount: resData.rent || 0,
          dueDate: resData.dueDate
            ? `${resData.dueDate}th of every month`
            : "N/A",
          pgName: resData.apartmentName || "PG Accommodation",
          joiningDate: resData.joiningDate
            ? resData.joiningDate.split("T")[0]
            : "N/A",
        });
      }
    } catch (error: any) {
      console.log("Error fetching profile:", error?.response || error?.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchProfileData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchProfileData();
  };

  const handleLogout = async () => {
    Alert.alert("Logout", "Kya aap logout karna chahte hain?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          await AsyncStorage.multiRemove([
            "token",
            "isLoggedIn",
            "userRole",
            "tenantId",
            "userId",
          ]);
          router.replace("/login");
        },
      },
    ]);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingCenter}>
        <ActivityIndicator size="large" color="#38BDF8" />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <StatusBar barStyle="light-content" backgroundColor="#0F172A" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Tenant Profile</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#38BDF8"
          />
        }
      >
        {/* Profile Avatar Card */}
        <View style={styles.avatarCard}>
          <View style={styles.avatarCircle}>
            <Ionicons name="person" size={40} color="#38BDF8" />
          </View>
          <Text style={styles.profileName}>{profile?.name}</Text>
          <Text style={styles.profileRole}>PG Tenant</Text>
          {profile?.pgName ? (
            <View style={styles.pgBadge}>
              <Ionicons name="business-outline" size={12} color="#38BDF8" />
              <Text style={styles.pgBadgeText}>{profile.pgName}</Text>
            </View>
          ) : null}
        </View>

        {/* Details Section */}
        <Text style={styles.sectionTitle}>Personal Information</Text>
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <View style={styles.infoIconBox}>
              <Ionicons name="call-outline" size={18} color="#38BDF8" />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Phone Number</Text>
              <Text style={styles.infoValue}>{profile?.phone}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <View style={styles.infoIconBox}>
              <Ionicons name="mail-outline" size={18} color="#38BDF8" />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Email Address</Text>
              <Text style={styles.infoValue}>{profile?.email}</Text>
            </View>
          </View>
        </View>

        {/* Accommodation Section */}
        <Text style={styles.sectionTitle}>Room & Rent Details</Text>
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <View style={styles.infoIconBox}>
              <Ionicons name="bed-outline" size={18} color="#34D399" />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Room / Bed Info</Text>
              <Text style={styles.infoValue}>{profile?.roomNumber}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <View style={styles.infoIconBox}>
              <Ionicons name="cash-outline" size={18} color="#34D399" />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Monthly Rent</Text>
              <Text style={styles.infoValue}>
                ₹{profile?.rentAmount?.toLocaleString() ?? 0}
              </Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <View style={styles.infoIconBox}>
              <Ionicons name="calendar-outline" size={18} color="#34D399" />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Due Date</Text>
              <Text style={styles.infoValue}>{profile?.dueDate}</Text>
            </View>
          </View>
        </View>

        {/* Logout Button */}
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
          activeOpacity={0.85}
        >
          <Ionicons name="log-out-outline" size={20} color="#EF4444" />
          <Text style={styles.logoutButtonText}>Logout from App</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0B0F19" },
  loadingCenter: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#0B0F19",
  },
  loadingText: { color: "#94A3B8", marginTop: 10, fontSize: 13 },
  header: {
    backgroundColor: "#0F172A",
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#1E293B",
    alignItems: "center",
  },
  headerTitle: { color: "#F8FAFC", fontSize: 18, fontWeight: "700" },
  scrollContent: { padding: 20, paddingBottom: 30 },
  avatarCard: {
    backgroundColor: "#111827",
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#1F2937",
    marginBottom: 24,
  },
  avatarCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(56, 189, 248, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "rgba(56, 189, 248, 0.3)",
  },
  profileName: { fontSize: 20, fontWeight: "800", color: "#F8FAFC" },
  profileRole: { fontSize: 12, color: "#94A3B8", marginTop: 2 },
  pgBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 10,
    backgroundColor: "rgba(56, 189, 248, 0.1)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  pgBadgeText: { color: "#38BDF8", fontSize: 12, fontWeight: "600" },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#94A3B8",
    marginBottom: 10,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  infoCard: {
    backgroundColor: "#111827",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#1F2937",
    marginBottom: 20,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  infoIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "rgba(56, 189, 248, 0.08)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  infoContent: { flex: 1 },
  infoLabel: { fontSize: 11, color: "#94A3B8", fontWeight: "600" },
  infoValue: {
    fontSize: 14,
    color: "#F8FAFC",
    fontWeight: "700",
    marginTop: 2,
  },
  divider: { height: 1, backgroundColor: "#1F2937", marginVertical: 12 },
  logoutButton: {
    backgroundColor: "rgba(239, 68, 68, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.3)",
    borderRadius: 14,
    height: 50,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    marginTop: 10,
  },
  logoutButtonText: { color: "#EF4444", fontSize: 15, fontWeight: "700" },
});
