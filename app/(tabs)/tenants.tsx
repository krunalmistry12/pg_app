import Ionicons from "@expo/vector-icons/Ionicons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import { router } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import {
  Alert,
  FlatList,
  Linking,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export interface Tenant {
  id: string;
  pgId?: string; // Associated PG / Property ID
  pgName?: string; // PG Name for display
  name: string;
  phone: string;
  room: string;
  bed: string;
  status: "Active" | "Inactive";
  deposit?: string;
  dueDate?: string;
  hasAadhaar?: boolean;
  hasPhoto?: boolean;
  emergencyContact?: string;
}

// Sample default data with multiple PG names
const defaultTenants: Tenant[] = [
  {
    id: "1",
    pgId: "pg1",
    pgName: "Sunrise Heights PG",
    name: "Rahul Sharma",
    phone: "9876543210",
    room: "101",
    bed: "A1",
    status: "Active",
    deposit: "10000",
    dueDate: "5th of every month",
    hasAadhaar: true,
    hasPhoto: true,
    emergencyContact: "9811223344",
  },
  {
    id: "2",
    pgId: "pg2",
    pgName: "Green Villa PG",
    name: "Priya Patel",
    phone: "9123456789",
    room: "202",
    bed: "B2",
    status: "Active",
    deposit: "8000",
    dueDate: "1st of every month",
    hasAadhaar: true,
    hasPhoto: false,
    emergencyContact: "9822334455",
  },
];

export default function TenantsScreen() {
  const [tenants, setTenants] = useState<Tenant[]>(defaultTenants);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPg, setSelectedPg] = useState<string>("ALL"); // Selected PG filter
  const [selectedStatus, setSelectedStatus] = useState<
    "ALL" | "Active" | "Inactive"
  >("ALL");

  const loadTenants = async () => {
    try {
      const data = await AsyncStorage.getItem("tenants");
      if (data) {
        const storedTenants: Tenant[] = JSON.parse(data);
        const combined = [...defaultTenants];
        storedTenants.forEach((st) => {
          if (!combined.some((t) => t.id === st.id)) {
            combined.push(st);
          }
        });
        setTenants(combined);
      }
    } catch (e) {
      console.error("Failed to load tenants:", e);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadTenants();
    }, []),
  );

  // Extract unique PG names for the top filter tabs
  const availablePgs = useMemo(() => {
    const pgs = tenants
      .map((t) => t.pgName)
      .filter((name): name is string => Boolean(name));
    return Array.from(new Set(pgs));
  }, [tenants]);

  // Enhanced Filtering logic
  const filteredTenants = useMemo(() => {
    return tenants.filter((t) => {
      // 1. Filter by PG Name
      const matchesPg = selectedPg === "ALL" || t.pgName === selectedPg;

      // 2. Filter by Status
      const matchesStatus =
        selectedStatus === "ALL" || t.status === selectedStatus;

      // 3. Multi-field Search Query (Name, Phone, Room, Bed, PG Name)
      const q = searchQuery.trim().toLowerCase();
      const matchesSearch =
        q === "" ||
        t.name.toLowerCase().includes(q) ||
        t.phone.includes(q) ||
        t.room.toLowerCase().includes(q) ||
        t.bed.toLowerCase().includes(q) ||
        (t.pgName && t.pgName.toLowerCase().includes(q));

      return matchesPg && matchesStatus && matchesSearch;
    });
  }, [tenants, selectedPg, selectedStatus, searchQuery]);

  const makePhoneCall = async (phoneNumber: string) => {
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
    } catch (err) {
      Alert.alert("Error", "Unable to open phone dialer.");
    }
  };

  const renderTenantItem = ({ item }: { item: Tenant }) => (
    <View style={styles.card}>
      <View style={styles.topRow}>
        <View style={styles.avatarContainer}>
          <Text style={styles.avatarText}>{item.name[0]?.toUpperCase()}</Text>
        </View>

        <View style={styles.nameContainer}>
          <Text style={styles.name}>{item.name}</Text>
          <Text style={styles.phoneSub}>{item.phone}</Text>
          {item.pgName && (
            <View style={styles.pgTagContainer}>
              <Ionicons name="home-outline" size={12} color="#94A3B8" />
              <Text style={styles.pgTagText}>{item.pgName}</Text>
            </View>
          )}
        </View>

        <View
          style={[
            styles.badge,
            {
              backgroundColor: item.status === "Active" ? "#14532D" : "#7F1D1D",
            },
          ]}
        >
          <Text
            style={[
              styles.badgeText,
              {
                color: item.status === "Active" ? "#4ADE80" : "#FCA5A5",
              },
            ]}
          >
            {item.status}
          </Text>
        </View>
      </View>

      <View style={styles.divider} />

      {/* Room & Bed Info */}
      <View style={styles.infoRow}>
        <View style={styles.infoBox}>
          <Ionicons name="business-outline" size={16} color="#3B82F6" />
          <Text style={styles.infoText}>Room {item.room}</Text>
        </View>
        <View style={styles.infoBox}>
          <Ionicons name="bed-outline" size={16} color="#F59E0B" />
          <Text style={styles.infoText}>Bed {item.bed}</Text>
        </View>
      </View>

      {/* Verification Status Badges */}
      <View style={styles.verificationRow}>
        <View
          style={[
            styles.tag,
            item.hasAadhaar ? styles.tagSuccess : styles.tagWarning,
          ]}
        >
          <Ionicons
            name={
              item.hasAadhaar
                ? "checkmark-circle-outline"
                : "alert-circle-outline"
            }
            size={14}
            color={item.hasAadhaar ? "#22C55E" : "#F59E0B"}
          />
          <Text
            style={[
              styles.tagText,
              { color: item.hasAadhaar ? "#22C55E" : "#F59E0B" },
            ]}
          >
            {item.hasAadhaar ? "Aadhaar Verified" : "Aadhaar Missing"}
          </Text>
        </View>

        <View
          style={[
            styles.tag,
            item.hasPhoto ? styles.tagSuccess : styles.tagWarning,
          ]}
        >
          <Ionicons
            name={item.hasPhoto ? "image-outline" : "alert-circle-outline"}
            size={14}
            color={item.hasPhoto ? "#22C55E" : "#F59E0B"}
          />
          <Text
            style={[
              styles.tagText,
              { color: item.hasPhoto ? "#22C55E" : "#F59E0B" },
            ]}
          >
            {item.hasPhoto ? "Photo Attached" : "No Photo"}
          </Text>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionRow}>
        <TouchableOpacity
          style={styles.callButton}
          onPress={() => makePhoneCall(item.phone)}
        >
          <Ionicons name="call-outline" size={18} color="#10B981" />
          <Text style={styles.callButtonText}>Call</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.detailsButton}
          onPress={() =>
            router.push({
              pathname: "/tenant-details" as any,
              params: {
                id: item.id,
                name: item.name,
                phone: item.phone,
                room: item.room,
                bed: item.bed,
                status: item.status,
                pgName: item.pgName ?? "",
                deposit: item.deposit ?? "",
                dueDate: item.dueDate ?? "",
                hasAadhaar: item.hasAadhaar ? "true" : "false",
                hasPhoto: item.hasPhoto ? "true" : "false",
                emergencyContact: item.emergencyContact ?? "",
              },
            })
          }
        >
          <Text style={styles.detailsButtonText}>View Details</Text>
          <Ionicons name="chevron-forward" size={16} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0F172A" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>👥 Tenants</Text>
        <Text style={styles.totalBadge}>{filteredTenants.length} Total</Text>
      </View>

      {/* Horizontal PG Property Selector Filter */}
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
                All PGs
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

      {/* Search Bar & Status Filters */}
      <View style={styles.searchContainer}>
        <Ionicons name="search-outline" size={20} color="#94A3B8" />
        <TextInput
          placeholder="Search name, phone, room, bed..."
          placeholderTextColor="#94A3B8"
          style={styles.searchInput}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery("")}>
            <Ionicons name="close-circle" size={20} color="#94A3B8" />
          </TouchableOpacity>
        )}
      </View>

      {/* Status Filter Toggle Chips */}
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

      {/* Tenant List */}
      <FlatList
        data={filteredTenants}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        renderItem={renderTenantItem}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="people-outline" size={48} color="#475569" />
            <Text style={styles.emptyText}>No tenants found</Text>
          </View>
        }
      />

      {/* Floating Add Button */}
      <TouchableOpacity
        style={styles.fab}
        activeOpacity={0.8}
        onPress={() => router.push("/add-tenant")}
      >
        <Ionicons name="add" size={32} color="#FFFFFF" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0F172A",
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 20,
    marginBottom: 12,
  },
  title: {
    color: "#FFFFFF",
    fontSize: 26,
    fontWeight: "700",
  },
  totalBadge: {
    color: "#94A3B8",
    fontSize: 14,
    backgroundColor: "#1E293B",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  filterSection: {
    marginBottom: 12,
  },
  chip: {
    backgroundColor: "#1E293B",
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginRight: 8,
    borderWidth: 1,
    borderColor: "#334155",
  },
  activeChip: {
    backgroundColor: "#2563EB",
    borderColor: "#3B82F6",
  },
  chipText: {
    color: "#94A3B8",
    fontSize: 13,
    fontWeight: "600",
  },
  activeChipText: {
    color: "#FFFFFF",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1E293B",
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 48,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#334155",
  },
  searchInput: {
    flex: 1,
    color: "#FFFFFF",
    marginLeft: 10,
    fontSize: 15,
  },
  statusRow: {
    flexDirection: "row",
    marginBottom: 16,
    gap: 8,
  },
  statusChip: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 6,
    backgroundColor: "#1E293B",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#334155",
  },
  activeStatusChip: {
    backgroundColor: "#334155",
    borderColor: "#64748B",
  },
  statusChipText: {
    color: "#94A3B8",
    fontSize: 12,
    fontWeight: "600",
  },
  activeStatusChipText: {
    color: "#F8FAFC",
  },
  card: {
    backgroundColor: "#1E293B",
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#334155",
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatarContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#2563EB",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  avatarText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 18,
  },
  nameContainer: {
    flex: 1,
  },
  name: {
    color: "#F8FAFC",
    fontSize: 17,
    fontWeight: "600",
  },
  phoneSub: {
    color: "#94A3B8",
    fontSize: 13,
    marginTop: 2,
  },
  pgTagContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
    gap: 4,
  },
  pgTagText: {
    color: "#38BDF8",
    fontSize: 12,
    fontWeight: "500",
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "600",
  },
  divider: {
    height: 1,
    backgroundColor: "#334155",
    marginVertical: 12,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  infoBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#0F172A",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    width: "48%",
  },
  infoText: {
    color: "#CBD5E1",
    marginLeft: 8,
    fontSize: 13,
    fontWeight: "500",
  },
  verificationRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  tag: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  tagSuccess: {
    backgroundColor: "#10B98110",
    borderColor: "#10B98140",
  },
  tagWarning: {
    backgroundColor: "#F59E0B10",
    borderColor: "#F59E0B40",
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
    backgroundColor: "#10B9811A",
    borderWidth: 1,
    borderColor: "#10B98150",
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 10,
    width: "30%",
  },
  callButtonText: {
    color: "#10B981",
    fontWeight: "600",
    marginLeft: 6,
    fontSize: 13,
  },
  detailsButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#2563EB",
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 10,
    width: "66%",
  },
  detailsButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
    marginRight: 6,
    fontSize: 13,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 60,
  },
  emptyText: {
    color: "#64748B",
    marginTop: 10,
    fontSize: 16,
  },
  fab: {
    position: "absolute",
    right: 20,
    bottom: 25,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#2563EB",
    justifyContent: "center",
    alignItems: "center",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
});
