import React, { useEffect, useMemo, useState } from "react";
import {
  FlatList,
  Modal,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";

interface RentItem {
  id: string;
  tenant: string;
  amount: number;
  status: "Paid" | "Due";
  room: string;
  month: string;
  year: string;
}

const initialRents: RentItem[] = [
  {
    id: "1",
    tenant: "Rahul Sharma",
    amount: 6500,
    status: "Paid",
    room: "101",
    month: "Jul",
    year: "2026",
  },
  {
    id: "2",
    tenant: "Amit Patel",
    amount: 7000,
    status: "Due",
    room: "205",
    month: "Jul",
    year: "2026",
  },
  {
    id: "3",
    tenant: "Priya Shah",
    amount: 6000,
    status: "Paid",
    room: "301",
    month: "Jul",
    year: "2026",
  },
  {
    id: "4",
    tenant: "Vikram Malhotra",
    amount: 8500,
    status: "Due",
    room: "402",
    month: "Jul",
    year: "2026",
  },
  {
    id: "5",
    tenant: "Karan Mehta",
    amount: 7500,
    status: "Paid",
    room: "102",
    month: "Jul",
    year: "2024",
  },
  {
    id: "6",
    tenant: "Suresh Raina",
    amount: 6000,
    status: "Paid",
    room: "201",
    month: "Jul",
    year: "2026",
  },
];

const ALL_MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

type FilterTab = "All" | "Paid" | "Due";

export default function RentManagement() {
  const [rents, setRents] = useState<RentItem[]>(initialRents);
  const [searchRoom, setSearchRoom] = useState<string>("");
  const [statusTab, setStatusTab] = useState<FilterTab>("All");
  const [selectedTenant, setSelectedTenant] = useState<RentItem | null>(null);
  const [isMonthPickerVisible, setIsMonthPickerVisible] =
    useState<boolean>(false);

  const { width } = useWindowDimensions();
  const isCompactScreen = width < 380;

  // Dynamic Year Extraction
  const availableYears = useMemo(() => {
    const existingYears = rents.map((r) => r.year).filter(Boolean);
    const uniqueYears = Array.from(new Set(existingYears));
    return uniqueYears.sort((a, b) => Number(b) - Number(a));
  }, [rents]);

  const [selectedYear, setSelectedYear] = useState<string>(
    availableYears[0] || "2026",
  );
  const [selectedMonth, setSelectedMonth] = useState<string>("Jul");

  useEffect(() => {
    if (availableYears.length > 0 && !availableYears.includes(selectedYear)) {
      setSelectedYear(availableYears[0]);
    }
  }, [availableYears, selectedYear]);

  // Toggle Payment Status
  const toggleStatus = (id: string) => {
    if (!id) return;
    setRents((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, status: item.status === "Paid" ? "Due" : "Paid" }
          : item,
      ),
    );
    setSelectedTenant(null);
  };

  // Safe Multi-layer Filtering
  const filteredRents = rents.filter((item) => {
    const matchesYear = item.year === selectedYear;
    const matchesMonth = item.month === selectedMonth;
    const matchesTab = statusTab === "All" || item.status === statusTab;
    const searchLower = searchRoom.trim().toLowerCase();
    const matchesSearch =
      item.room.toLowerCase().includes(searchLower) ||
      item.tenant.toLowerCase().includes(searchLower);

    return matchesYear && matchesMonth && matchesTab && matchesSearch;
  });

  // Calculate Metrics for Current Period
  const periodRents = rents.filter(
    (r) => r.year === selectedYear && r.month === selectedMonth,
  );
  const totalCollected = periodRents
    .filter((r) => r.status === "Paid")
    .reduce((sum, r) => sum + r.amount, 0);

  const totalPending = periodRents
    .filter((r) => r.status === "Due")
    .reduce((sum, r) => sum + r.amount, 0);

  const totalBilled = totalCollected + totalPending;
  const collectionPercentage =
    totalBilled > 0 ? Math.round((totalCollected / totalBilled) * 100) : 0;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0B0F19" />

      {/* Header Bar */}
      <View style={styles.header}>
        <View>
          <Text style={styles.brandTitle}>PG ADMIN HUB</Text>
          <Text style={styles.title}>Rent Collection</Text>
        </View>

        {/* Month Selector Pill */}
        <TouchableOpacity
          style={styles.monthPill}
          onPress={() => setIsMonthPickerVisible(true)}
        >
          <Text style={styles.monthPillText}>
            📅 {selectedMonth} {selectedYear} ▾
          </Text>
        </TouchableOpacity>
      </View>

      {/* Year Tabs */}
      {availableYears.length > 0 && (
        <View style={styles.yearRow}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {availableYears.map((y) => {
              const active = y === selectedYear;
              return (
                <TouchableOpacity
                  key={y}
                  style={[styles.yearChip, active && styles.activeYearChip]}
                  onPress={() => setSelectedYear(y)}
                >
                  <Text
                    style={[
                      styles.yearChipText,
                      active && styles.activeYearChipText,
                    ]}
                  >
                    {y}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      )}

      {/* Overview Analytics Banner */}
      <View style={[styles.analyticsCard, isCompactScreen && { padding: 12 }]}>
        <View style={styles.progressHeader}>
          <Text style={styles.analyticsTitle}>Collection Overview</Text>
          <Text style={styles.progressPercent}>
            {collectionPercentage}% Paid
          </Text>
        </View>

        {/* Visual Progress Bar */}
        <View style={styles.progressBarTrack}>
          <View
            style={[
              styles.progressBarFill,
              { width: `${collectionPercentage}%` },
            ]}
          />
        </View>

        <View style={styles.metricGrid}>
          <View>
            <Text style={styles.metricLabel}>COLLECTED</Text>
            <Text style={[styles.metricValue, { color: "#10B981" }]}>
              ₹{totalCollected.toLocaleString()}
            </Text>
          </View>
          <View style={styles.metricDivider} />
          <View>
            <Text style={styles.metricLabel}>PENDING DUE</Text>
            <Text style={[styles.metricValue, { color: "#F59E0B" }]}>
              ₹{totalPending.toLocaleString()}
            </Text>
          </View>
        </View>
      </View>

      {/* Search & Status Filter Section */}
      <View style={styles.filterSection}>
        <View style={styles.searchBox}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search tenant or room..."
            placeholderTextColor="#64748B"
            value={searchRoom}
            onChangeText={setSearchRoom}
          />
          {searchRoom.length > 0 && (
            <TouchableOpacity onPress={() => setSearchRoom("")}>
              <Text style={{ color: "#94A3B8" }}>✕</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Quick Filter Tabs */}
        <View style={styles.segmentedControl}>
          {(["All", "Paid", "Due"] as FilterTab[]).map((tab) => {
            const active = statusTab === tab;
            return (
              <TouchableOpacity
                key={tab}
                style={[styles.segmentBtn, active && styles.segmentBtnActive]}
                onPress={() => setStatusTab(tab)}
              >
                <Text
                  style={[
                    styles.segmentText,
                    active && styles.segmentTextActive,
                  ]}
                >
                  {tab}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Tenants List */}
      <FlatList
        data={filteredRents}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 20 }}
        ListEmptyComponent={
          <View style={styles.emptyCard}>
            <Text style={styles.emptyIcon}>📋</Text>
            <Text style={styles.emptyTitle}>No Tenant Records</Text>
            <Text style={styles.emptySub}>
              No {statusTab !== "All" ? statusTab.toLowerCase() : ""} records
              for {selectedMonth} {selectedYear} matching "{searchRoom}".
            </Text>
          </View>
        }
        renderItem={({ item }) => {
          const isPaid = item.status === "Paid";
          return (
            <View style={styles.tenantCard}>
              <View style={styles.cardHeader}>
                {/* Room Pill Badge */}
                <View style={styles.roomTag}>
                  <Text style={styles.roomTagText}>ROOM {item.room}</Text>
                </View>

                {/* Status Badge */}
                <View
                  style={[
                    styles.statusBadge,
                    isPaid ? styles.paidBadge : styles.dueBadge,
                  ]}
                >
                  <View
                    style={[
                      styles.statusDot,
                      isPaid ? styles.paidDot : styles.dueDot,
                    ]}
                  />
                  <Text
                    style={[
                      styles.statusText,
                      isPaid ? styles.paidText : styles.dueText,
                    ]}
                  >
                    {item.status}
                  </Text>
                </View>
              </View>

              <View style={styles.cardBody}>
                <View>
                  <Text style={styles.tenantName}>{item.tenant}</Text>
                  <Text style={styles.billingPeriod}>
                    Billing Period: {item.month} {item.year}
                  </Text>
                </View>

                <View style={{ alignItems: "flex-end" }}>
                  <Text style={styles.amountText}>
                    ₹{item.amount.toLocaleString()}
                  </Text>
                  {/* Action Button */}
                  <TouchableOpacity
                    style={styles.manageBtn}
                    onPress={() => setSelectedTenant(item)}
                  >
                    <Text style={styles.manageBtnText}>Action ›</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          );
        }}
      />

      {/* Month Selection Modal */}
      <Modal
        visible={isMonthPickerVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsMonthPickerVisible(false)}
      >
        <Pressable
          style={styles.modalBackdrop}
          onPress={() => setIsMonthPickerVisible(false)}
        >
          <View style={styles.modalBox}>
            <Text style={styles.modalHeaderTitle}>
              Select Month ({selectedYear})
            </Text>
            <ScrollView style={{ maxHeight: 300 }}>
              {ALL_MONTHS.map((m) => {
                const isSelected = m === selectedMonth;
                return (
                  <TouchableOpacity
                    key={m}
                    style={[
                      styles.monthRow,
                      isSelected && styles.monthRowActive,
                    ]}
                    onPress={() => {
                      setSelectedMonth(m);
                      setIsMonthPickerVisible(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.monthRowText,
                        isSelected && styles.monthRowTextActive,
                      ]}
                    >
                      {m}
                    </Text>
                    {isSelected && (
                      <Text style={{ color: "#38BDF8", fontWeight: "700" }}>
                        ✓
                      </Text>
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </Pressable>
      </Modal>

      {/* Tenant Action Sheet Modal */}
      <Modal
        visible={!!selectedTenant}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedTenant(null)}
      >
        <Pressable
          style={styles.modalBackdrop}
          onPress={() => setSelectedTenant(null)}
        >
          <View style={styles.modalBox}>
            <Text style={styles.modalHeaderTitle}>Update Payment Record</Text>
            <Text style={styles.modalHeaderSub}>
              {selectedTenant?.tenant} • Room {selectedTenant?.room} (
              {selectedTenant?.month} {selectedTenant?.year})
            </Text>

            <TouchableOpacity
              style={[
                styles.actionSubmitBtn,
                selectedTenant?.status === "Paid"
                  ? styles.btnWarning
                  : styles.btnSuccess,
              ]}
              onPress={() => selectedTenant && toggleStatus(selectedTenant.id)}
            >
              <Text style={styles.actionSubmitText}>
                {selectedTenant?.status === "Paid"
                  ? "Mark as Pending (Due)"
                  : "Mark as Received (Paid)"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionCancelBtn}
              onPress={() => setSelectedTenant(null)}
            >
              <Text style={styles.actionCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0B0F19",
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  brandTitle: {
    color: "#38BDF8",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.2,
  },
  title: {
    color: "#F8FAFC",
    fontSize: 22,
    fontWeight: "700",
  },
  monthPill: {
    backgroundColor: "#1E293B",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#334155",
  },
  monthPillText: {
    color: "#38BDF8",
    fontSize: 13,
    fontWeight: "600",
  },
  yearRow: {
    marginBottom: 14,
  },
  yearChip: {
    backgroundColor: "#111827",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 12,
    marginRight: 8,
    borderWidth: 1,
    borderColor: "#1E293B",
  },
  activeYearChip: {
    backgroundColor: "#2563EB",
    borderColor: "#3B82F6",
  },
  yearChipText: {
    color: "#64748B",
    fontSize: 12,
    fontWeight: "600",
  },
  activeYearChipText: {
    color: "#FFFFFF",
  },
  analyticsCard: {
    backgroundColor: "#111827",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#1E293B",
  },
  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  analyticsTitle: {
    color: "#94A3B8",
    fontSize: 12,
    fontWeight: "600",
  },
  progressPercent: {
    color: "#10B981",
    fontSize: 12,
    fontWeight: "700",
  },
  progressBarTrack: {
    height: 6,
    backgroundColor: "#1E293B",
    borderRadius: 3,
    overflow: "hidden",
    marginBottom: 14,
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: "#10B981",
  },
  metricGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  metricLabel: {
    color: "#64748B",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  metricValue: {
    fontSize: 18,
    fontWeight: "700",
    marginTop: 2,
  },
  metricDivider: {
    width: 1,
    height: 28,
    backgroundColor: "#1E293B",
  },
  filterSection: {
    marginBottom: 14,
    gap: 10,
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#111827",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#1E293B",
    paddingHorizontal: 12,
    height: 42,
  },
  searchIcon: {
    marginRight: 8,
    fontSize: 12,
  },
  searchInput: {
    flex: 1,
    color: "#FFFFFF",
    fontSize: 13,
  },
  segmentedControl: {
    flexDirection: "row",
    backgroundColor: "#111827",
    borderRadius: 10,
    padding: 3,
    borderWidth: 1,
    borderColor: "#1E293B",
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 7,
    alignItems: "center",
    borderRadius: 8,
  },
  segmentBtnActive: {
    backgroundColor: "#1E293B",
  },
  segmentText: {
    color: "#64748B",
    fontSize: 12,
    fontWeight: "600",
  },
  segmentTextActive: {
    color: "#F8FAFC",
  },
  tenantCard: {
    backgroundColor: "#111827",
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#1E293B",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  roomTag: {
    backgroundColor: "#1E293B",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  roomTagText: {
    color: "#38BDF8",
    fontSize: 11,
    fontWeight: "700",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  paidBadge: { backgroundColor: "rgba(16, 185, 129, 0.12)" },
  dueBadge: { backgroundColor: "rgba(245, 158, 11, 0.12)" },
  paidDot: { backgroundColor: "#10B981" },
  dueDot: { backgroundColor: "#F59E0B" },
  statusText: { fontSize: 11, fontWeight: "600" },
  paidText: { color: "#34D399" },
  dueText: { color: "#FBBF24" },
  cardBody: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  tenantName: {
    color: "#F8FAFC",
    fontSize: 15,
    fontWeight: "600",
  },
  billingPeriod: {
    color: "#64748B",
    fontSize: 11,
    marginTop: 2,
  },
  amountText: {
    color: "#F8FAFC",
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 6,
  },
  manageBtn: {
    backgroundColor: "#1E293B",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#334155",
  },
  manageBtnText: {
    color: "#94A3B8",
    fontSize: 11,
    fontWeight: "600",
  },
  emptyCard: {
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyIcon: {
    fontSize: 28,
    marginBottom: 8,
  },
  emptyTitle: {
    color: "#F8FAFC",
    fontSize: 15,
    fontWeight: "600",
  },
  emptySub: {
    color: "#64748B",
    fontSize: 12,
    textAlign: "center",
    marginTop: 4,
    paddingHorizontal: 20,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalBox: {
    width: "100%",
    backgroundColor: "#111827",
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: "#1E293B",
  },
  modalHeaderTitle: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "700",
  },
  modalHeaderSub: {
    color: "#64748B",
    fontSize: 12,
    marginTop: 4,
    marginBottom: 16,
  },
  monthRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  monthRowActive: {
    backgroundColor: "rgba(56, 189, 248, 0.1)",
  },
  monthRowText: {
    color: "#94A3B8",
    fontSize: 14,
  },
  monthRowTextActive: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  actionSubmitBtn: {
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 10,
  },
  btnSuccess: { backgroundColor: "#10B981" },
  btnWarning: { backgroundColor: "#EAB308" },
  actionSubmitText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
  actionCancelBtn: {
    paddingVertical: 12,
    alignItems: "center",
  },
  actionCancelText: {
    color: "#64748B",
    fontSize: 14,
    fontWeight: "600",
  },
});
