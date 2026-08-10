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
import api from "../../src/services/api";

interface TenantData {
  name: string;
  roomNumber?: string;
  rentAmount?: number;
  dueDate: string;
  isRentPaid: boolean;
  pgName?: string;
}

export default function TenantDashboard() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [tenant, setTenant] = useState<TenantData | null>(null);

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

  const fetchTenantProfile = async () => {
    try {
      const tenantId = await getTenantId();

      // 1. Fetch Tenant Profile
      const response = await api.get(`/Tenants/${tenantId}`);
      const resData = response.data?.data || response.data;

      let isPaid = resData?.isRentPaid || false;

      // 2. Double check with pending bills API to ensure absolute accuracy
      try {
        const billsResponse = await api.get("/Rent/tenant/my-pending-bills");
        const billsData = billsResponse.data?.data || billsResponse.data;

        // Agar pending bills ki list khali hai ya array length 0 hai, matlab rent pay ho chuka hai!
        if (Array.isArray(billsData) && billsData.length === 0) {
          isPaid = true;
        } else if (Array.isArray(billsData) && billsData.length > 0) {
          // Check if all bills are paid or amount due is 0
          const hasUnpaid = billsData.some(
            (bill: any) =>
              !bill.isPaid && (bill.dueAmount > 0 || bill.amount > 0),
          );
          isPaid = !hasUnpaid;
        }
      } catch (billErr) {
        console.log(
          "Could not fetch pending bills, falling back to profile status:",
          billErr,
        );
      }

      const currentMonthName = new Date().toLocaleString("default", {
        month: "long",
        year: "numeric",
      });

      if (resData) {
        setTenant({
          name: resData.name || "Tenant",
          roomNumber: `Flat ${resData.flatNumber || "N/A"} - ${resData.roomName || ""} (${resData.bedName || ""})`,
          rentAmount: resData.rent || 0,
          dueDate: resData.dueDate
            ? `${resData.dueDate}th of ${currentMonthName}`
            : currentMonthName,
          isRentPaid: isPaid,
          pgName: resData.apartmentName || "PG Accommodation",
        });
      }
    } catch (error: any) {
      console.log(
        "Error fetching tenant profile:",
        error?.response || error?.message,
      );
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
      <View style={styles.loadingCenter}>
        <ActivityIndicator size="large" color="#38BDF8" />
        <Text style={styles.loadingText}>Loading dashboard...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0F172A" />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.welcomeText}>Welcome back 👋</Text>
          <Text style={styles.tenantName}>{tenant?.name}</Text>
          {tenant?.pgName ? (
            <View style={styles.pgBadge}>
              <Ionicons name="business-outline" size={12} color="#38BDF8" />
              <Text style={styles.pgNameText}>{tenant.pgName}</Text>
            </View>
          ) : null}
        </View>

        <TouchableOpacity
          onPress={handleLogout}
          style={styles.logoutBtn}
          activeOpacity={0.8}
        >
          <Ionicons name="log-out-outline" size={20} color="#EF4444" />
        </TouchableOpacity>
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
        {/* Room & Rent Summary Card */}
        <View
          style={[
            styles.summaryCard,
            tenant?.isRentPaid && styles.summaryCardPaid,
          ]}
        >
          <View style={styles.cardHeader}>
            <View style={{ flex: 1, marginRight: 10 }}>
              <Text style={styles.cardLabel}>Room / Bed Info</Text>
              <Text style={styles.cardValue} numberOfLines={1}>
                {tenant?.roomNumber || "N/A"}
              </Text>
            </View>

            <View
              style={[
                styles.statusBadge,
                {
                  backgroundColor: tenant?.isRentPaid
                    ? "rgba(52, 211, 153, 0.15)"
                    : "rgba(245, 158, 11, 0.15)",
                },
              ]}
            >
              <Ionicons
                name={tenant?.isRentPaid ? "checkmark-circle" : "alert-circle"}
                size={14}
                color={tenant?.isRentPaid ? "#34D399" : "#F59E0B"}
              />
              <Text
                style={[
                  styles.statusText,
                  { color: tenant?.isRentPaid ? "#34D399" : "#F59E0B" },
                ]}
              >
                {tenant?.isRentPaid ? "Rent Paid" : "Payment Due"}
              </Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.rentDetails}>
            <View>
              <Text style={styles.cardLabel}>Monthly Rent</Text>
              <Text style={styles.rentAmount}>
                ₹{tenant?.rentAmount?.toLocaleString() ?? 0}
              </Text>
            </View>
            <View style={styles.alignRight}>
              <Text style={styles.cardLabel}>Billing Cycle</Text>
              <Text style={styles.dueDate}>{tenant?.dueDate || "N/A"}</Text>
            </View>
          </View>

          {/* Conditional Pay Button */}
          {!tenant?.isRentPaid ? (
            <TouchableOpacity
              style={styles.payButton}
              onPress={() => router.push("/(tenant)/rent-payments" as any)}
              activeOpacity={0.85}
            >
              <Ionicons name="card-outline" size={18} color="#FFF" />
              <Text style={styles.payButtonText}>Pay Rent Now</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.paidSuccessBox}>
              <Ionicons name="shield-checkmark" size={16} color="#34D399" />
              <Text style={styles.paidSuccessText}>
                This month's rent has been successfully paid!
              </Text>
            </View>
          )}
        </View>

        {/* Quick Actions Grid */}
        <Text style={styles.sectionTitle}>Services & Support</Text>

        <View style={styles.grid}>
          <TouchableOpacity
            style={styles.gridItem}
            onPress={() =>
              Alert.alert("Complaint", "Raise issue feature is coming soon.")
            }
            activeOpacity={0.8}
          >
            <View
              style={[
                styles.iconBox,
                { backgroundColor: "rgba(245, 158, 11, 0.12)" },
              ]}
            >
              <Ionicons name="construct-outline" size={24} color="#F59E0B" />
            </View>
            <Text style={styles.gridTitle}>Raise Issue</Text>
            <Text style={styles.gridSub}>Fan, WiFi, Plumbing</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.gridItem}
            onPress={() =>
              Alert.alert(
                "Mess",
                "Today's food menu is updated in the dining area.",
              )
            }
            activeOpacity={0.8}
          >
            <View
              style={[
                styles.iconBox,
                { backgroundColor: "rgba(99, 102, 241, 0.12)" },
              ]}
            >
              <Ionicons name="restaurant-outline" size={24} color="#6366F1" />
            </View>
            <Text style={styles.gridTitle}>Food Menu</Text>
            <Text style={styles.gridSub}>Check Mess Schedule</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.gridItem}
            onPress={() => router.push("/(tenant)/rent-payments" as any)}
            activeOpacity={0.8}
          >
            <View
              style={[
                styles.iconBox,
                { backgroundColor: "rgba(52, 211, 153, 0.12)" },
              ]}
            >
              <Ionicons name="receipt-outline" size={24} color="#34D399" />
            </View>
            <Text style={styles.gridTitle}>Payment History</Text>
            <Text style={styles.gridSub}>View Receipts & Bills</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.gridItem}
            onPress={() =>
              Alert.alert(
                "PG Rules",
                "1. Gate closes at 10:30 PM.\n2. Visitors allowed till 8 PM.",
              )
            }
            activeOpacity={0.8}
          >
            <View
              style={[
                styles.iconBox,
                { backgroundColor: "rgba(168, 85, 247, 0.12)" },
              ]}
            >
              <Ionicons
                name="shield-checkmark-outline"
                size={24}
                color="#A855F7"
              />
            </View>
            <Text style={styles.gridTitle}>PG Rules</Text>
            <Text style={styles.gridSub}>Timing & Policy</Text>
          </TouchableOpacity>
        </View>

        {/* Notice Board */}
        <Text style={styles.sectionTitle}>Notice Board 📢</Text>
        <View style={styles.noticeCard}>
          <Text style={styles.noticeTitle}>Water Tank Cleaning Notice</Text>
          <Text style={styles.noticeText}>
            Water supply will be temporarily paused on upcoming Sunday between
            10:00 AM to 1:00 PM due to routine tank cleaning.
          </Text>
          <Text style={styles.noticeDate}>Posted by Admin</Text>
        </View>
      </ScrollView>
    </View>
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
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#1E293B",
  },
  headerLeft: { flex: 1 },
  welcomeText: { color: "#94A3B8", fontSize: 12, fontWeight: "500" },
  tenantName: {
    color: "#F8FAFC",
    fontSize: 20,
    fontWeight: "800",
    marginTop: 2,
  },
  pgBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 4,
    backgroundColor: "rgba(56, 189, 248, 0.1)",
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  pgNameText: { color: "#38BDF8", fontSize: 11, fontWeight: "600" },
  logoutBtn: {
    backgroundColor: "#1E293B",
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#334155",
  },
  scrollContent: { padding: 16, paddingBottom: 30 },
  summaryCard: {
    backgroundColor: "#111827",
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: "#1F2937",
    marginBottom: 24,
  },
  summaryCardPaid: {
    borderColor: "rgba(52, 211, 153, 0.3)",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardLabel: {
    fontSize: 11,
    color: "#94A3B8",
    fontWeight: "600",
    textTransform: "uppercase",
  },
  cardValue: {
    fontSize: 15,
    fontWeight: "700",
    color: "#F8FAFC",
    marginTop: 3,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  statusText: { fontSize: 11, fontWeight: "700" },
  divider: { height: 1, backgroundColor: "#1F2937", marginVertical: 16 },
  rentDetails: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  rentAmount: {
    fontSize: 22,
    fontWeight: "800",
    color: "#38BDF8",
    marginTop: 2,
  },
  alignRight: { alignItems: "flex-end" },
  dueDate: { fontSize: 12, fontWeight: "700", color: "#F8FAFC", marginTop: 3 },
  payButton: {
    backgroundColor: "#3B82F6",
    borderRadius: 12,
    height: 46,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 18,
  },
  payButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
    marginLeft: 6,
  },
  paidSuccessBox: {
    backgroundColor: "rgba(52, 211, 153, 0.1)",
    borderRadius: 12,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 16,
    borderWidth: 1,
    borderColor: "rgba(52, 211, 153, 0.2)",
  },
  paidSuccessText: { color: "#34D399", fontSize: 12, fontWeight: "600" },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#F8FAFC",
    marginBottom: 12,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  gridItem: {
    backgroundColor: "#111827",
    width: "48%",
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#1F2937",
  },
  iconBox: {
    width: 42,
    height: 42,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  gridTitle: { fontSize: 14, fontWeight: "700", color: "#F8FAFC" },
  gridSub: { fontSize: 11, color: "#94A3B8", marginTop: 2 },
  noticeCard: {
    backgroundColor: "rgba(59, 130, 246, 0.08)",
    borderWidth: 1,
    borderColor: "rgba(59, 130, 246, 0.2)",
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  noticeTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#60A5FA",
    marginBottom: 6,
  },
  noticeText: { fontSize: 12, color: "#93C5FD", lineHeight: 18 },
  noticeDate: {
    fontSize: 11,
    color: "#64748B",
    marginTop: 10,
    textAlign: "right",
    fontWeight: "600",
  },
});
