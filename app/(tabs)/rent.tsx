import { COLORS } from "@/src/constants/theme";
import api from "@/src/services/api";
import { pdfReceiptService } from "@/src/services/pdfReceiptService"; // <--- Import here
import { rentService } from "@/src/services/rentService";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import React, { useCallback, useState } from "react";
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
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { styles } from "../../src/styles/Admin/rentManagementStyles"; // Styles imported from separate file

export interface PaymentHistoryItem {
  paymentId: number | string;
  receiptNumber?: string;
  amountPaid: number;
  paymentDate: string;
  paymentMode: string;
  transactionId?: string;
  paymentStatus?: string;
  remarks?: string;
}

export interface RentItem {
  id: string;
  tenantId?: string;
  tenant: string;
  phone?: string;
  amount: number;
  paidAmount: number;
  pendingAmount: number;
  status: "Paid" | "Partial" | "Due";
  room: string;
  apartmentName?: string;
  month: string;
  year: string;
  paymentHistory: PaymentHistoryItem[];
}

export interface PGProperty {
  id: string;
  name: string;
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
  const [pgList, setPgList] = useState<PGProperty[]>([]);
  const [selectedPgId, setSelectedPgId] = useState<string>("ALL");

  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [actionLoading, setActionLoading] = useState<boolean>(false);

  const [searchRoom, setSearchRoom] = useState<string>("");
  const [statusTab, setStatusTab] = useState<FilterTab>("All");

  const [historyTenant, setHistoryTenant] = useState<RentItem | null>(null);
  const [whatsappTarget, setWhatsappTarget] = useState<RentItem | null>(null);
  const [confirmPaymentTarget, setConfirmPaymentTarget] =
    useState<RentItem | null>(null);
  const [isMonthPickerVisible, setIsMonthPickerVisible] =
    useState<boolean>(false);
  const [isPgPickerVisible, setIsPgPickerVisible] = useState<boolean>(false);

  const { width } = useWindowDimensions();
  const isCompactScreen = width < 380;

  const currentYearStr = new Date().getFullYear().toString();
  const [selectedYear, setSelectedYear] = useState<string>(currentYearStr);
  const [selectedMonth, setSelectedMonth] = useState<string>(
    ALL_MONTHS[new Date().getMonth()],
  );

  const fetchAdminPgList = useCallback(async () => {
    try {
      const storedUserId = await AsyncStorage.getItem("userId");
      if (!storedUserId) return [];

      const response = await api.get(`/Flats/user/${storedUserId}`);
      let rawData = [];
      if (Array.isArray(response?.data)) {
        rawData = response.data;
      } else if (Array.isArray(response?.data?.data)) {
        rawData = response.data.data;
      } else if (Array.isArray(response?.data?.flats)) {
        rawData = response.data.flats;
      }

      let pgs: PGProperty[] = rawData.map((item: any) => ({
        id: String(item.id || item.pgId),
        name: `${item.apartmentName || "Property"} - Flat No: ${item.flatNumber || ""}`,
        flatNumber: String(item.flatNumber || ""),
        apartmentName: String(item.apartmentName || ""),
      }));

      setPgList(pgs);
      return rawData;
    } catch (error) {
      console.error("Error fetching admin properties:", error);
      setPgList([]);
      return [];
    }
  }, []);

  const fetchRentRecords = useCallback(
    async (isInitialLoad = false) => {
      try {
        if (isInitialLoad) setLoading(true);

        const flatsRaw = await fetchAdminPgList();
        const flatLookupMap = new Map();
        flatsRaw.forEach((flat: any) => {
          const flatNum = String(flat.flatNumber || "");
          const aptName = String(flat.apartmentName || "");

          if (Array.isArray(flat.roomBreakup)) {
            flat.roomBreakup.forEach((room: any) => {
              if (Array.isArray(room.beds)) {
                room.beds.forEach((bed: any) => {
                  if (bed.tenantName) {
                    flatLookupMap.set(bed.tenantName.trim().toLowerCase(), {
                      flatNum,
                      aptName,
                    });
                  }
                });
              }
            });
          }
        });

        const monthIndex = ALL_MONTHS.indexOf(selectedMonth) + 1;
        let statusParam: number | undefined = undefined;
        if (statusTab === "Paid") statusParam = 1;
        if (statusTab === "Due") statusParam = 2;

        const params: any = {
          month: monthIndex,
          year: selectedYear,
          status: statusParam,
          search: searchRoom.trim() || undefined,
        };

        if (selectedPgId !== "ALL") {
          params.flatId = selectedPgId;
        }

        const response = await rentService.getAllRentRecords(params);
        if (response?.success) {
          const mappedData: RentItem[] = (response.data || []).map(
            (item: any) => {
              const total = Number(item.totalAmount || item.amount || 0);
              const paid = Number(item.paidAmount || 0);
              const pending = Number(
                item.pendingAmount !== undefined
                  ? item.pendingAmount
                  : Math.max(0, total - paid),
              );

              let computedStatus: "Paid" | "Partial" | "Due" = "Due";
              const rawStatus = String(item.status || "").toUpperCase();
              if (rawStatus === "PAID" || item.isPaid === true) {
                computedStatus = "Paid";
              } else if (rawStatus === "PARTIAL" || (paid > 0 && pending > 0)) {
                computedStatus = "Partial";
              } else {
                computedStatus = "Due";
              }

              const tenantKey = String(item.tenantName || "")
                .trim()
                .toLowerCase();
              const matchedFlat = flatLookupMap.get(tenantKey);

              const flatNum =
                item.flatNumber ||
                item.roomNumber ||
                item.room ||
                matchedFlat?.flatNum ||
                "101";
              const aptName =
                item.apartmentName ||
                item.pgName ||
                matchedFlat?.aptName ||
                "Roma Apartment";

              return {
                id: String(item.rentId || item.id || Math.random()),
                tenantId: String(item.tenantId || ""),
                tenant: item.tenantName || "Unknown Tenant",
                phone: item.tenantPhone || "",
                amount: total,
                paidAmount: paid,
                pendingAmount: pending,
                status: computedStatus,
                room: String(flatNum),
                apartmentName: String(aptName),
                month: item.monthName || selectedMonth,
                year: String(item.billingYear || selectedYear),
                paymentHistory: (item.paymentHistory || []).map((p: any) => ({
                  paymentId: p.paymentId || p.id,
                  receiptNumber: p.receiptNumber,
                  amountPaid: Number(p.amountPaid || 0),
                  paymentDate: p.paymentDate,
                  paymentMode: p.paymentMode || "Cash",
                  transactionId: p.transactionId,
                  paymentStatus: p.paymentStatus,
                  remarks: p.remarks,
                })),
              };
            },
          );

          setRents(mappedData);
        }
      } catch (error: any) {
        console.error("Error fetching rent records:", error);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [
      selectedMonth,
      selectedYear,
      statusTab,
      searchRoom,
      selectedPgId,
      fetchAdminPgList,
    ],
  );

  useFocusEffect(
    useCallback(() => {
      fetchRentRecords(true);
    }, [fetchRentRecords]),
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchRentRecords(false);
  }, [fetchRentRecords]);

  const handlePayRemaining = async (item: RentItem) => {
    if (item.pendingAmount <= 0) return;
    try {
      setActionLoading(true);
      const generatedReceiptNo = `REC-${Date.now().toString().slice(-6)}`;
      const currentDate = new Date().toISOString();

      // Step 1: Backend record & PDF Generation
      const result = await pdfReceiptService.recordAndGeneratePDF({
        rentId: item.id,
        tenantName: item.tenant,
        tenantPhone: item.phone,
        amountPaid: item.pendingAmount,
        paymentMode: "CASH_OR_UPI",
        transactionId: `TXN_${Date.now()}`,
        apartmentName: item.apartmentName,
        roomNumber: item.room,
        month: item.month,
        year: item.year,
        receiptNumber: generatedReceiptNo,
        paymentDate: currentDate,
      });

      if (result.success && result.pdfUri) {
        Alert.alert(
          "Payment Successful",
          `Receipt No: ${generatedReceiptNo} generated successfully. Would you like to share the PDF receipt?`,
          [
            {
              text: "Cancel",
              style: "cancel",
              onPress: () => {
                setConfirmPaymentTarget(null);
                fetchRentRecords();
              },
            },
            {
              text: "Share PDF / WhatsApp",
              onPress: async () => {
                setConfirmPaymentTarget(null);
                fetchRentRecords();
                // Step 2: Share PDF & Open WhatsApp
                await pdfReceiptService.sharePDF(
                  result.pdfUri!,
                  item.phone,
                  item.tenant,
                  item.pendingAmount,
                  item.month,
                );
              },
            },
          ],
        );
      } else {
        Alert.alert("Error", result.error || "Failed to generate receipt.");
      }
    } catch (error: any) {
      Alert.alert("Error", "Something went wrong.");
    } finally {
      setActionLoading(false);
    }
  };

  const totalCollected = rents.reduce((sum, r) => sum + r.paidAmount, 0);
  const totalPending = rents.reduce((sum, r) => sum + r.pendingAmount, 0);
  const totalBilled = rents.reduce((sum, r) => sum + r.amount, 0);
  const collectionPercentage =
    totalBilled > 0 ? Math.round((totalCollected / totalBilled) * 100) : 0;

  const executeWhatsAppSend = (phoneToUse: string, item: RentItem) => {
    const cleanPhone = phoneToUse.replace(/[^0-9]/g, "");
    const formattedPhone = cleanPhone.startsWith("91")
      ? `+${cleanPhone}`
      : `+91${cleanPhone}`;
    const message = encodeURIComponent(
      `Hello ${item.tenant}, your pending rent of ₹${item.pendingAmount.toLocaleString()} is due for ${selectedMonth}. Please clear it at your earliest. - PG ADMIN HUB`,
    );
    Linking.openURL(`https://wa.me/${formattedPhone}?text=${message}`).catch(
      () => {
        Alert.alert("Error", "WhatsApp is not installed.");
      },
    );
    setWhatsappTarget(null);
  };

  const currentSelectedPgName =
    selectedPgId === "ALL"
      ? "All Properties"
      : pgList.find((p) => p.id === selectedPgId)?.name || "Selected Property";

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />

      <View style={styles.contentWrapper}>
        {/* Header Bar */}
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={styles.brandTitle}>PG ADMIN HUB</Text>
            <Text style={styles.title}>Rent Management</Text>
          </View>

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

        {/* Property Selector */}
        <TouchableOpacity
          style={styles.pgFilterDropdown}
          onPress={() => setIsPgPickerVisible(true)}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 8,
              flex: 1,
            }}
          >
            <Ionicons name="business-outline" size={16} color={COLORS.accent} />
            <Text style={styles.pgFilterLabel} numberOfLines={1}>
              Property:{" "}
              <Text style={{ color: COLORS.textPrimary, fontWeight: "700" }}>
                {currentSelectedPgName}
              </Text>
            </Text>
          </View>
          <Ionicons name="chevron-down" size={14} color={COLORS.textMuted} />
        </TouchableOpacity>

        {/* Overview Analytics Banner */}
        <View
          style={[styles.analyticsCard, isCompactScreen && { padding: 12 }]}
        >
          <View style={styles.progressHeader}>
            <Text style={styles.analyticsTitle}>Collection Overview</Text>
            <Text style={styles.progressPercent}>
              {collectionPercentage}% Collected
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
              placeholder="Search tenant name or room..."
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

          <View style={[styles.segmentedControl, { width: "100%" }]}>
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

        {/* Tenants List / Loading */}
        {loading && !refreshing ? (
          <View
            style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
          >
            <ActivityIndicator size="large" color={COLORS.accent} />
            <Text style={{ color: COLORS.textMuted, marginTop: 8 }}>
              Loading records...
            </Text>
          </View>
        ) : (
          <FlatList
            data={rents}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 24 }}
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
                <Text style={styles.emptyTitle}>No Records Found</Text>
                <Text style={styles.emptySub}>
                  No rent data found for the selected filter.
                </Text>
              </View>
            }
            renderItem={({ item }) => {
              const isPaid = item.status === "Paid";
              const isPartial = item.status === "Partial";
              return (
                <View style={styles.tenantCard}>
                  <View style={styles.cardHeader}>
                    <View style={styles.flatTagContainer}>
                      <View style={styles.flatNumberTag}>
                        <Text style={styles.flatNumberText} numberOfLines={1}>
                          Flat: {item.room}
                        </Text>
                      </View>
                      <View style={styles.apartmentNameTag}>
                        <Text
                          style={styles.apartmentNameText}
                          numberOfLines={1}
                        >
                          {item.apartmentName}
                        </Text>
                      </View>

                      {item.pendingAmount > 0 && item.phone ? (
                        <TouchableOpacity
                          style={styles.remindIconBtn}
                          onPress={() => setWhatsappTarget(item)}
                        >
                          <Ionicons
                            name="logo-whatsapp"
                            size={14}
                            color={COLORS.success}
                          />
                        </TouchableOpacity>
                      ) : null}
                    </View>

                    <View
                      style={[
                        styles.statusBadge,
                        isPaid
                          ? styles.paidBadge
                          : isPartial
                            ? styles.partialBadge
                            : styles.dueBadge,
                      ]}
                    >
                      <View
                        style={[
                          styles.statusDot,
                          isPaid
                            ? styles.paidDot
                            : isPartial
                              ? styles.partialDot
                              : styles.dueDot,
                        ]}
                      />
                      <Text
                        style={[
                          styles.statusText,
                          isPaid
                            ? styles.paidText
                            : isPartial
                              ? styles.partialText
                              : styles.dueText,
                        ]}
                      >
                        {item.status.toUpperCase()}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.cardBody}>
                    <View style={{ flex: 1, marginRight: 8 }}>
                      <Text style={styles.tenantName} numberOfLines={1}>
                        {item.tenant}
                      </Text>
                      <Text
                        style={{
                          color: COLORS.textSecondary,
                          fontSize: 12,
                          marginTop: 2,
                        }}
                      >
                        {item.phone ? `Phone: ${item.phone}` : ""}
                      </Text>

                      <View style={{ marginTop: 6 }}>
                        <Text
                          style={{ color: COLORS.textSecondary, fontSize: 11 }}
                        >
                          Total: ₹{item.amount.toLocaleString()} | Paid: ₹
                          {item.paidAmount.toLocaleString()}
                        </Text>
                        <Text
                          style={{
                            color: COLORS.warningText,
                            fontSize: 12,
                            fontWeight: "700",
                            marginTop: 2,
                          }}
                        >
                          Pending: ₹{item.pendingAmount.toLocaleString()}
                        </Text>
                      </View>

                      <TouchableOpacity
                        onPress={() => setHistoryTenant(item)}
                        style={{ marginTop: 6 }}
                      >
                        <Text style={styles.historyLinkText}>
                          View History Logs ({item.paymentHistory.length}) ↗
                        </Text>
                      </TouchableOpacity>
                    </View>

                    <View
                      style={{
                        alignItems: "flex-end",
                        justifyContent: "center",
                      }}
                    >
                      {item.pendingAmount > 0 ? (
                        <TouchableOpacity
                          style={styles.actionPayBtn}
                          onPress={() => setConfirmPaymentTarget(item)}
                        >
                          <Text style={styles.actionPayBtnText}>Mark Paid</Text>
                        </TouchableOpacity>
                      ) : (
                        <View style={styles.completedPill}>
                          <Text style={styles.completedPillText}>
                            Settled ✓
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                </View>
              );
            }}
          />
        )}
      </View>

      {/* Property Selection Modal */}
      <Modal
        visible={isPgPickerVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsPgPickerVisible(false)}
      >
        <Pressable
          style={styles.modalBackdrop}
          onPress={() => setIsPgPickerVisible(false)}
        >
          <View style={styles.modalBox}>
            <Text style={styles.modalHeaderTitle}>Select Property Filter</Text>
            <ScrollView style={{ maxHeight: 250, marginVertical: 12 }}>
              <TouchableOpacity
                style={[
                  styles.monthRow,
                  selectedPgId === "ALL" && styles.monthRowActive,
                ]}
                onPress={() => {
                  setSelectedPgId("ALL");
                  setIsPgPickerVisible(false);
                }}
              >
                <Text
                  style={[
                    styles.monthRowText,
                    selectedPgId === "ALL" && styles.monthRowTextActive,
                  ]}
                >
                  All Properties
                </Text>
                {selectedPgId === "ALL" && (
                  <Ionicons name="checkmark" size={18} color={COLORS.accent} />
                )}
              </TouchableOpacity>
              {pgList.map((pg) => {
                const isSelected = pg.id === selectedPgId;
                return (
                  <TouchableOpacity
                    key={pg.id}
                    style={[
                      styles.monthRow,
                      isSelected && styles.monthRowActive,
                    ]}
                    onPress={() => {
                      setSelectedPgId(pg.id);
                      setIsPgPickerVisible(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.monthRowText,
                        isSelected && styles.monthRowTextActive,
                      ]}
                      numberOfLines={1}
                    >
                      {pg.name}
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

      {/* View History Modal */}
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
              <View style={{ flex: 1, marginRight: 8 }}>
                <Text style={styles.modalHeaderTitle}>Payment History</Text>
                <Text style={styles.modalHeaderSub} numberOfLines={2}>
                  {historyTenant?.tenant} • Flat {historyTenant?.room} (
                  {historyTenant?.apartmentName})
                </Text>
              </View>
              <TouchableOpacity
                style={styles.closeIconBtn}
                onPress={() => setHistoryTenant(null)}
              >
                <Ionicons name="close" size={20} color={COLORS.textPrimary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 300, marginVertical: 8 }}>
              {historyTenant?.paymentHistory &&
              historyTenant.paymentHistory.length > 0 ? (
                historyTenant.paymentHistory.map((p, index) => (
                  <View
                    key={p.paymentId || index}
                    style={styles.historyCardItem}
                  >
                    <View
                      style={{
                        flexDirection: "row",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <View style={{ flex: 1, marginRight: 8 }}>
                        <Text
                          style={{
                            color: COLORS.successText,
                            fontWeight: "700",
                          }}
                        >
                          ₹{p.amountPaid.toLocaleString()} ({p.paymentMode})
                        </Text>
                        <Text
                          style={{
                            color: COLORS.textMuted,
                            fontSize: 11,
                            marginTop: 2,
                          }}
                        >
                          {new Date(p.paymentDate).toLocaleDateString()}{" "}
                          {p.receiptNumber ? `• ${p.receiptNumber}` : ""}
                        </Text>
                      </View>

                      {/* View & Share Buttons */}
                      <View style={{ flexDirection: "row", gap: 6 }}>
                        {/* View PDF Button */}
                        <TouchableOpacity
                          style={{
                            backgroundColor: COLORS.success + "20",
                            paddingHorizontal: 8,
                            paddingVertical: 6,
                            borderRadius: 6,
                            flexDirection: "row",
                            alignItems: "center",
                            gap: 4,
                          }}
                          onPress={() =>
                            pdfReceiptService.previewPDF(p, historyTenant)
                          }
                        >
                          <Ionicons
                            name="eye-outline"
                            size={14}
                            color={COLORS.success}
                          />
                          <Text
                            style={{
                              color: COLORS.success,
                              fontSize: 11,
                              fontWeight: "600",
                            }}
                          >
                            View
                          </Text>
                        </TouchableOpacity>

                        {/* Share / Resend PDF Button */}
                        <TouchableOpacity
                          style={{
                            backgroundColor: COLORS.accent + "20",
                            paddingHorizontal: 8,
                            paddingVertical: 6,
                            borderRadius: 6,
                            flexDirection: "row",
                            alignItems: "center",
                            gap: 4,
                          }}
                          onPress={() =>
                            pdfReceiptService.regenerateAndSharePDF(
                              p,
                              historyTenant,
                            )
                          }
                        >
                          <Ionicons
                            name="share-social-outline"
                            size={14}
                            color={COLORS.accent}
                          />
                          <Text
                            style={{
                              color: COLORS.accent,
                              fontSize: 11,
                              fontWeight: "600",
                            }}
                          >
                            Share
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>

                    {p.transactionId && (
                      <Text
                        style={{
                          color: COLORS.textSecondary,
                          fontSize: 11,
                          marginTop: 4,
                        }}
                      >
                        Txn ID: {p.transactionId}
                      </Text>
                    )}
                    {p.remarks && (
                      <Text
                        style={{
                          color: COLORS.textMuted,
                          fontSize: 11,
                          marginTop: 2,
                        }}
                      >
                        Remark: {p.remarks}
                      </Text>
                    )}
                  </View>
                ))
              ) : (
                <Text
                  style={{
                    color: COLORS.textMuted,
                    textAlign: "center",
                    padding: 16,
                  }}
                >
                  No payment logs found.
                </Text>
              )}
            </ScrollView>
          </View>
        </Pressable>
      </Modal>

      {/* Payment Confirmation Modal */}
      <Modal
        visible={!!confirmPaymentTarget}
        transparent
        animationType="fade"
        onRequestClose={() => setConfirmPaymentTarget(null)}
      >
        <Pressable
          style={styles.modalBackdrop}
          onPress={() => setConfirmPaymentTarget(null)}
        >
          <View style={styles.modalBox}>
            <View style={styles.historyModalHeader}>
              <View style={{ flex: 1, marginRight: 8 }}>
                <Text style={styles.modalHeaderTitle}>
                  Confirm Manual Payment
                </Text>
                <Text style={styles.modalHeaderSub} numberOfLines={1}>
                  {confirmPaymentTarget?.tenant} • Flat{" "}
                  {confirmPaymentTarget?.room}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.closeIconBtn}
                onPress={() => setConfirmPaymentTarget(null)}
              >
                <Ionicons name="close" size={20} color={COLORS.textPrimary} />
              </TouchableOpacity>
            </View>

            <View style={styles.confirmDetailsBox}>
              <View style={styles.confirmRow}>
                <Text style={styles.confirmLabel}>Tenant:</Text>
                <Text style={styles.confirmValue} numberOfLines={1}>
                  {confirmPaymentTarget?.tenant}
                </Text>
              </View>
              <View style={styles.confirmRow}>
                <Text style={styles.confirmLabel}>Flat Number:</Text>
                <Text style={styles.confirmValue} numberOfLines={1}>
                  {confirmPaymentTarget?.room}
                </Text>
              </View>
              <View style={styles.confirmRow}>
                <Text style={styles.confirmLabel}>Apartment Name:</Text>
                <Text style={styles.confirmValue} numberOfLines={1}>
                  {confirmPaymentTarget?.apartmentName}
                </Text>
              </View>
              <View
                style={[
                  styles.confirmRow,
                  { borderBottomWidth: 0, marginTop: 4 },
                ]}
              >
                <Text
                  style={[
                    styles.confirmLabel,
                    { color: COLORS.successText, fontWeight: "700" },
                  ]}
                >
                  Collection Amount:
                </Text>
                <Text
                  style={[
                    styles.confirmValue,
                    {
                      color: COLORS.successText,
                      fontSize: 16,
                      fontWeight: "700",
                    },
                  ]}
                >
                  ₹{confirmPaymentTarget?.pendingAmount.toLocaleString()}
                </Text>
              </View>
            </View>

            <View style={styles.modalActionRow}>
              <TouchableOpacity
                style={styles.cancelModalBtn}
                onPress={() => setConfirmPaymentTarget(null)}
              >
                <Text style={styles.cancelModalBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.confirmModalBtn}
                onPress={() =>
                  confirmPaymentTarget &&
                  handlePayRemaining(confirmPaymentTarget)
                }
                disabled={actionLoading}
              >
                {actionLoading ? (
                  <ActivityIndicator size="small" color={COLORS.textWhite} />
                ) : (
                  <Text style={styles.confirmModalBtnText}>
                    Confirm Collection
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </Pressable>
      </Modal>

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
              <View style={{ flex: 1, marginRight: 8 }}>
                <Text style={styles.modalHeaderTitle}>Send Rent Reminder</Text>
                <Text style={styles.modalHeaderSub} numberOfLines={1}>
                  {whatsappTarget?.tenant} • Flat {whatsappTarget?.room}
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
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text
                    style={{
                      color: COLORS.textPrimary,
                      fontWeight: "600",
                      fontSize: 13,
                    }}
                  >
                    Registered Phone
                  </Text>
                  <Text
                    style={{ color: COLORS.accent, fontSize: 13, marginTop: 2 }}
                    numberOfLines={1}
                  >
                    +91 {whatsappTarget.phone}
                  </Text>
                </View>
                <Text style={{ color: COLORS.success, fontWeight: "700" }}>
                  Send 💬
                </Text>
              </TouchableOpacity>
            ) : null}
          </View>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}
