import api from "@/src/services/api";
import { Ionicons } from "@expo/vector-icons";
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
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

interface BillItem {
  id: number | string;
  rentId?: number;
  month: number;
  year: number;
  totalAmount?: number;
  amount?: number;
  status: string;
}

interface PaymentHistoryItem {
  id: number | string;
  amountPaid: number;
  paymentMode: string;
  transactionId: string;
  paymentDate: string;
  remarks: string;
  status?: string; // Approved/Pending
}

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

export default function TenantRentScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<"PENDING" | "HISTORY">("PENDING");

  const [pendingBills, setPendingBills] = useState<BillItem[]>([]);
  const [paymentHistory, setPaymentHistory] = useState<PaymentHistoryItem[]>(
    [],
  );

  // Payment Modal States
  const [isModalVisible, setIsModalVisible] = useState<boolean>(false);
  const [selectedBill, setSelectedBill] = useState<BillItem | null>(null);
  const [amountPaid, setAmountPaid] = useState<string>("");
  const [paymentMode, setPaymentMode] = useState<string>("UPI");
  const [transactionId, setTransactionId] = useState<string>("");
  const [remarks, setRemarks] = useState<string>("Monthly Rent Payment");
  const [submitting, setSubmitting] = useState<boolean>(false);

  useEffect(() => {
    fetchTenantData();
  }, []);

  const fetchTenantData = async (isRefresh = false) => {
    try {
      if (!isRefresh) setLoading(true);

      const [pendingRes, historyRes] = await Promise.allSettled([
        api.get("/Rent/tenant/my-pending-bills"),
        api.get("/Rent/tenant/my-payment-history"),
      ]);

      if (pendingRes.status === "fulfilled") {
        const data =
          pendingRes.value?.data?.data || pendingRes.value?.data || [];
        setPendingBills(Array.isArray(data) ? data : []);
      }

      if (historyRes.status === "fulfilled") {
        const data =
          historyRes.value?.data?.data || historyRes.value?.data || [];
        setPaymentHistory(Array.isArray(data) ? data : []);
      }
    } catch (error: any) {
      console.log(
        "Fetch Tenant Rent Error:",
        error?.response || error?.message,
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchTenantData(true);
  };

  const handleOpenPaymentModal = (bill: BillItem) => {
    setSelectedBill(bill);
    setAmountPaid(String(bill.totalAmount || bill.amount || ""));
    setPaymentMode("UPI");
    setTransactionId("");
    setRemarks("Monthly Rent Payment");
    setIsModalVisible(true);
  };

  const handleSubmitPayment = async () => {
    if (!selectedBill || !amountPaid || !transactionId) {
      Alert.alert(
        "Validation Required",
        "Please enter the Amount and Transaction ID / UTR.",
      );
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        rentId: Number(selectedBill.id || selectedBill.rentId),
        amountPaid: Number(amountPaid),
        paymentMode: paymentMode,
        transactionId: transactionId.trim(),
        remarks: remarks.trim(),
      };

      await api.post("/Rent/record-payment", payload);

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

  const totalPendingAmount = pendingBills.reduce(
    (sum, bill) => sum + (bill.totalAmount || bill.amount || 0),
    0,
  );

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
          <Text style={styles.headerSubtitle}>Manage payments & receipts</Text>
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
                      {ALL_MONTHS[item.month] || "Month"} {item.year} Rent
                    </Text>
                    <View style={styles.statusBadgePending}>
                      <Text style={styles.statusBadgePendingText}>
                        {item.status || "PENDING"}
                      </Text>
                    </View>
                  </View>
                </View>
                <Text style={styles.amountText}>
                  ₹{(item.totalAmount || item.amount || 0).toLocaleString()}
                </Text>
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
          )}
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
            <View style={styles.card}>
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
                      {item.paymentMode || "Online Payment"}
                    </Text>
                    <Text style={styles.cardSub}>
                      Txn: {item.transactionId || "N/A"}
                    </Text>
                  </View>
                </View>
                <Text style={[styles.amountText, { color: "#34D399" }]}>
                  ₹{item.amountPaid?.toLocaleString()}
                </Text>
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
            </View>
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
                  Enter details after paying via UPI/Cash
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
              placeholder="e.g. 4500"
              placeholderTextColor="#475569"
              keyboardType="numeric"
              value={amountPaid}
              onChangeText={setAmountPaid}
            />

            <Text style={styles.inputLabel}>Payment Method</Text>
            <TextInput
              style={styles.input}
              placeholder="UPI, GooglePay, PhonePe, Cash"
              placeholderTextColor="#475569"
              value={paymentMode}
              onChangeText={setPaymentMode}
            />

            <Text style={styles.inputLabel}>Transaction ID / UTR Number *</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter 12-digit UPI Transaction reference"
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#0B0F19" },
  center: { justifyContent: "center", alignItems: "center" },
  loadingText: {
    color: "#94A3B8",
    marginTop: 12,
    fontSize: 13,
    fontWeight: "500",
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#1E293B",
  },
  backBtn: {
    marginRight: 14,
    padding: 8,
    backgroundColor: "#1E293B",
    borderRadius: 10,
  },
  headerTitleContainer: { flex: 1 },
  headerTitle: { color: "#F8FAFC", fontSize: 18, fontWeight: "700" },
  headerSubtitle: { color: "#94A3B8", fontSize: 12, fontWeight: "500" },

  overviewCard: {
    backgroundColor: "#111827",
    margin: 16,
    marginBottom: 8,
    padding: 18,
    borderRadius: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#1F2937",
  },
  overviewLabel: { color: "#94A3B8", fontSize: 12, fontWeight: "600" },
  overviewAmount: {
    color: "#F8FAFC",
    fontSize: 24,
    fontWeight: "800",
    marginTop: 2,
  },
  overviewBadge: {
    backgroundColor: "rgba(56, 189, 248, 0.1)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  overviewBadgeText: { color: "#38BDF8", fontSize: 11, fontWeight: "700" },

  tabContainer: {
    flexDirection: "row",
    backgroundColor: "#111827",
    padding: 4,
    marginHorizontal: 16,
    marginVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#1F2937",
  },
  tabButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: 9,
    gap: 6,
  },
  tabActive: {
    backgroundColor: "#1F2937",
  },
  tabText: { color: "#64748B", fontSize: 12, fontWeight: "600" },
  tabTextActive: { color: "#F8FAFC", fontWeight: "700" },

  listContainer: { paddingHorizontal: 16, paddingBottom: 30, paddingTop: 4 },
  card: {
    backgroundColor: "#111827",
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#1F2937",
  },
  cardHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  row: { flexDirection: "row", alignItems: "center", flex: 1 },
  iconBox: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: "rgba(245, 158, 11, 0.12)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  cardTitle: { color: "#F8FAFC", fontSize: 15, fontWeight: "700" },
  cardSub: { color: "#94A3B8", fontSize: 12, marginTop: 2 },
  statusBadgePending: {
    backgroundColor: "rgba(245, 158, 11, 0.15)",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    alignSelf: "flex-start",
    marginTop: 4,
  },
  statusBadgePendingText: { color: "#F59E0B", fontSize: 10, fontWeight: "700" },
  amountText: { color: "#F8FAFC", fontSize: 17, fontWeight: "800" },

  payButton: {
    backgroundColor: "#3B82F6",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 14,
  },
  payButtonText: { color: "#FFFFFF", fontSize: 13, fontWeight: "700" },

  historyDetailsFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#1F2937",
    paddingTop: 10,
  },
  remarksText: { color: "#94A3B8", fontSize: 11, flex: 1, marginRight: 10 },
  dateText: { color: "#64748B", fontSize: 11, fontWeight: "600" },

  emptyBox: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyIconBg: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#111827",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#1F2937",
  },
  emptyTitle: { color: "#F8FAFC", fontSize: 16, fontWeight: "700" },
  emptyText: {
    color: "#94A3B8",
    fontSize: 12,
    marginTop: 4,
    textAlign: "center",
  },

  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0, 0, 0, 0.75)",
  },
  modalContent: {
    backgroundColor: "#0F172A",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 22,
    borderWidth: 1,
    borderColor: "#1E293B",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  modalTitle: { color: "#F8FAFC", fontSize: 18, fontWeight: "700" },
  modalSubTitle: { color: "#94A3B8", fontSize: 12, marginTop: 2 },
  closeBtn: {
    backgroundColor: "#1E293B",
    padding: 6,
    borderRadius: 8,
  },
  inputLabel: {
    color: "#94A3B8",
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 6,
    marginTop: 10,
  },
  input: {
    backgroundColor: "#1E293B",
    borderWidth: 1,
    borderColor: "#334155",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: "#F8FAFC",
    fontSize: 14,
  },
  submitButton: {
    backgroundColor: "#10B981",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 24,
    marginBottom: 10,
  },
  submitButtonText: { color: "#FFFFFF", fontSize: 14, fontWeight: "700" },
});
