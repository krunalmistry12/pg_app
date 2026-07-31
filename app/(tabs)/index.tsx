import Ionicons from "@expo/vector-icons/Ionicons";
import React from "react";
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

// Types for icon string safety
interface QuickAction {
  id: string;
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
}

interface RecentActivity {
  id: string;
  text: string;
  time: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
}

export default function Dashboard() {
  const quickActions: QuickAction[] = [
    {
      id: "1",
      title: "Add Tenant",
      icon: "person-add-outline",
      color: "#3B82F6",
    },
    { id: "2", title: "Add Room", icon: "business-outline", color: "#8B5CF6" },
    { id: "3", title: "Allocate", icon: "key-outline", color: "#F59E0B" },
    {
      id: "4",
      title: "Collect Rent",
      icon: "wallet-outline",
      color: "#10B981",
    },
  ];

  const recentActivities: RecentActivity[] = [
    {
      id: "1",
      text: "Rahul joined Room 101",
      time: "10 mins ago",
      icon: "person-add-outline",
      color: "#3B82F6",
    },
    {
      id: "2",
      text: "Rent received ₹5,000",
      time: "2 hours ago",
      icon: "cash-outline",
      color: "#10B981",
    },
    {
      id: "3",
      text: "Bed A3 allocated",
      time: "Yesterday",
      icon: "bed-outline",
      color: "#F59E0B",
    },
    {
      id: "4",
      text: "Complaint submitted (#102)",
      time: "Yesterday",
      icon: "alert-circle-outline",
      color: "#EF4444",
    },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#0F172A" />
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>👋 Welcome Back,</Text>
            <Text style={styles.username}>Kunal</Text>
          </View>
          <TouchableOpacity activeOpacity={0.8} style={styles.profileCircle}>
            <Text style={styles.profileText}>K</Text>
          </TouchableOpacity>
        </View>

        {/* Revenue Card Header Banner */}
        <View style={styles.revenueCard}>
          <View style={styles.revenueHeader}>
            <Text style={styles.revenueLabel}>Monthly Revenue</Text>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>Jul 2026</Text>
            </View>
          </View>

          <Text style={styles.revenueAmount}>₹85,000</Text>

          <View style={styles.revenueFooter}>
            <Ionicons name="time-outline" size={16} color="#93C5FD" />
            <Text style={styles.pendingText}>
              Pending Rent: <Text style={styles.boldText}>₹12,000</Text>
            </Text>
          </View>
        </View>

        {/* Quick Actions Bar */}
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionGrid}>
          {quickActions.map((action) => (
            <TouchableOpacity
              key={action.id}
              style={styles.actionButton}
              activeOpacity={0.7}
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
        <Text style={styles.sectionTitle}>Property Overview</Text>
        <View style={styles.statsContainer}>
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="business-outline" size={20} color="#3B82F6" />
              <Text style={styles.cardTitle}>Total Rooms</Text>
            </View>
            <Text style={styles.cardValue}>25</Text>
          </View>

          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="people-outline" size={20} color="#10B981" />
              <Text style={styles.cardTitle}>Tenants</Text>
            </View>
            <Text style={styles.cardValue}>78</Text>
          </View>

          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="bed-outline" size={20} color="#F59E0B" />
              <Text style={styles.cardTitle}>Occupied Beds</Text>
            </View>
            <Text style={styles.cardValue}>65</Text>
          </View>

          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons
                name="checkmark-circle-outline"
                size={20}
                color="#22C55E"
              />
              <Text style={styles.cardTitle}>Vacant Beds</Text>
            </View>
            <Text style={styles.cardValue}>15</Text>
          </View>
        </View>

        {/* Occupancy Card */}
        <View style={styles.occupancyCard}>
          <View style={styles.occupancyHeader}>
            <Text style={styles.cardSectionTitle}>Occupancy Rate</Text>
            <Text style={styles.occupancyValue}>81%</Text>
          </View>
          <View style={styles.progressBg}>
            <View style={styles.progressFill} />
          </View>
        </View>

        {/* Recent Activity List */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          <TouchableOpacity>
            <Text style={styles.seeAllText}>See All</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.activityContainer}>
          {recentActivities.map((act, index) => (
            <View
              key={act.id}
              style={[
                styles.activityRow,
                index === recentActivities.length - 1 && {
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
                <Ionicons name={act.icon} size={18} color={act.color} />
              </View>
              <View style={styles.activityContent}>
                <Text style={styles.activityText}>{act.text}</Text>
                <Text style={styles.activityTime}>{act.time}</Text>
              </View>
            </View>
          ))}
        </View>
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
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 15,
    marginBottom: 20,
  },
  greeting: {
    color: "#94A3B8",
    fontSize: 14,
  },
  username: {
    color: "#F8FAFC",
    fontSize: 26,
    fontWeight: "700",
  },
  profileCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#2563EB",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#3B82F6",
  },
  profileText: {
    color: "#FFFFFF",
    fontWeight: "bold",
    fontSize: 16,
  },

  // Revenue Card
  revenueCard: {
    backgroundColor: "#1E3A8A",
    padding: 20,
    borderRadius: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "#2563EB",
  },
  revenueHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  revenueLabel: {
    color: "#93C5FD",
    fontSize: 14,
    fontWeight: "500",
  },
  badge: {
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
  },
  revenueAmount: {
    color: "#FFFFFF",
    fontSize: 32,
    fontWeight: "800",
    marginVertical: 8,
  },
  revenueFooter: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  pendingText: {
    color: "#93C5FD",
    fontSize: 13,
    marginLeft: 6,
  },
  boldText: {
    color: "#FFFFFF",
    fontWeight: "700",
  },

  // Quick Actions
  sectionTitle: {
    color: "#F8FAFC",
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 12,
  },
  actionGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  actionButton: {
    width: "23%",
    alignItems: "center",
  },
  actionIconContainer: {
    width: 52,
    height: 52,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 6,
    backgroundColor: "#1E293B",
  },
  actionText: {
    color: "#CBD5E1",
    fontSize: 12,
    fontWeight: "500",
    textAlign: "center",
  },

  // Stats Grid
  statsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  card: {
    width: "48%",
    backgroundColor: "#1E293B",
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#334155",
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  cardTitle: {
    color: "#94A3B8",
    fontSize: 13,
    marginLeft: 8,
    fontWeight: "500",
  },
  cardValue: {
    color: "#FFFFFF",
    fontSize: 24,
    fontWeight: "700",
  },

  // Occupancy Card
  occupancyCard: {
    backgroundColor: "#1E293B",
    padding: 18,
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
  cardSectionTitle: {
    color: "#F8FAFC",
    fontSize: 15,
    fontWeight: "600",
  },
  occupancyValue: {
    color: "#22C55E",
    fontSize: 15,
    fontWeight: "700",
  },
  progressBg: {
    height: 8,
    backgroundColor: "#334155",
    borderRadius: 4,
    overflow: "hidden",
  },
  progressFill: {
    width: "81%",
    height: "100%",
    backgroundColor: "#22C55E",
    borderRadius: 4,
  },

  // Activity List
  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  seeAllText: {
    color: "#3B82F6",
    fontSize: 13,
    fontWeight: "600",
  },
  activityContainer: {
    backgroundColor: "#1E293B",
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginBottom: 30,
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
  activityContent: {
    flex: 1,
  },
  activityText: {
    color: "#F1F5F9",
    fontSize: 14,
    fontWeight: "500",
  },
  activityTime: {
    color: "#64748B",
    fontSize: 12,
    marginTop: 2,
  },
});
