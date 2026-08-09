import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import React, { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Linking,
  Modal,
  Pressable,
  RefreshControl,
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

import { COLORS, RADIUS, SPACING } from "@/src/constants/theme";
import api from "@/src/services/api";

// --- Types & Interfaces ---
export interface RentItem {
  id: string;
  tenant: string;
  phone?: string;
  amount: number;
  status: "Paid" | "Due";
  room: string;
  month: string;
  year: string;
}

type FilterTab = "All" | "Paid" | "Due";

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

export default function RentManagement() {
  const [rents, setRents] = useState<RentItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

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

  const currentYearStr = new Date().getFullYear().toString();
  const [selectedYear, setSelectedYear] = useState<string>(currentYearStr);
  const [selectedMonth, setSelectedMonth] = useState<string>(
    ALL_MONTHS[new Date().getMonth()],
  );

  const availableYears = useMemo(() => {
    const existingYears = rents.map((r) => r.year).filter(Boolean);
    const uniqueYears = Array.from(new Set([currentYearStr, ...existingYears]));
    return uniqueYears.sort((a, b) => Number(b) - Number(a));
  }, [rents, currentYearStr]);
 
  // =========================================================================
  // 🌐 API CALL: Fetch Rent Records
  // =========================================================================
  const fetchRentRecords = useCallback(async () => {
    try {
      setLoading(true);
      const monthIndex = ALL_MONTHS.indexOf(selectedMonth) + 1;

      // C# Enum mapping for API parameter (1 = PAID, 2 = PENDING)
      let statusParam: number | string | undefined = undefined;
      if (statusTab === "Paid") statusParam = 1;
      if (statusTab === "Due") statusParam = 2;

      const response = await api.get("/Rent/admin/all-records", {
        params: {
          month: monthIndex,
          year: selectedYear,
          status: statusParam,
          search: searchRoom.trim() || undefined,
        },
      });

      if (response.data?.success) {
        const mappedData: RentItem[] = (response.data.data || []).map(
          (item: any) => {
            // C# Enum Check: 1 = PAID, 2 = PENDING, 3 = PARTIAL, 4 = OVERDUE
            const rawStatus = item.status ?? item.paymentStatus;
            const isPaid =
              rawStatus === 1 ||
              rawStatus === "1" ||
              String(rawStatus).toUpperCase() === "PAID" ||
              item.isPaid === true;

            return {
              id: String(item.id || item.rentId || Math.random()),
              tenant: item.tenantName || item.tenant || "Unknown",
              phone: item.phoneNumber || item.phone || "",
              amount: Number(item.amount || item.totalAmount || 0),
              status: isPaid ? "Paid" : "Due",
              room: String(item.roomNumber || item.room || "N/A"),
              month: item.monthName || selectedMonth,
              year: String(item.year || selectedYear),
            };
          },
        );

        setRents(mappedData);
      } else {
        Alert.alert(
          "Error",
          response.data?.message || "Failed to fetch rent records.",
        );
      }
    } catch (error: any) {
      console.error("Error fetching rent records:", error);
      Alert.alert(
        "Error",
        error?.response?.data?.message ||
          "Network error while loading rent records.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedMonth, selectedYear, statusTab, searchRoom]);

  useFocusEffect(
    useCallback(() => {
      fetchRentRecords();
    }, [fetchRentRecords]),
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchRentRecords();
  }, [fetchRentRecords]);

  // =========================================================================
  // 🌐 API CALL: Record Payment
  // =========================================================================
  const handleRecordPayment = async (item: RentItem) => {
    try {
      const response = await api.post("/Rent/record-payment", {
        rentId: item.id,
        amountPaid: item.amount,
        paymentMode: "Cash",
      });

      if (response.data?.success) {
        Alert.alert("Success", "Payment recorded successfully!");
        setSelectedTenant(null);
        fetchRentRecords();
      } else {
        Alert.alert(
          "Error",
          response.data?.message || "Failed to record payment.",
        );
      }
    } catch (error: any) {
      console.error("Error recording payment:", error);
      Alert.alert(
        "Error",
        error?.response?.data?.message ||
          "Something went wrong while recording payment.",
      );
    }
  };

  const toggleStatus = (tenantItem: RentItem) => {
    if (tenantItem.status === "Due") {
      handleRecordPayment(tenantItem);
    } else {
      Alert.alert("Notice", "Reversing paid records is restricted.");
      setSelectedTenant(null);
    }
  };

  // Analytics Calculations
  const periodRents = rents;
  const totalCollected = periodRents
    .filter((r) => r.status === "Paid")
    .reduce((sum, r) => sum + r.amount, 0);

  const totalPending = periodRents
    .filter((r) => r.status === "Due")
    .reduce((sum, r) => sum + r.amount, 0);

  const totalBilled = totalCollected + totalPending;
  const collectionPercentage =
    totalBilled > 0 ? Math.round((totalCollected / totalBilled) * 100) : 0;

  const executeWhatsAppSend = (phoneToUse: string, item: RentItem) => {
    if (!phoneToUse.trim()) {
      Alert.alert("Validation", "Please provide a valid phone number!");
      return;
    }
    const cleanPhone = phoneToUse.replace(/[^0-9]/g, "");
    const formattedPhone = cleanPhone.startsWith("91")
      ? `+${cleanPhone}`
      : `+91${cleanPhone}`;

    const message = encodeURIComponent(
      `Hello ${item.tenant}, your rent of ₹${item.amount.toLocaleString()} for Room ${item.room} (${item.month} ${item.year}) is currently Due. Please clear it at your earliest convenience. - PG ADMIN HUB`,
    );
    const url = `https://wa.me/${formattedPhone}?text=${message}`;

    Linking.openURL(url).catch(() => {
      Alert.alert("Error", "WhatsApp is not installed or unable to open link.");
    });
    setWhatsappTarget(null);
  };

  const sendBulkWhatsAppReminders = () => {
    const dueItems = rents.filter((r) => r.status === "Due");
    if (dueItems.length === 0) {
      Alert.alert("Info", "No pending dues found for this selection!");
      return;
    }

    const firstItem = dueItems[0];
    const message = encodeURIComponent(
      `Hello ${firstItem.tenant}, your rent of ₹${firstItem.amount.toLocaleString()} for Room ${firstItem.room} (${selectedMonth} ${selectedYear}) is Due. - PG ADMIN HUB`,
    );
    Linking.openURL(
      `https://wa.me/+91${firstItem.phone || ""}?text=${message}`,
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.bgDark} />

      <View style={styles.contentWrapper}>
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
            activeOpacity={0.8}
          >
            <Ionicons
              name="calendar-outline"
              size={14}
              color={COLORS.accent}
              style={{ marginRight: 4 }}
            />
            <Text style={styles.monthPillText}>
              {selectedMonth} {selectedYear}
            </Text>
            <Ionicons
              name="chevron-down"
              size={12}
              color={COLORS.accent}
              style={{ marginLeft: 4 }}
            />
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
        <View
          style={[
            styles.analyticsCard,
            isCompactScreen && { padding: SPACING.md },
          ]}
        >
          <View style={styles.progressHeader}>
            <Text style={styles.analyticsTitle}>Collection Overview</Text>
            <Text style={styles.progressPercent}>
              {collectionPercentage}% Paid
            </Text>
          </View>

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
            <Ionicons
              name="search"
              size={16}
              color={COLORS.textMuted}
              style={{ marginRight: 8 }}
            />
            <TextInput
              style={styles.searchInput}
              placeholder="Search tenant or room..."
              placeholderTextColor={COLORS.textMuted}
              value={searchRoom}
              onChangeText={setSearchRoom}
            />
            {searchRoom.length > 0 && (
              <TouchableOpacity onPress={() => setSearchRoom("")}>
                <Ionicons
                  name="close-circle"
                  size={16}
                  color={COLORS.textMuted}
                />
              </TouchableOpacity>
            )}
          </View>

          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: SPACING.sm,
            }}
          >
            <View style={[styles.segmentedControl, { flex: 1 }]}>
              {(["All", "Paid", "Due"] as FilterTab[]).map((tab) => {
                const active = statusTab === tab;
                return (
                  <TouchableOpacity
                    key={tab}
                    style={[
                      styles.segmentBtn,
                      active && styles.segmentBtnActive,
                    ]}
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

            {statusTab === "Due" && totalPending > 0 && (
              <TouchableOpacity
                style={styles.bulkRemindBtn}
                onPress={sendBulkWhatsAppReminders}
              >
                <Ionicons
                  name="megaphone-outline"
                  size={14}
                  color={COLORS.textWhite}
                  style={{ marginRight: 4 }}
                />
                <Text style={styles.bulkRemindText}>Bulk Remind</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Tenants List / Loading */}
        {loading && !refreshing ? (
          <View
            style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
          >
            <ActivityIndicator size="large" color={COLORS.accent} />
            <Text style={{ color: COLORS.textMuted, marginTop: 8 }}>
              Fetching rent records...
            </Text>
          </View>
        ) : (
          <FlatList
            data={rents}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: SPACING.xxl }}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={COLORS.accent}
              />
            }
            ListEmptyComponent={
              <View style={styles.emptyCard}>
                <Ionicons
                  name="document-text-outline"
                  size={40}
                  color={COLORS.textMuted}
                />
                <Text style={styles.emptyTitle}>No Tenant Records</Text>
                <Text style={styles.emptySub}>
                  No {statusTab !== "All" ? statusTab.toLowerCase() : ""}{" "}
                  records for {selectedMonth} {selectedYear} matching "
                  {searchRoom}".
                </Text>
              </View>
            }
            renderItem={({ item }) => {
              const isPaid = item.status === "Paid";
              return (
                <View style={styles.tenantCard}>
                  <View style={styles.cardHeader}>
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: SPACING.sm,
                      }}
                    >
                      <View style={styles.roomTag}>
                        <Text style={styles.roomTagText}>ROOM {item.room}</Text>
                      </View>

                      {!isPaid && (
                        <TouchableOpacity
                          style={styles.remindIconBtn}
                          onPress={() => {
                            setWhatsappTarget(item);
                            setCustomPhoneInput(item.phone || "");
                          }}
                        >
                          <Ionicons
                            name="logo-whatsapp"
                            size={14}
                            color={COLORS.success}
                          />
                        </TouchableOpacity>
                      )}
                    </View>

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
                        <Text style={styles.historyLinkText}>
                          View History ↗
                        </Text>
                      </TouchableOpacity>
                    </View>

                    <View style={{ alignItems: "flex-end" }}>
                      <Text style={styles.amountText}>
                        ₹{item.amount.toLocaleString()}
                      </Text>
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
        )}
      </View>

      {/* WhatsApp Modal */}
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
                <Text style={styles.modalHeaderTitle}>
                  Select WhatsApp Contact
                </Text>
                <Text style={styles.modalHeaderSub}>
                  {whatsappTarget?.tenant} • Room {whatsappTarget?.room}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.closeIconBtn}
                onPress={() => setWhatsappTarget(null)}
              >
                <Ionicons name="close" size={20} color={COLORS.textPrimary} />
              </TouchableOpacity>
            </View>

            {whatsappTarget?.phone ? (
              <TouchableOpacity
                style={styles.contactOptionRow}
                onPress={() =>
                  executeWhatsAppSend(whatsappTarget.phone!, whatsappTarget)
                }
              >
                <View>
                  <Text
                    style={{
                      color: COLORS.textPrimary,
                      fontWeight: "600",
                      fontSize: 13,
                    }}
                  >
                    Registered Contact
                  </Text>
                  <Text
                    style={{ color: COLORS.accent, fontSize: 13, marginTop: 2 }}
                  >
                    +91 {whatsappTarget.phone}
                  </Text>
                </View>
                <Text style={{ color: COLORS.success, fontWeight: "700" }}>
                  Send 💬
                </Text>
              </TouchableOpacity>
            ) : (
              <Text
                style={{
                  color: COLORS.textMuted,
                  fontSize: 12,
                  marginBottom: SPACING.md,
                }}
              >
                No registered phone number found on file.
              </Text>
            )}

            <View style={{ marginTop: SPACING.md }}>
              <Text
                style={{
                  color: COLORS.textSecondary,
                  fontSize: 12,
                  marginBottom: SPACING.xs,
                }}
              >
                Or enter custom WhatsApp number:
              </Text>
              <View style={{ flexDirection: "row", gap: SPACING.sm }}>
                <TextInput
                  style={[
                    styles.searchInput,
                    { flex: 1, height: 40, paddingHorizontal: 10 },
                  ]}
                  placeholder="Enter 10-digit number"
                  placeholderTextColor={COLORS.textMuted}
                  keyboardType="phone-pad"
                  value={customPhoneInput}
                  onChangeText={setCustomPhoneInput}
                />
                <TouchableOpacity
                  style={[
                    styles.bulkRemindBtn,
                    { paddingHorizontal: SPACING.lg },
                  ]}
                  onPress={() =>
                    whatsappTarget &&
                    executeWhatsAppSend(customPhoneInput, whatsappTarget)
                  }
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
                      <Ionicons
                        name="checkmark"
                        size={18}
                        color={COLORS.accent}
                      />
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </Pressable>
      </Modal>

      {/* History Modal */}
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
                <Ionicons name="close" size={20} color={COLORS.textPrimary} />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={{ maxHeight: 320 }}
              showsVerticalScrollIndicator={false}
            >
              {rents
                .filter((r) => r.tenant === historyTenant?.tenant)
                .map((record) => (
                  <View key={record.id} style={styles.historyRow}>
                    <Text style={{ color: COLORS.textPrimary, fontSize: 13 }}>
                      {record.month} {record.year}
                    </Text>
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: SPACING.md,
                      }}
                    >
                      <Text
                        style={{ color: COLORS.textSecondary, fontSize: 13 }}
                      >
                        ₹{record.amount.toLocaleString()}
                      </Text>
                      <Text
                        style={{
                          color:
                            record.status === "Paid"
                              ? COLORS.successText
                              : COLORS.warningText,
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

      {/* Action Sheet Modal */}
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
              onPress={() => selectedTenant && toggleStatus(selectedTenant)}
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
  container: { flex: 1, backgroundColor: COLORS.background },
  contentWrapper: {
    flex: 1,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
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
  title: { color: COLORS.textPrimary, fontSize: 22, fontWeight: "700" },
  monthPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surface,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  monthPillText: { color: COLORS.accent, fontSize: 13, fontWeight: "600" },
  yearRow: { marginBottom: SPACING.md },
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
  yearChipText: { color: COLORS.textMuted, fontSize: 12, fontWeight: "600" },
  activeYearChipText: { color: COLORS.textWhite },
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
    marginBottom: SPACING.xs,
  },
  analyticsTitle: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  progressPercent: { color: COLORS.accent, fontSize: 13, fontWeight: "700" },
  progressBarTrack: {
    height: 6,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.full,
    marginVertical: SPACING.md,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: COLORS.success,
    borderRadius: RADIUS.full,
  },
  metricGrid: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    marginTop: SPACING.xs,
  },
  metricLabel: {
    color: COLORS.textMuted,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  metricValue: { fontSize: 16, fontWeight: "700", marginTop: 2 },
  metricDivider: { width: 1, height: 24, backgroundColor: COLORS.border },
  filterSection: { marginBottom: SPACING.lg },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    paddingHorizontal: SPACING.md,
    height: 42,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.sm,
  },
  searchInput: { flex: 1, color: COLORS.textPrimary, fontSize: 14 },
  segmentedControl: {
    flexDirection: "row",
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: 3,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: SPACING.xs,
    alignItems: "center",
    borderRadius: RADIUS.md,
  },
  segmentBtnActive: { backgroundColor: COLORS.cardBg },
  segmentText: { color: COLORS.textMuted, fontSize: 12, fontWeight: "600" },
  segmentTextActive: { color: COLORS.textPrimary, fontWeight: "700" },
  bulkRemindBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.accent,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.lg,
    justifyContent: "center",
    height: 36,
  },
  bulkRemindText: { color: COLORS.textWhite, fontSize: 12, fontWeight: "700" },
  tenantCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: RADIUS.lg,
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
    paddingVertical: 2,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  roomTagText: { color: COLORS.textSecondary, fontSize: 10, fontWeight: "700" },
  remindIconBtn: {
    backgroundColor: COLORS.surface,
    padding: 4,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: RADIUS.full,
  },
  paidBadge: { backgroundColor: "rgba(16, 185, 129, 0.1)" },
  dueBadge: { backgroundColor: "rgba(245, 158, 11, 0.1)" },
  statusDot: { width: 6, height: 6, borderRadius: 3, marginRight: 4 },
  paidDot: { backgroundColor: COLORS.success },
  dueDot: { backgroundColor: COLORS.warning },
  statusText: { fontSize: 11, fontWeight: "700" },
  paidText: { color: COLORS.successText },
  dueText: { color: COLORS.warningText },
  cardBody: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  tenantName: { color: COLORS.textPrimary, fontSize: 16, fontWeight: "700" },
  historyLinkText: {
    color: COLORS.accent,
    fontSize: 12,
    fontWeight: "600",
    marginTop: 4,
  },
  amountText: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 4,
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
    fontSize: 12,
    fontWeight: "600",
  },
  emptyCard: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: SPACING.xxl,
  },
  emptyTitle: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: "700",
    marginTop: SPACING.sm,
  },
  emptySub: {
    color: COLORS.textMuted,
    fontSize: 12,
    textAlign: "center",
    marginTop: 4,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: SPACING.lg,
  },
  modalBox: {
    backgroundColor: COLORS.cardBg,
    width: "100%",
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  historyModalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: SPACING.md,
  },
  modalHeaderTitle: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: "700",
  },
  modalHeaderSub: {
    color: COLORS.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  closeIconBtn: { padding: 4 },
  contactOptionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: COLORS.surface,
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  monthRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  monthRowActive: { backgroundColor: COLORS.surface },
  monthRowText: { color: COLORS.textMuted, fontSize: 14, fontWeight: "600" },
  monthRowTextActive: { color: COLORS.accent, fontWeight: "700" },
  historyRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  actionSubmitBtn: {
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.lg,
    alignItems: "center",
    marginTop: SPACING.md,
  },
  btnSuccess: { backgroundColor: COLORS.success },
  btnWarning: { backgroundColor: COLORS.warning },
  actionSubmitText: {
    color: COLORS.textWhite,
    fontWeight: "700",
    fontSize: 14,
  },
  actionCancelBtn: {
    paddingVertical: SPACING.md,
    alignItems: "center",
    marginTop: SPACING.xs,
  },
  actionCancelText: {
    color: COLORS.textMuted,
    fontSize: 13,
    fontWeight: "600",
  },
});
