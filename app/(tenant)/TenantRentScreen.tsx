import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  RefreshControl,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { pdfReceiptService } from "../../src/services/pdfReceiptService";
import {
  BillItem,
  PaymentHistoryItem,
  rentApi,
} from "../../src/services/Tenant/rentApi";
import { styles } from "../../src/styles/Tenant/TenantRentScreen.styles";

const ALL_MONTHS = [
  "",
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const extractPendingAmount = (item: any): number => {
  if (!item) return 0;
  const raw = item.pendingAmount ?? item.totalAmount ?? item.amount ?? 0;
  const parsed = Number(raw);
  return isNaN(parsed) ? 0 : parsed;
};

const getPaymentModeLabel = (mode: any): string => {
  if (mode === 1 || mode === "1" || mode === "UPI") return "UPI";
  if (mode === 2 || mode === "2" || mode === "Cash") return "Cash";
  if (mode === 3 || mode === "3" || mode === "Bank Transfer")
    return "Bank Transfer";
  return "Online Payment";
};

export default function TenantRentScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<"PENDING" | "HISTORY">("PENDING");

  const [pendingBills, setPendingBills] = useState<BillItem[]>([]);
  const [paymentHistory, setPaymentHistory] = useState<PaymentHistoryItem[]>(
    [],
  );

  const [cachedTenantInfo, setCachedTenantInfo] = useState<any>(null);

  const [isModalVisible, setIsModalVisible] = useState<boolean>(false);
  const [selectedBill, setSelectedBill] = useState<BillItem | null>(null);
  const [amountPaid, setAmountPaid] = useState<string>("");
  const [paymentMode, setPaymentMode] = useState<string>("UPI");
  const [transactionId, setTransactionId] = useState<string>("");
  const [remarks, setRemarks] = useState<string>("Monthly Rent Payment");
  const [submitting, setSubmitting] = useState<boolean>(false);

  const [isReceiptModalVisible, setIsReceiptModalVisible] =
    useState<boolean>(false);
  const [selectedReceipt, setSelectedReceipt] =
    useState<PaymentHistoryItem | null>(null);

  useEffect(() => {
    fetchTenantData();
    loadCachedTenantData();
  }, []);

  const loadCachedTenantData = async () => {
    try {
      const keys = [
        "cached_tenant_profile",
        "tenant_info",
        "user_profile",
        "cached_tenants_list",
        "auth_user",
        "userData",
      ];
      for (const key of keys) {
        const stored = await AsyncStorage.getItem(key);
        if (stored) {
          const parsed = JSON.parse(stored);
          const dataObj = Array.isArray(parsed) ? parsed[0] : parsed;
          if (dataObj) {
            setCachedTenantInfo(dataObj);
            break;
          }
        }
      }
    } catch (e) {
      console.log("Error loading cached tenant data:", e);
    }
  };

  const fetchTenantData = async (isRefresh = false) => {
    try {
      if (!isRefresh) setLoading(true);

      const [pendingRes, historyRes] = await Promise.allSettled([
        rentApi.getPendingBills(),
        rentApi.getPaymentHistory(),
      ]);

      if (pendingRes.status === "fulfilled") {
        setPendingBills(pendingRes.value);
      }

      if (historyRes.status === "fulfilled") {
        setPaymentHistory(historyRes.value);
      }
    } catch (error: any) {
      console.log("Fetch Tenant Rent Error:", error?.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchTenantData(true);
    loadCachedTenantData();
  };

  const handleOpenPaymentModal = (bill: BillItem) => {
    setSelectedBill(bill);
    const billAmount = extractPendingAmount(bill);
    setAmountPaid(String(billAmount));
    setPaymentMode("UPI");
    setTransactionId("");
    setRemarks("Monthly Rent Payment");
    setIsModalVisible(true);
  };

  const handleOpenReceiptModal = (receipt: PaymentHistoryItem) => {
    setSelectedReceipt(receipt);
    setIsReceiptModalVisible(true);
  };

  const handleSubmitPayment = async () => {
    if (!selectedBill || !amountPaid || !transactionId) {
      Alert.alert(
        "Validation Required",
        "Please enter the Amount and Transaction ID / UTR.",
      );
      return;
    }

    const parsedAmount = Number(amountPaid);
    const billMaxAmount = extractPendingAmount(selectedBill);

    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      Alert.alert("Invalid Amount", "Please enter a valid payment amount.");
      return;
    }

    if (parsedAmount > billMaxAmount) {
      Alert.alert(
        "Amount Exceeded",
        `You cannot pay more than the pending amount (₹${billMaxAmount.toLocaleString()}).`,
      );
      return;
    }

    let modeValue: any = paymentMode;
    if (paymentMode === "UPI") modeValue = 1;
    else if (paymentMode === "Cash") modeValue = 2;
    else if (paymentMode === "Bank Transfer") modeValue = 3;

    try {
      setSubmitting(true);
      const payload = {
        rentId: Number(selectedBill.id || selectedBill.rentId),
        amountPaid: parsedAmount,
        paymentMode: modeValue.toString(),
        transactionId: transactionId.trim(),
        remarks: remarks.trim(),
      };

      await rentApi.recordPayment(payload);

      Alert.alert(
        "Success 🎉",
        "Payment details submitted successfully! Awaiting admin approval.",
      );
      setIsModalVisible(false);
      fetchTenantData(true);
    } catch (error: any) {
      console.log("Record Payment Error:", error?.response || error?.message);
      Alert.alert(
        "Error",
        error?.response?.data?.title ||
          "Failed to record payment. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const getTenantName = () => {
    const receipt: any = selectedReceipt;
    return (
      receipt?.tenant?.name ||
      receipt?.tenantName ||
      cachedTenantInfo?.name ||
      cachedTenantInfo?.fullName ||
      cachedTenantInfo?.tenantName ||
      "Tenant"
    );
  };

  const getApartmentName = () => {
    const receipt: any = selectedReceipt;
    return (
      receipt?.rent?.flat?.apartmentName ||
      receipt?.apartmentName ||
      cachedTenantInfo?.apartmentName ||
      cachedTenantInfo?.pgName ||
      cachedTenantInfo?.propertyName ||
      "PG / Apartment"
    );
  };

  const getRoomNumber = () => {
    const receipt: any = selectedReceipt;
    return (
      receipt?.rent?.room?.roomNumber ||
      receipt?.roomNumber ||
      cachedTenantInfo?.roomNumber ||
      cachedTenantInfo?.room ||
      "N/A"
    );
  };

  const totalPendingAmount = pendingBills.reduce((sum, bill) => {
    return sum + extractPendingAmount(bill);
  }, 0);

  if (loading) {
    return (
      <SafeAreaView style={[styles.safeArea, styles.center]}>
        <ActivityIndicator size="large" color="#38BDF8" />
        <Text style={styles.loadingText}>Loading your rent statements...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#0F172A" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={20} color="#F8FAFC" />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Rent & Bills</Text>
          <Text style={styles.headerSubtitle}>
            {cachedTenantInfo?.pgName ? `${cachedTenantInfo.pgName} • ` : ""}
            Manage payments & receipts
          </Text>
        </View>
      </View>

      {/* Overview Banner */}
      <View style={styles.overviewCard}>
        <View>
          <Text style={styles.overviewLabel}>Total Due Balance</Text>
          <Text style={styles.overviewAmount}>
            ₹{totalPendingAmount.toLocaleString()}
          </Text>
        </View>
        <View style={styles.overviewBadge}>
          <Ionicons name="shield-checkmark" size={16} color="#38BDF8" />
          <Text style={styles.overviewBadgeText}>
            {pendingBills.length} Bill(s) Pending
          </Text>
        </View>
      </View>

      {/* Segmented Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[
            styles.tabButton,
            activeTab === "PENDING" && styles.tabActive,
          ]}
          onPress={() => setActiveTab("PENDING")}
          activeOpacity={0.8}
        >
          <Ionicons
            name="document-text"
            size={16}
            color={activeTab === "PENDING" ? "#38BDF8" : "#64748B"}
          />
          <Text
            style={[
              styles.tabText,
              activeTab === "PENDING" && styles.tabTextActive,
            ]}
          >
            Pending ({pendingBills.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tabButton,
            activeTab === "HISTORY" && styles.tabActive,
          ]}
          onPress={() => setActiveTab("HISTORY")}
          activeOpacity={0.8}
        >
          <Ionicons
            name="time"
            size={16}
            color={activeTab === "HISTORY" ? "#34D399" : "#64748B"}
          />
          <Text
            style={[
              styles.tabText,
              activeTab === "HISTORY" && styles.tabTextActive,
            ]}
          >
            History ({paymentHistory.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content List */}
      {activeTab === "PENDING" ? (
        <FlatList
          data={pendingBills}
          keyExtractor={(item, index) =>
            String(item.id || item.rentId || index)
          }
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#38BDF8"
            />
          }
          renderItem={({ item }) => {
            const billMonth = (item as any).billingMonth || item.month;
            const billYear = (item as any).billingYear || item.year;
            const pendingVal = extractPendingAmount(item);
            const totalVal = item.totalAmount ?? 0;

            return (
              <View style={styles.card}>
                <View style={styles.cardHeaderRow}>
                  <View style={styles.row}>
                    <View style={styles.iconBox}>
                      <Ionicons
                        name="receipt-outline"
                        size={20}
                        color="#F59E0B"
                      />
                    </View>
                    <View>
                      <Text style={styles.cardTitle}>
                        {ALL_MONTHS[billMonth] || "Month"} {billYear} Rent
                      </Text>
                      <View style={styles.statusBadgePending}>
                        <Text style={styles.statusBadgePendingText}>
                          {item.status || "PENDING"}
                        </Text>
                      </View>
                    </View>
                  </View>
                  <View style={{ alignItems: "flex-end" }}>
                    <Text style={styles.amountText}>
                      ₹{pendingVal.toLocaleString()}
                    </Text>
                    {totalVal > pendingVal && (
                      <Text
                        style={{
                          fontSize: 11,
                          color: "#94A3B8",
                          textDecorationLine: "line-through",
                        }}
                      >
                        Total: ₹{totalVal.toLocaleString()}
                      </Text>
                    )}
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.payButton}
                  onPress={() => handleOpenPaymentModal(item)}
                  activeOpacity={0.85}
                >
                  <Ionicons
                    name="card"
                    size={16}
                    color="#FFFFFF"
                    style={{ marginRight: 6 }}
                  />
                  <Text style={styles.payButtonText}>Pay & Submit Details</Text>
                </TouchableOpacity>
              </View>
            );
          }}
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <View style={styles.emptyIconBg}>
                <Ionicons
                  name="checkmark-done-circle"
                  size={48}
                  color="#34D399"
                />
              </View>
              <Text style={styles.emptyTitle}>All Caught Up!</Text>
              <Text style={styles.emptyText}>
                You have no pending rent bills right now.
              </Text>
            </View>
          }
        />
      ) : (
        <FlatList
          data={paymentHistory}
          keyExtractor={(item, index) => String(item.id || index)}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#38BDF8"
            />
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.card}
              onPress={() => handleOpenReceiptModal(item)}
              activeOpacity={0.85}
            >
              <View style={styles.cardHeaderRow}>
                <View style={styles.row}>
                  <View
                    style={[
                      styles.iconBox,
                      { backgroundColor: "rgba(52, 211, 153, 0.12)" },
                    ]}
                  >
                    <Ionicons
                      name="checkmark-circle"
                      size={20}
                      color="#34D399"
                    />
                  </View>
                  <View>
                    <Text style={styles.cardTitle}>
                      {getPaymentModeLabel(item.paymentMode)} Payment
                    </Text>
                    <Text style={styles.cardSub}>
                      Txn: {item.transactionId || "N/A"}
                    </Text>
                  </View>
                </View>
                <View style={{ alignItems: "flex-end" }}>
                  <Text style={[styles.amountText, { color: "#34D399" }]}>
                    ₹{item.amountPaid?.toLocaleString()}
                  </Text>
                  <Text
                    style={{ fontSize: 10, color: "#38BDF8", marginTop: 2 }}
                  >
                    View Receipt 📄
                  </Text>
                </View>
              </View>

              <View style={styles.historyDetailsFooter}>
                <Text style={styles.remarksText} numberOfLines={1}>
                  Note: {item.remarks || "No remarks"}
                </Text>
                <Text style={styles.dateText}>
                  {item.paymentDate
                    ? new Date(item.paymentDate).toLocaleDateString()
                    : ""}
                </Text>
              </View>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <View style={styles.emptyIconBg}>
                <Ionicons name="wallet-outline" size={48} color="#64748B" />
              </View>
              <Text style={styles.emptyTitle}>No Payment History</Text>
              <Text style={styles.emptyText}>
                Your submitted payment records will show up here.
              </Text>
            </View>
          }
        />
      )}

      {/* Payment Submission Modal */}
      <Modal visible={isModalVisible} animationType="slide" transparent={true}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Submit Payment</Text>
                <Text style={styles.modalSubTitle}>
                  Enter details after paying
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setIsModalVisible(false)}
                style={styles.closeBtn}
              >
                <Ionicons name="close" size={20} color="#94A3B8" />
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>Amount Paid (₹)</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. 4000"
              placeholderTextColor="#475569"
              keyboardType="numeric"
              value={amountPaid}
              onChangeText={setAmountPaid}
            />

            {/* Payment Method Selector */}
            <Text style={styles.inputLabel}>Payment Method</Text>
            <View style={styles.paymentModeContainer}>
              {["UPI", "Cash", "Bank Transfer"].map((mode) => {
                const isSelected = paymentMode === mode;
                return (
                  <TouchableOpacity
                    key={mode}
                    onPress={() => setPaymentMode(mode)}
                    style={[
                      styles.paymentModeBtn,
                      isSelected && styles.paymentModeBtnActive,
                    ]}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[
                        styles.paymentModeText,
                        isSelected && styles.paymentModeTextActive,
                      ]}
                    >
                      {mode}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={styles.inputLabel}>Transaction ID / UTR Number *</Text>
            <TextInput
              style={styles.input}
              placeholder={
                paymentMode === "Cash"
                  ? "Enter Cash receipt number"
                  : "Enter 12-digit transaction UTR"
              }
              placeholderTextColor="#475569"
              value={transactionId}
              onChangeText={setTransactionId}
            />

            <Text style={styles.inputLabel}>Remarks (Optional)</Text>
            <TextInput
              style={styles.input}
              placeholder="Any message for admin"
              placeholderTextColor="#475569"
              value={remarks}
              onChangeText={setRemarks}
            />

            <TouchableOpacity
              style={[styles.submitButton, submitting && { opacity: 0.7 }]}
              onPress={handleSubmitPayment}
              disabled={submitting}
              activeOpacity={0.85}
            >
              {submitting ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.submitButtonText}>
                  Confirm & Send to Admin
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Clean Professional Receipt Viewer Modal */}
      <Modal
        visible={isReceiptModalVisible}
        animationType="fade"
        transparent={true}
      >
        <View style={styles.receiptOverlay}>
          <View style={styles.receiptCard}>
            {/* Header */}
            <View style={styles.receiptHeader}>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <View style={styles.receiptIconBox}>
                  <Ionicons name="receipt-outline" size={18} color="#38BDF8" />
                </View>
                <View>
                  <Text style={styles.receiptTitle}>Payment Receipt</Text>
                  <Text style={styles.receiptSubId}>
                    {(selectedReceipt as any)?.receiptNumber ||
                      `REF-${selectedReceipt?.id || "REC"}`}
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                onPress={() => setIsReceiptModalVisible(false)}
                style={styles.receiptCloseBtn}
                activeOpacity={0.7}
              >
                <Ionicons name="close" size={15} color="#94A3B8" />
              </TouchableOpacity>
            </View>
            {/* Compact Info Box */}
            <View style={styles.receiptInfoBox}>
              <View style={styles.receiptAmountRow}>
                <Text style={styles.receiptAmountLabel}>Paid Amount</Text>
                <Text style={styles.receiptAmountVal}>
                  ₹{selectedReceipt?.amountPaid?.toLocaleString()}
                </Text>
              </View>

              <View style={styles.receiptDetailRow}>
                <Text style={styles.receiptKey}>Tenant</Text>
                <Text style={styles.receiptVal}>{getTenantName()}</Text>
              </View>

              <View style={styles.receiptDetailRow}>
                <Text style={styles.receiptKey}>Property</Text>
                <Text style={styles.receiptVal}>{getApartmentName()}</Text>
              </View>

              <View style={styles.receiptDetailRow}>
                <Text style={styles.receiptKey}>Room No</Text>
                <Text style={styles.receiptVal}>{getRoomNumber()}</Text>
              </View>

              <View style={styles.receiptDetailRow}>
                <Text style={styles.receiptKey}>UTR / Txn ID</Text>
                <Text
                  style={[
                    styles.receiptVal,
                    {
                      fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
                    },
                  ]}
                >
                  {selectedReceipt?.transactionId || "N/A"}
                </Text>
              </View>

              <View style={styles.receiptDetailRow}>
                <Text style={styles.receiptKey}>Method</Text>
                <Text style={styles.receiptVal}>
                  {getPaymentModeLabel(selectedReceipt?.paymentMode)}
                </Text>
              </View>

              <View style={[styles.receiptDetailRow, { marginBottom: 0 }]}>
                <Text style={styles.receiptKey}>Date</Text>
                <Text style={styles.receiptVal}>
                  {selectedReceipt?.paymentDate
                    ? new Date(selectedReceipt.paymentDate).toLocaleDateString(
                        "en-IN",
                        {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        },
                      )
                    : "N/A"}
                </Text>
              </View>
            </View>
            {/* Actions */}
            <TouchableOpacity
              style={styles.previewBtn}
              onPress={() => {
                if (selectedReceipt) {
                  const receipt: any = selectedReceipt;
                  const tenantInfo = {
                    month: receipt.rent?.billingMonth || "Current",
                    year: receipt.rent?.billingYear || "Year",
                    tenant: getTenantName(),
                    phone: cachedTenantInfo?.phone || "",
                    apartmentName: getApartmentName(),
                    room: getRoomNumber(),
                  };
                  pdfReceiptService.previewPDF(selectedReceipt, tenantInfo);
                }
              }}
              activeOpacity={0.85}
            >
              <Ionicons
                name="eye-outline"
                size={16}
                color="#FFFFFF"
                style={{ marginRight: 6 }}
              />
              <Text style={styles.btnTextWhite}>Preview PDF</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.shareBtn}
              onPress={() => {
                if (selectedReceipt) {
                  const receipt: any = selectedReceipt;
                  const tenantInfo = {
                    month: receipt.rent?.billingMonth || "Current",
                    year: receipt.rent?.billingYear || "Year",
                    tenant: getTenantName(),
                    phone: cachedTenantInfo?.phone || "",
                    apartmentName: getApartmentName(),
                    room: getRoomNumber(),
                  };
                  pdfReceiptService.regenerateAndSharePDF(
                    selectedReceipt,
                    tenantInfo,
                  );
                }
              }}
              activeOpacity={0.85}
            >
              <Ionicons
                name="share-social-outline"
                size={16}
                color="#FFFFFF"
                style={{ marginRight: 6 }}
              />
              <Text style={styles.btnTextWhite}>Share Receipt</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.receiptCloseTextBtn}
              onPress={() => setIsReceiptModalVisible(false)}
              activeOpacity={0.7}
            >
              <Text style={styles.receiptCloseText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
