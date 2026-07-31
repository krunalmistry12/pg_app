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

interface ZoneInput {
  id: string;
  zoneName: string;
  type: "AC" | "Non AC";
  bedsCount: string;
  rentPerBed: string;
}

export default function Add2BHKFlatScreen() {
  const [flatNumber, setFlatNumber] = useState("101");
  const [apartmentName, setApartmentName] = useState("Roma Apartment");

  // Default: Start with 1 zone (Hall Space)
  const [zones, setZones] = useState<ZoneInput[]>([
    {
      id: `z-${Date.now()}-0`,
      zoneName: "Hall Space",
      type: "Non AC",
      bedsCount: "2",
      rentPerBed: "4500",
    },
  ]);

  // Handler to add a new zone dynamically
  const handleAddZone = () => {
    const zoneNumber = zones.length + 1;
    setZones((prev) => [
      ...prev,
      {
        id: `z-${Date.now()}-${Math.random()}`,
        zoneName: `Bedroom ${zoneNumber - 1}`,
        type: "Non AC",
        bedsCount: "3",
        rentPerBed: "5500",
      },
    ]);
  };

  // Handler to remove a zone
  const handleDeleteZone = (id: string) => {
    if (zones.length === 1) {
      Alert.alert("Action Not Allowed", "A flat must have at least one zone.");
      return;
    }
    setZones((prev) => prev.filter((z) => z.id !== id));
  };

  // Update a specific zone field
  const updateZoneField = (
    id: string,
    field: keyof ZoneInput,
    value: string,
  ) => {
    setZones((prev) =>
      prev.map((zone) => (zone.id === id ? { ...zone, [field]: value } : zone)),
    );
  };

  // Helper to generate beds array
  const generateBeds = (count: number) =>
    Array.from({ length: count }, (_, i) => ({
      id: `bed-${Date.now()}-${Math.random()}-${i}`,
      bedNumber: `Bed ${i + 1}`,
      isOccupied: false,
      tenantName: "",
    }));

  const handleSaveFlat = async () => {
    if (!flatNumber.trim()) {
      Alert.alert("Error", "Please enter flat number.");
      return;
    }

    // Convert dynamic zones state into database schema
    const formattedZones = zones.map((zone) => {
      const count = Math.max(1, Number(zone.bedsCount) || 1);
      const rent = Math.max(0, Number(zone.rentPerBed) || 0);

      return {
        id: zone.id,
        zoneName: zone.zoneName.trim() || "Zone",
        type: zone.type,
        capacity: count,
        rentPerBed: rent,
        beds: generateBeds(count),
      };
    });

    const totalBeds = formattedZones.reduce((sum, z) => sum + z.capacity, 0);

    const newFlat = {
      id: `flat-${Date.now()}`,
      flatNumber: flatNumber.trim(),
      apartmentName: apartmentName.trim() || "Roma Apartment",
      zones: formattedZones,
    };

    try {
      const existingData = await AsyncStorage.getItem("flats_2bhk");
      const flats = existingData ? JSON.parse(existingData) : [];
      flats.push(newFlat);

      await AsyncStorage.setItem("flats_2bhk", JSON.stringify(flats));
      Alert.alert(
        "Success",
        `Flat ${flatNumber} created with ${totalBeds} total beds.`,
      );
      router.back();
    } catch (e) {
      Alert.alert("Error", "Failed to save flat details.");
    }
  };

  return (
    <ScrollView style={styles.container}>
      {/* Top Header */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.title}>Create Flat Config</Text>
      </View>

      {/* Flat Details */}
      <Text style={styles.sectionHeader}>1. Flat Identification</Text>
      <TextInput
        value={flatNumber}
        onChangeText={setFlatNumber}
        placeholder="Flat Number (e.g. 101)"
        placeholderTextColor="#64748B"
        style={styles.input}
      />
      <TextInput
        value={apartmentName}
        onChangeText={setApartmentName}
        placeholder="Apartment / Building Name"
        placeholderTextColor="#64748B"
        style={[styles.input, { marginTop: 10 }]}
      />

      {/* Dynamic Zones Configuration */}
      <Text style={styles.sectionHeader}>2. Configure Zones & Rooms</Text>

      {zones.map((zone, index) => (
        <View key={zone.id} style={styles.zoneCard}>
          {/* Card Title & Delete Action */}
          <View style={styles.zoneCardHeader}>
            <Text style={styles.zoneCardTitle}>
              Zone {index + 1}: {zone.zoneName || "Custom Zone"}
            </Text>
            {zones.length > 1 && (
              <TouchableOpacity onPress={() => handleDeleteZone(zone.id)}>
                <Ionicons name="trash-outline" size={20} color="#EF4444" />
              </TouchableOpacity>
            )}
          </View>

          {/* Zone Name */}
          <Text style={styles.label}>Zone / Room Name</Text>
          <TextInput
            value={zone.zoneName}
            onChangeText={(val) => updateZoneField(zone.id, "zoneName", val)}
            placeholder="e.g. Hall Space, Bedroom 1"
            placeholderTextColor="#64748B"
            style={styles.input}
          />

          {/* AC / Non AC Selector */}
          <Text style={[styles.label, { marginTop: 10 }]}>Type</Text>
          <View style={styles.typeContainer}>
            <TouchableOpacity
              style={[
                styles.typeBadge,
                zone.type === "Non AC" && styles.typeBadgeActive,
              ]}
              onPress={() => updateZoneField(zone.id, "type", "Non AC")}
            >
              <Text
                style={[
                  styles.typeBadgeText,
                  zone.type === "Non AC" && styles.typeBadgeTextActive,
                ]}
              >
                Non AC
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.typeBadge,
                zone.type === "AC" && styles.typeBadgeActive,
              ]}
              onPress={() => updateZoneField(zone.id, "type", "AC")}
            >
              <Text
                style={[
                  styles.typeBadgeText,
                  zone.type === "AC" && styles.typeBadgeTextActive,
                ]}
              >
                AC Room
              </Text>
            </TouchableOpacity>
          </View>

          {/* Beds Count & Rent */}
          <View style={[styles.row, { marginTop: 12 }]}>
            <View style={styles.flex1}>
              <Text style={styles.label}>Beds Count</Text>
              <TextInput
                value={zone.bedsCount}
                onChangeText={(val) =>
                  updateZoneField(zone.id, "bedsCount", val)
                }
                keyboardType="numeric"
                style={styles.input}
              />
            </View>
            <View style={styles.flex1}>
              <Text style={styles.label}>Rent / Bed (₹)</Text>
              <TextInput
                value={zone.rentPerBed}
                onChangeText={(val) =>
                  updateZoneField(zone.id, "rentPerBed", val)
                }
                keyboardType="numeric"
                style={styles.input}
              />
            </View>
          </View>
        </View>
      ))}

      {/* Add New Zone Button */}
      <TouchableOpacity style={styles.addZoneButton} onPress={handleAddZone}>
        <Ionicons name="add-circle-outline" size={20} color="#38BDF8" />
        <Text style={styles.addZoneButtonText}>Add Another Zone / Room</Text>
      </TouchableOpacity>

      {/* Save Button */}
      <TouchableOpacity style={styles.button} onPress={handleSaveFlat}>
        <Text style={styles.buttonText}>Save All Zones & Beds</Text>
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
  sectionHeader: {
    color: "#38BDF8",
    fontSize: 15,
    fontWeight: "bold",
    marginTop: 18,
    marginBottom: 10,
  },
  label: {
    color: "#CBD5E1",
    fontSize: 12,
    marginBottom: 6,
  },
  input: {
    backgroundColor: "#1E293B",
    color: "#FFFFFF",
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 48,
    borderWidth: 1,
    borderColor: "#334155",
  },
  row: {
    flexDirection: "row",
    gap: 12,
  },
  flex1: {
    flex: 1,
  },
  zoneCard: {
    backgroundColor: "#1E293B",
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#334155",
  },
  zoneCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  zoneCardTitle: {
    color: "#38BDF8",
    fontSize: 14,
    fontWeight: "bold",
  },
  typeContainer: {
    flexDirection: "row",
    gap: 10,
  },
  typeBadge: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#334155",
    alignItems: "center",
    backgroundColor: "#0F172A",
  },
  typeBadgeActive: {
    borderColor: "#2563EB",
    backgroundColor: "#2563EB",
  },
  typeBadgeText: {
    color: "#94A3B8",
    fontSize: 12,
    fontWeight: "600",
  },
  typeBadgeTextActive: {
    color: "#FFFFFF",
  },
  addZoneButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#38BDF8",
    borderStyle: "dashed",
    marginTop: 5,
    marginBottom: 20,
  },
  addZoneButtonText: {
    color: "#38BDF8",
    fontWeight: "600",
    fontSize: 14,
  },
  button: {
    backgroundColor: "#2563EB",
    height: 52,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 50,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },
});
