import React, {
  useState,
  useCallback,
} from "react";

import { router } from "expo-router";

import AsyncStorage from "@react-native-async-storage/async-storage";

import { useFocusEffect } from "@react-navigation/native";

import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
} from "react-native";



export default function Rooms() {
    const defaultRooms = [
    {
      id: "1",
      roomNo: "101",
      type: "AC Room",
      capacity: 4,
      occupied: 3,
      available: 1,
      rent: 6500,
    },
  ];

  const [rooms, setRooms] =
    useState(defaultRooms);

  const loadRooms = async () => {
    const data =
      await AsyncStorage.getItem("rooms");

    if (data) {
      setRooms(JSON.parse(data));
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadRooms();
    }, [])
  );
  return (
    <View style={styles.container}>
      <Text style={styles.title}>🛏 Rooms</Text>

      <FlatList
        data={rooms}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card}>
            <View style={styles.topRow}>
              <Text style={styles.roomNo}>
                Room {item.roomNo}
              </Text>

              <View
                style={[
                  styles.statusBadge,
                  {
                    backgroundColor:
                      item.available > 0
                        ? "#14532D"
                        : "#7F1D1D",
                  },
                ]}
              >
                <Text style={styles.statusText}>
                  {item.available > 0
                    ? `${item.available} Available`
                    : "Full"}
                </Text>
              </View>
            </View>

            <Text style={styles.roomType}>
              {item.type}
            </Text>

            <View style={styles.statsRow}>
              <View>
                <Text style={styles.label}>
                  Capacity
                </Text>

                <Text style={styles.value}>
                  {item.capacity}
                </Text>
              </View>

              <View>
                <Text style={styles.label}>
                  Occupied
                </Text>

                <Text style={styles.value}>
                  {item.occupied}
                </Text>
              </View>

              <View>
                <Text style={styles.label}>
                  Rent
                </Text>

                <Text style={styles.value}>
                  ₹{item.rent}
                </Text>
              </View>
            </View>

            <TouchableOpacity style={styles.button}>
              <Text style={styles.buttonText}>
                View Beds
              </Text>
            </TouchableOpacity>
          </TouchableOpacity>
        )}
      />

      <TouchableOpacity style={styles.fab} onPress={() => router.push("/add-room")}>
        <Text style={styles.fabText}>+</Text>
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
    fontSize: 28,marginTop:25,
    fontWeight: "bold",
    marginBottom: 20,
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

  roomNo: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "bold",
  },

  roomType: {
    color: "#94A3B8",
    marginTop: 6,
    marginBottom: 15,
  },

  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
  },

  statusText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },

  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 15,
  },

  label: {
    color: "#94A3B8",
    fontSize: 12,
  },

  value: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 5,
  },

  button: {
    backgroundColor: "#2563EB",
    padding: 12,
    borderRadius: 12,
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