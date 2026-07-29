import React from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
} from "react-native";

const rents = [
  {
    id: "1",
    tenant: "Rahul Sharma",
    amount: 6500,
    status: "Paid",
    room: "101",
  },
  {
    id: "2",
    tenant: "Amit Patel",
    amount: 7000,
    status: "Due",
    room: "205",
  },
  {
    id: "3",
    tenant: "Priya Shah",
    amount: 6000,
    status: "Paid",
    room: "301",
  },
];

export default function Rent() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>💰 Rent Management</Text>

      <View style={styles.summaryCard}>
        <Text style={styles.summaryLabel}>
          Total Collection
        </Text>

        <Text style={styles.summaryAmount}>
          ₹1,25,000
        </Text>

        <Text style={styles.pending}>
          Pending Rent: ₹18,500
        </Text>
      </View>

      <FlatList
        data={rents}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View>
              <Text style={styles.name}>
                {item.tenant}
              </Text>

              <Text style={styles.room}>
                Room {item.room}
              </Text>
            </View>

            <View style={{ alignItems: "flex-end" }}>
              <Text style={styles.amount}>
                ₹{item.amount}
              </Text>

              <Text
                style={{
                  color:
                    item.status === "Paid"
                      ? "#22C55E"
                      : "#F59E0B",
                  fontWeight: "bold",
                }}
              >
                {item.status}
              </Text>
            </View>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0F172A",
    padding: 20,
  },

  title: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 20,
  },

  summaryCard: {
    backgroundColor: "#2563EB",
    padding: 20,
    borderRadius: 20,
    marginBottom: 20,
  },

  summaryLabel: {
    color: "#DBEAFE",
  },

  summaryAmount: {
    color: "#fff",
    fontSize: 34,
    fontWeight: "bold",
    marginVertical: 10,
  },

  pending: {
    color: "#fff",
  },

  card: {
    backgroundColor: "#1E293B",
    borderRadius: 15,
    padding: 15,
    marginBottom: 12,
    flexDirection: "row",
    justifyContent: "space-between",
  },

  name: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "bold",
  },

  room: {
    color: "#94A3B8",
    marginTop: 5,
  },

  amount: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 18,
  },
});