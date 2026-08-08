import Ionicons from "@expo/vector-icons/Ionicons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import { router } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Linking,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { getTenantsByUserIdApi } from "../../src/services/tenantApi";

export const THEME = {
  colors: {
    bgDark: "#0F172A",
    cardBg: "#1E293B",
    cardBgSubtle: "#0F172A",
    primary: "#2563EB",
    primaryHover: "#1D4ED8",
    border: "#334155",
    textPrimary: "#F8FAFC",
    textSecondary: "#94A3B8",
    textMuted: "#64748B",
    accent: "#38BDF8",
    successBg: "#10B98115",
    successBorder: "#10B98140",
    successText: "#34D399",
    warningBg: "#F59E0B15",
    warningBorder: "#F59E0B40",
    warningText: "#FBBF24",
    dangerBg: "#EF444415",
    dangerText: "#F87171",
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
  },
  radius: {
    sm: 6,
    md: 10,
    lg: 14,
    full: 9999,
  },
};

export interface Tenant {
  id: string;
  pgId?: string;
  pgName?: string;
  name: string;
  phone: string;
  room: string;
  bed?: string;
  allocationType?: string;
  status: "Active" | "Inactive";
  deposit?: string;
  dueDate?: string;
  hasIdProof?: boolean;
  hasPhoto?: boolean;
  policeVerificationStatus?: string;
  emergencyContact?: string;
  rawItem?: any;
}

const TenantCard = React.memo(
  ({
    item,
    onCall,
    onViewDetails,
  }: {
    item: Tenant;
    onCall: (phone: string) => void;
    onViewDetails: (item: Tenant) => void;
  }) => {
    const getPoliceBadgeStyle = (status?: string) => {
      switch (status) {
        case "VERIFIED":
          return {
            bg: THEME.colors.successBg,
            border: THEME.colors.successBorder,
            text: THEME.colors.successText,
            label: "Police Verified",
          };
        case "IN_PROGRESS":
          return {
            bg: THEME.colors.warningBg,
            border: THEME.colors.warningBorder,
            text: THEME.colors.warningText,
            label: "Police Verification Pending",
          };
        default:
          return {
            bg: THEME.colors.dangerBg,
            border: THEME.colors.dangerBg,
            text: THEME.colors.dangerText,
            label: "Police Verification Not Started",
          };
      }
    };

    const policeBadge = getPoliceBadgeStyle(item.policeVerificationStatus);

    // Check karein ki bed maujood hai ya nahi
    const hasBed = Boolean(item.bed && item.allocationType !== "FULL_ROOM");

    return (
      <View style={styles.card}>
        {/* Top Header Row */}
        <View style={styles.topRow}>
          <View style={styles.avatarContainer}>
            <Text style={styles.avatarText}>{item.name[0]?.toUpperCase()}</Text>
          </View>

          <View style={styles.nameContainer}>
            <Text style={styles.name}>{item.name}</Text>
            <Text style={styles.phoneSub}>{item.phone}</Text>
            {item.pgName && (
              <View style={styles.pgTagContainer}>
                <Ionicons
                  name="business"
                  size={12}
                  color={THEME.colors.textSecondary}
                />
                <Text style={styles.pgTagText}>{item.pgName}</Text>
              </View>
            )}
          </View>

          <View
            style={[
              styles.statusBadge,
              {
                backgroundColor:
                  item.status === "Active"
                    ? THEME.colors.successBg
                    : THEME.colors.dangerBg,
                borderColor:
                  item.status === "Active"
                    ? THEME.colors.successBorder
                    : THEME.colors.dangerBg,
              },
            ]}
          >
            <Text
              style={[
                styles.statusBadgeText,
                {
                  color:
                    item.status === "Active"
                      ? THEME.colors.successText
                      : THEME.colors.dangerText,
                },
              ]}
            >
              {item.status}
            </Text>
          </View>
        </View>

        <View style={styles.divider} />

        {/* Room & Bed/Allocation Info */}
        <View style={styles.infoRow}>
          {/* Agar bed nahi hai toh room poori width (100%) le lega */}
          <View
            style={[styles.infoBox, !hasBed && { width: "100%" }]}
          >
            <Ionicons
              name="business-outline"
              size={15}
              color={THEME.colors.accent}
            />
            <Text style={styles.infoText} numberOfLines={1}>
              Room: {item.room}
            </Text>
          </View>

          {/* Agar Full Room hai toh Full Room show karega, warna agar bed hai toh Bed show karega */}
          {item.allocationType === "FULL_ROOM" ? (
            <View style={styles.infoBox}>
              <Ionicons
                name="home-outline"
                size={15}
                color={THEME.colors.accent}
              />
              <Text style={styles.infoText} numberOfLines={1}>
                Type: Full Room
              </Text>
            </View>
          ) : (
            hasBed && (
              <View style={styles.infoBox}>
                <Ionicons
                  name="bed-outline"
                  size={15}
                  color={THEME.colors.warningText}
                />
                <Text style={styles.infoText} numberOfLines={1}>
                  Bed: {item.bed}
                </Text>
              </View>
            )
          )}
        </View>

        {/* Document & Verification Badges */}
        <View style={styles.verificationRow}>
          <View
            style={[
              styles.tag,
              item.hasIdProof ? styles.tagSuccess : styles.tagWarning,
            ]}
          >
            <Ionicons
              name={item.hasIdProof ? "checkmark-circle" : "alert-circle"}
              size={13}
              color={
                item.hasIdProof
                  ? THEME.colors.successText
                  : THEME.colors.warningText
              }
            />
            <Text
              style={[
                styles.tagText,
                {
                  color: item.hasIdProof
                    ? THEME.colors.successText
                    : THEME.colors.warningText,
                },
              ]}
            >
              {item.hasIdProof ? "ID Verified" : "ID Pending"}
            </Text>
          </View>

          <View
            style={[
              styles.tag,
              {
                backgroundColor: policeBadge.bg,
                borderColor: policeBadge.border,
              },
            ]}
          >
            <Ionicons
              name={
                item.policeVerificationStatus === "VERIFIED"
                  ? "shield-checkmark"
                  : "shield-outline"
              }
              size={13}
              color={policeBadge.text}
            />
            <Text style={[styles.tagText, { color: policeBadge.text }]}>
              {policeBadge.label}
            </Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={styles.callButton}
            onPress={() => onCall(item.phone)}
            activeOpacity={0.7}
          >
            <Ionicons
              name="call-outline"
              size={16}
              color={THEME.colors.successText}
            />
            <Text style={styles.callButtonText}>Call</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.detailsButton}
            activeOpacity={0.8}
            onPress={() => onViewDetails(item)}
          >
            <Text style={styles.detailsButtonText}>View Profile</Text>
            <Ionicons name="chevron-forward" size={15} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>
    );
  },
);

export default function TenantsScreen() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPg, setSelectedPg] = useState<string>("ALL");
  const [selectedStatus, setSelectedStatus] = useState<
    "ALL" | "Active" | "Inactive"
  >("ALL");

  const loadTenants = async () => {
    try {
      const storedUserId = await AsyncStorage.getItem("userId");
      if (!storedUserId) {
        Alert.alert(
          "Authentication Error",
          "User ID not found. Please log in again.",
        );
        setLoading(false);
        setRefreshing(false);
        return;
      }

      const cachedData = await AsyncStorage.getItem("cached_tenants_list");
      if (cachedData) {
        setTenants(JSON.parse(cachedData));
        setLoading(false);
      }

      const data = await getTenantsByUserIdApi(storedUserId);
      const apiData = Array.isArray(data) ? data : data?.data || [];

      const mappedTenants: Tenant[] = apiData.map((item: any) => {
        const roomDisplay =
          item.roomName ||
          item.roomNumber ||
          item.flatNumber ||
          (item.roomId ? `Room ${item.roomId}` : "N/A");

        // Allocation type detection (Agar backend se FULL_ROOM hai ya bed info nahi hai)
        const allocation = 
          item.allocationType || 
          item.bookingType || 
          (item.bedNumber || item.bedId ? "BED" : "FULL_ROOM");

        // Agar allocation FULL_ROOM hai, toh bedDisplay ko strictly undefined kar do
        const isFullRoom = allocation === "FULL_ROOM" || String(allocation).toLowerCase().includes("full");

        const bedDisplay = isFullRoom
          ? undefined
          : item.bedNumber ||
            item.bedName ||
            (item.bedId ? `Bed ${item.bedId}` : undefined);

        const rawStatus = item.status;
        let isActive = false;
        if (
          rawStatus === 1 ||
          rawStatus === true ||
          String(rawStatus).toLowerCase() === "active" ||
          String(rawStatus).toLowerCase() === "1" ||
          String(rawStatus).toLowerCase() === "true"
        ) {
          isActive = true;
        }

        return {
          id: String(item.id || item.tenantId || ""),
          pgId: String(item.propertyId || item.flatId || ""),
          pgName:
            item.apartmentName ||
            (item.flatNumber ? `Flat ${item.flatNumber}` : "Property"),
          name: item.name || "Unknown Tenant",
          phone: item.phone || "",
          room: String(roomDisplay),
          bed: bedDisplay ? String(bedDisplay) : undefined,
          allocationType: isFullRoom ? "FULL_ROOM" : String(allocation),
          status: isActive ? "Active" : "Inactive",
          deposit: item.deposit ? String(item.deposit) : "0",
          dueDate: item.dueDate ? `${item.dueDate}th of every month` : "N/A",
          hasIdProof: Boolean(item.idProofUrl || item.idProofNumber),
          hasPhoto: Boolean(item.tenantPhotoUrl),
          policeVerificationStatus:
            item.policeVerificationStatus || "NOT_STARTED",
          emergencyContact: item.emergencyPhone || "",
          rawItem: item,
        };
      });

      setTenants(mappedTenants);
      await AsyncStorage.setItem(
        "cached_tenants_list",
        JSON.stringify(mappedTenants),
      );
    } catch (error: any) {
      console.error("Error fetching tenants:", error?.message || error);
      const cachedData = await AsyncStorage.getItem("cached_tenants_list");
      if (cachedData) {
        setTenants(JSON.parse(cachedData));
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      if (tenants.length === 0) {
        setLoading(true);
      }
      loadTenants();
    }, []),
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadTenants();
  }, []);

  const availablePgs = useMemo(() => {
    const pgs = tenants
      .map((t) => t.pgName)
      .filter((name): name is string => Boolean(name));
    return Array.from(new Set(pgs));
  }, [tenants]);

  const filteredTenants = useMemo(() => {
    return tenants.filter((t) => {
      const matchesPg = selectedPg === "ALL" || t.pgName === selectedPg;
      const matchesStatus =
        selectedStatus === "ALL" || t.status === selectedStatus;
      const q = searchQuery.trim().toLowerCase();
      const matchesSearch =
        q === "" ||
        t.name.toLowerCase().includes(q) ||
        t.phone.includes(q) ||
        t.room.toLowerCase().includes(q) ||
        (t.bed && t.bed.toLowerCase().includes(q)) ||
        (t.pgName && t.pgName.toLowerCase().includes(q));

      return matchesPg && matchesStatus && matchesSearch;
    });
  }, [tenants, selectedPg, selectedStatus, searchQuery]);

  const makePhoneCall = useCallback(async (phoneNumber: string) => {
    if (!phoneNumber) {
      Alert.alert("Error", "Phone number not available.");
      return;
    }
    const url = `tel:${phoneNumber}`;
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert(
          "Error",
          "Phone call function is not supported on this device.",
        );
      }
    } catch {
      Alert.alert("Error", "Unable to open phone dialer.");
    }
  }, []);

  const handleViewDetails = useCallback((item: Tenant) => {
    router.push({
      pathname: "/tenant-details" as any,
      params: {
        id: item.id,
        tenantData: JSON.stringify(item.rawItem || item),
      },
    });
  }, []);

  const renderTenantItem = useCallback(
    ({ item }: { item: Tenant }) => {
      return (
        <TenantCard
          item={item}
          onCall={makePhoneCall}
          onViewDetails={handleViewDetails}
        />
      );
    },
    [makePhoneCall, handleViewDetails],
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        barStyle="light-content"
        backgroundColor={THEME.colors.bgDark}
      />

      <View style={styles.mainWrapper}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTitleRow}>
            <Ionicons name="people" size={22} color={THEME.colors.primary} />
            <Text style={styles.title}>Tenant Directory</Text>
          </View>
          <Text style={styles.totalBadge}>
            {filteredTenants.length} Records
          </Text>
        </View>

        {/* Property Selector Chips */}
        {availablePgs.length > 0 && (
          <View style={styles.filterSection}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <TouchableOpacity
                style={[styles.chip, selectedPg === "ALL" && styles.activeChip]}
                onPress={() => setSelectedPg("ALL")}
              >
                <Text
                  style={[
                    styles.chipText,
                    selectedPg === "ALL" && styles.activeChipText,
                  ]}
                >
                  All Properties
                </Text>
              </TouchableOpacity>
              {availablePgs.map((pgName) => (
                <TouchableOpacity
                  key={pgName}
                  style={[
                    styles.chip,
                    selectedPg === pgName && styles.activeChip,
                  ]}
                  onPress={() => setSelectedPg(pgName)}
                >
                  <Text
                    style={[
                      styles.chipText,
                      selectedPg === pgName && styles.activeChipText,
                    ]}
                  >
                    {pgName}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Ionicons
            name="search-outline"
            size={18}
            color={THEME.colors.textMuted}
          />
          <TextInput
            placeholder="Search by name, phone, room..."
            placeholderTextColor={THEME.colors.textMuted}
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <Ionicons
                name="close-circle"
                size={18}
                color={THEME.colors.textMuted}
              />
            </TouchableOpacity>
          )}
        </View>

        {/* Status Segment Control */}
        <View style={styles.statusRow}>
          {(["ALL", "Active", "Inactive"] as const).map((status) => (
            <TouchableOpacity
              key={status}
              style={[
                styles.statusChip,
                selectedStatus === status && styles.activeStatusChip,
              ]}
              onPress={() => setSelectedStatus(status)}
            >
              <Text
                style={[
                  styles.statusChipText,
                  selectedStatus === status && styles.activeStatusChipText,
                ]}
              >
                {status}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Tenant FlatList */}
        {loading && tenants.length === 0 ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color={THEME.colors.primary} />
            <Text style={styles.loadingText}>Loading Tenants...</Text>
          </View>
        ) : (
          <FlatList
            data={filteredTenants}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ paddingBottom: 100 }}
            showsVerticalScrollIndicator={false}
            renderItem={renderTenantItem}
            initialNumToRender={10}
            maxToRenderPerBatch={10}
            windowSize={7}
            removeClippedSubviews={true}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={THEME.colors.primary}
              />
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons
                  name="folder-open-outline"
                  size={44}
                  color={THEME.colors.textMuted}
                />
                <Text style={styles.emptyText}>
                  No matching tenant records found
                </Text>
              </View>
            }
          />
        )}
      </View>

      {/* FAB (Add Tenant) */}
      <TouchableOpacity
        style={styles.fab}
        activeOpacity={0.85}
        onPress={() => router.push("/add-tenant")}
      >
        <Ionicons name="add" size={28} color="#FFFFFF" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.colors.bgDark,
  },
  mainWrapper: {
    flex: 1,
    paddingHorizontal: THEME.spacing.lg,
    paddingTop: THEME.spacing.sm,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: THEME.spacing.sm,
    marginBottom: THEME.spacing.md,
  },
  headerTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: THEME.spacing.sm,
  },
  title: {
    color: THEME.colors.textPrimary,
    fontSize: 22,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  totalBadge: {
    color: THEME.colors.textSecondary,
    fontSize: 12,
    fontWeight: "600",
    backgroundColor: THEME.colors.cardBg,
    paddingHorizontal: THEME.spacing.md,
    paddingVertical: 5,
    borderRadius: THEME.radius.full,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  filterSection: {
    marginBottom: THEME.spacing.md,
  },
  chip: {
    backgroundColor: THEME.colors.cardBg,
    borderRadius: THEME.radius.md,
    paddingHorizontal: THEME.spacing.md,
    paddingVertical: THEME.spacing.sm,
    marginRight: THEME.spacing.sm,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  activeChip: {
    backgroundColor: THEME.colors.primary,
    borderColor: THEME.colors.primaryHover,
  },
  chipText: {
    color: THEME.colors.textSecondary,
    fontSize: 13,
    fontWeight: "600",
  },
  activeChipText: {
    color: THEME.colors.textPrimary,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: THEME.colors.cardBg,
    borderRadius: THEME.radius.md,
    paddingHorizontal: THEME.spacing.md,
    height: 46,
    marginBottom: THEME.spacing.md,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  searchInput: {
    flex: 1,
    color: THEME.colors.textPrimary,
    marginLeft: THEME.spacing.sm,
    fontSize: 14,
  },
  statusRow: {
    flexDirection: "row",
    marginBottom: THEME.spacing.lg,
    gap: THEME.spacing.sm,
  },
  statusChip: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 9,
    backgroundColor: THEME.colors.cardBg,
    borderRadius: THEME.radius.md,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  activeStatusChip: {
    backgroundColor: THEME.colors.border,
    borderColor: THEME.colors.textMuted,
  },
  statusChipText: {
    color: THEME.colors.textSecondary,
    fontSize: 12,
    fontWeight: "600",
  },
  activeStatusChipText: {
    color: THEME.colors.textPrimary,
  },
  card: {
    backgroundColor: THEME.colors.cardBg,
    borderRadius: THEME.radius.lg,
    padding: THEME.spacing.lg,
    marginBottom: THEME.spacing.md,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatarContainer: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: THEME.colors.primary,
    justifyContent: "center",
    alignItems: "center",
    marginRight: THEME.spacing.md,
  },
  avatarText: {
    color: THEME.colors.textPrimary,
    fontWeight: "700",
    fontSize: 16,
  },
  nameContainer: {
    flex: 1,
  },
  name: {
    color: THEME.colors.textPrimary,
    fontSize: 16,
    fontWeight: "600",
  },
  phoneSub: {
    color: THEME.colors.textSecondary,
    fontSize: 12,
    marginTop: 1,
  },
  pgTagContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
    gap: 4,
  },
  pgTagText: {
    color: THEME.colors.accent,
    fontSize: 11,
    fontWeight: "500",
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: THEME.radius.sm,
    borderWidth: 1,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: "600",
  },
  divider: {
    height: 1,
    backgroundColor: THEME.colors.border,
    marginVertical: THEME.spacing.md,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: THEME.spacing.sm,
  },
  infoBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: THEME.colors.cardBgSubtle,
    paddingHorizontal: THEME.spacing.md,
    paddingVertical: THEME.spacing.sm,
    borderRadius: THEME.radius.sm,
    width: "48%",
  },
  infoText: {
    color: THEME.colors.textPrimary,
    marginLeft: THEME.spacing.sm,
    fontSize: 12,
    fontWeight: "500",
    flex: 1,
  },
  verificationRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: THEME.spacing.lg,
  },
  tag: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: THEME.spacing.sm,
    paddingVertical: 4,
    borderRadius: THEME.radius.sm,
    borderWidth: 1,
  },
  tagSuccess: {
    backgroundColor: THEME.colors.successBg,
    borderColor: THEME.colors.successBorder,
  },
  tagWarning: {
    backgroundColor: THEME.colors.warningBg,
    borderColor: THEME.colors.warningBorder,
  },
  tagText: {
    fontSize: 11,
    fontWeight: "600",
    marginLeft: 4,
  },
  actionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  callButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: THEME.colors.successBg,
    borderWidth: 1,
    borderColor: THEME.colors.successBorder,
    paddingVertical: 9,
    paddingHorizontal: THEME.spacing.md,
    borderRadius: THEME.radius.md,
    width: "28%",
  },
  callButtonText: {
    color: THEME.colors.successText,
    fontWeight: "600",
    marginLeft: 6,
    fontSize: 12,
  },
  detailsButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: THEME.colors.primary,
    paddingVertical: 9,
    paddingHorizontal: THEME.spacing.md,
    borderRadius: THEME.radius.md,
    width: "68%",
  },
  detailsButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
    marginRight: 4,
    fontSize: 12,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 50,
  },
  loadingText: {
    color: THEME.colors.textMuted,
    marginTop: THEME.spacing.sm,
    fontSize: 13,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 60,
  },
  emptyText: {
    color: THEME.colors.textMuted,
    marginTop: THEME.spacing.sm,
    fontSize: 14,
  },
  fab: {
    position: "absolute",
    right: THEME.spacing.lg,
    bottom: 25,
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: THEME.colors.primary,
    justifyContent: "center",
    alignItems: "center",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
});