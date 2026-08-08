import Ionicons from "@expo/vector-icons/Ionicons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { jwtDecode } from "jwt-decode";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import {
  DashboardDataResponse,
  getDashboardDataApi,
} from "../../src/services/dashboardApi"; // Import API

const STORAGE_KEY = "@dashboard_cache_data";

export default function Dashboard() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const [isNotificationModalVisible, setIsNotificationModalVisible] =
    useState(false);

  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [dashboardData, setDashboardData] =
    useState<DashboardDataResponse | null>(null);

  // --- Helper to decode JWT token or fetch stored user details ---
  const getAuthDetailsFromStorage = async () => {
    try {
      // Login screen wali exact keys use karein (without '@')
      const userId = await AsyncStorage.getItem("userId");
      const role = await AsyncStorage.getItem("userRole");

      if (userId) {
        return { userId, role: role || "SuperAdmin" };
      }

      // Agar direct userId nahi mili, toh token se decode kar lein
      const token = await AsyncStorage.getItem("token"); // Login me "token" save kiya hai
      if (token) {
        const decoded: any = jwtDecode(token); // ya jo bhi aapka decoder ho
        const extractedUserId =
          decoded.id || decoded.userId || decoded.sub || "";
        const extractedRole = decoded.role || "SuperAdmin";

        return { userId: extractedUserId, role: extractedRole };
      }
    } catch (e) {
      console.error("Error reading auth data from storage:", e);
    }
    return { userId: null, role: "SuperAdmin" };
  };
  // --- Load Data: Pehle Local Storage se, phir API se ---
  const loadDashboardData = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        // Step 1: Instant load from local storage cache to prevent lag
        const cachedData = await AsyncStorage.getItem(STORAGE_KEY);
        if (cachedData) {
          const parsedData: DashboardDataResponse = JSON.parse(cachedData);
          setDashboardData(parsedData);
          setLoading(false);
        }
      }

      // Step 2: Token / Storage se userId aur role fetch karein
      const { userId, role } = await getAuthDetailsFromStorage();

      if (!userId) {
        console.warn("User ID not found in storage. Redirecting to login...");
        router.replace("/login" as any); // Agar user logged in nahi hai toh login page par bhej dein
        return;
      }

      // Step 3: Fetch fresh data using API with dynamic parameters
      const freshData = await getDashboardDataApi(userId, role);

      // Step 4: Update State & Save to Local Storage Cache
      setDashboardData(freshData);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(freshData));
    } catch (error) {
      console.error("Data sync error:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const handleDismissAlert = async (id: string) => {
    if (!dashboardData) return;
    const updatedAlerts = dashboardData.alerts.filter((item) => item.id !== id);
    const updatedData = { ...dashboardData, alerts: updatedAlerts };

    setDashboardData(updatedData);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedData));
  };

  const quickActions = [
    {
      id: "1",
      title: "Add Tenant",
      icon: "person-add-outline" as const,
      color: "#3B82F6",
      route: "/add-tenant",
    },
    {
      id: "2",
      title: "Add Room",
      icon: "business-outline" as const,
      color: "#8B5CF6",
      route: "/add-2bhk-flat",
    },
    {
      id: "3",
      title: "Collect Rent",
      icon: "wallet-outline" as const,
      color: "#10B981",
      route: "/rent",
    },
    {
      id: "4",
      title: "Complaints",
      icon: "alert-circle-outline" as const,
      color: "#EF4444",
      route: "/complaints",
    },
    {
      id: "5",
      title: "Notice Board",
      icon: "megaphone-outline" as const,
      color: "#F59E0B",
      route: "/notices",
    },
    {
      id: "6",
      title: "Utility Bills",
      icon: "flash-outline" as const,
      color: "#06B6D4",
      route: "/utilities",
    },
  ];

  if (loading && !dashboardData) {
    return (
      <SafeAreaView style={[styles.safeArea, styles.centerContainer]}>
        <StatusBar barStyle="light-content" backgroundColor="#0F172A" />
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>Loading Dashboard...</Text>
      </SafeAreaView>
    );
  }

  const primaryAlert = dashboardData?.alerts?.[0];

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#0F172A" />

      {/* Sticky Header */}
      <View style={styles.stickyHeader}>
        <View>
          <Text style={styles.greeting}>👋 Welcome Back,</Text>
          <Text style={styles.username}>
            {dashboardData?.ownerName || "Owner"}
          </Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => setIsNotificationModalVisible(true)}
          >
            <Ionicons name="notifications-outline" size={20} color="#F8FAFC" />
            {(dashboardData?.alerts?.length || 0) > 0 && (
              <View style={styles.notificationBadge} />
            )}
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            style={styles.profileCircle}
            onPress={() => router.push("/profile" as any)}
          >
            <Text style={styles.profileText}>
              {dashboardData?.ownerName
                ? dashboardData.ownerName.charAt(0).toUpperCase()
                : "O"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadDashboardData(true)}
            tintColor="#3B82F6"
          />
        }
      >
        {/* Global Quick Search Bar */}
        {isSearchVisible && (
          <View style={styles.searchContainer}>
            <Ionicons
              name="search-outline"
              size={18}
              color="#64748B"
              style={styles.searchIcon}
            />
            <TextInput
              style={styles.searchInput}
              placeholder="Search tenant, room no, or payment..."
              placeholderTextColor="#64748B"
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoFocus={true}
            />
            <TouchableOpacity
              onPress={() => {
                setSearchQuery("");
                setIsSearchVisible(false);
              }}
            >
              <Ionicons name="close-circle" size={18} color="#64748B" />
            </TouchableOpacity>
          </View>
        )}

        {/* Dynamic Alert Banner */}
        {primaryAlert && (
          <View
            style={[
              styles.alertBanner,
              {
                backgroundColor: `${primaryAlert.color}12`,
                borderColor: `${primaryAlert.color}40`,
              },
            ]}
          >
            <TouchableOpacity
              style={{ flex: 1, flexDirection: "row", alignItems: "center" }}
              activeOpacity={0.8}
              onPress={() => router.push(primaryAlert.route as any)}
            >
              <View
                style={[
                  styles.alertIconBox,
                  { backgroundColor: `${primaryAlert.color}25` },
                ]}
              >
                <Ionicons
                  name={
                    primaryAlert.type === "rent"
                      ? "alert"
                      : primaryAlert.type === "maintenance"
                        ? "construct"
                        : "megaphone"
                  }
                  size={18}
                  color={primaryAlert.color}
                />
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <Text
                    style={[styles.alertTitle, { color: primaryAlert.color }]}
                  >
                    {primaryAlert.title}
                  </Text>
                  <Text style={styles.alertCounter}>
                    {dashboardData?.alerts?.length} Pending
                  </Text>
                </View>
                <Text style={styles.alertSubtitle} numberOfLines={1}>
                  {primaryAlert.subtitle}
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.nextAlertBtn}
              onPress={() => setIsNotificationModalVisible(true)}
            >
              <Ionicons name="chevron-forward" size={16} color="#94A3B8" />
            </TouchableOpacity>
          </View>
        )}

        {/* Revenue Card Banner */}
        <View style={styles.revenueCard}>
          <View style={styles.revenueHeader}>
            <Text style={styles.revenueLabel}>
              {dashboardData?.revenueOverview?.monthName || "Current"} Revenue
              Overview
            </Text>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>Live Sync</Text>
            </View>
          </View>
          <Text style={styles.revenueAmount}>
            ₹
            {(
              dashboardData?.revenueOverview?.totalExpectedRevenue || 0
            ).toLocaleString("en-IN")}
          </Text>
          <View style={styles.financialSplitRow}>
            <View style={styles.splitBox}>
              <Text style={styles.splitLabel}>Collected</Text>
              <Text style={[styles.splitValue, { color: "#34D399" }]}>
                ₹
                {(
                  dashboardData?.revenueOverview?.totalCollected || 0
                ).toLocaleString("en-IN")}
              </Text>
            </View>
            <View style={styles.splitDivider} />
            <View style={styles.splitBox}>
              <Text style={styles.splitLabel}>Pending Due</Text>
              <Text style={[styles.splitValue, { color: "#FCA5A5" }]}>
                ₹
                {(
                  dashboardData?.revenueOverview?.totalPendingDue || 0
                ).toLocaleString("en-IN")}
              </Text>
            </View>
          </View>
        </View>

        {/* Quick Actions Grid */}
        <Text style={styles.sectionTitle}>Management Tools</Text>
        <View style={styles.actionGrid}>
          {quickActions.map((action) => (
            <TouchableOpacity
              key={action.id}
              style={styles.actionButton}
              activeOpacity={0.7}
              onPress={() => router.push(action.route as any)}
            >
              <View
                style={[
                  styles.actionIconContainer,
                  { backgroundColor: `${action.color}20` },
                ]}
              >
                <Ionicons name={action.icon} size={22} color={action.color} />
              </View>
              <Text style={styles.actionText}>{action.title}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Key Metrics Grid */}
        <Text style={styles.sectionTitle}>Property Metrics</Text>
        <View style={styles.statsContainer}>
          <TouchableOpacity
            style={styles.card}
            onPress={() => router.push("/flat-manager" as any)}
          >
            <View style={styles.cardHeader}>
              <View style={styles.iconBoxBlue}>
                <Ionicons name="business" size={18} color="#3B82F6" />
              </View>
              <Text style={styles.cardTitle}>Total Rooms</Text>
            </View>
            <Text style={styles.cardValue}>
              {dashboardData?.propertyMetrics?.totalRooms || 0}
            </Text>
            <Text style={styles.cardSubText}>
              {dashboardData?.propertyMetrics?.occupiedRooms || 0} Occupied •{" "}
              {dashboardData?.propertyMetrics?.vacantRooms || 0} Vacant
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.card}
            onPress={() => router.push("/tenants" as any)}
          >
            <View style={styles.cardHeader}>
              <View style={styles.iconBoxGreen}>
                <Ionicons name="people" size={18} color="#10B981" />
              </View>
              <Text style={styles.cardTitle}>Active Tenants</Text>
            </View>
            <Text style={styles.cardValue}>
              {dashboardData?.propertyMetrics?.activeTenants || 0}
            </Text>
            <Text style={styles.cardSubText}>
              +{dashboardData?.propertyMetrics?.newJoinersThisMonth || 0} joined
              this month
            </Text>
          </TouchableOpacity>
        </View>

        {/* Occupancy Rate Bar */}
        <View style={styles.occupancyCard}>
          <View style={styles.occupancyHeader}>
            <Text style={styles.cardSectionTitle}>Overall Occupancy Rate</Text>
            <Text style={styles.occupancyValue}>
              {dashboardData?.propertyMetrics?.occupancyPercentage || 0}%
              (Filled)
            </Text>
          </View>
          <View style={styles.progressBg}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${dashboardData?.propertyMetrics?.occupancyPercentage || 0}%`,
                },
              ]}
            />
          </View>
        </View>

        {/* Recent Activity List */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Recent Activity Log</Text>
          <TouchableOpacity onPress={() => router.push("/notices" as any)}>
            <Text style={styles.seeAllText}>View All</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.activityContainer}>
          {dashboardData?.recentActivities?.length === 0 ? (
            <Text style={styles.emptyActivityText}>
              No recent activities found.
            </Text>
          ) : (
            dashboardData?.recentActivities?.map((act, index) => (
              <View
                key={act.id}
                style={[
                  styles.activityRow,
                  index ===
                    (dashboardData?.recentActivities?.length || 1) - 1 && {
                    borderBottomWidth: 0,
                  },
                ]}
              >
                <View
                  style={[
                    styles.activityIconBg,
                    { backgroundColor: `${act.color}18` },
                  ]}
                >
                  <Ionicons
                    name={act.icon as any}
                    size={18}
                    color={act.color}
                  />
                </View>
                <View style={styles.activityContent}>
                  <Text style={styles.activityText}>{act.text}</Text>
                  <Text style={styles.activityTime}>{act.time}</Text>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {/* Notifications Bottom Sheet Modal */}
      <Modal
        visible={isNotificationModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsNotificationModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.bottomSheetContainer}>
            <View style={styles.modalHeader}>
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
              >
                <Ionicons name="notifications" size={20} color="#3B82F6" />
                <Text style={styles.modalTitle}>System Notifications</Text>
                <View style={styles.modalCountBadge}>
                  <Text style={styles.modalCountText}>
                    {dashboardData?.alerts?.length || 0}
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={() => setIsNotificationModalVisible(false)}
                style={styles.closeModalBtn}
              >
                <Ionicons name="close" size={20} color="#94A3B8" />
              </TouchableOpacity>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingVertical: 10 }}
            >
              {dashboardData?.alerts?.length === 0 ? (
                <View style={styles.emptyNotificationBox}>
                  <Ionicons
                    name="checkmark-done-circle-outline"
                    size={48}
                    color="#334155"
                  />
                  <Text style={styles.emptyNotifTitle}>
                    You're all caught up!
                  </Text>
                  <Text style={styles.emptyNotifSub}>
                    No pending alerts or active requests.
                  </Text>
                </View>
              ) : (
                dashboardData?.alerts?.map((item) => (
                  <View
                    key={item.id}
                    style={[
                      styles.notificationCardItem,
                      { borderLeftColor: item.color },
                    ]}
                  >
                    <TouchableOpacity
                      style={{ flex: 1 }}
                      activeOpacity={0.8}
                      onPress={() => {
                        setIsNotificationModalVisible(false);
                        router.push(item.route as any);
                      }}
                    >
                      <View
                        style={{
                          flexDirection: "row",
                          justifyContent: "space-between",
                        }}
                      >
                        <Text
                          style={[styles.notifCardTitle, { color: item.color }]}
                        >
                          {item.title}
                        </Text>
                        <Text style={styles.notifCardTime}>{item.time}</Text>
                      </View>
                      <Text style={styles.notifCardSub}>{item.subtitle}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.dismissBtn}
                      onPress={() => handleDismissAlert(item.id)}
                    >
                      <Ionicons
                        name="checkmark-outline"
                        size={16}
                        color="#10B981"
                      />
                    </TouchableOpacity>
                  </View>
                ))
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#0F172A" },
  centerContainer: { justifyContent: "center", alignItems: "center" },
  loadingText: { color: "#94A3B8", marginTop: 10, fontSize: 14 },
  stickyHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: "#0F172A",
    borderBottomWidth: 1,
    borderBottomColor: "#1E293B",
  },
  headerRight: { flexDirection: "row", alignItems: "center", gap: 10 },
  iconButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#1E293B",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#334155",
  },
  notificationBadge: {
    position: "absolute",
    top: 8,
    right: 9,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#EF4444",
  },
  container: { flex: 1, paddingHorizontal: 20, paddingTop: 15 },
  greeting: { color: "#94A3B8", fontSize: 13 },
  username: { color: "#F8FAFC", fontSize: 22, fontWeight: "700" },
  profileCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#2563EB",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#3B82F6",
  },
  profileText: { color: "#FFFFFF", fontWeight: "bold", fontSize: 15 },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1E293B",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#334155",
  },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, color: "#F8FAFC", fontSize: 14, padding: 0 },
  alertBanner: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 14,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
  },
  alertIconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  alertTitle: { fontSize: 13, fontWeight: "700" },
  alertSubtitle: { color: "#94A3B8", fontSize: 11, marginTop: 1 },
  alertCounter: { color: "#64748B", fontSize: 10, fontWeight: "600" },
  nextAlertBtn: {
    paddingLeft: 8,
    paddingVertical: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  revenueCard: {
    backgroundColor: "#1E3A8A",
    padding: 20,
    borderRadius: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#2563EB",
  },
  revenueHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  revenueLabel: { color: "#93C5FD", fontSize: 14, fontWeight: "500" },
  badge: {
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: { color: "#FFFFFF", fontSize: 12, fontWeight: "600" },
  revenueAmount: {
    color: "#FFFFFF",
    fontSize: 32,
    fontWeight: "800",
    marginVertical: 6,
  },
  financialSplitRow: {
    flexDirection: "row",
    backgroundColor: "rgba(15, 23, 42, 0.3)",
    borderRadius: 12,
    padding: 10,
    marginTop: 8,
    alignItems: "center",
  },
  splitBox: { flex: 1, alignItems: "center" },
  splitLabel: { color: "#93C5FD", fontSize: 11, fontWeight: "500" },
  splitValue: { fontSize: 14, fontWeight: "700", marginTop: 2 },
  splitDivider: {
    width: 1,
    height: 24,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
  },
  sectionTitle: {
    color: "#F8FAFC",
    fontSize: 17,
    fontWeight: "700",
    marginBottom: 12,
  },
  actionGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  actionButton: {
    width: "31%",
    alignItems: "center",
    marginBottom: 14,
    backgroundColor: "#1E293B",
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#334155",
  },
  actionIconContainer: {
    width: 42,
    height: 42,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  actionText: {
    color: "#CBD5E1",
    fontSize: 12,
    fontWeight: "500",
    textAlign: "center",
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  card: {
    width: "48%",
    backgroundColor: "#1E293B",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "#334155",
  },
  cardHeader: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
  iconBoxBlue: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: "rgba(59, 130, 246, 0.15)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  iconBoxGreen: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: "rgba(16, 185, 129, 0.15)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  cardTitle: { color: "#94A3B8", fontSize: 12, fontWeight: "500" },
  cardValue: {
    color: "#FFFFFF",
    fontSize: 24,
    fontWeight: "700",
    marginTop: 2,
  },
  cardSubText: { color: "#64748B", fontSize: 10, marginTop: 4 },
  occupancyCard: {
    backgroundColor: "#1E293B",
    padding: 16,
    borderRadius: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "#334155",
  },
  occupancyHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  cardSectionTitle: { color: "#F8FAFC", fontSize: 14, fontWeight: "600" },
  occupancyValue: { color: "#22C55E", fontSize: 13, fontWeight: "700" },
  progressBg: {
    height: 8,
    backgroundColor: "#334155",
    borderRadius: 4,
    overflow: "hidden",
  },
  progressFill: { height: "100%", backgroundColor: "#22C55E", borderRadius: 4 },
  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  seeAllText: { color: "#3B82F6", fontSize: 13, fontWeight: "600" },
  activityContainer: {
    backgroundColor: "#1E293B",
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#334155",
  },
  activityRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#334155",
  },
  activityIconBg: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  activityContent: { flex: 1 },
  activityText: { color: "#F1F5F9", fontSize: 14, fontWeight: "500" },
  activityTime: { color: "#64748B", fontSize: 12, marginTop: 2 },
  emptyActivityText: {
    color: "#64748B",
    textAlign: "center",
    fontSize: 13,
    paddingVertical: 10,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.8)",
    justifyContent: "flex-end",
  },
  bottomSheetContainer: {
    backgroundColor: "#1E293B",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
    maxHeight: "75%",
    borderWidth: 1,
    borderColor: "#334155",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#334155",
    paddingBottom: 12,
    marginBottom: 10,
  },
  modalTitle: { color: "#F8FAFC", fontSize: 16, fontWeight: "700" },
  modalCountBadge: {
    backgroundColor: "rgba(59, 130, 246, 0.2)",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  modalCountText: { color: "#3B82F6", fontSize: 11, fontWeight: "700" },
  closeModalBtn: { padding: 4 },
  emptyNotificationBox: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
  },
  emptyNotifTitle: {
    color: "#F8FAFC",
    fontSize: 15,
    fontWeight: "600",
    marginTop: 12,
  },
  emptyNotifSub: { color: "#64748B", fontSize: 12, marginTop: 4 },
  notificationCardItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#0F172A",
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    borderLeftWidth: 4,
    borderWidth: 1,
    borderColor: "#334155",
  },
  notifCardTitle: { fontSize: 13, fontWeight: "700" },
  notifCardTime: { color: "#64748B", fontSize: 10 },
  notifCardSub: { color: "#94A3B8", fontSize: 12, marginTop: 4 },
  dismissBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(16, 185, 129, 0.15)",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 10,
  },
});
