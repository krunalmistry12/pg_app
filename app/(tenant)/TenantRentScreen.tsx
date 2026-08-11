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
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
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
  };

  const handleOpenPaymentModal = (bill: BillItem) => {
    setSelectedBill(bill);
    // Ensure bill amount is correctly mapped as string
    const billAmount = bill.totalAmount ?? bill.amount ?? 0;
    setAmountPaid(String(billAmount));
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

    const parsedAmount = Number(amountPaid);
    const billMaxAmount = selectedBill.totalAmount ?? selectedBill.amount ?? 0;

    // Validation: Check for invalid number or zero
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      Alert.alert("Invalid Amount", "Please enter a valid payment amount.");
      return;
    }

    // Validation: Check if paid amount is greater than bill amount
    if (parsedAmount > billMaxAmount) {
      Alert.alert(
        "Amount Exceeded",
        `You cannot pay more than the bill amount (₹${billMaxAmount.toLocaleString()}).`,
      );
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        rentId: Number(selectedBill.id || selectedBill.rentId),
        amountPaid: parsedAmount,
        paymentMode: paymentMode,
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

  // Safe Total Due calculation handling both totalAmount and amount fields properly
  const totalPendingAmount = pendingBills.reduce((sum, bill) => {
    const billVal = Number(bill.totalAmount ?? bill.amount ?? 0);
    return sum + (isNaN(billVal) ? 0 : billVal);
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
          renderItem={({ item }) => {
            const billAmount = item.totalAmount ?? item.amount ?? 0;
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
                    ₹{billAmount.toLocaleString()}
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
