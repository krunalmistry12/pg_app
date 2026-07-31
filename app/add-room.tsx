import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function AddFlatRoomScreen() {
  const [flatNumber, setFlatNumber] = useState("101");
  const [apartmentName, setApartmentName] = useState("Roma Apartment");
  const [selectedZone, setSelectedZone] = useState<
    "Hall" | "Room 1" | "Room 2"
  >("Hall");
  const [totalBeds, setTotalBeds] = useState("2");
  const [customRent, setCustomRent] = useState("5000");
  const [roomType, setRoomType] = useState<"AC" | "Non AC">("Non AC");

  // Auto-fill defaults based on selected zone
  const handleZoneSelect = (zone: "Hall" | "Room 1" | "Room 2") => {
    setSelectedZone(zone);
    if (zone === "Hall") {
      setTotalBeds("2");
      setRoomType("Non AC");
      setCustomRent("4500");
    } else if (zone === "Room 1") {
      setTotalBeds("3");
      setRoomType("Non AC");
      setCustomRent("5500");
    } else if (zone === "Room 2") {
      setTotalBeds("3");
      setRoomType("AC");
      setCustomRent("6500");
    }
  };

  const handleCreateRoomZone = async () => {
    if (!flatNumber.trim()) {
      Alert.alert("Validation Error", "Please enter flat number.");
      return;
    }

    const bedCount = Number(totalBeds);
    if (isNaN(bedCount) || bedCount <= 0) {
      Alert.alert("Validation Error", "Please enter a valid bed count.");
      return;
    }

    const fullRoomCode = `${flatNumber.trim()}-${selectedZone.replace(" ", "")}`; // e.g. 101-Hall, 101-Room1

    // Generate Sub-Beds
    const generatedBeds = Array.from({ length: bedCount }, (_, i) => ({
      id: `bed-${Date.now()}-${i + 1}`,
      bedNumber: `Bed ${i + 1}`,
      isOccupied: false,
    }));

    const newRoomZone = {
      id: Date.now().toString(),
      roomNo: fullRoomCode,
      floor: apartmentName.trim() || "Roma Apartment",
      type: roomType === "AC" ? "AC Room" : "Non AC Room",
      capacity: bedCount,
      rent: Number(customRent) || 5000,
      beds: generatedBeds,
    };

    try {
      const existingRooms = await AsyncStorage.getItem("rooms");
      const rooms = existingRooms ? JSON.parse(existingRooms) : [];
      rooms.push(newRoomZone);

      await AsyncStorage.setItem("rooms", JSON.stringify(rooms));
      Alert.alert("Success", `${fullRoomCode} added with ${bedCount} beds.`);
      router.back();
    } catch (error) {
      Alert.alert("Error", "Failed to save room details.");
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.title}>Add 2BHK Sub-Zone</Text>
      </View>

      {/* Flat Number & Apartment */}
      <Text style={styles.label}>Flat / Room Number</Text>
      <TextInput
        value={flatNumber}
        onChangeText={setFlatNumber}
        placeholder="e.g. 101"
        placeholderTextColor="#64748B"
        style={styles.input}
      />

      <Text style={styles.label}>Building / Apartment Name</Text>
      <TextInput
        value={apartmentName}
        onChangeText={setApartmentName}
        placeholder="e.g. Roma Apartment"
        placeholderTextColor="#64748B"
        style={styles.input}
      />

      {/* Quick Zone Selector */}
      <Text style={styles.label}>Select Flat Area / Zone</Text>
      <View style={styles.zoneRow}>
        {(["Hall", "Room 1", "Room 2"] as const).map((zone) => (
          <TouchableOpacity
            key={zone}
            style={[
              styles.zoneChip,
              selectedZone === zone && styles.activeZoneChip,
            ]}
            onPress={() => handleZoneSelect(zone)}
          >
            <Text
              style={[
                styles.zoneText,
                selectedZone === zone && styles.activeZoneText,
              ]}
            >
              {zone}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Capacity & Price Configuration */}
      <Text style={styles.label}>Bed Capacity in this Zone</Text>
      <TextInput
        value={totalBeds}
        onChangeText={setTotalBeds}
        keyboardType="numeric"
        style={styles.input}
      />

      <Text style={styles.label}>Monthly Rent Per Bed (₹)</Text>
      <TextInput
        value={customRent}
        onChangeText={setCustomRent}
        keyboardType="numeric"
        style={styles.input}
      />

      {/* Type Toggle */}
      <Text style={styles.label}>Climate Control</Text>
      <View style={styles.typeContainer}>
        <TouchableOpacity
          style={[styles.typeButton, roomType === "AC" && styles.activeType]}
          onPress={() => setRoomType("AC")}
        >
          <Ionicons name="snow-outline" size={18} color="#FFFFFF" />
          <Text style={styles.typeText}>AC Room</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.typeButton,
            roomType === "Non AC" && styles.activeType,
          ]}
          onPress={() => setRoomType("Non AC")}
        >
          <Ionicons name="leaf-outline" size={18} color="#FFFFFF" />
          <Text style={styles.typeText}>Non AC</Text>
        </TouchableOpacity>
      </View>

      {/* Summary Preview */}
      <View style={styles.previewCard}>
        <Text style={styles.previewTitle}>Zone Summary</Text>
        <Text style={styles.previewText}>
          Code: {flatNumber}-{selectedZone.replace(" ", "")}
        </Text>
        <Text style={styles.previewText}>Location: {apartmentName}</Text>
        <Text style={styles.previewText}>Total Beds: {totalBeds}</Text>
        <Text style={styles.previewText}>
          Rent: ₹{customRent}/month ({roomType})
        </Text>
      </View>

      <TouchableOpacity style={styles.button} onPress={handleCreateRoomZone}>
        <Text style={styles.buttonText}>Save Flat Zone</Text>
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
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 15,
    marginTop: 40,
    marginBottom: 20,
  },
  title: {
    color: "#FFFFFF",
    fontSize: 22,
    fontWeight: "bold",
  },
  label: {
    color: "#CBD5E1",
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    backgroundColor: "#1E293B",
    color: "#FFFFFF",
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 50,
    borderWidth: 1,
    borderColor: "#334155",
    fontSize: 15,
  },
  zoneRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 4,
  },
  zoneChip: {
    flex: 1,
    backgroundColor: "#1E293B",
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#334155",
  },
  activeZoneChip: {
    backgroundColor: "#2563EB",
    borderColor: "#3B82F6",
  },
  zoneText: {
    color: "#94A3B8",
    fontWeight: "600",
  },
  activeZoneText: {
    color: "#FFFFFF",
  },
  typeContainer: {
    flexDirection: "row",
    gap: 10,
    marginTop: 4,
  },
  typeButton: {
    flex: 1,
    backgroundColor: "#1E293B",
    padding: 12,
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: "#334155",
  },
  activeType: {
    backgroundColor: "#2563EB",
    borderColor: "#3B82F6",
  },
  typeText: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  previewCard: {
    backgroundColor: "#1E293B",
    padding: 16,
    borderRadius: 14,
    marginTop: 20,
    borderWidth: 1,
    borderColor: "#334155",
  },
  previewTitle: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 8,
  },
  previewText: {
    color: "#94A3B8",
    marginBottom: 4,
  },
  button: {
    backgroundColor: "#2563EB",
    height: 52,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 24,
    marginBottom: 40,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },
});
