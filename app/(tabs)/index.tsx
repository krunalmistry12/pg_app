import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";
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

interface QuickAction {
  id: string;
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  route: string;
}

interface RecentActivity {
  id: string;
  text: string;
  time: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
}

export default function Dashboard() {
  const router = useRouter();

  const quickActions: QuickAction[] = [
    {
      id: "1",
      title: "Add Tenant",
      icon: "person-add-outline",
      color: "#3B82F6",
      route: "/add-tenant",
    },
    {
      id: "2",
      title: "Add Room",
      icon: "business-outline",
      color: "#8B5CF6",
      route: "/add-2bhk-flat",
    },
    {
      id: "3",
      title: "Collect Rent",
      icon: "wallet-outline",
      color: "#10B981",
      route: "/rent",
    },
    {
      id: "4",
      title: "Complaints",
      icon: "alert-circle-outline",
      color: "#EF4444",
      route: "/complaints", // Naya feature
    },
    {
      id: "5",
      title: "Notice Board",
      icon: "megaphone-outline",
      color: "#F59E0B",
      route: "/notices", // Naya feature
    },
    {
      id: "6",
      title: "Utility Bills",
      icon: "flash-outline",
      color: "#06B6D4",
      route: "/utilities", // Naya feature
    },
  ];

  const recentActivities: RecentActivity[] = [
    {
      id: "1",
      text: "Rahul paid August rent ₹6,500",
      time: "5 mins ago",
      icon: "checkmark-circle-outline",
      color: "#10B981",
    },
    {
      id: "2",
      text: "New maintenance request: Room 202",
      time: "1 hour ago",
      icon: "construct-outline",
      color: "#EF4444",
    },
    {
      id: "3",
      text: "Aman Patel allocated to Room 101-B",
      time: "3 hours ago",
      icon: "key-outline",
      color: "#3B82F6",
    },
    {
      id: "4",
      text: "Broadcast sent: Water supply shutdown",
      time: "Yesterday",
      icon: "megaphone-outline",
      color: "#F59E0B",
    },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#0F172A" />

      {/* Sticky Header */}
      <View style={styles.stickyHeader}>
        <View>
          <Text style={styles.greeting}>👋 Welcome Back,</Text>
          <Text style={styles.username}>Kunal Mistry</Text>
        </View>
        <TouchableOpacity
          activeOpacity={0.8}
          style={styles.profileCircle}
          onPress={() => router.push("/profile" as any)}
        >
          <Text style={styles.profileText}>K</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {/* Revenue Card Banner */}
        <View style={styles.revenueCard}>
          <View style={styles.revenueHeader}>
            <Text style={styles.revenueLabel}>August Revenue Overview</Text>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>Live</Text>
            </View>
          </View>

          <Text style={styles.revenueAmount}>₹92,500</Text>

          <View style={styles.revenueFooter}>
            <Ionicons name="alert-circle-outline" size={16} color="#FCA5A5" />
            <Text style={styles.pendingText}>
              Pending Collection: <Text style={styles.boldText}>₹14,000</Text>
            </Text>
          </View>
        </View>

        {/* Quick Actions Grid (Expanded) */}
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
            <Text style={styles.cardValue}>24</Text>
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
            <Text style={styles.cardValue}>68</Text>
          </TouchableOpacity>
        </View>

        {/* Occupancy Rate Bar */}
        <View style={styles.occupancyCard}>
          <View style={styles.occupancyHeader}>
            <Text style={styles.cardSectionTitle}>Overall Occupancy</Text>
            <Text style={styles.occupancyValue}>85% (Filled)</Text>
          </View>
          <View style={styles.progressBg}>
            <View style={styles.progressFill} />
          </View>
        </View>

        {/* Recent Activity List */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Recent Activity Log</Text>
          <TouchableOpacity>
            <Text style={styles.seeAllText}>View All</Text>
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
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 15,
  },
  greeting: {
    color: "#94A3B8",
    fontSize: 13,
  },
  username: {
    color: "#F8FAFC",
    fontSize: 22,
    fontWeight: "700",
  },
  profileCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#2563EB",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#3B82F6",
  },
  profileText: {
    color: "#FFFFFF",
    fontWeight: "bold",
    fontSize: 15,
  },
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
    color: "#FCA5A5",
    fontSize: 13,
    marginLeft: 6,
  },
  boldText: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  sectionTitle: {
    color: "#F8FAFC",
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 12,
  },
  actionGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  actionButton: {
    width: "31%",
    alignItems: "center",
    marginBottom: 16,
    backgroundColor: "#1E293B",
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#334155",
  },
  actionIconContainer: {
    width: 44,
    height: 44,
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
    marginBottom: 20,
  },
  card: {
    width: "48%",
    backgroundColor: "#1E293B",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#334155",
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  iconBoxBlue: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "rgba(59, 130, 246, 0.15)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  iconBoxGreen: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "rgba(16, 185, 129, 0.15)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  cardTitle: {
    color: "#94A3B8",
    fontSize: 13,
    fontWeight: "500",
  },
  cardValue: {
    color: "#FFFFFF",
    fontSize: 26,
    fontWeight: "700",
    marginTop: 4,
  },
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
    fontSize: 14,
    fontWeight: "700",
  },
  progressBg: {
    height: 8,
    backgroundColor: "#334155",
    borderRadius: 4,
    overflow: "hidden",
  },
  progressFill: {
    width: "85%",
    height: "100%",
    backgroundColor: "#22C55E",
    borderRadius: 4,
  },
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