import React, { useEffect, useMemo, useState } from "react";
import {
  FlatList,
  Linking,
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
import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from "@/src/constants/theme";

interface RentItem {
  id: string;
  tenant: string;
  phone?: string;
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
    phone: "9876543210",
    amount: 6500,
    status: "Paid",
    room: "101",
    month: "Jul",
    year: "2026",
  },
  {
    id: "2",
    tenant: "Amit Patel",
    phone: "9876543211",
    amount: 7000,
    status: "Due",
    room: "205",
    month: "Jul",
    year: "2026",
  },
  {
    id: "3",
    tenant: "Priya Shah",
    phone: "9876543212",
    amount: 6000,
    status: "Paid",
    room: "301",
    month: "Jul",
    year: "2026",
  },
  {
    id: "4",
    tenant: "Vikram Malhotra",
    phone: "9876543213",
    amount: 8500,
    status: "Due",
    room: "402",
    month: "Jul",
    year: "2026",
  },
  {
    id: "5",
    tenant: "Karan Mehta",
    phone: "9876543214",
    amount: 7500,
    status: "Paid",
    room: "102",
    month: "Jul",
    year: "2024",
  },
  {
    id: "6",
    tenant: "Suresh Raina",
    phone: "9876543215",
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
  const [historyTenant, setHistoryTenant] = useState<RentItem | null>(null);
  const [whatsappTarget, setWhatsappTarget] = useState<RentItem | null>(null);
  const [customPhoneInput, setCustomPhoneInput] = useState<string>("");
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

  // Open WhatsApp with selected contact number
  const executeWhatsAppSend = (phoneToUse: string, item: RentItem) => {
    if (!phoneToUse.trim()) {
      alert("Please provide a valid phone number!");
      return;
    }
    const cleanPhone = phoneToUse.replace(/[^0-9]/g, "");
    const formattedPhone = cleanPhone.startsWith("91") ? `+${cleanPhone}` : `+91${cleanPhone}`;
    
    const message = encodeURIComponent(
      `Hello ${item.tenant}, your rent of ₹${item.amount.toLocaleString()} for Room ${item.room} (${item.month} ${item.year}) is currently Due. Please clear it at your earliest convenience. - PG ADMIN HUB`,
    );
    const url = `https://wa.me/${formattedPhone}?text=${message}`;
    
    Linking.openURL(url).catch(() => {
      alert("WhatsApp is not installed or unable to open link.");
    });
    setWhatsappTarget(null);
  };

  // Bulk WhatsApp Reminder for All Due Rents in Current Period
  const sendBulkWhatsAppReminders = () => {
    const dueItems = periodRents.filter((r) => r.status === "Due");
    if (dueItems.length === 0) {
      alert("No pending dues found for this month!");
      return;
    }

    const firstItem = dueItems[0];
    const message = encodeURIComponent(
      `Hello ${firstItem.tenant}, your rent of ₹${firstItem.amount.toLocaleString()} for Room ${firstItem.room} (${selectedMonth} ${selectedYear}) is Due. - PG ADMIN HUB`,
    );
    Linking.openURL(`https://wa.me/+91${firstItem.phone || ""}?text=${message}`);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.bgDark} />

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
      <View style={[styles.analyticsCard, isCompactScreen && { padding: SPACING.md }]}>
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
            <Text style={[styles.metricValue, { color: COLORS.success }]}>
              ₹{totalCollected.toLocaleString()}
            </Text>
          </View>
          <View style={styles.metricDivider} />
          <View>
            <Text style={styles.metricLabel}>PENDING DUE</Text>
            <Text style={[styles.metricValue, { color: COLORS.warning }]}>
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
            placeholderTextColor={COLORS.textMuted}
            value={searchRoom}
            onChangeText={setSearchRoom}
          />
          {searchRoom.length > 0 && (
            <TouchableOpacity onPress={() => setSearchRoom("")}>
              <Text style={{ color: COLORS.textSecondary }}>✕</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Quick Filter Tabs & Bulk WhatsApp Option */}
        <View style={{ flexDirection: "row", alignItems: "center", gap: SPACING.sm }}>
          <View style={[styles.segmentedControl, { flex: 1 }]}>
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

          {/* Bulk WhatsApp Reminder Button */}
          {statusTab === "Due" && totalPending > 0 && (
            <TouchableOpacity
              style={styles.bulkRemindBtn}
              onPress={sendBulkWhatsAppReminders}
            >
              <Text style={styles.bulkRemindText}>📢 Bulk Remind</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Tenants List */}
      <FlatList
        data={filteredRents}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: SPACING.xxl }}
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
                <View style={{ flexDirection: "row", alignItems: "center", gap: SPACING.sm }}>
                  {/* Room Pill Badge */}
                  <View style={styles.roomTag}>
                    <Text style={styles.roomTagText}>ROOM {item.room}</Text>
                  </View>

                  {/* WhatsApp Reminder Icon -> Opens Contact Picker Modal */}
                  {!isPaid && (
                    <TouchableOpacity
                      style={styles.remindIconBtn}
                      onPress={() => {
                        setWhatsappTarget(item);
                        setCustomPhoneInput(item.phone || "");
                      }}
                    >
                      <Text style={{ fontSize: 12 }}>💬</Text>
                    </TouchableOpacity>
                  )}
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
                  <TouchableOpacity onPress={() => setHistoryTenant(item)}>
                    <Text style={styles.historyLinkText}>View History ↗</Text>
                  </TouchableOpacity>
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

      {/* WhatsApp Contact Selector / Picker Modal */}
      <Modal
        visible={!!whatsappTarget}
        transparent
        animationType="fade"
        onRequestClose={() => setWhatsappTarget(null)}
      >
        <Pressable
          style={styles.modalBackdrop}
          onPress={() => setWhatsappTarget(null)}
        >
          <View style={styles.modalBox}>
            <View style={styles.historyModalHeader}>
              <View>
                <Text style={styles.modalHeaderTitle}>Select WhatsApp Contact</Text>
                <Text style={styles.modalHeaderSub}>
                  {whatsappTarget?.tenant} • Room {whatsappTarget?.room}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.closeIconBtn}
                onPress={() => setWhatsappTarget(null)}
              >
                <Text style={{ color: COLORS.textPrimary, fontWeight: "700" }}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Registered Phone Option */}
            {whatsappTarget?.phone ? (
              <TouchableOpacity
                style={styles.contactOptionRow}
                onPress={() => executeWhatsAppSend(whatsappTarget.phone!, whatsappTarget)}
              >
                <View>
                  <Text style={{ color: COLORS.textPrimary, fontWeight: "600", fontSize: 13 }}>
                    Registered Contact
                  </Text>
                  <Text style={{ color: COLORS.accent, fontSize: 13, marginTop: 2 }}>
                    +91 {whatsappTarget.phone}
                  </Text>
                </View>
                <Text style={{ color: COLORS.success, fontWeight: "700" }}>Send 💬</Text>
              </TouchableOpacity>
            ) : (
              <Text style={{ color: COLORS.textMuted, fontSize: 12, marginBottom: SPACING.md }}>
                No registered phone number found on file.
              </Text>
            )}

            {/* Custom Phone Number Input Option */}
            <View style={{ marginTop: SPACING.md }}>
              <Text style={{ color: COLORS.textSecondary, fontSize: 12, marginBottom: SPACING.xs }}>
                Or enter custom WhatsApp number:
              </Text>
              <View style={{ flexDirection: "row", gap: SPACING.sm }}>
                <TextInput
                  style={[styles.searchInput, { flex: 1, height: 40 }]}
                  placeholder="Enter 10-digit number"
                  placeholderTextColor={COLORS.textMuted}
                  keyboardType="phone-pad"
                  value={customPhoneInput}
                  onChangeText={setCustomPhoneInput}
                />
                <TouchableOpacity
                  style={[styles.bulkRemindBtn, { paddingHorizontal: SPACING.lg }]}
                  onPress={() => whatsappTarget && executeWhatsAppSend(customPhoneInput, whatsappTarget)}
                >
                  <Text style={styles.bulkRemindText}>Send</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Pressable>
      </Modal>

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
                      <Text style={{ color: COLORS.accent, fontWeight: "700" }}>
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

      {/* Payment History Modal */}
      <Modal
        visible={!!historyTenant}
        transparent
        animationType="fade"
        onRequestClose={() => setHistoryTenant(null)}
      >
        <Pressable
          style={styles.modalBackdrop}
          onPress={() => setHistoryTenant(null)}
        >
          <View style={styles.modalBox}>
            <View style={styles.historyModalHeader}>
              <View>
                <Text style={styles.modalHeaderTitle}>Payment History</Text>
                <Text style={styles.modalHeaderSub}>
                  {historyTenant?.tenant} • Room {historyTenant?.room}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.closeIconBtn}
                onPress={() => setHistoryTenant(null)}
              >
                <Text style={{ color: COLORS.textPrimary, fontWeight: "700" }}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 320 }} showsVerticalScrollIndicator={false}>
              {rents
                .filter((r) => r.tenant === historyTenant?.tenant)
                .map((record) => (
                  <View key={record.id} style={styles.historyRow}>
                    <Text style={{ color: COLORS.textPrimary, fontSize: 13 }}>
                      {record.month} {record.year}
                    </Text>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: SPACING.md }}>
                      <Text style={{ color: COLORS.textSecondary, fontSize: 13 }}>
                        ₹{record.amount.toLocaleString()}
                      </Text>
                      <Text
                        style={{
                          color: record.status === "Paid" ? COLORS.successText : COLORS.warningText,
                          fontWeight: "700",
                          fontSize: 12,
                        }}
                      >
                        {record.status}
                      </Text>
                    </View>
                  </View>
                ))}
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
    backgroundColor: COLORS.background,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.sm,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: SPACING.md,
  },
  brandTitle: {
    color: COLORS.accent,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.2,
  },
  title: {
    color: COLORS.textPrimary,
    fontSize: 22,
    fontWeight: "700",
  },
  monthPill: {
    backgroundColor: COLORS.surface,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  monthPillText: {
    color: COLORS.accent,
    fontSize: 13,
    fontWeight: "600",
  },
  yearRow: {
    marginBottom: SPACING.md,
  },
  yearChip: {
    backgroundColor: COLORS.cardBg,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.lg,
    marginRight: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  activeYearChip: {
    backgroundColor: COLORS.primaryHover,
    borderColor: COLORS.primary,
  },
  yearChipText: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: "600",
  },
  activeYearChipText: {
    color: COLORS.textWhite,
  },
  analyticsCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: SPACING.sm,
  },
  analyticsTitle: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: "600",
  },
  progressPercent: {
    color: COLORS.success,
    fontSize: 12,
    fontWeight: "700",
  },
  progressBarTrack: {
    height: 6,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.full,
    overflow: "hidden",
    marginBottom: SPACING.lg,
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: COLORS.success,
  },
  metricGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  metricLabel: {
    color: COLORS.textMuted,
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
    backgroundColor: COLORS.border,
  },
  filterSection: {
    marginBottom: SPACING.md,
    gap: SPACING.sm,
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.cardBg,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.md,
    height: 42,
  },
  searchIcon: {
    marginRight: SPACING.sm,
    fontSize: 12,
  },
  searchInput: {
    flex: 1,
    color: COLORS.textWhite,
    fontSize: 13,
  },
  segmentedControl: {
    flexDirection: "row",
    backgroundColor: COLORS.cardBg,
    borderRadius: RADIUS.md,
    padding: 3,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 7,
    alignItems: "center",
    borderRadius: RADIUS.sm,
  },
  segmentBtnActive: {
    backgroundColor: COLORS.surface,
  },
  segmentText: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: "600",
  },
  segmentTextActive: {
    color: COLORS.textPrimary,
  },
  bulkRemindBtn: {
    backgroundColor: COLORS.warningBackground,
    paddingHorizontal: SPACING.md,
    paddingVertical: 10,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.warning,
    justifyContent: "center",
    alignItems: "center",
  },
  bulkRemindText: {
    color: COLORS.warningText,
    fontSize: 12,
    fontWeight: "700",
  },
  tenantCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: SPACING.md,
  },
  roomTag: {
    backgroundColor: COLORS.surface,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 3,
    borderRadius: RADIUS.sm,
  },
  roomTagText: {
    color: COLORS.accent,
    fontSize: 11,
    fontWeight: "700",
  },
  remindIconBtn: {
    backgroundColor: COLORS.warningBackground,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 3,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.warning,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: SPACING.sm,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: RADIUS.full,
    marginRight: SPACING.xs,
  },
  paidBadge: { backgroundColor: COLORS.successBackground },
  dueBadge: { backgroundColor: COLORS.warningBackground },
  paidDot: { backgroundColor: COLORS.success },
  dueDot: { backgroundColor: COLORS.warning },
  statusText: { fontSize: 11, fontWeight: "600" },
  paidText: { color: COLORS.successText },
  dueText: { color: COLORS.warningText },
  cardBody: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  tenantName: {
    color: COLORS.textPrimary,
    fontSize: 15,
    fontWeight: "600",
  },
  historyLinkText: {
    color: COLORS.accent,
    fontSize: 11,
    marginTop: 4,
    fontWeight: "600",
  },
  amountText: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: "700",
    marginBottom: SPACING.sm,
  },
  manageBtn: {
    backgroundColor: COLORS.surface,
    paddingHorizontal: SPACING.md,
    paddingVertical: 4,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  manageBtnText: {
    color: COLORS.textSecondary,
    fontSize: 11,
    fontWeight: "600",
  },
  emptyCard: {
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyIcon: {
    fontSize: 28,
    marginBottom: SPACING.sm,
  },
  emptyTitle: {
    color: COLORS.textPrimary,
    fontSize: 15,
    fontWeight: "600",
  },
  emptySub: {
    color: COLORS.textMuted,
    fontSize: 12,
    textAlign: "center",
    marginTop: SPACING.xs,
    paddingHorizontal: SPACING.xxl,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
    padding: SPACING.xl,
  },
  modalBox: {
    width: "100%",
    backgroundColor: COLORS.cardBg,
    borderRadius: RADIUS.xl,
    padding: SPACING.xl,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  modalHeaderTitle: {
    color: COLORS.textWhite,
    fontSize: 17,
    fontWeight: "700",
  },
  modalHeaderSub: {
    color: COLORS.textMuted,
    fontSize: 12,
    marginTop: SPACING.xs,
    marginBottom: SPACING.lg,
  },
  historyModalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: SPACING.md,
  },
  closeIconBtn: {
    backgroundColor: COLORS.surface,
    width: 28,
    height: 28,
    borderRadius: RADIUS.full,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  contactOptionRow: {
    backgroundColor: COLORS.surface,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  monthRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.sm,
  },
  monthRowActive: {
    backgroundColor: COLORS.accentBackground,
  },
  monthRowText: {
    color: COLORS.textSecondary,
    fontSize: 14,
  },
  monthRowTextActive: {
    color: COLORS.textWhite,
    fontWeight: "700",
  },
  historyRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: SPACING.sm + 2,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  actionSubmitBtn: {
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.md,
    alignItems: "center",
    marginBottom: SPACING.sm,
  },
  btnSuccess: { backgroundColor: COLORS.success },
  btnWarning: { backgroundColor: COLORS.warning },
  actionSubmitText: {
    color: COLORS.textWhite,
    fontSize: 14,
    fontWeight: "700",
  },
  actionCancelBtn: {
    paddingVertical: SPACING.md,
    alignItems: "center",
  },
  actionCancelText: {
    color: COLORS.textMuted,
    fontSize: 14,
    fontWeight: "600",
  },
});