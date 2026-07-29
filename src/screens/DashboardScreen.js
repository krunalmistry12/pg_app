// import {
//   View,
//   Text,
//   StyleSheet,
//   ScrollView,
//   TouchableOpacity,
// } from "react-native";

// export default function DashboardScreen() {
//   const occupancy = 82;

//   return (
//     <ScrollView style={styles.container}>
//       {/* Header */}
//       <View style={styles.header}>
//         <View>
//           <Text style={styles.welcome}>Welcome Back 👋</Text>
//           <Text style={styles.name}>Kunal</Text>
//         </View>

//         <View style={styles.avatar}>
//           <Text style={styles.avatarText}>K</Text>
//         </View>
//       </View>

//       {/* Occupancy */}
//       <View style={styles.occupancyCard}>
//         <Text style={styles.sectionTitle}>Occupancy Rate</Text>

//         <Text style={styles.percent}>{occupancy}%</Text>

//         <View style={styles.progressBackground}>
//           <View
//             style={[
//               styles.progressFill,
//               { width: `${occupancy}%` },
//             ]}
//           />
//         </View>
//       </View>

//       {/* Stats */}
//       <View style={styles.grid}>
//         <Card title="PGs" value="2" />
//         <Card title="Flats" value="8" />
//         <Card title="Rooms" value="45" />
//         <Card title="Beds" value="180" />
//         <Card title="Tenants" value="135" />
//         <Card title="Available" value="32" />
//       </View>

//       {/* Quick Actions */}
//       <Text style={styles.sectionTitle}>Quick Actions</Text>

//       <View style={styles.actions}>
//         <ActionButton title="+ Tenant" />
//         <ActionButton title="+ Room" />
//         <ActionButton title="+ Bed" />
//       </View>

//       {/* Activity */}
//       <Text style={styles.sectionTitle}>Recent Activity</Text>

//       <View style={styles.activityCard}>
//         <Text>✅ New Tenant Added</Text>
//       </View>

//       <View style={styles.activityCard}>
//         <Text>🛏 Bed B-12 Allocated</Text>
//       </View>

//       <View style={styles.activityCard}>
//         <Text>🏠 Room 102 Created</Text>
//       </View>
//     </ScrollView>
//   );
// }

// function Card({ title, value }) {
//   return (
//     <View style={styles.card}>
//       <Text style={styles.cardValue}>{value}</Text>
//       <Text style={styles.cardTitle}>{title}</Text>
//     </View>
//   );
// }

// function ActionButton({ title }) {
//   return (
//     <TouchableOpacity style={styles.actionBtn}>
//       <Text style={styles.actionText}>{title}</Text>
//     </TouchableOpacity>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: "#0F172A",
//     padding: 16,
//   },

//   header: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     alignItems: "center",
//     marginTop: 20,
//     marginBottom: 25,
//   },

//   welcome: {
//     color: "#94A3B8",
//     fontSize: 15,
//   },

//   name: {
//     color: "#fff",
//     fontSize: 28,
//     fontWeight: "bold",
//   },

//   avatar: {
//     width: 50,
//     height: 50,
//     borderRadius: 25,
//     backgroundColor: "#2563EB",
//     justifyContent: "center",
//     alignItems: "center",
//   },

//   avatarText: {
//     color: "#fff",
//     fontWeight: "bold",
//     fontSize: 20,
//   },

//   occupancyCard: {
//     backgroundColor: "#1E293B",
//     borderRadius: 16,
//     padding: 18,
//     marginBottom: 20,
//   },

//   sectionTitle: {
//     color: "#fff",
//     fontSize: 18,
//     fontWeight: "bold",
//     marginBottom: 10,
//   },

//   percent: {
//     color: "#38BDF8",
//     fontSize: 32,
//     fontWeight: "bold",
//     marginBottom: 10,
//   },

//   progressBackground: {
//     height: 10,
//     backgroundColor: "#334155",
//     borderRadius: 20,
//   },

//   progressFill: {
//     height: 10,
//     backgroundColor: "#38BDF8",
//     borderRadius: 20,
//   },

//   grid: {
//     flexDirection: "row",
//     flexWrap: "wrap",
//     justifyContent: "space-between",
//   },

//   card: {
//     width: "48%",
//     backgroundColor: "#1E293B",
//     borderRadius: 15,
//     padding: 18,
//     marginBottom: 15,
//   },

//   cardValue: {
//     color: "#fff",
//     fontSize: 26,
//     fontWeight: "bold",
//   },

//   cardTitle: {
//     color: "#94A3B8",
//     marginTop: 5,
//   },

//   actions: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     marginBottom: 20,
//   },

//   actionBtn: {
//     backgroundColor: "#2563EB",
//     padding: 12,
//     borderRadius: 12,
//     width: "31%",
//   },

//   actionText: {
//     color: "#fff",
//     textAlign: "center",
//     fontWeight: "600",
//   },

//   activityCard: {
//     backgroundColor: "#1E293B",
//     padding: 15,
//     borderRadius: 12,
//     marginBottom: 10,
//   },
// });

import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
} from "react-native";

export default function DashboardScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Good Morning 👋</Text>
            <Text style={styles.name}>Kunal Mistry</Text>
            <Text style={styles.role}>Owner - Kunal PG</Text>
          </View>

          <View style={styles.avatar}>
            <Text style={styles.avatarText}>K</Text>
          </View>
        </View>

        {/* Revenue Card */}
        <View style={styles.revenueCard}>
          <Text style={styles.revenueLabel}>💰 Revenue This Month</Text>
          <Text style={styles.revenueAmount}>₹1,25,000</Text>
          <Text style={styles.revenueGrowth}>+12% from last month</Text>
        </View>

        {/* Stats */}
        <View style={styles.statsGrid}>
          <StatCard value="180" label="Total Beds" />
          <StatCard value="135" label="Tenants" />
          <StatCard value="32" label="Vacant Beds" />
          <StatCard value="₹18.5K" label="Pending Rent" />
        </View>

        {/* Occupancy */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Occupancy Rate</Text>

          <View style={styles.occupancyRow}>
            <Text style={styles.occupancyPercent}>82%</Text>
            <Text style={styles.occupancyText}>148 / 180 Occupied</Text>
          </View>

          <View style={styles.progressBackground}>
            <View style={styles.progressFill} />
          </View>
        </View>

        {/* Quick Actions */}
        <Text style={styles.heading}>Quick Actions</Text>

        <View style={styles.actionGrid}>
          <ActionButton title="+ Tenant" />
          <ActionButton title="+ Room" />
          <ActionButton title="💰 Rent" />
          <ActionButton title="🔧 Issues" />
        </View>

        {/* Recent Activity */}
        <Text style={styles.heading}>Recent Activity</Text>

        <ActivityItem
          title="Rahul moved into Room 101"
          time="10 mins ago"
        />

        <ActivityItem
          title="Rent received ₹8,500"
          time="1 hour ago"
        />

        <ActivityItem
          title="Complaint submitted"
          time="2 hours ago"
        />

        <ActivityItem
          title="New Bed allocated"
          time="Today"
        />
      </ScrollView>

      
    </SafeAreaView>
  );
}

function StatCard({ value, label }) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function ActionButton({ title }) {
  return (
    <TouchableOpacity style={styles.actionButton}>
      <Text style={styles.actionText}>{title}</Text>
    </TouchableOpacity>
  );
}

function ActivityItem({ title, time }) {
  return (
    <View style={styles.activityCard}>
      <Text style={styles.activityTitle}>{title}</Text>
      <Text style={styles.activityTime}>{time}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0F172A",
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 20,
    paddingTop: 30,
  },

  greeting: {
    color: "#94A3B8",
    fontSize: 15,
  },

  name: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "bold",
  },

  role: {
    color: "#94A3B8",
    marginTop: 4,
  },

  avatar: {
    width: 55,
    height: 55,
    borderRadius: 28,
    backgroundColor: "#2563EB",
    justifyContent: "center",
    alignItems: "center",
  },

  avatarText: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "bold",
  },

  revenueCard: {
    backgroundColor: "#2563EB",
    marginHorizontal: 20,
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
  },

  revenueLabel: {
    color: "#DBEAFE",
    fontSize: 14,
  },

  revenueAmount: {
    color: "#fff",
    fontSize: 34,
    fontWeight: "bold",
    marginVertical: 8,
  },

  revenueGrowth: {
    color: "#DBEAFE",
  },

  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    paddingHorizontal: 20,
  },

  statCard: {
    width: "48%",
    backgroundColor: "#1E293B",
    borderRadius: 18,
    padding: 18,
    marginBottom: 15,
  },

  statValue: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "bold",
  },

  statLabel: {
    color: "#94A3B8",
    marginTop: 5,
  },

  sectionCard: {
    backgroundColor: "#1E293B",
    marginHorizontal: 20,
    borderRadius: 18,
    padding: 20,
    marginTop: 10,
  },

  sectionTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },

  occupancyRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 15,
  },

  occupancyPercent: {
    color: "#22C55E",
    fontSize: 28,
    fontWeight: "bold",
  },

  occupancyText: {
    color: "#94A3B8",
    alignSelf: "center",
  },

  progressBackground: {
    height: 10,
    backgroundColor: "#334155",
    borderRadius: 20,
  },

  progressFill: {
    width: "82%",
    height: 10,
    backgroundColor: "#22C55E",
    borderRadius: 20,
  },

  heading: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
    marginTop: 25,
    marginHorizontal: 20,
    marginBottom: 10,
  },

  actionGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    paddingHorizontal: 20,
  },

  actionButton: {
    width: "48%",
    backgroundColor: "#2563EB",
    padding: 15,
    borderRadius: 15,
    marginBottom: 12,
  },

  actionText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "600",
  },

  activityCard: {
    backgroundColor: "#1E293B",
    marginHorizontal: 20,
    borderRadius: 15,
    padding: 15,
    marginBottom: 10,
  },

  activityTitle: {
    color: "#fff",
    fontSize: 15,
  },

  activityTime: {
    color: "#94A3B8",
    marginTop: 4,
    fontSize: 12,
  },

  bottomNav: {
    height: 70,
    backgroundColor: "#1E293B",
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
  },

  navItem: {
    fontSize: 24,
  },
});