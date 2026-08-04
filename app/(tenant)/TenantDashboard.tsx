import Ionicons from "@expo/vector-icons/Ionicons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
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
import api from "../../src/services/api"; // Aapka api client path

interface TenantData {
  name: string;
  roomNo: string;
  rentAmount: number;
  dueDate: string;
  isRentPaid: boolean;
  pgName: string;
}

export default function TenantDashboard() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [tenant, setTenant] = useState<TenantData | null>(null);

  // Tenant Details Fetch Karna
  const fetchTenantProfile = async () => {
    try {
      // Backend api call to fetch tenant profile
      const response = await api.get("/Tenant/profile");
      if (response.data) {
        setTenant(response.data);
      }
    } catch (error) {
      console.log("Error fetching profile, loading mock data instead", error);
      // Fallback Data agar Backend API abhi ready na ho
      setTenant({
        name: "Kunal",
        roomNo: "102 - Bed A",
        rentAmount: 6500,
        dueDate: "10th Aug 2026",
        isRentPaid: false,
        pgName: "Sunrise Luxury PG",
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchTenantProfile();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchTenantProfile();
  };

  // Logout Handler
  const handleLogout = async () => {
    Alert.alert("Logout", "Kya aap logout karna chahte hain?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          await AsyncStorage.multiRemove(["token", "isLoggedIn", "userRole"]);
          router.replace("/login");
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={styles.loadingCenter}>
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0F172A" />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.welcomeText}>Welcome Back 👋</Text>
          <Text style={styles.tenantName}>{tenant?.name || "Tenant"}</Text>
          <Text style={styles.pgName}>{tenant?.pgName}</Text>
        </View>

        <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
          <Ionicons name="log-out-outline" size={22} color="#EF4444" />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Room & Rent Summary Card */}
        <View style={styles.summaryCard}>
          <View style={styles.cardHeader}>
            <View>
              <Text style={styles.cardLabel}>Room Number</Text>
              <Text style={styles.cardValue}>{tenant?.roomNo}</Text>
            </View>

            {/* Rent Status Badge */}
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: tenant?.isRentPaid ? "#DCFCE7" : "#FEE2E2" },
              ]}
            >
              <Text
                style={[
                  styles.statusText,
                  { color: tenant?.isRentPaid ? "#16A34A" : "#DC2626" },
                ]}
              >
                {tenant?.isRentPaid ? "Rent Paid" : "Rent Pending"}
              </Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.rentDetails}>
            <View>
              <Text style={styles.cardLabel}>Monthly Rent</Text>
              <Text style={styles.rentAmount}>₹{tenant?.rentAmount}</Text>
            </View>
            <View style={styles.alignRight}>
              <Text style={styles.cardLabel}>Due Date</Text>
              <Text style={styles.dueDate}>{tenant?.dueDate}</Text>
            </View>
          </View>

          {/* Pay Rent Button */}
          {!tenant?.isRentPaid && (
            <TouchableOpacity
              style={styles.payButton}
              onPress={() => Alert.alert("Payment Gateway", "UPI Redirect...")}
            >
              <Ionicons name="card-outline" size={20} color="#FFF" />
              <Text style={styles.payButtonText}>Pay Rent Now</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Quick Actions Grid */}
        <Text style={styles.sectionTitle}>Services & Support</Text>

        <View style={styles.grid}>
          {/* Action 1: Complaints */}
          <TouchableOpacity
            style={styles.gridItem}
            onPress={() => Alert.alert("Complaint", "Raise issue feature")}
          >
            <View style={[styles.iconBox, { backgroundColor: "#FEF3C7" }]}>
              <Ionicons name="construct-outline" size={26} color="#D97706" />
            </View>
            <Text style={styles.gridTitle}>Raise Issue</Text>
            <Text style={styles.gridSub}>Fan, WiFi, Plumbing</Text>
          </TouchableOpacity>

          {/* Action 2: Food Menu */}
          <TouchableOpacity
            style={styles.gridItem}
            onPress={() => Alert.alert("Mess", "Today's Food Menu")}
          >
            <View style={[styles.iconBox, { backgroundColor: "#E0E7FF" }]}>
              <Ionicons name="restaurant-outline" size={26} color="#4F46E5" />
            </View>
            <Text style={styles.gridTitle}>Food Menu</Text>
            <Text style={styles.gridSub}>Check Today's Mess</Text>
          </TouchableOpacity>

          {/* Action 3: Rent Receipts */}
          <TouchableOpacity
            style={styles.gridItem}
            onPress={() => Alert.alert("Receipts", "History of payments")}
          >
            <View style={[styles.iconBox, { backgroundColor: "#DCFCE7" }]}>
              <Ionicons name="receipt-outline" size={26} color="#16A34A" />
            </View>
            <Text style={styles.gridTitle}>Payment History</Text>
            <Text style={styles.gridSub}>Download Receipts</Text>
          </TouchableOpacity>

          {/* Action 4: PG Rules */}
          <TouchableOpacity
            style={styles.gridItem}
            onPress={() => Alert.alert("Rules", "Gate timing & Policy")}
          >
            <View style={[styles.iconBox, { backgroundColor: "#F3E8FF" }]}>
              <Ionicons
                name="shield-checkmark-outline"
                size={26}
                color="#9333EA"
              />
            </View>
            <Text style={styles.gridTitle}>PG Rules</Text>
            <Text style={styles.gridSub}>Timing & Policy</Text>
          </TouchableOpacity>
        </View>

        {/* Notice Board */}
        <Text style={styles.sectionTitle}>Notice Board 📢</Text>
        <View style={styles.noticeCard}>
          <Text style={styles.noticeTitle}>Water Tank Cleaning</Text>
          <Text style={styles.noticeText}>
            Water supply will be paused on Sunday between 10:00 AM to 1:00 PM
            due to tank cleaning.
          </Text>
          <Text style={styles.noticeDate}>Posted on: Yesterday</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  loadingCenter: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#0F172A",
  },
  header: {
    backgroundColor: "#0F172A",
    paddingTop: 50,
    paddingBottom: 24,
    paddingHorizontal: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  welcomeText: {
    color: "#94A3B8",
    fontSize: 13,
  },
  tenantName: {
    color: "#FFFFFF",
    fontSize: 22,
    fontWeight: "800",
  },
  pgName: {
    color: "#38BDF8",
    fontSize: 12,
    fontWeight: "600",
    marginTop: 2,
  },
  logoutBtn: {
    backgroundColor: "#1E293B",
    padding: 10,
    borderRadius: 12,
  },
  scrollContent: {
    padding: 20,
  },
  summaryCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 20,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
    marginBottom: 24,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardLabel: {
    fontSize: 12,
    color: "#64748B",
    fontWeight: "600",
  },
  cardValue: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0F172A",
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "700",
  },
  divider: {
    height: 1,
    backgroundColor: "#F1F5F9",
    marginVertical: 16,
  },
  rentDetails: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  rentAmount: {
    fontSize: 22,
    fontWeight: "800",
    color: "#2563EB",
    marginTop: 2,
  },
  alignRight: {
    alignItems: "flex-end",
  },
  dueDate: {
    fontSize: 15,
    fontWeight: "700",
    color: "#DC2626",
    marginTop: 4,
  },
  payButton: {
    backgroundColor: "#2563EB",
    borderRadius: 12,
    height: 48,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 18,
  },
  payButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
    marginLeft: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0F172A",
    marginBottom: 14,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  gridItem: {
    backgroundColor: "#FFFFFF",
    width: "48%",
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    shadowColor: "#000",
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  iconBox: {
    width: 46,
    height: 46,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  gridTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0F172A",
  },
  gridSub: {
    fontSize: 11,
    color: "#94A3B8",
    marginTop: 2,
  },
  noticeCard: {
    backgroundColor: "#EFF6FF",
    borderWidth: 1,
    borderColor: "#BFDBFE",
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  noticeTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1E40AF",
    marginBottom: 4,
  },
  noticeText: {
    fontSize: 13,
    color: "#3B82F6",
    lineHeight: 18,
  },
  noticeDate: {
    fontSize: 11,
    color: "#93C5FD",
    marginTop: 8,
    textAlign: "right",
  },
});
