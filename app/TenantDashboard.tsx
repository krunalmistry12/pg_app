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
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { TenantProfile, tenantService } from "../src/services/tenantApi";
import { styles } from "../src/styles/Tenant/TenantDashboard.styles";

const CACHE_KEY = "cached_tenant_profile";

export default function TenantDashboard() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [tenant, setTenant] = useState<TenantProfile | null>(null);

  useEffect(() => {
    loadInitialData();
  }, []);

  // Pehle cached data dikhao fast rendering ke liye, phir background mein API call karo
  const loadInitialData = async () => {
    try {
      const cachedData = await AsyncStorage.getItem(CACHE_KEY);
      if (cachedData) {
        setTenant(JSON.parse(cachedData));
        setLoading(false); // Quick load from cache
      }
    } catch (e) {
      console.log("Error reading cached profile", e);
    }

    // Fresh data fetch from API
    await loadProfile(false);
  };

  const loadProfile = async (isRefreshing = false) => {
    try {
      if (isRefreshing) setRefreshing(true);

      const data = await tenantService.fetchTenantProfileData();
      if (data) {
        setTenant(data);
        // Cache mein save kar lo taaki rent screen ya next time use ho sake
        await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(data));
      }
    } catch (error) {
      console.log("Failed to load tenant profile from API");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    loadProfile(true);
  };

  const handleLogout = async () => {
    Alert.alert("Logout", "Kya aap logout karna chahte hain?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          // Logout par cache aur session data clear kar do
          await AsyncStorage.removeItem(CACHE_KEY);
          await tenantService.clearSessionData();
          router.replace("/login");
        },
      },
    ]);
  };

  if (loading && !tenant) {
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
          <Text style={styles.tenantName}>{tenant?.name || "Tenant"}</Text>
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
              <Text style={styles.cardLabel}>ROOM / BED</Text>
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

          {/* Professional Financial Summary Layout */}
          <View style={{ marginBottom: 16 }}>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "flex-end",
              }}
            >
              <View>
                <Text style={styles.cardLabel}>TOTAL RENT AMOUNT</Text>
                <Text
                  style={[styles.rentAmount, { fontSize: 26, marginTop: 2 }]}
                >
                  ₹{tenant?.rentAmount?.toLocaleString() ?? 0}
                </Text>
              </View>
              <View style={styles.alignRight}>
                <Text style={styles.cardLabel}>BILLING CYCLE</Text>
                <Text style={[styles.dueDate, { marginTop: 4 }]}>
                  {tenant?.dueDate || "N/A"}
                </Text>
              </View>
            </View>

            {/* Sub-breakdown for Paid & Pending if partial payment exists */}
            {!tenant?.isRentPaid && (
              <View
                style={{
                  flexDirection: "row",
                  marginTop: 14,
                  backgroundColor: "rgba(255, 255, 255, 0.04)",
                  padding: 10,
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: "rgba(255, 255, 255, 0.06)",
                }}
              >
                <View style={{ flex: 1 }}>
                  <Text style={[styles.cardLabel, { fontSize: 10 }]}>
                    PAID SO FAR
                  </Text>
                  <Text
                    style={{
                      color: "#34D399",
                      fontWeight: "700",
                      fontSize: 14,
                      marginTop: 2,
                    }}
                  >
                    ₹{tenant?.paidAmount?.toLocaleString() ?? 0}
                  </Text>
                </View>
                <View
                  style={{
                    width: 1,
                    backgroundColor: "rgba(255, 255, 255, 0.1)",
                    marginHorizontal: 10,
                  }}
                />
                <View style={{ flex: 1, alignItems: "flex-end" }}>
                  <Text style={[styles.cardLabel, { fontSize: 10 }]}>
                    BALANCE DUE
                  </Text>
                  <Text
                    style={{
                      color: "#F59E0B",
                      fontWeight: "700",
                      fontSize: 14,
                      marginTop: 2,
                    }}
                  >
                    ₹{tenant?.pendingAmount?.toLocaleString() ?? 0}
                  </Text>
                </View>
              </View>
            )}
          </View>

          {/* Conditional Pay Button */}
          {!tenant?.isRentPaid ? (
            <TouchableOpacity
              style={styles.payButton}
              onPress={() => router.push("/(tenant)/rent-payments" as any)}
              activeOpacity={0.85}
            >
              <Ionicons name="card-outline" size={18} color="#FFF" />
              <Text style={styles.payButtonText}>Pay Remaining Rent</Text>
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
            onPress={() => router.push("/(tenant)/TenantRentScreen" as any)}
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
