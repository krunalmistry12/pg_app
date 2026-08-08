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
  status: BedStatus | number;
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

// --- Helper Functions for Bed Status Colors & Safety ---
const getSafeStatus = (status: any): string => {
  const s = String(status).toLowerCase();
  if (s === "2" || s === "occupied") return "OCCUPIED";
  if (s === "3" || s === "reserved") return "RESERVED";
  if (s === "4" || s === "maintenance") return "MAINTENANCE";
  return "VACANT";
};

const getStatusColor = (status: BedStatus | number | string) => {
  const statusStr = String(status).toLowerCase();

  if (statusStr === "occupied" || statusStr === "2") {
    return {
      bg: "rgba(239, 68, 68, 0.12)",
      border: "rgba(239, 68, 68, 0.3)",
      text: COLORS.dangerText,
      icon: COLORS.danger,
    };
  }
  if (statusStr === "reserved" || statusStr === "3") {
    return {
      bg: "rgba(217, 119, 6, 0.12)",
      border: "rgba(217, 119, 6, 0.3)",
      text: COLORS.warning,
      icon: COLORS.warning,
    };
  }
  if (statusStr === "maintenance" || statusStr === "4") {
    return {
      bg: "rgba(100, 116, 139, 0.15)",
      border: "rgba(100, 116, 139, 0.3)",
      text: COLORS.textMuted,
      icon: COLORS.textMuted,
    };
  }
  return {
    bg: "rgba(16, 185, 129, 0.12)",
    border: "rgba(16, 185, 129, 0.3)",
    text: COLORS.success,
    icon: COLORS.success,
  };
};

// --- Sub-Component: Flat Card (Memoized for High Performance) ---
interface FlatCardProps {
  flat: Flat;
  onEdit: (flatId: string) => void;
  onOpenZone: (flatId: string, zone: Zone) => void;
  onQuickToggleBed: (flatId: string, zoneId: string, bed: Bed) => void;
}

const FlatCard: React.FC<FlatCardProps> = React.memo(
  ({ flat, onEdit, onOpenZone, onQuickToggleBed }) => {
    let totalCapacity = 0;
    let totalOccupied = 0;
    let totalEarning = 0;
    let maxEarning = 0;

    flat.zones?.forEach((z) => {
      const capacity = z.capacity || z.beds?.length || 0;
      const occupiedInZone =
        z.beds?.filter((b) => {
          const status = String(b.status).toLowerCase();
          return (
            status === "occupied" ||
            status === "reserved" ||
            status === "2" ||
            status === "3"
          );
        }).length ??
        z.occupiedBeds ??
        0;

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
          <View style={{ flex: 1 }}>
            <Text style={styles.flatNo}>Flat {flat.flatNumber}</Text>
            <Text style={styles.subText} numberOfLines={1}>
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
                {availableBeds > 0 ? `${availableBeds} Vacant` : "Full"}
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
          </View>
        </View>

        {/* Occupancy Progress Bar */}
        <View style={styles.progressContainer}>
          <View
            style={[
              styles.progressBar,
              { width: `${Math.min(occupancyPercent, 100)}%` },
            ]}
          />
        </View>

        {/* Financial & Summary Row */}
        <View style={styles.revenueRow}>
          <View>
            <Text style={styles.revenueLabel}>Est. Revenue</Text>
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
              {Math.round(occupancyPercent)}% ({totalOccupied}/{totalCapacity})
            </Text>
          </View>
        </View>

        {/* Zone Wise Bed View List */}
        <View style={styles.zonesList}>
          {flat.zones?.map((zone, zIdx) => {
            const occupiedInZone =
              zone.beds?.filter((b) => {
                const status = String(b.status).toLowerCase();
                return (
                  status === "occupied" ||
                  status === "reserved" ||
                  status === "2" ||
                  status === "3"
                );
              }).length ??
              zone.occupiedBeds ??
              0;

            const isAc = zone.type === "AC";
            const zoneCapacity = zone.capacity || zone.beds?.length || 0;
            const zoneVacant = zoneCapacity - occupiedInZone;
            const zoneKey = zone.id || `${flat.id}-zone-${zIdx}`;

            return (
              <View key={zoneKey} style={styles.zoneBox}>
                <View style={styles.zoneHeader}>
                  <View style={styles.zoneTitleRow}>
                    <Ionicons
                      name={isAc ? "snow-outline" : "bed-outline"}
                      size={15}
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
                    activeOpacity={0.7}
                  >
                    <Text style={styles.expandBtnText}>
                      {zoneVacant > 0 ? `${zoneVacant} Vacant` : "Full"}
                    </Text>
                    <Ionicons
                      name="chevron-forward"
                      size={13}
                      color={COLORS.accent}
                    />
                  </TouchableOpacity>
                </View>

                {/* Inline Zone Beds Matrix (Optimized Container) */}
                <View style={styles.inlineBedGrid}>
                  {zone.beds && zone.beds.length > 0 ? (
                    zone.beds.slice(0, 8).map((bed, bIdx) => {
                      const colors = getStatusColor(bed.status);
                      const isOccupied =
                        String(bed.status).toLowerCase() === "occupied" ||
                        bed.status === 2;
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
                          <View style={styles.miniBedTopRow}>
                            <Ionicons name="bed" size={9} color={colors.icon} />
                            <Text
                              style={[
                                styles.miniBedText,
                                { color: colors.text },
                              ]}
                              numberOfLines={1}
                            >
                              {bed.bedNumber}
                            </Text>
                          </View>
                          {isOccupied && bed.tenantName ? (
                            <Text
                              numberOfLines={1}
                              ellipsizeMode="tail"
                              style={[
                                styles.miniTenantText,
                                { color: colors.text },
                              ]}
                            >
                              {bed.tenantName}
                            </Text>
                          ) : (
                            <Text
                              numberOfLines={1}
                              style={[
                                styles.miniTenantText,
                                { color: COLORS.textMuted },
                              ]}
                            >
                              Vacant
                            </Text>
                          )}
                        </TouchableOpacity>
                      );
                    })
                  ) : (
                    <Text style={styles.noBedsText}>No beds configured</Text>
                  )}
                  {zone.beds && zone.beds.length > 8 && (
                    <TouchableOpacity
                      style={styles.moreBedsBadge}
                      onPress={() => onOpenZone(flat.id, zone)}
                    >
                      <Text style={styles.moreBedsText}>
                        +{zone.beds.length - 8} more
                      </Text>
                    </TouchableOpacity>
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
  const snapPoints = useMemo(() => ["55%", "85%"], []);

  // 🌐 --- API Fetch with Stale-While-Revalidate ---
  const fetchFlatsFromAPI = async () => {
    try {
      const storedUserId = await AsyncStorage.getItem("userId");
const storedToken = await AsyncStorage.getItem("token");

    console.log("👉 CHECKING STORAGE -> userId:", storedUserId, "| token:", storedToken ? "Available" : "Missing");
      if (!storedUserId) {
        await loadFromLocalStorage();
        return;
      }

      // Load cache first for instant feedback
      const cached = await AsyncStorage.getItem("flats_2bhk");
      if (cached && flats.length === 0) {
        setFlats(JSON.parse(cached));
        setLoading(false);
      }

      const response = await api.get(`/Flats/user/${storedUserId}`);
      if (response.data && response.data.success) {
        const rawData = response.data.data ?? [];

        const formattedFlats = rawData.map((flat: any, fIdx: number) => {
          const flatId = flat.id || `flat-${fIdx}`;
          return {
            ...flat,
            id: flatId,
            zones:
              flat.roomBreakup?.map((room: any, rIdx: number) => {
                const zoneId = room.id || `${flatId}-zone-${rIdx}`;
                const capacity = room.capacity || 0;

                const beds =
                  room.beds?.map((b: any, bIdx: number) => {
                    let normalizedStatus: BedStatus | number = "vacant";
                    const rawStatus = b.status;

                    if (
                      rawStatus === 2 ||
                      String(rawStatus).toLowerCase() === "occupied"
                    ) {
                      normalizedStatus = "occupied";
                    } else if (
                      rawStatus === 3 ||
                      String(rawStatus).toLowerCase() === "reserved"
                    ) {
                      normalizedStatus = "reserved";
                    } else if (
                      rawStatus === 4 ||
                      String(rawStatus).toLowerCase() === "maintenance"
                    ) {
                      normalizedStatus = "maintenance";
                    } else {
                      normalizedStatus = "vacant";
                    }

                    return {
                      id: b.id || `${zoneId}-bed-${bIdx}`,
                      bedNumber: b.bedNumber || `B${bIdx + 1}`,
                      status: normalizedStatus,
                      tenantName: b.tenantName || undefined,
                    };
                  }) ||
                  Array.from({ length: capacity }, (_, bIdx) => ({
                    id: `${zoneId}-bed-${bIdx + 1}`,
                    bedNumber: `B${bIdx + 1}`,
                    status: "vacant" as BedStatus,
                    tenantName: undefined,
                  }));

                const actualOccupiedCount = beds.filter(
                  (b: any) =>
                    b.status === "occupied" ||
                    b.status === "reserved" ||
                    b.status === 2 ||
                    b.status === 3,
                ).length;

                return {
                  id: zoneId,
                  zoneName: room.zoneName || `Zone ${rIdx + 1}`,
                  type: room.type === 2 ? "AC" : "Non AC",
                  capacity: capacity,
                  occupiedBeds: actualOccupiedCount,
                  vacantBeds: capacity - actualOccupiedCount,
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
      if (flats.length === 0) setLoading(true);
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
            const status = String(b.status).toLowerCase();
            if (
              status === "occupied" ||
              status === "reserved" ||
              status === "2" ||
              status === "3"
            ) {
              occupiedBeds++;
              totalRevenue += z.rentPerBed || 0;
            }
          });
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

      let totalCapacity = 0;
      let totalOccupied = 0;

      flat.zones?.forEach((z) => {
        const capacity = z.capacity || z.beds?.length || 0;
        const occupied =
          z.beds?.filter((b) => {
            const status = String(b.status).toLowerCase();
            return (
              status === "occupied" ||
              status === "reserved" ||
              status === "2" ||
              status === "3"
            );
          }).length || 0;
        totalCapacity += capacity;
        totalOccupied += occupied;
      });

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
    status: BedStatus | number,
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

            const occupiedCount = updatedBeds.filter((b) => {
              const s = String(b.status).toLowerCase();
              return (
                s === "occupied" || s === "reserved" || s === "2" || s === "3"
              );
            }).length;

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

      let numericStatus = 1;
      const s = String(status).toLowerCase();
      if (s === "occupied" || s === "2") numericStatus = 2;
      else if (s === "reserved" || s === "3") numericStatus = 3;
      else if (s === "maintenance" || s === "4") numericStatus = 4;

      await api.put(`/Bed/update-status`, {
        bedId,
        status: numericStatus,
        tenantName: tenantName || null,
      });
    } catch (error: any) {
      Alert.alert("Error", "Failed to sync bed status with server.");
      fetchFlatsFromAPI();
    }
  };

  const handleBedAction = (flatId: string, zoneId: string, bed: Bed) => {
    const safeStatusStr = getSafeStatus(bed.status);
    Alert.alert(
      `Manage Bed ${bed.bedNumber}`,
      `Current Status: ${safeStatusStr}${
        bed.tenantName ? ` (${bed.tenantName})` : ""
      }`,
      [
        {
          text: "Mark Vacant",
          onPress: () => updateSingleBed(flatId, zoneId, bed.id, 1, undefined),
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
                        2,
                        name?.trim() || "Tenant",
                      ),
                  },
                ],
                "plain-text",
              );
            } else {
              updateSingleBed(flatId, zoneId, bed.id, 2, "Occupied Bed");
            }
          },
        },
        {
          text: "Mark Reserved",
          onPress: () => updateSingleBed(flatId, zoneId, bed.id, 3, "Reserved"),
        },
        {
          text: "Maintenance",
          onPress: () => updateSingleBed(flatId, zoneId, bed.id, 4, undefined),
        },
        { text: "Cancel", style: "cancel" },
      ],
    );
  };

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
      const safeStatus = getSafeStatus(item.status);
      const isOccupied =
        String(item.status).toLowerCase() === "occupied" || item.status === 2;
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

          {isOccupied && item.tenantName ? (
            <Text
              numberOfLines={1}
              style={[styles.tenantNameTopText, { color: colors.text }]}
            >
              {item.tenantName}
            </Text>
          ) : null}

          <Text style={styles.bedNumber}>{item.bedNumber}</Text>

          <Text
            numberOfLines={1}
            style={[styles.bedStatusText, { color: colors.text }]}
          >
            {isOccupied ? "Occupied" : safeStatus}
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

      {/* Global Quick Stats Banner */}
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

      {/* Flat List with Performance Enhancements */}
      {loading && flats.length === 0 ? (
        <View style={styles.loaderBox}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Fetching Flats & Rooms...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredFlats}
          keyExtractor={(item) => item.id}
          initialNumToRender={6}
          maxToRenderPerBatch={6}
          windowSize={7}
          removeClippedSubviews={true}
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
            <View style={{ flex: 1 }}>
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
    fontSize: 18,
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
    fontSize: 13,
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
    flex: 1,
  },
  zoneTitleText: {
    fontSize: 12,
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
    gap: 5,
    marginTop: 4,
  },
  miniBedPill: {
    width: "23%",
    paddingHorizontal: 4,
    paddingVertical: 5,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    alignItems: "center",
    overflow: "hidden",
  },
  miniBedTopRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  miniBedText: {
    fontSize: 9,
    fontWeight: "700",
  },
  miniTenantText: {
    fontSize: 8.5,
    fontWeight: "600",
    marginTop: 2,
    textAlign: "center",
    width: "100%",
  },
  moreBedsBadge: {
    width: "23%",
    paddingVertical: 6,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
    justifyContent: "center",
  },
  moreBedsText: {
    fontSize: 9,
    color: COLORS.accent,
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
  tenantNameTopText: {
    fontSize: 10,
    fontWeight: "700",
    marginTop: 3,
    textAlign: "center",
  },
  bedStatusText: {
    fontSize: 10,
    marginTop: 2,
    fontWeight: "500",
  },
});
