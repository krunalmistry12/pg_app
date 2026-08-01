import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from "../src/constants/theme";
import { commonStyles } from "../src/styles/commonStyles";

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

  const [zones, setZones] = useState<ZoneInput[]>([
    {
      id: `z-${Date.now()}-0`,
      zoneName: "Hall Space",
      type: "Non AC",
      bedsCount: "2",
      rentPerBed: "4500",
    },
  ]);

  // Calculations for live summary
  const totalBeds = zones.reduce(
    (sum, z) => sum + (parseInt(z.bedsCount, 10) || 0),
    0
  );
  const totalPotentialRevenue = zones.reduce(
    (sum, z) =>
      sum + (parseInt(z.bedsCount, 10) || 0) * (parseFloat(z.rentPerBed) || 0),
    0
  );

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

  const handleDeleteZone = (id: string) => {
    if (zones.length === 1) {
      Alert.alert("Action Not Allowed", "A flat must have at least one zone.");
      return;
    }
    setZones((prev) => prev.filter((z) => z.id !== id));
  };

  const updateZoneField = (
    id: string,
    field: keyof ZoneInput,
    value: string
  ) => {
    setZones((prev) =>
      prev.map((zone) => (zone.id === id ? { ...zone, [field]: value } : zone))
    );
  };

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
        `Flat ${flatNumber} created with ${totalBeds} total beds.`
      );
      router.back();
    } catch (e) {
      Alert.alert("Error", "Failed to save flat details.");
    }
  };

  return (
    <SafeAreaView style={commonStyles.container}>
      {/* Top Header */}
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={22} color={COLORS.textSecondary} />
        </TouchableOpacity>
        <View>
          <Text style={TYPOGRAPHY.headerTitle}>Add Property / Flat</Text>
          <Text style={{ color: COLORS.textMuted, fontSize: 12 }}>
            Configure layout & bed capacities
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={commonStyles.scrollPadding}>
        {/* Live Calculation Summary */}
        <View style={commonStyles.card}>
          <View style={commonStyles.row}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>{zones.length}</Text>
              <Text style={TYPOGRAPHY.label}>Total Zones</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>{totalBeds}</Text>
              <Text style={TYPOGRAPHY.label}>Total Beds</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryValue, { color: COLORS.success }]}>
                ₹{totalPotentialRevenue.toLocaleString("en-IN")}
              </Text>
              <Text style={TYPOGRAPHY.label}>Est. Revenue</Text>
            </View>
          </View>
        </View>

        {/* Flat Details Section */}
        <View style={commonStyles.card}>
          <Text style={TYPOGRAPHY.sectionTitle}>Property Details</Text>

          <View style={[commonStyles.row, { marginTop: SPACING.md }]}>
            <View style={commonStyles.flex1}>
              <Text style={TYPOGRAPHY.label}>Flat Number</Text>
              <TextInput
                value={flatNumber}
                onChangeText={setFlatNumber}
                placeholder="101"
                placeholderTextColor={COLORS.textMuted}
                style={commonStyles.input}
              />
            </View>

            <View style={[commonStyles.flex1, { flex: 2 }]}>
              <Text style={TYPOGRAPHY.label}>Building Name</Text>
              <TextInput
                value={apartmentName}
                onChangeText={setApartmentName}
                placeholder="Roma Apartment"
                placeholderTextColor={COLORS.textMuted}
                style={commonStyles.input}
              />
            </View>
          </View>
        </View>

        {/* Zones Section Title */}
        <View style={styles.sectionHeaderContainer}>
          <Text style={TYPOGRAPHY.sectionTitle}>Configure Zones & Rooms</Text>
        </View>

        {/* Dynamic Zones List */}
        {zones.map((zone, index) => (
          <View key={zone.id} style={commonStyles.card}>
            <View style={styles.zoneCardHeader}>
              <View style={styles.zoneBadge}>
                <Text style={styles.zoneBadgeText}>Zone #{index + 1}</Text>
              </View>

              {zones.length > 1 && (
                <TouchableOpacity
                  onPress={() => handleDeleteZone(zone.id)}
                  style={styles.deleteButton}
                >
                  <Ionicons name="trash-outline" size={16} color={COLORS.danger} />
                  <Text style={{ color: COLORS.dangerText, fontSize: 12 }}>
                    Remove
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            <Text style={TYPOGRAPHY.label}>Zone / Room Name</Text>
            <TextInput
              value={zone.zoneName}
              onChangeText={(val) => updateZoneField(zone.id, "zoneName", val)}
              placeholder="e.g. Hall Space, Bedroom 1"
              placeholderTextColor={COLORS.textMuted}
              style={commonStyles.input}
            />

            <Text style={[TYPOGRAPHY.label, { marginTop: SPACING.md }]}>
              Room AC Status
            </Text>
            <View style={commonStyles.row}>
              <TouchableOpacity
                style={[
                  styles.typeBadge,
                  zone.type === "Non AC" && {
                    borderColor: COLORS.warning,
                    backgroundColor: COLORS.warning,
                  },
                ]}
                onPress={() => updateZoneField(zone.id, "type", "Non AC")}
              >
                <Ionicons
                  name="flame-outline"
                  size={16}
                  color={zone.type === "Non AC" ? COLORS.textWhite : COLORS.textSecondary}
                />
                <Text
                  style={[
                    styles.typeBadgeText,
                    zone.type === "Non AC" && { color: COLORS.textWhite },
                  ]}
                >
                  Non AC
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.typeBadge,
                  zone.type === "AC" && {
                    borderColor: COLORS.primary,
                    backgroundColor: COLORS.primary,
                  },
                ]}
                onPress={() => updateZoneField(zone.id, "type", "AC")}
              >
                <Ionicons
                  name="snow-outline"
                  size={16}
                  color={zone.type === "AC" ? COLORS.textWhite : COLORS.textSecondary}
                />
                <Text
                  style={[
                    styles.typeBadgeText,
                    zone.type === "AC" && { color: COLORS.textWhite },
                  ]}
                >
                  AC Room
                </Text>
              </TouchableOpacity>
            </View>

            <View style={[commonStyles.row, { marginTop: SPACING.md }]}>
              <View style={commonStyles.flex1}>
                <Text style={TYPOGRAPHY.label}>Beds Count</Text>
                <TextInput
                  value={zone.bedsCount}
                  onChangeText={(val) =>
                    updateZoneField(zone.id, "bedsCount", val)
                  }
                  keyboardType="numeric"
                  style={commonStyles.input}
                />
              </View>

              <View style={commonStyles.flex1}>
                <Text style={TYPOGRAPHY.label}>Rent / Bed (₹)</Text>
                <TextInput
                  value={zone.rentPerBed}
                  onChangeText={(val) =>
                    updateZoneField(zone.id, "rentPerBed", val)
                  }
                  keyboardType="numeric"
                  style={commonStyles.input}
                />
              </View>
            </View>
          </View>
        ))}

        {/* Add Zone Button */}
        <TouchableOpacity style={styles.addZoneButton} onPress={handleAddZone}>
          <Ionicons name="add-circle-outline" size={20} color={COLORS.accent} />
          <Text style={{ color: COLORS.accent, fontWeight: "600", fontSize: 14 }}>
            Add Another Zone / Room
          </Text>
        </TouchableOpacity>

        {/* Save Button */}
        <TouchableOpacity style={commonStyles.primaryButton} onPress={handleSaveFlat}>
          <Ionicons name="checkmark-circle-outline" size={20} color={COLORS.textWhite} />
          <Text style={commonStyles.primaryButtonText}>Save Configuration</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

// Local UI specific styles
const styles = StyleSheet.create({
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    gap: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.surface,
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  summaryItem: {
    alignItems: "center",
    flex: 1,
  },
  summaryValue: {
    color: COLORS.accent,
    fontSize: 18,
    fontWeight: "700",
  },
  summaryDivider: {
    width: 1,
    height: 28,
    backgroundColor: COLORS.border,
  },
  sectionHeaderContainer: {
    marginBottom: SPACING.md,
  },
  zoneCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: SPACING.md,
  },
  zoneBadge: {
    backgroundColor: COLORS.accentBackground,
    paddingHorizontal: SPACING.sm + 2,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.sm,
  },
  zoneBadgeText: {
    color: COLORS.accent,
    fontSize: 12,
    fontWeight: "700",
  },
  deleteButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.xs,
  },
  typeBadge: {
    flex: 1,
    flexDirection: "row",
    gap: SPACING.xs,
    paddingVertical: SPACING.sm + 2,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.background,
  },
  typeBadgeText: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontWeight: "600",
  },
  addZoneButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: SPACING.sm,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.accent,
    borderStyle: "dashed",
    marginBottom: SPACING.lg,
    backgroundColor: COLORS.accentBackground,
  },
});