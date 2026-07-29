import { useState } from "react";import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from "react-native";
import { router } from "expo-router";

export default function AddRoomScreen() {
  const [roomNumber, setRoomNumber] =
    useState("");

  const [totalBeds, setTotalBeds] =
    useState("");

  const [roomType, setRoomType] =
    useState("AC");
const handleCreateRoom = async () => {

  if (!roomNumber.trim()) {
    Alert.alert(
      "Validation",
      "Please enter room number"
    );
    return;
  }

  if (!totalBeds.trim()) {
    Alert.alert(
      "Validation",
      "Please enter total beds"
    );
    return;
  }

  const newRoom = {
    id: Date.now().toString(),
    roomNo: roomNumber,
    type:
      roomType === "AC"
        ? "AC Room"
        : "Non AC Room",
    capacity: Number(totalBeds),
    occupied: 0,
    available: Number(totalBeds),
    rent:
      roomType === "AC"
        ? 6500
        : 5500,
  };

  const existingRooms =
    await AsyncStorage.getItem(
      "rooms"
    );

  const rooms = existingRooms
    ? JSON.parse(existingRooms)
    : [];

  rooms.push(newRoom);

  await AsyncStorage.setItem(
    "rooms",
    JSON.stringify(rooms)
  );

  Alert.alert(
    "Success",
    "Room Created Successfully"
  );

  router.back();
};

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>
        Add New Room
      </Text>

      <Text style={styles.label}>
        Room Number
      </Text>

      <TextInput
        value={roomNumber}
        onChangeText={setRoomNumber}
        placeholder="101"
        placeholderTextColor="#94A3B8"
        style={styles.input}
      />

      <Text style={styles.label}>
        Total Beds
      </Text>

      <TextInput
        value={totalBeds}
        onChangeText={setTotalBeds}
        placeholder="4"
        keyboardType="numeric"
        placeholderTextColor="#94A3B8"
        style={styles.input}
      />

      <Text style={styles.label}>
        Room Type
      </Text>

      <View style={styles.typeContainer}>
        <TouchableOpacity
          style={[
            styles.typeButton,
            roomType === "AC" &&
              styles.activeType,
          ]}
          onPress={() =>
            setRoomType("AC")
          }
        >
          <Text
            style={styles.typeText}
          >
            AC
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.typeButton,
            roomType === "Non AC" &&
              styles.activeType,
          ]}
          onPress={() =>
            setRoomType("Non AC")
          }
        >
          <Text
            style={styles.typeText}
          >
            Non AC
          </Text>
        </TouchableOpacity>
      </View>

      {/* Preview Card */}

      <View style={styles.previewCard}>
        <Text
          style={styles.previewTitle}
        >
          Room Preview
        </Text>

        <Text
          style={styles.previewText}
        >
          Room No: {roomNumber || "-"}
        </Text>

        <Text
          style={styles.previewText}
        >
          Beds: {totalBeds || "-"}
        </Text>

        <Text
          style={styles.previewText}
        >
          Type: {roomType}
        </Text>
      </View>

      <TouchableOpacity
        style={styles.button}
        onPress={handleCreateRoom}
      >
        <Text style={styles.buttonText}>
          Create Room
        </Text>
      </TouchableOpacity>
    </ScrollView>
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
    marginTop: 50,
    marginBottom: 25,
  },

  label: {
    color: "#CBD5E1",
    marginBottom: 8,
    marginTop: 15,
  },

  input: {
    backgroundColor: "#1E293B",
    color: "#fff",
    borderRadius: 14,
    paddingHorizontal: 15,
    height: 55,
  },

  typeContainer: {
    flexDirection: "row",
    marginTop: 10,
  },

  typeButton: {
    flex: 1,
    backgroundColor: "#1E293B",
    padding: 15,
    borderRadius: 14,
    alignItems: "center",
    marginRight: 10,
  },

  activeType: {
    backgroundColor: "#2563EB",
  },

  typeText: {
    color: "#fff",
    fontWeight: "600",
  },

  previewCard: {
    backgroundColor: "#1E293B",
    padding: 20,
    borderRadius: 20,
    marginTop: 25,
  },

  previewTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
  },

  previewText: {
    color: "#CBD5E1",
    marginBottom: 8,
  },

  button: {
    backgroundColor: "#2563EB",
    height: 58,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 30,
    marginBottom: 40,
  },

  buttonText: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "bold",
  },
});