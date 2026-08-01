import React, { useCallback, useMemo, useRef, useState } from "react";
import {
  Alert,
  FlatList,
  ListRenderItem,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetFlatList,
} from "@gorhom/bottom-sheet";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import { router } from "expo-router";

import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from "@/src/constants/theme";

// --- Types & Interfaces ---
export type BedStatus = "vacant" | "occupied" | "reserved" | "maintenance";

export interface Bed {
  id: string;
  bedNumber: string;
  status: BedStatus;
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

type FilterType = "ALL" | "VACANT" | "AC" | "FULL";

// --- Helper Functions for Bed Status Colors ---
const getStatusColor = (status: BedStatus) => {
  switch (status) {
    case "occupied":
      return { bg: "rgba(239, 68, 68, 0.15)", border: COLORS.danger, text: COLORS.dangerText, icon: COLORS.danger };
    case "reserved":
      return { bg: "rgba(217, 119, 6, 0.15)", border: COLORS.warning, text: COLORS.warning, icon: COLORS.warning };
    case "maintenance":
      return { bg: "rgba(100, 116, 139, 0.2)", border: COLORS.textMuted, text: COLORS.textMuted, icon: COLORS.textMuted };
    case "vacant":
    default:
      return { bg: "rgba(16, 185, 129, 0.15)", border: COLORS.success, text: COLORS.success, icon: COLORS.success };
  }
};

// --- Sub-Component: Inline Flat Card ---
interface FlatCardProps {
  flat: Flat;
  onDelete: (flatId: string, flatNumber: string) => void;
  onOpenZone: (flatId: string, zone: Zone) => void;
  onQuickToggleBed: (flatId: string, zoneId: string, bed: Bed) => void;
}

const FlatCard: React.FC<FlatCardProps> = React.memo(
  ({ flat, onDelete, onOpenZone, onQuickToggleBed }) => {
    let totalCapacity = 0;
    let totalOccupied = 0;
    let totalEarning = 0;
    let maxEarning = 0;

    flat.zones.forEach((z) => {
      const occupiedInZone = z.beds?.filter((b) => b.status === "occupied" || b.status === "reserved").length || 0;
      totalCapacity += z.capacity;
      totalOccupied += occupiedInZone;
      totalEarning += occupiedInZone * z.rentPerBed;
      maxEarning += z.capacity * z.rentPerBed;
    });

    const availableBeds = totalCapacity - totalOccupied;
    const occupancyPercent = totalCapacity > 0 ? (totalOccupied / totalCapacity) * 100 : 0;

    return (
      <View style={styles.card}>
        {/* Flat Top Header */}
        <View style={styles.topRow}>
          <View>
            <Text style={styles.flatNo}>Flat {flat.flatNumber}</Text>
            <Text style={styles.subText}>
              {flat.apartmentName} • {flat.zones.length} Zones
            </Text>
          </View>

          <View style={styles.topRightRow}>
            <View
              style={[
                styles.statusBadge,
                {
                  backgroundColor: availableBeds > 0 ? "rgba(16, 185, 129, 0.12)" : "rgba(239, 68, 68, 0.12)",
                  borderColor: availableBeds > 0 ? COLORS.success : COLORS.danger,
                },
              ]}
            >
              <Text
                style={[
                  styles.statusText,
                  { color: availableBeds > 0 ? COLORS.success : COLORS.dangerText },
                ]}
              >
                {availableBeds > 0 ? `${availableBeds} Vacant` : "Full"}
              </Text>
            </View>

            <TouchableOpacity
              onPress={() => onDelete(flat.id, flat.flatNumber)}
              style={styles.deleteFlatBtn}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="trash-outline" size={18} color={COLORS.danger} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Progress Bar & Financial Snapshot */}
        <View style={styles.progressContainer}>
          <View style={[styles.progressBar, { width: `${occupancyPercent}%` }]} />
        </View>

        <View style={styles.revenueRow}>
          <Text style={styles.revenueText}>
            Revenue: <Text style={styles.revenueHighlight}>₹{totalEarning.toLocaleString()}</Text> / ₹{maxEarning.toLocaleString()}
          </Text>
          <Text style={styles.occupancyRateText}>{Math.round(occupancyPercent)}% Occupied</Text>
        </View>

        {/* Zones & Mini Inline Bed Grids */}
        <View style={styles.zonesList}>
          {flat.zones.map((zone) => {
            const occupiedInZone = zone.beds?.filter((b) => b.status === "occupied" || b.status === "reserved").length || 0;
            const isAc = zone.type === "AC";

            return (
              <View key={zone.id} style={styles.zoneBox}>
                <View style={styles.zoneHeader}>
                  <View style={styles.zoneTitleRow}>
                    <Ionicons
                      name={isAc ? "snow-outline" : "bed-outline"}
                      size={15}
                      color={isAc ? COLORS.accent : COLORS.textSecondary}
                    />
                    <Text style={TYPOGRAPHY.sectionTitle}>{zone.zoneName}</Text>
                    <Text style={styles.zoneSubMeta}>• ₹{zone.rentPerBed}/mo</Text>
                  </View>

                  <TouchableOpacity
                    style={styles.expandBtn}
                    onPress={() => onOpenZone(flat.id, zone)}
                  >
                    <Text style={styles.expandBtnText}>{occupiedInZone}/{zone.capacity} Beds</Text>
                    <Ionicons name="chevron-forward" size={12} color={COLORS.accent} />
                  </TouchableOpacity>
                </View>

                {/* Inline Bed Indicators */}
                <View style={styles.inlineBedGrid}>
  {/* Render only the first 6 beds on the flat card */}
  {zone.beds.length > 6 && (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={() => onOpenZone(flat.id, zone)}
      style={[styles.miniBedPill, styles.moreBedsPill]}
    >
      <Text style={styles.moreBedsText}>
        +{zone.beds.length - 6} More
      </Text>
      <Ionicons name="arrow-forward" size={12} color={COLORS.accent} />
    </TouchableOpacity>
  )}
</View>
              </View>
            );
          })}
        </View>
      </View>
    );
  }
);

// --- Main Screen Component ---
export default function RoomsScreen() {
  const [flats, setFlats] = useState<Flat[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterType>("ALL");

  const [selectedFlatId, setSelectedFlatId] = useState<string | null>(null);
  const [selectedZone, setSelectedZone] = useState<Zone | null>(null);

  const bottomSheetRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => ["50%", "75%"], []);

  // --- Async Data Operations ---
  const loadFlats = async () => {
    try {
      const data = await AsyncStorage.getItem("flats_2bhk");
      if (data) {
        const parsed: Flat[] = JSON.parse(data);
        // Migration support for legacy boolean 'isOccupied'
        const migratedFlats = parsed.map((f) => ({
          ...f,
          zones: f.zones.map((z) => ({
            ...z,
            beds: z.beds.map((b: any) => ({
              ...b,
              status: b.status || (b.isOccupied ? "occupied" : "vacant"),
            })),
          })),
        }));
        setFlats(migratedFlats);
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
    }, [])
  );

  const saveFlatsToStorage = async (updatedFlats: Flat[]) => {
    setFlats(updatedFlats);
    try {
      await AsyncStorage.setItem("flats_2bhk", JSON.stringify(updatedFlats));
    } catch (e) {
      console.error("Failed to save flats:", e);
    }
  };

  // --- Calculations for Analytics Banner ---
  const globalStats = useMemo(() => {
    let totalBeds = 0;
    let occupiedBeds = 0;
    let totalRevenue = 0;

    flats.forEach((f) => {
      f.zones.forEach((z) => {
        totalBeds += z.capacity;
        z.beds.forEach((b) => {
          if (b.status === "occupied" || b.status === "reserved") {
            occupiedBeds++;
            totalRevenue += z.rentPerBed;
          }
        });
      });
    });

    const vacantBeds = totalBeds - occupiedBeds;
    const occupancyRate = totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0;

    return { totalBeds, occupiedBeds, vacantBeds, totalRevenue, occupancyRate };
  }, [flats]);

  // --- Filter & Search Logic ---
  const filteredFlats = useMemo(() => {
    return flats.filter((flat) => {
      // Search matching (Flat Number, Apartment Name, or Tenant Name)
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        flat.flatNumber.toLowerCase().includes(q) ||
        flat.apartmentName.toLowerCase().includes(q) ||
        flat.zones.some((z) =>
          z.beds.some((b) => b.tenantName?.toLowerCase().includes(q) || b.bedNumber.toLowerCase().includes(q))
        );

      if (!matchesSearch) return false;

      // Filter Chips matching
      const totalCapacity = flat.zones.reduce((acc, z) => acc + z.capacity, 0);
      const totalOccupied = flat.zones.reduce(
        (acc, z) => acc + z.beds.filter((b) => b.status === "occupied" || b.status === "reserved").length,
        0
      );
      const vacantCount = totalCapacity - totalOccupied;

      if (activeFilter === "VACANT") return vacantCount > 0;
      if (activeFilter === "FULL") return vacantCount === 0;
      if (activeFilter === "AC") return flat.zones.some((z) => z.type === "AC");

      return true;
    });
  }, [flats, searchQuery, activeFilter]);

  // --- Bed Action Handler ---
  const handleBedAction = (flatId: string, zoneId: string, bed: Bed) => {
    Alert.alert(
      `Manage Bed ${bed.bedNumber}`,
      `Current Status: ${bed.status.toUpperCase()}${bed.tenantName ? ` (${bed.tenantName})` : ""}`,
      [
        {
          text: "Mark Vacant",
          onPress: () => updateSingleBed(flatId, zoneId, bed.id, "vacant", undefined),
        },
        {
          text: "Assign Tenant",
          onPress: () => {
            if (Alert.prompt) {
              Alert.prompt(
                "Assign Tenant",
                `Enter tenant name for Bed ${bed.bedNumber}:`,
                [
                  { text: "Cancel", style: "cancel" },
                  {
                    text: "Assign",
                    onPress: (name?: string) =>
                      updateSingleBed(flatId, zoneId, bed.id, "occupied", name?.trim() || "Tenant"),
                  },
                ],
                "plain-text"
              );
            } else {
              updateSingleBed(flatId, zoneId, bed.id, "occupied", "Occupied Bed");
            }
          },
        },
        {
          text: "Mark Reserved",
          onPress: () => updateSingleBed(flatId, zoneId, bed.id, "reserved", "Reserved"),
        },
        {
          text: "Maintenance",
          onPress: () => updateSingleBed(flatId, zoneId, bed.id, "maintenance", undefined),
        },
        { text: "Cancel", style: "cancel" },
      ]
    );
  };

  const updateSingleBed = (
    flatId: string,
    zoneId: string,
    bedId: string,
    status: BedStatus,
    tenantName?: string
  ) => {
    const updatedFlats = flats.map((flat) => {
      if (flat.id !== flatId) return flat;

      return {
        ...flat,
        zones: flat.zones.map((zone) => {
          if (zone.id !== zoneId) return zone;

          const updatedBeds = zone.beds.map((b) =>
            b.id === bedId ? { ...b, status, tenantName } : b
          );

          const updatedZone = { ...zone, beds: updatedBeds };
          if (selectedZone?.id === zoneId) {
            setSelectedZone(updatedZone);
          }
          return updatedZone;
        }),
      };
    });

    saveFlatsToStorage(updatedFlats);
  };

  const handleDeleteFlat = useCallback(
    (flatId: string, flatNumber: string) => {
      Alert.alert(
        "Delete Flat",
        `Are you sure you want to remove Flat ${flatNumber}?`,
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Delete",
            style: "destructive",
            onPress: () => {
              const updated = flats.filter((f) => f.id !== flatId);
              saveFlatsToStorage(updated);
            },
          },
        ]
      );
    },
    [flats]
  );

  const openBedMatrix = useCallback((flatId: string, zone: Zone) => {
    setSelectedFlatId(flatId);
    setSelectedZone(zone);
    bottomSheetRef.current?.snapToIndex(1);
  }, []);

  const closeBedMatrix = useCallback(() => {
    bottomSheetRef.current?.close();
  }, []);

  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.6}
      />
    ),
    []
  );

  const renderBedItem: ListRenderItem<Bed> = useCallback(
    ({ item }) => {
      const colors = getStatusColor(item.status);
      return (
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() =>
            selectedFlatId && selectedZone && handleBedAction(selectedFlatId, selectedZone.id, item)
          }
          style={[styles.bedCard, { backgroundColor: colors.bg, borderColor: colors.border }]}
        >
          <Ionicons name="bed" size={22} color={colors.icon} />
          <Text style={styles.bedNumber}>{item.bedNumber}</Text>
          <Text numberOfLines={1} style={[styles.bedStatusText, { color: colors.text }]}>
            {item.status === "occupied"
              ? item.tenantName || "Occupied"
              : item.status.toUpperCase()}
          </Text>
        </TouchableOpacity>
      );
    },
    [selectedFlatId, selectedZone, handleBedAction]
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={TYPOGRAPHY.headerTitle}>PG Rooms &amp; Dashboard</Text>
        <Text style={styles.subtitle}>Instant bed status, occupancy &amp; financial overview</Text>
      </View>

      {/* Global Quick Stats Banner */}
      <View style={styles.statsBanner}>
        <View style={styles.bannerStatBox}>
          <Text style={TYPOGRAPHY.label}>Occupancy</Text>
          <Text style={styles.bannerStatVal}>{globalStats.occupancyRate}%</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.bannerStatBox}>
          <Text style={TYPOGRAPHY.label}>Vacant Beds</Text>
          <Text style={[styles.bannerStatVal, { color: COLORS.success }]}>
            {globalStats.vacantBeds}
          </Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.bannerStatBox}>
          <Text style={TYPOGRAPHY.label}>Est. Revenue</Text>
          <Text style={styles.bannerStatVal}>₹{globalStats.totalRevenue.toLocaleString()}</Text>
        </View>
      </View>

      {/* Search Bar */}
      <View style={styles.searchBarContainer}>
        <Ionicons name="search" size={18} color={COLORS.textMuted} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search flat, tenant, bed..."
          placeholderTextColor={COLORS.textMuted}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery ? (
          <TouchableOpacity onPress={() => setSearchQuery("")}>
            <Ionicons name="close-circle" size={18} color={COLORS.textMuted} />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Filter Chips */}
      <View style={{ height: 38, marginBottom: SPACING.md }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterBar}>
          {(
            [
              { id: "ALL", label: "All Flats" },
              { id: "VACANT", label: "🟢 Has Vacancies" },
              { id: "AC", label: "❄️ AC Zones" },
              { id: "FULL", label: "🔴 Fully Occupied" },
            ] as const
          ).map((chip) => {
            const isActive = activeFilter === chip.id;
            return (
              <TouchableOpacity
                key={chip.id}
                onPress={() => setActiveFilter(chip.id)}
                style={[
                  styles.filterChip,
                  isActive && { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
                ]}
              >
                <Text style={[styles.filterChipText, isActive && { color: COLORS.textWhite }]}>
                  {chip.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Flat List */}
      <FlatList
        data={filteredFlats}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <FlatCard
            flat={item}
            onDelete={handleDeleteFlat}
            onOpenZone={openBedMatrix}
            onQuickToggleBed={(flatId, zoneId, bed) => handleBedAction(flatId, zoneId, bed)}
          />
        )}
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <Ionicons name="business-outline" size={56} color={COLORS.textMuted} />
            <Text style={styles.emptyText}>No matching flats found.</Text>
          </View>
        }
      />

      {/* FAB Button */}
      <TouchableOpacity
        style={styles.fab}
        activeOpacity={0.8}
        onPress={() => router.push("/add-2bhk-flat")}
      >
        <Ionicons name="add" size={32} color={COLORS.textWhite} />
      </TouchableOpacity>

      {/* Bed Matrix Bottom Sheet */}
      <BottomSheet
        ref={bottomSheetRef}
        index={-1}
        snapPoints={snapPoints}
        enablePanDownToClose
        backdropComponent={renderBackdrop}
        backgroundStyle={{ backgroundColor: COLORS.surface }}
        handleIndicatorStyle={{ backgroundColor: COLORS.textMuted, width: 40 }}
      >
        <View style={styles.sheetContent}>
          <View style={styles.modalHeader}>
            <View>
              <Text style={TYPOGRAPHY.headerTitle}>{selectedZone?.zoneName}</Text>
              <Text style={styles.modalSub}>
                ₹{selectedZone?.rentPerBed} / month per bed ({selectedZone?.type})
              </Text>
            </View>
            <TouchableOpacity onPress={closeBedMatrix}>
              <Ionicons name="close-circle-outline" size={28} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>

          <BottomSheetFlatList
          key={`bed-grid-${selectedZone?.id || "none"}-cols-4`} // 👈 ADD THIS KEY PROP
          data={selectedZone?.beds || []}
          keyExtractor={(item) => item.id}
          renderItem={renderBedItem}
          numColumns={4}
          columnWrapperStyle={styles.columnWrapper}
          contentContainerStyle={{ paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
        />
        </View>
      </BottomSheet>
    </View>
  );
}

// --- Stylesheet ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingHorizontal: SPACING.lg,
    paddingTop: 50,
  },
  header: {
    marginBottom: SPACING.sm,
  },moreBedsPill: {
    backgroundColor: "rgba(56, 189, 248, 0.1)",
    borderColor: COLORS.accent,
  },
  moreBedsText: {
    fontSize: 11,
    fontWeight: "700",
    color: COLORS.accent,
  },
  subtitle: {
    color: COLORS.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  statsBanner: {
    flexDirection: "row",
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.md,
    alignItems: "center",
  },
  bannerStatBox: {
    flex: 1,
    alignItems: "center",
  },
  bannerStatVal: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.textPrimary,
    marginTop: 2,
  },
  divider: {
    width: 1,
    height: 24,
    backgroundColor: COLORS.border,
  },
  searchBarContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.md,
    height: 42,
    marginBottom: SPACING.sm,
  },
  searchIcon: {
    marginRight: SPACING.xs,
  },
  searchInput: {
    flex: 1,
    color: COLORS.textPrimary,
    fontSize: 13,
  },
  filterBar: {
    gap: SPACING.xs,
    alignItems: "center",
  },
  filterChip: {
    paddingHorizontal: SPACING.md,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  filterChipText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: "500",
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  topRightRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.xs,
  },
  flatNo: {
    color: COLORS.textPrimary,
    fontSize: 20,
    fontWeight: "700",
  },
  subText: {
    color: COLORS.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: RADIUS.full,
    borderWidth: 1,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "600",
  },
  deleteFlatBtn: {
    padding: SPACING.xs,
  },
  progressContainer: {
    height: 5,
    backgroundColor: COLORS.border,
    borderRadius: 3,
    marginTop: SPACING.md,
    overflow: "hidden",
  },
  progressBar: {
    height: "100%",
    backgroundColor: COLORS.primary,
  },
  revenueRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 6,
    marginBottom: SPACING.md,
  },
  revenueText: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  revenueHighlight: {
    color: COLORS.textPrimary,
    fontWeight: "600",
  },
  occupancyRateText: {
    fontSize: 11,
    color: COLORS.accent,
    fontWeight: "600",
  },
  zonesList: {
    gap: SPACING.sm,
  },
  zoneBox: {
    backgroundColor: COLORS.background,
    padding: SPACING.sm,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  zoneHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: SPACING.xs,
  },
  zoneTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.xs,
  },
  zoneSubMeta: {
    color: COLORS.textSecondary,
    fontSize: 11,
  },
  expandBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  expandBtnText: {
    color: COLORS.accent,
    fontSize: 11,
    fontWeight: "600",
  },
  inlineBedGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 4,
  },
  miniBedPill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    gap: 5,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  miniBedText: {
    fontSize: 11,
    fontWeight: "600",
  },
  fab: {
    position: "absolute",
    right: SPACING.lg,
    bottom: 30,
    width: 56,
    height: 56,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  emptyBox: {
    alignItems: "center",
    marginTop: 80,
  },
  emptyText: {
    color: COLORS.textMuted,
    fontSize: 14,
    marginTop: SPACING.md,
  },
  sheetContent: {
    flex: 1,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.sm,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: SPACING.md,
  },
  modalSub: {
    color: COLORS.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  columnWrapper: {
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  bedCard: {
    flex: 1,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
    alignItems: "center",
  },
  bedNumber: {
    color: COLORS.textPrimary,
    fontWeight: "700",
    fontSize: 13,
    marginTop: SPACING.xs,
  },
  bedStatusText: {
    fontSize: 10,
    marginTop: 2,
    fontWeight: "500",
  },
});