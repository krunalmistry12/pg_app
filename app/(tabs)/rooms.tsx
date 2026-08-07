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
  ActivityIndicator,
  Alert,
  FlatList,
  ListRenderItem,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from "@/src/constants/theme";
import api from "@/src/services/api";

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
  occupiedBeds?: number;
  vacantBeds?: number;
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
      return {
        bg: "rgba(239, 68, 68, 0.15)",
        border: COLORS.danger,
        text: COLORS.dangerText,
        icon: COLORS.danger,
      };
    case "reserved":
      return {
        bg: "rgba(217, 119, 6, 0.15)",
        border: COLORS.warning,
        text: COLORS.warning,
        icon: COLORS.warning,
      };
    case "maintenance":
      return {
        bg: "rgba(100, 116, 139, 0.2)",
        border: COLORS.textMuted,
        text: COLORS.textMuted,
        icon: COLORS.textMuted,
      };
    case "vacant":
    default:
      return {
        bg: "rgba(16, 185, 129, 0.15)",
        border: COLORS.success,
        text: COLORS.success,
        icon: COLORS.success,
      };
  }
};

// --- Sub-Component: Enhanced Flat Card ---
interface FlatCardProps {
  flat: Flat;
  onDelete: (flatId: string, flatNumber: string) => void;
  onEdit: (flatId: string) => void;
  onOpenZone: (flatId: string, zone: Zone) => void;
  onQuickToggleBed: (flatId: string, zoneId: string, bed: Bed) => void;
}

const FlatCard: React.FC<FlatCardProps> = React.memo(
  ({ flat, onDelete, onEdit, onOpenZone, onQuickToggleBed }) => {
    let totalCapacity = 0;
    let totalOccupied = 0;
    let totalEarning = 0;
    let maxEarning = 0;

    flat.zones?.forEach((z) => {
      const capacity = z.capacity || z.beds?.length || 0;
      const occupiedInZone =
        z.occupiedBeds ??
        (z.beds?.filter(
          (b) => b.status === "occupied" || b.status === "reserved",
        ).length ||
          0);

      totalCapacity += capacity;
      totalOccupied += occupiedInZone;
      totalEarning += occupiedInZone * (z.rentPerBed || 0);
      maxEarning += capacity * (z.rentPerBed || 0);
    });

    const availableBeds = totalCapacity - totalOccupied;
    const occupancyPercent =
      totalCapacity > 0 ? (totalOccupied / totalCapacity) * 100 : 0;

    return (
      <View style={styles.card}>
        {/* Flat Top Header */}
        <View style={styles.topRow}>
          <View>
            <Text style={styles.flatNo}>Flat {flat.flatNumber}</Text>
            <Text style={styles.subText}>
              {flat.apartmentName || "Apartment"} • {flat.zones?.length || 0}{" "}
              Zones
            </Text>
          </View>

          <View style={styles.topRightRow}>
            <View
              style={[
                styles.statusBadge,
                {
                  backgroundColor:
                    availableBeds > 0
                      ? "rgba(16, 185, 129, 0.12)"
                      : "rgba(239, 68, 68, 0.12)",
                  borderColor:
                    availableBeds > 0 ? COLORS.success : COLORS.danger,
                },
              ]}
            >
              <Text
                style={[
                  styles.statusText,
                  {
                    color:
                      availableBeds > 0 ? COLORS.success : COLORS.dangerText,
                  },
                ]}
              >
                {availableBeds > 0 ? `${availableBeds} Vacant Beds` : "Full"}
              </Text>
            </View>

            {/* Edit Button */}
            <TouchableOpacity
              onPress={() => onEdit(flat.id)}
              style={styles.actionIconButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="create-outline" size={18} color={COLORS.accent} />
            </TouchableOpacity>

            {/* Delete Button */}
            <TouchableOpacity
              onPress={() => onDelete(flat.id, flat.flatNumber)}
              style={styles.actionIconButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="trash-outline" size={18} color={COLORS.danger} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Occupancy Progress Bar */}
        <View style={styles.progressContainer}>
          <View
            style={[styles.progressBar, { width: `${occupancyPercent}%` }]}
          />
        </View>

        {/* Financial & Summary Row */}
        <View style={styles.revenueRow}>
          <View>
            <Text style={styles.revenueLabel}>Est. Flat Revenue</Text>
            <Text style={styles.revenueHighlight}>
              ₹{totalEarning.toLocaleString()}{" "}
              <Text style={styles.maxRevenue}>
                / ₹{maxEarning.toLocaleString()}
              </Text>
            </Text>
          </View>
          <View style={{ alignItems: "flex-end" }}>
            <Text style={styles.revenueLabel}>Occupancy</Text>
            <Text style={styles.occupancyRateText}>
              {Math.round(occupancyPercent)}% ({totalOccupied}/{totalCapacity}{" "}
              Beds)
            </Text>
          </View>
        </View>

        {/* Zone Wise Bed View List */}
        <View style={styles.zonesList}>
          {flat.zones?.map((zone, zIdx) => {
            const occupiedInZone =
              zone.occupiedBeds ??
              (zone.beds?.filter(
                (b) => b.status === "occupied" || b.status === "reserved",
              ).length ||
                0);
            const isAc = zone.type === "AC";
            const zoneVacant =
              (zone.capacity || zone.beds?.length || 0) - occupiedInZone;

            // Ensured unique key fallback
            const zoneKey = zone.id || `${flat.id}-zone-${zIdx}`;

            return (
              <View key={zoneKey} style={styles.zoneBox}>
                <View style={styles.zoneHeader}>
                  <View style={styles.zoneTitleRow}>
                    <Ionicons
                      name={isAc ? "snow-outline" : "bed-outline"}
                      size={16}
                      color={isAc ? COLORS.accent : COLORS.textSecondary}
                    />
                    <Text style={styles.zoneTitleText}>{zone.zoneName}</Text>
                    <Text style={styles.zoneSubMeta}>
                      • ₹{zone.rentPerBed}/mo
                    </Text>
                  </View>

                  <TouchableOpacity
                    style={styles.expandBtn}
                    onPress={() => onOpenZone(flat.id, zone)}
                  >
                    <Text style={styles.expandBtnText}>
                      {zoneVacant > 0 ? `${zoneVacant} Vacant` : "Full"}
                    </Text>
                    <Ionicons
                      name="chevron-forward"
                      size={14}
                      color={COLORS.accent}
                    />
                  </TouchableOpacity>
                </View>

                {/* Inline Zone Beds Matrix (Shows All Beds in Card) */}
                <View style={styles.inlineBedGrid}>
                  {zone.beds && zone.beds.length > 0 ? (
                    zone.beds.map((bed, bIdx) => {
                      const colors = getStatusColor(bed.status);
                      const bedKey = bed.id || `${zoneKey}-bed-${bIdx}`;
                      return (
                        <TouchableOpacity
                          key={bedKey}
                          activeOpacity={0.7}
                          onPress={() =>
                            onQuickToggleBed(flat.id, zone.id, bed)
                          }
                          style={[
                            styles.miniBedPill,
                            {
                              backgroundColor: colors.bg,
                              borderColor: colors.border,
                            },
                          ]}
                        >
                          <Ionicons name="bed" size={12} color={colors.icon} />
                          <Text
                            style={[styles.miniBedText, { color: colors.text }]}
                          >
                            {bed.bedNumber}
                          </Text>
                        </TouchableOpacity>
                      );
                    })
                  ) : (
                    <Text style={styles.noBedsText}>
                      No beds configured in this zone
                    </Text>
                  )}
                </View>
              </View>
            );
          })}
        </View>
      </View>
    );
  },
);

// --- Main Screen Component ---
export default function RoomsScreen() {
  const [flats, setFlats] = useState<Flat[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterType>("ALL");

  const [selectedFlatId, setSelectedFlatId] = useState<string | null>(null);
  const [selectedZone, setSelectedZone] = useState<Zone | null>(null);

  const bottomSheetRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => ["50%", "75%"], []);

  // 🌐 --- API Fetch ---
  const fetchFlatsFromAPI = async () => {
    try {
      const storedUserId = await AsyncStorage.getItem("userId");

      if (!storedUserId) {
        console.log("No UserId found in AsyncStorage");
        await loadFromLocalStorage();
        return;
      }

      const response = await api.get(`/Flats/user/${storedUserId}`);

      if (response.data && response.data.success) {
        const rawData = response.data.data ?? [];

        // 🛠️ Mapping backend keys & assigning guaranteed IDs/beds array
        const formattedFlats = rawData.map((flat: any, fIdx: number) => {
          const flatId = flat.id || `flat-${fIdx}`;
          return {
            ...flat,
            id: flatId,
            zones:
              flat.roomBreakup?.map((room: any, rIdx: number) => {
                const zoneId = room.id || `${flatId}-zone-${rIdx}`;
                const capacity = room.capacity || 0;
                const occupiedCount = room.occupiedBeds || 0;

                // Build default beds array if not returned directly from API
                const beds =
                  room.beds ||
                  Array.from({ length: capacity }, (_, bIdx) => ({
                    id: `${zoneId}-bed-${bIdx + 1}`,
                    bedNumber: `B${bIdx + 1}`,
                    status: bIdx < occupiedCount ? "occupied" : "vacant",
                    tenantName: bIdx < occupiedCount ? "Tenant" : undefined,
                  }));

                return {
                  id: zoneId,
                  zoneName: room.zoneName || `Zone ${rIdx + 1}`,
                  type: room.type === 2 ? "AC" : "Non AC",
                  capacity: capacity,
                  occupiedBeds: room.occupiedBeds ?? 0,
                  vacantBeds: room.vacantBeds ?? capacity - occupiedCount,
                  rentPerBed:
                    capacity > 0 ? room.roomRent / capacity : room.roomRent,
                  beds: beds,
                };
              }) || [],
          };
        });

        setFlats(formattedFlats);
        await AsyncStorage.setItem(
          "flats_2bhk",
          JSON.stringify(formattedFlats),
        );
      }
    } catch (error: any) {
      console.log("API Fetch error, loading local cache:", error?.message);
      await loadFromLocalStorage();
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadFromLocalStorage = async () => {
    try {
      const data = await AsyncStorage.getItem("flats_2bhk");
      if (data) {
        setFlats(JSON.parse(data));
      }
    } catch (err) {
      console.error("Failed to load local storage:", err);
    }
  };

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchFlatsFromAPI();
    }, []),
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchFlatsFromAPI();
  };

  // 📊 --- Global Top Header Stats Calculation ---
  const globalStats = useMemo(() => {
    let totalFlats = flats.length;
    let totalBeds = 0;
    let occupiedBeds = 0;
    let totalRevenue = 0;

    flats.forEach((f) => {
      f.zones?.forEach((z) => {
        const zoneCapacity = z.capacity || z.beds?.length || 0;
        totalBeds += zoneCapacity;

        if (z.beds && z.beds.length > 0) {
          z.beds.forEach((b) => {
            if (b.status === "occupied" || b.status === "reserved") {
              occupiedBeds++;
              totalRevenue += z.rentPerBed || 0;
            }
          });
        } else {
          occupiedBeds += z.occupiedBeds || 0;
          totalRevenue += (z.occupiedBeds || 0) * (z.rentPerBed || 0);
        }
      });
    });

    const vacantBeds = totalBeds - occupiedBeds;
    const occupancyRate =
      totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0;

    return {
      totalFlats,
      totalBeds,
      occupiedBeds,
      vacantBeds,
      totalRevenue,
      occupancyRate,
    };
  }, [flats]);

  // --- Filter & Search Logic ---
  const filteredFlats = useMemo(() => {
    return flats.filter((flat) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        flat.flatNumber?.toLowerCase().includes(q) ||
        flat.apartmentName?.toLowerCase().includes(q) ||
        flat.zones?.some((z) =>
          z.beds?.some(
            (b) =>
              b.tenantName?.toLowerCase().includes(q) ||
              b.bedNumber?.toLowerCase().includes(q),
          ),
        );

      if (!matchesSearch) return false;

      const totalCapacity =
        flat.zones?.reduce(
          (acc, z) => acc + (z.capacity || z.beds?.length || 0),
          0,
        ) || 0;
      const totalOccupied =
        flat.zones?.reduce(
          (acc, z) =>
            acc +
            ((z.occupiedBeds ??
              z.beds?.filter(
                (b) => b.status === "occupied" || b.status === "reserved",
              ).length) ||
              0),
          0,
        ) || 0;
      const vacantCount = totalCapacity - totalOccupied;

      if (activeFilter === "VACANT") return vacantCount > 0;
      if (activeFilter === "FULL") return vacantCount === 0;
      if (activeFilter === "AC")
        return flat.zones?.some((z) => z.type === "AC");

      return true;
    });
  }, [flats, searchQuery, activeFilter]);

  // 🌐 --- Bed Update API ---
  const updateSingleBed = async (
    flatId: string,
    zoneId: string,
    bedId: string,
    status: BedStatus,
    tenantName?: string,
  ) => {
    try {
      const updatedFlats = flats.map((flat) => {
        if (flat.id !== flatId) return flat;
        return {
          ...flat,
          zones: flat.zones.map((zone) => {
            if (zone.id !== zoneId) return zone;
            const updatedBeds = zone.beds.map((b) =>
              b.id === bedId ? { ...b, status, tenantName } : b,
            );

            const occupiedCount = updatedBeds.filter(
              (b) => b.status === "occupied" || b.status === "reserved",
            ).length;

            const updatedZone = {
              ...zone,
              beds: updatedBeds,
              occupiedBeds: occupiedCount,
              vacantBeds: zone.capacity - occupiedCount,
            };

            if (selectedZone?.id === zoneId) {
              setSelectedZone(updatedZone);
            }
            return updatedZone;
          }),
        };
      });

      setFlats(updatedFlats);
      await AsyncStorage.setItem("flats_2bhk", JSON.stringify(updatedFlats));

      await api.put(`/Bed/update-status`, {
        bedId,
        status,
        tenantName: tenantName || null,
      });
    } catch (error: any) {
      Alert.alert("Error", "Failed to sync bed status with server.");
      fetchFlatsFromAPI();
    }
  };

  const handleBedAction = (flatId: string, zoneId: string, bed: Bed) => {
    Alert.alert(
      `Manage Bed ${bed.bedNumber}`,
      `Current Status: ${bed.status.toUpperCase()}${
        bed.tenantName ? ` (${bed.tenantName})` : ""
      }`,
      [
        {
          text: "Mark Vacant",
          onPress: () =>
            updateSingleBed(flatId, zoneId, bed.id, "vacant", undefined),
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
                      updateSingleBed(
                        flatId,
                        zoneId,
                        bed.id,
                        "occupied",
                        name?.trim() || "Tenant",
                      ),
                  },
                ],
                "plain-text",
              );
            } else {
              updateSingleBed(
                flatId,
                zoneId,
                bed.id,
                "occupied",
                "Occupied Bed",
              );
            }
          },
        },
        {
          text: "Mark Reserved",
          onPress: () =>
            updateSingleBed(flatId, zoneId, bed.id, "reserved", "Reserved"),
        },
        {
          text: "Maintenance",
          onPress: () =>
            updateSingleBed(flatId, zoneId, bed.id, "maintenance", undefined),
        },
        { text: "Cancel", style: "cancel" },
      ],
    );
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
            onPress: async () => {
              try {
                await api.delete(`/Flat/${flatId}`);
                const updated = flats.filter((f) => f.id !== flatId);
                setFlats(updated);
                await AsyncStorage.setItem(
                  "flats_2bhk",
                  JSON.stringify(updated),
                );
              } catch (error: any) {
                Alert.alert(
                  "Error",
                  error?.response?.data?.message || "Failed to delete flat",
                );
              }
            },
          },
        ],
      );
    },
    [flats],
  );

  const handleEditFlat = useCallback((flatId: string) => {
    router.push({
      pathname: "/add-2bhk-flat",
      params: { flatId },
    });
  }, []);

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
    [],
  );

  const renderBedItem: ListRenderItem<Bed> = useCallback(
    ({ item, index }) => {
      const colors = getStatusColor(item.status);
      return (
        <TouchableOpacity
          key={item.id || `sheet-bed-${index}`}
          activeOpacity={0.7}
          onPress={() =>
            selectedFlatId &&
            selectedZone &&
            handleBedAction(selectedFlatId, selectedZone.id, item)
          }
          style={[
            styles.bedCard,
            { backgroundColor: colors.bg, borderColor: colors.border },
          ]}
        >
          <Ionicons name="bed" size={22} color={colors.icon} />
          <Text style={styles.bedNumber}>{item.bedNumber}</Text>
          <Text
            numberOfLines={1}
            style={[styles.bedStatusText, { color: colors.text }]}
          >
            {item.status === "occupied"
              ? item.tenantName || "Occupied"
              : item.status.toUpperCase()}
          </Text>
        </TouchableOpacity>
      );
    },
    [selectedFlatId, selectedZone],
  );

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={styles.header}>
        <Text style={TYPOGRAPHY.headerTitle}>PG Rooms & Dashboard</Text>
        <Text style={styles.subtitle}>
          {globalStats.totalFlats} Flats • {globalStats.totalBeds} Total Beds
        </Text>
      </View>

      {/* Global Quick Stats Banner (Top Header Total Data) */}
      <View style={styles.statsBanner}>
        <View style={styles.bannerStatBox}>
          <Text style={TYPOGRAPHY.label}>Total Revenue</Text>
          <Text style={[styles.bannerStatVal, { color: COLORS.primary }]}>
            ₹{globalStats.totalRevenue.toLocaleString()}
          </Text>
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
          <Text style={TYPOGRAPHY.label}>Occupancy</Text>
          <Text style={styles.bannerStatVal}>{globalStats.occupancyRate}%</Text>
        </View>
      </View>

      {/* Search Bar */}
      <View style={styles.searchBarContainer}>
        <Ionicons
          name="search"
          size={18}
          color={COLORS.textMuted}
          style={styles.searchIcon}
        />
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
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterBar}
        >
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
                  isActive && {
                    backgroundColor: COLORS.primary,
                    borderColor: COLORS.primary,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    isActive && { color: COLORS.textWhite },
                  ]}
                >
                  {chip.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Flat List / Loader */}
      {loading ? (
        <View style={styles.loaderBox}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Fetching Flats & Rooms...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredFlats}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={COLORS.primary}
            />
          }
          renderItem={({ item }) => (
            <FlatCard
              flat={item}
              onDelete={handleDeleteFlat}
              onEdit={handleEditFlat}
              onOpenZone={openBedMatrix}
              onQuickToggleBed={(flatId, zoneId, bed) =>
                handleBedAction(flatId, zoneId, bed)
              }
            />
          )}
          contentContainerStyle={{ paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Ionicons
                name="business-outline"
                size={56}
                color={COLORS.textMuted}
              />
              <Text style={styles.emptyText}>No matching flats found.</Text>
            </View>
          }
        />
      )}

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
              <Text style={TYPOGRAPHY.headerTitle}>
                {selectedZone?.zoneName}
              </Text>
              <Text style={styles.modalSub}>
                ₹
                {selectedZone?.rentPerBed
                  ? Math.round(selectedZone.rentPerBed)
                  : 0}{" "}
                / month per bed ({selectedZone?.type})
              </Text>
            </View>
            <TouchableOpacity onPress={closeBedMatrix}>
              <Ionicons
                name="close-circle-outline"
                size={28}
                color={COLORS.textSecondary}
              />
            </TouchableOpacity>
          </View>

          <BottomSheetFlatList
            data={selectedZone?.beds || []}
            keyExtractor={(item, index) => item.id || `bed-${index}`}
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
    marginBottom: SPACING.xs,
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
    marginVertical: SPACING.md,
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
    paddingVertical: 3,
    borderRadius: RADIUS.full,
    borderWidth: 1,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "600",
  },
  actionIconButton: {
    padding: 4,
  },
  progressContainer: {
    height: 6,
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
    marginTop: 8,
    marginBottom: SPACING.md,
    paddingHorizontal: 2,
  },
  revenueLabel: {
    fontSize: 10,
    color: COLORS.textMuted,
    textTransform: "uppercase",
    fontWeight: "600",
  },
  revenueHighlight: {
    color: COLORS.textPrimary,
    fontSize: 14,
    fontWeight: "700",
  },
  maxRevenue: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: "400",
  },
  occupancyRateText: {
    fontSize: 13,
    color: COLORS.accent,
    fontWeight: "700",
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
    gap: 6,
  },
  zoneTitleText: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.textPrimary,
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
    marginTop: 6,
  },
  miniBedPill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    gap: 4,
  },
  miniBedText: {
    fontSize: 11,
    fontWeight: "700",
  },
  noBedsText: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontStyle: "italic",
  },
  loaderBox: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 40,
  },
  loadingText: {
    marginTop: 10,
    color: COLORS.textSecondary,
    fontSize: 13,
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
