import { Ionicons } from "@expo/vector-icons";
import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetFlatList,
} from "@gorhom/bottom-sheet";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import { router } from "expo-router";
import React, { useCallback, useMemo, useRef, useState } from "react";
import {
  Alert,
  FlatList,
  ListRenderItem,
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

export default function RoomsScreen() {
  const [flats, setFlats] = useState<Flat[]>([]);
  const [selectedFlatId, setSelectedFlatId] = useState<string | null>(null);
  const [selectedZone, setSelectedZone] = useState<Zone | null>(null);

  // Bottom Sheet Ref & Snap Points
  const bottomSheetRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => ["50%", "75%"], []);

  // Load flats from AsyncStorage
  const loadFlats = async () => {
    try {
      const data = await AsyncStorage.getItem("flats_2bhk");
      if (data) {
        setFlats(JSON.parse(data));
      } else {
        setFlats([]);
      }
    } catch (error) {
      console.error("Failed to load flats:", error);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadFlats();
    }, []),
  );

  // Delete Entire Flat
  const handleDeleteFlat = (flatId: string, flatNumber: string) => {
    Alert.alert(
      "Delete Flat",
      `Are you sure you want to remove Flat ${flatNumber}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            const updated = flats.filter((f) => f.id !== flatId);
            setFlats(updated);
            await AsyncStorage.setItem("flats_2bhk", JSON.stringify(updated));
          },
        },
      ],
    );
  };

  // Open Bed Matrix Bottom Sheet Smoothly
  const openBedMatrix = (flatId: string, zone: Zone) => {
    setSelectedFlatId(flatId);
    setSelectedZone(zone);
    bottomSheetRef.current?.snapToIndex(1); // Expands smoothly to 75%
  };

  // Close Bottom Sheet Smoothly
  const closeBedMatrix = () => {
    bottomSheetRef.current?.close();
  };

  // Toggle Bed Occupancy & Sync to AsyncStorage
  const toggleBedOccupancy = (bed: Bed) => {
    if (!selectedZone || !selectedFlatId) return;

    if (bed.isOccupied) {
      Alert.alert(
        "Vacate Bed",
        `Vacate ${bed.bedNumber} (Occupied by ${bed.tenantName || "Tenant"})?`,
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
      if (Alert.prompt) {
        Alert.prompt(
          "Assign Bed",
          `Enter tenant name for ${bed.bedNumber}:`,
          [
            { text: "Cancel", style: "cancel" },
            {
              text: "Assign",
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

          const updatedBeds = zone.beds.map((b) =>
            b.id === bedId ? { ...b, isOccupied, tenantName } : b,
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

  // Smooth Backdrop Component
  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.6}
      />
    ),
    [],
  );

  // FIXED: Standard ListRenderItem signature typed with Bed interface
  const renderBedItem: ListRenderItem<Bed> = useCallback(
    ({ item }) => (
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => toggleBedOccupancy(item)}
        style={[
          styles.bedCard,
          {
            backgroundColor: item.isOccupied ? "#7F1D1D20" : "#14532D20",
            borderColor: item.isOccupied ? "#EF4444" : "#22C55E",
          },
        ]}
      >
        <Ionicons
          name="bed"
          size={24}
          color={item.isOccupied ? "#EF4444" : "#22C55E"}
        />
        <Text style={styles.bedNumber}>{item.bedNumber}</Text>
        <Text
          numberOfLines={1}
          style={[
            styles.bedStatusText,
            { color: item.isOccupied ? "#FCA5A5" : "#86EFAC" },
          ]}
        >
          {item.isOccupied ? item.tenantName || "Occupied" : "Vacant"}
        </Text>
      </TouchableOpacity>
    ),
    [selectedZone, selectedFlatId],
  );

  const renderFlatCard = ({ item }: { item: Flat }) => {
    const totalCapacity = item.zones.reduce((acc, z) => acc + z.capacity, 0);
    const totalOccupied = item.zones.reduce(
      (acc, z) => acc + (z.beds?.filter((b) => b.isOccupied).length || 0),
      0,
    );
    const availableBeds = totalCapacity - totalOccupied;
    const occupancyPercent =
      totalCapacity > 0 ? (totalOccupied / totalCapacity) * 100 : 0;

    return (
      <View style={styles.card}>
        {/* Header Row */}
        <View style={styles.topRow}>
          <View>
            <Text style={styles.flatNo}>Flat {item.flatNumber}</Text>
            <Text style={styles.subText}>
              {item.apartmentName} • {item.zones.length} Zones
            </Text>
          </View>

          <View style={styles.topRightRow}>
            <View
              style={[
                styles.statusBadge,
                {
                  backgroundColor:
                    availableBeds > 0 ? "#14532D30" : "#7F1D1D30",
                  borderColor: availableBeds > 0 ? "#22C55E" : "#EF4444",
                },
              ]}
            >
              <Text
                style={[
                  styles.statusText,
                  { color: availableBeds > 0 ? "#4ADE80" : "#FCA5A5" },
                ]}
              >
                {availableBeds > 0 ? `${availableBeds} Available` : "Full"}
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

        {/* Progress Bar */}
        <View style={styles.progressContainer}>
          <View
            style={[styles.progressBar, { width: `${occupancyPercent}%` }]}
          />
        </View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Total Beds</Text>
            <Text style={styles.statValue}>{totalCapacity}</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Occupied</Text>
            <Text style={styles.statValue}>{totalOccupied}</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Vacant</Text>
            <Text style={styles.statValue}>{availableBeds}</Text>
          </View>
        </View>

        {/* Zones Detail List */}
        <View style={styles.zonesList}>
          {item.zones.map((zone) => {
            const occupiedInZone =
              zone.beds?.filter((b) => b.isOccupied).length || 0;
            const isAc = zone.type === "AC";

            return (
              <View key={zone.id} style={styles.zoneRow}>
                <View style={{ flex: 1 }}>
                  <View style={styles.zoneTitleRow}>
                    <Ionicons
                      name={isAc ? "snow-outline" : "bed-outline"}
                      size={16}
                      color={isAc ? "#38BDF8" : "#94A3B8"}
                    />
                    <Text style={styles.zoneName}>{zone.zoneName}</Text>
                  </View>
                  <Text style={styles.zoneSubMeta}>
                    ₹{zone.rentPerBed}/mo • {zone.type}
                  </Text>
                </View>

                <TouchableOpacity
                  style={styles.bedMatrixBtn}
                  activeOpacity={0.7}
                  onPress={() => openBedMatrix(item.id, zone)}
                >
                  <Text style={styles.bedMatrixBtnText}>
                    {occupiedInZone}/{zone.capacity} Beds
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
      <View style={styles.header}>
        <Text style={styles.title}>PG Rooms & Flats</Text>
        <Text style={styles.subtitle}>
          Manage capacity, dynamic zones, and bed allocations
        </Text>
      </View>

      <FlatList
        data={flats}
        keyExtractor={(item, index) => item.id?.toString() ?? index.toString()}
        renderItem={renderFlatCard}
        contentContainerStyle={{ paddingBottom: 100 }}
        initialNumToRender={10}
        maxToRenderPerBatch={10}
        windowSize={5}
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <Ionicons name="business-outline" size={48} color="#64748B" />
            <Text style={styles.emptyText}>No flats configured yet.</Text>
          </View>
        }
      />

      {/* FAB to Add Flat */}
      <TouchableOpacity
        style={styles.fab}
        activeOpacity={0.8}
        onPress={() => router.push("/add-2bhk-flat")}
      >
        <Ionicons name="add" size={32} color="#FFFFFF" />
      </TouchableOpacity>

      {/* Smooth Gesture Bottom Sheet for Bed Matrix */}
      <BottomSheet
        ref={bottomSheetRef}
        index={-1}
        snapPoints={snapPoints}
        enablePanDownToClose
        backdropComponent={renderBackdrop}
        backgroundStyle={{ backgroundColor: "#1E293B" }}
        handleIndicatorStyle={{ backgroundColor: "#64748B", width: 40 }}
      >
        <View style={styles.sheetContent}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <View>
              <Text style={styles.modalTitle}>{selectedZone?.zoneName}</Text>
              <Text style={styles.modalSub}>
                ₹{selectedZone?.rentPerBed} / month per bed (
                {selectedZone?.type})
              </Text>
            </View>
            <TouchableOpacity onPress={closeBedMatrix}>
              <Ionicons name="close-circle-outline" size={28} color="#94A3B8" />
            </TouchableOpacity>
          </View>

          {/* FIXED: BottomSheetFlatList with explicit keyExtractor and renderItem */}
          <BottomSheetFlatList
            key={3}
            data={selectedZone?.beds || []}
            keyExtractor={(item: Bed, index: number) =>
              item.id ? String(item.id) : String(index)
            }
            renderItem={renderBedItem}
            numColumns={3}
            columnWrapperStyle={styles.columnWrapper}
            contentContainerStyle={{ paddingBottom: 40 }}
            showsVerticalScrollIndicator={false}
          />
        </View>
      </BottomSheet>
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
    fontSize: 28,
    fontWeight: "bold",
  },
  subtitle: {
    color: "#94A3B8",
    fontSize: 14,
    marginTop: 4,
  },
  card: {
    backgroundColor: "#1E293B",
    borderRadius: 18,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#334155",
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  topRightRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  flatNo: {
    color: "#FFFFFF",
    fontSize: 22,
    fontWeight: "bold",
  },
  subText: {
    color: "#94A3B8",
    fontSize: 13,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "600",
  },
  deleteFlatBtn: {
    padding: 4,
  },
  progressContainer: {
    height: 6,
    backgroundColor: "#334155",
    borderRadius: 3,
    marginVertical: 14,
    overflow: "hidden",
  },
  progressBar: {
    height: "100%",
    backgroundColor: "#2563EB",
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 14,
    backgroundColor: "#0F172A40",
    padding: 10,
    borderRadius: 12,
  },
  statBox: {
    alignItems: "center",
    flex: 1,
  },
  statLabel: {
    color: "#94A3B8",
    fontSize: 11,
  },
  statValue: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "bold",
    marginTop: 2,
  },
  zonesList: {
    gap: 8,
    marginTop: 4,
  },
  zoneRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#0F172A60",
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#334155",
  },
  zoneTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  zoneName: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 14,
  },
  zoneSubMeta: {
    color: "#94A3B8",
    fontSize: 11,
    marginTop: 2,
  },
  bedMatrixBtn: {
    backgroundColor: "#2563EB",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  bedMatrixBtnText: {
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
  emptyBox: {
    alignItems: "center",
    marginTop: 80,
  },
  emptyText: {
    color: "#64748B",
    fontSize: 16,
    marginTop: 10,
  },
  sheetContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
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
  columnWrapper: {
    gap: 10,
    marginBottom: 10,
  },
  bedCard: {
    flex: 1,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    alignItems: "center",
  },
  bedNumber: {
    color: "#FFFFFF",
    fontWeight: "bold",
    fontSize: 14,
    marginTop: 6,
  },
  bedStatusText: {
    fontSize: 11,
    marginTop: 2,
  },
});
