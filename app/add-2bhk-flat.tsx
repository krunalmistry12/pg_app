import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
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
import {
  createFlatApi,
  deleteFlatApi,
  getFlatByIdApi,
  updateFlatApi,
} from "../src/services/apiService";
import { commonStyles } from "../src/styles/commonStyles";

// 🟢 Helper Function: UUID Generator for new Zone and Bed IDs
const generateUUID = (): string => {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

interface ZoneInput {
  id: string;
  zoneName: string;
  type: "AC" | "Non AC";
  bedsCount: string;
  rentPerBed: string;
  existingBeds?: any[];
}

export default function Add2BHKFlatScreen() {
  const { flatId } = useLocalSearchParams<{ flatId?: string }>();
  const isEditing = Boolean(flatId);

  const [flatNumber, setFlatNumber] = useState("101");
  const [apartmentName, setApartmentName] = useState("Roma Apartment");
  const [loading, setLoading] = useState<boolean>(false);
  const [currentUserId, setCurrentUserId] = useState<string>(
    "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  );

  const [zones, setZones] = useState<ZoneInput[]>([
    {
      id: `z-${Date.now()}-0`,
      zoneName: "Hall Space",
      type: "Non AC",
      bedsCount: "2",
      rentPerBed: "4500",
    },
  ]);

  // Fetch logged-in UserId and Load flat data if editing
  useEffect(() => {
    const initScreen = async () => {
      try {
        const savedUserId = await AsyncStorage.getItem("userId");
        if (savedUserId) {
          setCurrentUserId(savedUserId);
        }
      } catch (e) {
        console.log("Could not load userId from storage", e);
      }

      if (isEditing && flatId) {
        loadFlatData(flatId);
      }
    };

    initScreen();
  }, [flatId]);

  // 🔵 GET API Call - Fetch Flat & Rooms Details
  const loadFlatData = async (id: string) => {
    setLoading(true);
    try {
      const response = await getFlatByIdApi(id);
      const flatData = response.data?.data || response.data;

      if (flatData) {
        setFlatNumber(flatData.flatNumber || "");
        setApartmentName(flatData.apartmentName || "");

        const rawZones = flatData.zones || flatData.roomBreakup || [];

        if (rawZones.length > 0) {
          const formattedZones = rawZones.map((zone: any) => {
            const bedsList = zone.beds || [];
            
            // Sort beds properly by their number (B1, B2, B3... B11)
            bedsList.sort((a: any, b: any) => {
              const numA = parseInt((a.bedNumber || "").replace(/\D/g, ""), 10) || 0;
              const numB = parseInt((b.bedNumber || "").replace(/\D/g, ""), 10) || 0;
              return numA - numB;
            });

            const bedCount =
              bedsList.length > 0 ? bedsList.length : zone.capacity || 1;

            const bedRentVal =
              bedsList[0]?.bedRent ||
              bedsList[0]?.rent ||
              (zone.roomRent && bedCount > 0 ? zone.roomRent / bedCount : 0);

            return {
              id: zone.id || zone.zoneId,
              zoneName: zone.zoneName || "",
              type: zone.type === 2 || zone.type === "AC" ? "AC" : "Non AC",
              bedsCount: bedCount.toString(),
              rentPerBed: bedRentVal.toString(),
              existingBeds: bedsList,
            };
          });
          setZones(formattedZones);
        }
      }
    } catch (error) {
      console.log("Error loading flat for edit:", error);
      Alert.alert("Error", "Could not load flat details for editing.");
    } finally {
      setLoading(false);
    }
  };

  // Calculations for live summary based strictly on user input count
  const totalBeds = zones.reduce(
    (sum, z) => sum + (parseInt(z.bedsCount, 10) || 0),
    0,
  );
  const totalPotentialRevenue = zones.reduce((sum, z) => {
    const count = parseInt(z.bedsCount, 10) || 0;
    return sum + count * (parseFloat(z.rentPerBed) || 0);
  }, 0);

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
    value: string,
  ) => {
    setZones((prev) =>
      prev.map((zone) => (zone.id === id ? { ...zone, [field]: value } : zone)),
    );
  };

  // 🟢 Bulletproof Bed Generator: Occupied beds ki position fixed rahegi aur vacant beds aasaani se remove honge.
 const generateBeds = (
  inputCount: number,
  existingBeds: any[] = [],
  rentPerBed: number,
) => {
  // -----------------------------------------
  // 1. Existing beds ko normalize karo
  // -----------------------------------------
  const mappedBeds = existingBeds.map((oldBed) => {
    const validBedId =
      oldBed?.id ||
      oldBed?.bedId ||
      oldBed?._id ||
      generateUUID();

    const isOccupied =
      oldBed?.status === 2 ||
      (oldBed?.tenantName &&
        oldBed.tenantName.trim() !== "");

    const bedNumber =
      oldBed?.bedNumber ||
      `B${existingBeds.indexOf(oldBed) + 1}`;

    return {
      id: validBedId,
      bedId: validBedId,
      bedNumber,

      status: isOccupied
        ? 2
        : typeof oldBed?.status === "number"
        ? oldBed.status
        : 1,

      tenantName: oldBed?.tenantName || "",

      bedRent: rentPerBed,
      rent: rentPerBed,

      _isOccupied: isOccupied,
    };
  });

  // -----------------------------------------
  // 2. Occupied beds ko kabhi remove mat karo
  // -----------------------------------------
  const occupiedBeds = mappedBeds.filter(
    (bed) => bed._isOccupied
  );

  // -----------------------------------------
  // 3. Agar requested count occupied beds se
  //    kam hai to minimum occupied count rakho
  // -----------------------------------------
  const targetCount = Math.max(
    inputCount,
    occupiedBeds.length
  );

  // -----------------------------------------
  // 4. Agar count kam hua:
  //    ONLY VACANT beds remove karo.
  //
  //    Highest-numbered vacant beds pehle remove
  //    honge.
  // -----------------------------------------
  let finalBeds = [...mappedBeds];

  if (finalBeds.length > targetCount) {
    const removeCount =
      finalBeds.length - targetCount;

    const vacantBeds = finalBeds
      .filter((bed) => !bed._isOccupied)
      .sort((a, b) => {
        const numA =
          parseInt(
            String(a.bedNumber).replace(/\D/g, ""),
            10
          ) || 0;

        const numB =
          parseInt(
            String(b.bedNumber).replace(/\D/g, ""),
            10
          ) || 0;

        return numB - numA;
      });

    // Remove only vacant beds
    const bedsToRemove = new Set(
      vacantBeds
        .slice(0, removeCount)
        .map((bed) => bed.id)
    );

    finalBeds = finalBeds.filter(
      (bed) => !bedsToRemove.has(bed.id)
    );
  }

  // -----------------------------------------
  // 5. Agar count increase hua:
  //    Missing bed numbers fill karo.
  // -----------------------------------------
  if (finalBeds.length < targetCount) {
    const existingNumbers = new Set(
      finalBeds.map((bed) => {
        return (
          parseInt(
            String(bed.bedNumber).replace(/\D/g, ""),
            10
          ) || 0
        );
      })
    );

    let nextNumber = 1;

    while (finalBeds.length < targetCount) {
      while (existingNumbers.has(nextNumber)) {
        nextNumber++;
      }

      const newBedId = generateUUID();

      finalBeds.push({
        id: newBedId,
        bedId: newBedId,
        bedNumber: `B${nextNumber}`,
        status: 1,
        tenantName: "",
        bedRent: rentPerBed,
        rent: rentPerBed,
        _isOccupied: false,
      });

      existingNumbers.add(nextNumber);
      nextNumber++;
    }
  }

  // -----------------------------------------
  // 6. Internal _isOccupied remove karo
  // -----------------------------------------
  return finalBeds.map((bed) => {
    const { _isOccupied, ...rest } = bed;

    return {
      ...rest,
      bedRent: rentPerBed,
      rent: rentPerBed,
    };
  });
};

  // 🟢 POST / PUT API Call - Save Flat & Rooms
  const handleSaveFlat = async () => {
    if (!flatNumber.trim()) {
      Alert.alert("Error", "Please enter flat number.");
      return;
    }

    // Validation Check: Agar user ne beds count occupied beds se kam kiya hai
    for (const zone of zones) {
      const existingBedsList = zone.existingBeds || [];
      const inputCount = Number(zone.bedsCount) || 1;

      const occupiedBedsCount = existingBedsList.filter(
        (bed: any) =>
          bed?.status === 2 ||
          (bed?.tenantName && bed?.tenantName.trim() !== ""),
      ).length;

      if (inputCount < occupiedBedsCount) {
        Alert.alert(
          "Validation Error",
          `In zone "${zone.zoneName}", there are ${occupiedBedsCount} occupied beds, but you entered bed count as ${inputCount}. You cannot reduce beds below the number of active tenants!`,
        );
        return;
      }
    }

    const payload: any = {
      ...(isEditing && { id: flatId, flatId: flatId }),
      flatNumber: flatNumber.trim(),
      apartmentName: apartmentName.trim() || "Roma Apartment",
      pricingType: "BED_WISE",
      userId: currentUserId,
      zones: zones.map((zone: any) => {
        const existingBedsList = zone.existingBeds || [];
        const count = Number(zone.bedsCount) || 1;
        const rentPerBed = Math.max(0, Number(zone.rentPerBed) || 0);

        const generatedBedsList = generateBeds(
          count,
          existingBedsList,
          rentPerBed,
        );
        const actualCapacity = generatedBedsList.length;
        const totalRoomRent = rentPerBed * actualCapacity;

        const rawZoneId = zone.id || zone.zoneId;
        const isRealZoneId = rawZoneId && !String(rawZoneId).startsWith("z-");
        const finalZoneId = isRealZoneId ? String(rawZoneId) : generateUUID();

        return {
          id: finalZoneId,
          zoneId: finalZoneId,
          zoneName: zone.zoneName.trim() || "Zone",
          type: zone.type === "AC" ? 2 : 1, // 2 = AC, 1 = Non AC
          capacity: actualCapacity,
          roomRent: totalRoomRent,
          rent: totalRoomRent,
          beds: generatedBedsList,
        };
      }),
    };

    setLoading(true);
    try {
      if (isEditing && flatId) {
        console.log("🚀 PUT PAYLOAD:", JSON.stringify(payload, null, 2));
        await updateFlatApi(flatId, payload);
        Alert.alert("Success", `Flat ${flatNumber} updated successfully.`);
      } else {
        console.log("🚀 POST PAYLOAD:", JSON.stringify(payload, null, 2));
        await createFlatApi(payload);
        Alert.alert("Success", `Flat ${flatNumber} created successfully.`);
      }
      router.back();
    } catch (e: any) {
      console.log("SAVE ERROR:", e.response?.data || e.message);
      Alert.alert(
        "Error",
        e.response?.data?.message || "Failed to save flat details.",
      );
    } finally {
      setLoading(false);
    }
  };

  // 🔴 DELETE API Call
  const handleDeleteFlat = () => {
    Alert.alert(
      "Delete Flat",
      `Are you sure you want to delete Flat ${flatNumber}? All its rooms and beds data will be removed permanently.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            if (!flatId) return;
            setLoading(true);
            try {
              await deleteFlatApi(flatId);
              Alert.alert("Deleted", "Flat removed successfully.");
              router.back();
            } catch (error: any) {
              Alert.alert(
                "Error",
                error.response?.data?.message || "Failed to delete flat.",
              );
            } finally {
              setLoading(false);
            }
          },
        },
      ],
    );
  };

  return (
    <SafeAreaView style={commonStyles.container}>
      {/* Top Header */}
      <View style={styles.topBar}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons
            name="chevron-back"
            size={22}
            color={COLORS.textSecondary}
          />
        </TouchableOpacity>
        <View>
          <Text style={TYPOGRAPHY.headerTitle}>
            {isEditing ? "Edit Property / Flat" : "Add Property / Flat"}
          </Text>
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
                  <Ionicons
                    name="trash-outline"
                    size={16}
                    color={COLORS.danger}
                  />
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
                  color={
                    zone.type === "Non AC"
                      ? COLORS.textWhite
                      : COLORS.textSecondary
                  }
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
                  color={
                    zone.type === "AC" ? COLORS.textWhite : COLORS.textSecondary
                  }
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
          <Text
            style={{ color: COLORS.accent, fontWeight: "600", fontSize: 14 }}
          >
            Add Another Zone / Room
          </Text>
        </TouchableOpacity>

        {/* Save / Update Button */}
        <TouchableOpacity
          style={[commonStyles.primaryButton, loading && { opacity: 0.7 }]}
          onPress={handleSaveFlat}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={COLORS.textWhite} />
          ) : (
            <>
              <Ionicons
                name="checkmark-circle-outline"
                size={20}
                color={COLORS.textWhite}
              />
              <Text style={commonStyles.primaryButtonText}>
                {isEditing ? "Update Configuration" : "Save Configuration"}
              </Text>
            </>
          )}
        </TouchableOpacity>

        {/* DELETE FLAT BUTTON (Only in Edit Mode) */}
        {isEditing && (
          <TouchableOpacity
            style={styles.deleteFlatButton}
            onPress={handleDeleteFlat}
            disabled={loading}
          >
            <Ionicons name="trash-outline" size={18} color={COLORS.danger} />
            <Text
              style={{
                color: COLORS.dangerText,
                fontWeight: "700",
                fontSize: 14,
              }}
            >
              Delete Entire Flat
            </Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

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
    marginBottom: SPACING.md,
    backgroundColor: COLORS.accentBackground,
  },
  deleteFlatButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: SPACING.sm,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.danger,
    backgroundColor: "rgba(239, 68, 68, 0.08)",
    marginTop: SPACING.sm,
    marginBottom: SPACING.xl,
  },
});