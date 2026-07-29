import React from "react";
import { router } from "expo-router";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
} from "react-native";

import AsyncStorage from "@react-native-async-storage/async-storage";

import { useFocusEffect } from "@react-navigation/native";
import {
  useState,
  useCallback,
} from "react";


const defaultTenants = [
  {
    id: "1",
    name: "Rahul Sharma",
    phone: "9876543210",
    room: "101",
    bed: "A1",
    status: "Active",
  },
];

export default function TenantsScreen() {
 
const [tenants, setTenants] =
  useState(defaultTenants);

const loadTenants = async () => {
  const data =
    await AsyncStorage.getItem(
      "tenants"
    );

  if (data) {
    setTenants([
      ...defaultTenants,
      ...JSON.parse(data),
    ]);
  }
};

useFocusEffect(
  useCallback(() => {
    loadTenants();
  }, [])
);
  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        👥 Tenants
      </Text>

      <TextInput
        placeholder="Search Tenant..."
        placeholderTextColor="#94A3B8"
        style={styles.search}
      />

      <Text style={styles.totalText}>
        Total Tenants: {tenants.length}
      </Text>

      <FlatList
        data={tenants}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card}>
            <View style={styles.topRow}>
              <Text style={styles.name}>
                {item.name}
              </Text>

              <View
                style={[
                  styles.badge,
                  {
                    backgroundColor:
                      item.status === "Active"
                        ? "#14532D"
                        : "#7F1D1D",
                  },
                ]}
              >
                <Text
                  style={styles.badgeText}
                >
                  {item.status}
                </Text>
              </View>
            </View>

            <Text style={styles.info}>
              📞 {item.phone}
            </Text>

            <Text style={styles.info}>
              🏠 Room {item.room}
            </Text>

            <Text style={styles.info}>
              🛏 Bed {item.bed}
            </Text>

            <TouchableOpacity
              style={styles.button}
              onPress={() =>
                router.push({
                  pathname:
                    "/tenant-details",
                  params: item,
                })
              }
            >
              <Text
                style={styles.buttonText}
              >
                View Details
              </Text>
            </TouchableOpacity>
          </TouchableOpacity>
        )}
      />

      <TouchableOpacity
        style={styles.fab}
        onPress={() =>
          router.push("/add-tenant")
        }
      >
        <Text style={styles.fabText}>
          +
        </Text>
      </TouchableOpacity>
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
    marginTop: 25,
    marginBottom: 15,
  },

  search: {
    backgroundColor: "#1E293B",
    borderRadius: 15,
    paddingHorizontal: 15,
    height: 55,
    color: "#fff",
  },

  totalText: {
    color: "#94A3B8",
    marginTop: 15,
    marginBottom: 15,
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
    alignItems: "center",
  },

  name: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
  },

  badge: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
  },

  badgeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },

  info: {
    color: "#CBD5E1",
    marginTop: 8,
  },

  button: {
    backgroundColor: "#2563EB",
    padding: 12,
    borderRadius: 12,
    marginTop: 15,
  },

  buttonText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "600",
  },

  fab: {
    position: "absolute",
    right: 20,
    bottom: 25,
    width: 65,
    height: 65,
    borderRadius: 35,
    backgroundColor: "#2563EB",
    justifyContent: "center",
    alignItems: "center",
  },

  fabText: {
    color: "#fff",
    fontSize: 32,
    fontWeight: "bold",
  },
});