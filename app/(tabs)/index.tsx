import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";

export default function Dashboard() {
  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}

      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>
            👋 Welcome Back
          </Text>

          <Text style={styles.username}>
            Kunal
          </Text>
        </View>

        <View style={styles.profileCircle}>
          <Text style={styles.profileText}>
            K
          </Text>
        </View>
      </View>

      {/* Stats */}

      <View style={styles.statsContainer}>
        <View style={styles.card}>
          <Ionicons
            name="business"
            size={24}
            color="#3B82F6"
          />
          <Text style={styles.cardTitle}>
            Rooms
          </Text>
          <Text style={styles.cardValue}>
            25
          </Text>
        </View>

        <View style={styles.card}>
          <Ionicons
            name="people"
            size={24}
            color="#10B981"
          />
          <Text style={styles.cardTitle}>
            Tenants
          </Text>
          <Text style={styles.cardValue}>
            78
          </Text>
        </View>

        <View style={styles.card}>
          <Ionicons
            name="bed"
            size={24}
            color="#F59E0B"
          />
          <Text style={styles.cardTitle}>
            Occupied
          </Text>
          <Text style={styles.cardValue}>
            65
          </Text>
        </View>

        <View style={styles.card}>
          <Ionicons
            name="checkmark-circle"
            size={24}
            color="#22C55E"
          />
          <Text style={styles.cardTitle}>
            Vacant
          </Text>
          <Text style={styles.cardValue}>
            15
          </Text>
        </View>
      </View>

      {/* Occupancy */}

      <View style={styles.occupancyCard}>
        <Text style={styles.sectionTitle}>
          Occupancy Rate
        </Text>

        <View style={styles.progressBg}>
          <View
            style={styles.progressFill}
          />
        </View>

        <Text style={styles.occupancyText}>
          81% Occupied
        </Text>
      </View>

      {/* Revenue */}

      <View style={styles.revenueCard}>
        <Text style={styles.revenueLabel}>
          Monthly Revenue
        </Text>

        <Text style={styles.revenueAmount}>
          ₹85,000
        </Text>

        <Text style={styles.pendingText}>
          Pending Rent ₹12,000
        </Text>
      </View>

      {/* Quick Actions */}

      <Text style={styles.sectionTitle}>
        Quick Actions
      </Text>

      <View style={styles.actionContainer}>
        <TouchableOpacity
          style={styles.actionCard}
        >
          <Ionicons
            name="person-add"
            size={28}
            color="#fff"
          />
          <Text style={styles.actionText}>
            Add Tenant
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionCard}
        >
          <Ionicons
            name="home"
            size={28}
            color="#fff"
          />
          <Text style={styles.actionText}>
            Add Room
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionCard}
        >
          <Ionicons
            name="key"
            size={28}
            color="#fff"
          />
          <Text style={styles.actionText}>
            Allocate
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionCard}
        >
          <Ionicons
            name="cash"
            size={28}
            color="#fff"
          />
          <Text style={styles.actionText}>
            Collect Rent
          </Text>
        </TouchableOpacity>
      </View>

      {/* Recent Activity */}

      <Text style={styles.sectionTitle}>
        Recent Activity
      </Text>

      <View style={styles.activityCard}>
        <Text style={styles.activityText}>
          👤 Rahul joined Room 101
        </Text>

        <Text style={styles.activityText}>
          💰 Rent received ₹5000
        </Text>

        <Text style={styles.activityText}>
          🛏 Bed A3 allocated
        </Text>

        <Text style={styles.activityText}>
          ⚠ Complaint submitted
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0F172A",
    padding: 20,
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 40,
    marginBottom: 25,
  },

  greeting: {
    color: "#94A3B8",
    fontSize: 16,
  },

  username: {
    color: "#fff",
    fontSize: 30,
    fontWeight: "bold",
  },

  profileCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#2563EB",
    justifyContent: "center",
    alignItems: "center",
  },

  profileText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 18,
  },

  statsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },

  card: {
    width: "48%",
    backgroundColor: "#1E293B",
    borderRadius: 18,
    padding: 18,
    marginBottom: 15,
  },

  cardTitle: {
    color: "#94A3B8",
    marginTop: 10,
  },

  cardValue: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "bold",
    marginTop: 8,
  },

  occupancyCard: {
    backgroundColor: "#1E293B",
    padding: 20,
    borderRadius: 20,
    marginBottom: 20,
  },

  sectionTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
  },

  progressBg: {
    height: 10,
    backgroundColor: "#334155",
    borderRadius: 10,
  },

  progressFill: {
    width: "81%",
    height: 10,
    backgroundColor: "#22C55E",
    borderRadius: 10,
  },

  occupancyText: {
    color: "#94A3B8",
    marginTop: 10,
  },

  revenueCard: {
    backgroundColor: "#2563EB",
    padding: 25,
    borderRadius: 20,
    marginBottom: 25,
  },

  revenueLabel: {
    color: "#DBEAFE",
    fontSize: 16,
  },

  revenueAmount: {
    color: "#fff",
    fontSize: 34,
    fontWeight: "bold",
    marginTop: 10,
  },

  pendingText: {
    color: "#DBEAFE",
    marginTop: 10,
  },

  actionContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },

  actionCard: {
    width: "48%",
    backgroundColor: "#1E293B",
    borderRadius: 18,
    padding: 20,
    alignItems: "center",
    marginBottom: 15,
  },

  actionText: {
    color: "#fff",
    marginTop: 10,
    fontWeight: "600",
  },

  activityCard: {
    backgroundColor: "#1E293B",
    borderRadius: 18,
    padding: 20,
    marginBottom: 30,
  },

  activityText: {
    color: "#CBD5E1",
    marginBottom: 12,
  },
});