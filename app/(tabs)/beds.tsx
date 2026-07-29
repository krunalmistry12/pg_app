import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";

const beds = [
  {
    id: 1,
    bedNo: "A1",
    status: "Occupied",
    tenant: "Rahul Sharma",
  },
  {
    id: 2,
    bedNo: "A2",
    status: "Occupied",
    tenant: "Aman Patel",
  },
  {
    id: 3,
    bedNo: "A3",
    status: "Occupied",
    tenant: "Kunal Shah",
  },
  {
    id: 4,
    bedNo: "A4",
    status: "Available",
    tenant: null,
  },
];

export default function BedsScreen() {
  const renderBed = ({ item }: any) => (
    <View style={styles.card}>
      <View style={styles.topRow}>
        <View>
          <Text style={styles.bedNo}>
            Bed {item.bedNo}
          </Text>

          <Text
            style={{
              color:
                item.status === "Occupied"
                  ? "#F59E0B"
                  : "#22C55E",
              marginTop: 5,
            }}
          >
            {item.status}
          </Text>
        </View>

        <Ionicons
          name="bed"
          size={28}
          color="#3B82F6"
        />
      </View>

      {item.tenant && (
        <View style={styles.tenantBox}>
          <Ionicons
            name="person"
            size={18}
            color="#fff"
          />

          <Text style={styles.tenantName}>
            {item.tenant}
          </Text>
        </View>
      )}

      <TouchableOpacity
        style={[
          styles.button,
          {
            backgroundColor:
              item.status === "Occupied"
                ? "#334155"
                : "#2563EB",
          },
        ]}
      >
        <Text style={styles.buttonText}>
          {item.status === "Occupied"
            ? "View Details"
            : "Allocate Tenant"}
        </Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}

      <View style={styles.header}>
        <Text style={styles.title}>
          Room 101
        </Text>

        <Text style={styles.subtitle}>
          4 Beds • 75% Occupied
        </Text>
      </View>

      {/* Summary */}

      <View style={styles.summary}>
        <View>
          <Text style={styles.summaryValue}>
            4
          </Text>

          <Text style={styles.summaryLabel}>
            Total Beds
          </Text>
        </View>

        <View>
          <Text style={styles.summaryValue}>
            3
          </Text>

          <Text style={styles.summaryLabel}>
            Occupied
          </Text>
        </View>

        <View>
          <Text
            style={[
              styles.summaryValue,
              { color: "#22C55E" },
            ]}
          >
            1
          </Text>

          <Text style={styles.summaryLabel}>
            Available
          </Text>
        </View>
      </View>

      <FlatList
        data={beds}
        keyExtractor={(item) =>
          item.id.toString()
        }
        renderItem={renderBed}
        showsVerticalScrollIndicator={
          false
        }
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

  header: {
    marginTop: 40,
    marginBottom: 20,
  },

  title: {
    color: "#fff",
    fontSize: 30,
    fontWeight: "bold",
  },

  subtitle: {
    color: "#94A3B8",
    marginTop: 5,
  },

  summary: {
    backgroundColor: "#1E293B",
    borderRadius: 20,
    padding: 20,
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 20,
  },

  summaryValue: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
  },

  summaryLabel: {
    color: "#94A3B8",
    marginTop: 5,
    textAlign: "center",
  },

  card: {
    backgroundColor: "#1E293B",
    borderRadius: 20,
    padding: 18,
    marginBottom: 15,
  },

  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },

  bedNo: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "bold",
  },

  tenantBox: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 15,
  },

  tenantName: {
    color: "#fff",
    marginLeft: 8,
  },

  button: {
    marginTop: 18,
    padding: 12,
    borderRadius: 12,
    alignItems: "center",
  },

  buttonText: {
    color: "#fff",
    fontWeight: "600",
  },
});