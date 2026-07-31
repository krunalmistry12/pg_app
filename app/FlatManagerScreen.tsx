import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import { router } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  Alert,
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export interface Bed {
  id: string;
  bedNumber: string;
  isOccupied: boolean;
  tenantName?: string;
}

export interface Zone {
  id: string;
  zoneName: string;
  type: "AC" | "Non AC";
  capacity: number;
  rentPerBed: number;
  beds: Bed[];
}

export interface Flat {
  id: string;
  flatNumber: string;
  apartmentName: string;
  zones: Zone[];
}

export default function FlatManagerScreen() {
  const [flats, setFlats] = useState<Flat[]>([]);
  const [selectedFlatId, setSelectedFlatId] = useState<string | null>(null);
  const [selectedZone, setSelectedZone] = useState<Zone | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  // Load flats from AsyncStorage
  const loadFlats = async () => {
    try {
      const data = await AsyncStorage.getItem("flats_2bhk");
      if (data) {
        setFlats(JSON.parse(data));
      } else {
        // Default starter flat if local storage is empty
        const defaultFlat: Flat = {
          id: "flat-101",
          flatNumber: "101",
          apartmentName: "Roma Apartment",
          zones: [
            {
              id: "z1",
              zoneName: "Hall Space",
              type: "Non AC",
              capacity: 2,
              rentPerBed: 4500,
              beds: [
                { id: "b1", bedNumber: "Bed 1", isOccupied: false },
                {
                  id: "b2",
                  bedNumber: "Bed 2",
                  isOccupied: true,
                  tenantName: "Rahul",
                },
              ],
            },
            {
              id: "z2",
              zoneName: "Bedroom 1",
              type: "Non AC",
              capacity: 3,
              rentPerBed: 5500,
              beds: [
                { id: "b3", bedNumber: "Bed 1", isOccupied: false },
                { id: "b4", bedNumber: "Bed 2", isOccupied: false },
                {
                  id: "b5",
                  bedNumber: "Bed 3",
                  isOccupied: true,
                  tenantName: "Aman",
                },
              ],
            },
          ],
        };
        setFlats([defaultFlat]);
        await AsyncStorage.setItem("flats_2bhk", JSON.stringify([defaultFlat]));
      }
    } catch (e) {
      console.error("Failed to load flats:", e);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadFlats();
    }, []),
  );

  const openBedMatrix = (flatId: string, zone: Zone) => {
    setSelectedFlatId(flatId);
    setSelectedZone(zone);
    setModalVisible(true);
  };

  // Handler to assign tenant or vacate bed
  const toggleBedOccupancy = (bed: Bed) => {
    if (!selectedZone || !selectedFlatId) return;

    if (bed.isOccupied) {
      // Confirm vacating bed
      Alert.alert(
        "Vacate Bed",
        `Are you sure you want to remove ${
          bed.tenantName || "the tenant"
        } from ${bed.bedNumber}?`,
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Vacate",
            style: "destructive",
            onPress: () => updateBedStatus(bed.id, false, undefined),
          },
        ],
      );
    } else {
      // Prompt for tenant check-in
      if (Alert.prompt) {
        Alert.prompt(
          "Check-In Tenant",
          `Enter tenant name for ${bed.bedNumber}:`,
          [
            { text: "Cancel", style: "cancel" },
            {
              text: "Assign Bed",
              onPress: (name?: string) => {
                const tenantName =
                  name && name.trim() !== "" ? name.trim() : "Tenant";
                updateBedStatus(bed.id, true, tenantName);
              },
            },
          ],
          "plain-text",
        );
      } else {
        updateBedStatus(bed.id, true, "Occupied Bed");
      }
    }
  };

  // Persist updated bed state back to AsyncStorage
  const updateBedStatus = async (
    bedId: string,
    isOccupied: boolean,
    tenantName?: string,
  ) => {
    const updatedFlats = flats.map((flat) => {
      if (flat.id !== selectedFlatId) return flat;

      return {
        ...flat,
        zones: flat.zones.map((zone) => {
          if (zone.id !== selectedZone?.id) return zone;

          const updatedBeds = zone.beds.map((bed) =>
            bed.id === bedId ? { ...bed, isOccupied, tenantName } : bed,
          );

          const updatedZone = { ...zone, beds: updatedBeds };
          setSelectedZone(updatedZone);
          return updatedZone;
        }),
      };
    });

    setFlats(updatedFlats);
    try {
      await AsyncStorage.setItem("flats_2bhk", JSON.stringify(updatedFlats));
    } catch (e) {
      console.error("Failed to save bed status:", e);
    }
  };

  // Handler to delete a flat
  const handleDeleteFlat = (flatId: string, flatNumber: string) => {
    Alert.alert(
      "Delete Flat",
      `Are you sure you want to delete Flat ${flatNumber}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            const filteredFlats = flats.filter((f) => f.id !== flatId);
            setFlats(filteredFlats);
            await AsyncStorage.setItem(
              "flats_2bhk",
              JSON.stringify(filteredFlats),
            );
          },
        },
      ],
    );
  };

  const renderFlatCard = ({ item }: { item: Flat }) => {
    const totalCapacity = item.zones.reduce((acc, z) => acc + z.capacity, 0);
    const totalOccupied = item.zones.reduce(
      (acc, z) => acc + z.beds.filter((b) => b.isOccupied).length,
      0,
    );

    return (
      <View style={styles.flatCard}>
        {/* Flat Card Header */}
        <View style={styles.flatHeader}>
          <View>
            <Text style={styles.flatTitle}>Flat {item.flatNumber}</Text>
            <Text style={styles.apartmentSubtitle}>
              {item.apartmentName} • {item.zones.length} Configured Zones
            </Text>
          </View>

          <View style={styles.headerRightActions}>
            <View style={styles.capacityBadge}>
              <Text style={styles.capacityBadgeText}>
                {totalOccupied}/{totalCapacity} Occupied
              </Text>
            </View>

            <TouchableOpacity
              onPress={() => handleDeleteFlat(item.id, item.flatNumber)}
              style={styles.deleteFlatBtn}
            >
              <Ionicons name="trash-outline" size={18} color="#EF4444" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Dynamically List All Saved Zones */}
        <View style={styles.zonesContainer}>
          {item.zones.map((zone) => {
            const occupiedBeds = zone.beds.filter((b) => b.isOccupied).length;
            const isAc = zone.type === "AC";

            return (
              <View key={zone.id} style={styles.zoneRow}>
                <View style={styles.zoneInfo}>
                  <View style={styles.zoneTitleRow}>
                    <Ionicons
                      name={isAc ? "snow-outline" : "bed-outline"}
                      size={18}
                      color={isAc ? "#38BDF8" : "#94A3B8"}
                    />
                    <Text style={styles.zoneName}>{zone.zoneName}</Text>
                    <View
                      style={[
                        styles.typePill,
                        { backgroundColor: isAc ? "#0284C720" : "#334155" },
                      ]}
                    >
                      <Text
                        style={[
                          styles.typePillText,
                          { color: isAc ? "#38BDF8" : "#CBD5E1" },
                        ]}
                      >
                        {zone.type}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.zoneMeta}>
                    {zone.capacity} Beds • ₹{zone.rentPerBed}/mo per bed
                  </Text>
                </View>

                <TouchableOpacity
                  style={styles.viewBedsBtn}
                  onPress={() => openBedMatrix(item.id, zone)}
                >
                  <Text style={styles.viewBedsBtnText}>
                    {occupiedBeds}/{zone.capacity} Beds
                  </Text>
                  <Ionicons name="chevron-forward" size={14} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            );
          })}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Flat Management</Text>
        <Text style={styles.subtitle}>
          Manage zone-wise bed allocations & custom rents
        </Text>
      </View>

      {/* List of Flats */}
      <FlatList
        data={flats}
        keyExtractor={(item) => item.id}
        renderItem={renderFlatCard}
        contentContainerStyle={{ paddingBottom: 100 }}
      />

      {/* Floating Action Button (FAB) to Add Flat */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push("/add-2bhk-flat")}
        activeOpacity={0.8}
      >
        <Ionicons name="add" size={30} color="#FFFFFF" />
      </TouchableOpacity>

      {/* Interactive Bed Matrix Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>{selectedZone?.zoneName}</Text>
                <Text style={styles.modalSub}>
                  Rent: ₹{selectedZone?.rentPerBed} / month per bed
                </Text>
              </View>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons
                  name="close-circle-outline"
                  size={28}
                  color="#94A3B8"
                />
              </TouchableOpacity>
            </View>

            <View style={styles.bedGrid}>
              {selectedZone?.beds.map((bed) => (
                <TouchableOpacity
                  key={bed.id}
                  activeOpacity={0.7}
                  onPress={() => toggleBedOccupancy(bed)}
                  style={[
                    styles.bedCard,
                    {
                      backgroundColor: bed.isOccupied
                        ? "#7F1D1D20"
                        : "#14532D20",
                      borderColor: bed.isOccupied ? "#EF4444" : "#22C55E",
                    },
                  ]}
                >
                  <Ionicons
                    name="bed"
                    size={22}
                    color={bed.isOccupied ? "#EF4444" : "#22C55E"}
                  />
                  <Text style={styles.bedNumber}>{bed.bedNumber}</Text>
                  <Text
                    numberOfLines={1}
                    style={[
                      styles.bedStatusText,
                      { color: bed.isOccupied ? "#FCA5A5" : "#86EFAC" },
                    ]}
                  >
                    {bed.isOccupied ? bed.tenantName || "Occupied" : "Vacant"}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0F172A",
    paddingHorizontal: 20,
    paddingTop: 50,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    color: "#FFFFFF",
    fontSize: 26,
    fontWeight: "bold",
  },
  subtitle: {
    color: "#94A3B8",
    fontSize: 14,
    marginTop: 4,
  },
  flatCard: {
    backgroundColor: "#1E293B",
    borderRadius: 20,
    padding: 18,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: "#334155",
  },
  flatHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#334155",
  },
  flatTitle: {
    color: "#FFFFFF",
    fontSize: 22,
    fontWeight: "bold",
  },
  apartmentSubtitle: {
    color: "#94A3B8",
    fontSize: 13,
    marginTop: 2,
  },
  headerRightActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  capacityBadge: {
    backgroundColor: "#2563EB20",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#2563EB60",
  },
  capacityBadgeText: {
    color: "#60A5FA",
    fontSize: 12,
    fontWeight: "600",
  },
  deleteFlatBtn: {
    padding: 4,
  },
  zonesContainer: {
    marginTop: 14,
    gap: 12,
  },
  zoneRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#0F172A60",
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#334155",
  },
  zoneInfo: {
    flex: 1,
  },
  zoneTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  zoneName: {
    color: "#FFFFFF",
    fontWeight: "bold",
    fontSize: 15,
  },
  typePill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  typePillText: {
    fontSize: 10,
    fontWeight: "bold",
  },
  zoneMeta: {
    color: "#94A3B8",
    fontSize: 12,
    marginTop: 4,
  },
  viewBedsBtn: {
    backgroundColor: "#2563EB",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
  },
  viewBedsBtnText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
  },
  fab: {
    position: "absolute",
    right: 20,
    bottom: 30,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#2563EB",
    justifyContent: "center",
    alignItems: "center",
    elevation: 5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.75)",
    justifyContent: "flex-end",
  },
  modalContainer: {
    backgroundColor: "#1E293B",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    minHeight: 320,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "bold",
  },
  modalSub: {
    color: "#94A3B8",
    fontSize: 13,
    marginTop: 2,
  },
  bedGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  bedCard: {
    width: "30%",
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
  },
  bedNumber: {
    color: "#FFFFFF",
    fontWeight: "bold",
    fontSize: 14,
    marginTop: 4,
  },
  bedStatusText: {
    fontSize: 11,
    marginTop: 2,
  },
});
