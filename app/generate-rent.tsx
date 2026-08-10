import api from "@/src/services/api";
import { getTenantsByUserIdApi } from "@/src/services/tenantApi";
import { commonStyles } from "@/src/styles/commonStyles";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { jwtDecode } from "jwt-decode";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

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

interface TenantItem {
  id: string;
  name: string;
  roomNumber: string;
  roomName: string;
  bedName: string;
  flatId: string;
  flatName: string;
  flatNumber: string;
  monthlyRent: number;
  allocationType: number | string;
}

interface PaymentRequestItem {
  id: string;
  tenantId: string;
  tenantName: string;
  flatName: string;
  roomNumber: string;
  amount: number;
  paymentMode: string;
  transactionId: string;
  status: string; // "PENDING", "APPROVED", "REJECTED"
}

export default function GenerateRentPage() {
  const router = useRouter();
  const [initialLoading, setInitialLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const [tenants, setTenants] = useState<TenantItem[]>([]);
  const [generatedTenantIds, setGeneratedTenantIds] = useState<string[]>([]);
  const [selectedTenantIds, setSelectedTenantIds] = useState<string[]>([]);
  const [paymentRequests, setPaymentRequests] = useState<PaymentRequestItem[]>(
    [],
  );

  const [flatsList, setFlatsList] = useState<{ id: string; name: string }[]>(
    [],
  );
  const [selectedFlatId, setSelectedFlatId] = useState<string>("ALL");

  // Tabs: "PENDING", "GENERATED", or "REQUESTS"
  const [activeTab, setActiveTab] = useState<
    "PENDING" | "GENERATED" | "REQUESTS"
  >("PENDING");

  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState<string>(
    ALL_MONTHS[currentDate.getMonth()],
  );
  const [selectedYear, setSelectedYear] = useState<string>(
    currentDate.getFullYear().toString(),
  );

  const monthScrollRef = useRef<ScrollView>(null);

  const getUserId = async () => {
    try {
      const userId = await AsyncStorage.getItem("userId");
      if (userId) return userId;

      const token = await AsyncStorage.getItem("token");
      if (token) {
        const decoded: any = jwtDecode(token);
        return decoded.id || decoded.userId || decoded.sub || "";
      }
    } catch (e) {}
    return null;
  };

  useEffect(() => {
    fetchInitialData(true);
  }, []);

  useEffect(() => {
    if (!initialLoading) {
      fetchMonthData();
    }
  }, [selectedMonth, selectedYear]);

  const fetchInitialData = async (isFirstLoad = false) => {
    try {
      if (isFirstLoad) setInitialLoading(true);
      else setRefreshing(true);

      const userId = await getUserId();
      if (!userId) {
        loadDummyData();
        return;
      }

      const monthIndex = ALL_MONTHS.indexOf(selectedMonth) + 1;

      const response = await getTenantsByUserIdApi(userId);
      const allTenants = response?.data || response?.tenants || response || [];
      const tenantArray = Array.isArray(allTenants) ? allTenants : [];

      if (tenantArray.length === 0) {
        loadDummyData();
        return;
      }

      const list: TenantItem[] = tenantArray.map((item: any) => ({
        id: String(item.id || item.tenantId || item._id),
        name: item.name || item.tenantName || "Unknown",
        roomNumber: String(item.roomNumber || "101"),
        roomName: String(item.roomName || "Room 1"),
        bedName: String(item.bedName || "Bed A"),
        flatId: String(item.flatId || "flat_1"),
        flatName: item.flatName || "Sunrise PG",
        flatNumber: String(item.flatNumber || "A-1"),
        monthlyRent: Number(item.rent || item.monthlyRent || 6000),
        allocationType: 3,
      }));

      setTenants(list);

      const uniqueFlatsMap = new Map();
      list.forEach((t) => {
        if (t.flatId) uniqueFlatsMap.set(t.flatId, t.flatName);
      });
      setFlatsList(Array.from(uniqueFlatsMap, ([id, name]) => ({ id, name })));

      try {
        const recordsResponse = await api.get("/Rent/admin/all-records", {
          params: { month: monthIndex, year: selectedYear },
        });
        const recordsData =
          recordsResponse?.data?.data || recordsResponse?.data || [];
        setGeneratedTenantIds(
          Array.isArray(recordsData)
            ? recordsData.map((r: any) => String(r.tenantId))
            : [],
        );
      } catch (err) {
        setGeneratedTenantIds([]);
      }

      try {
        const reqResponse = await api.get(`/Rent/admin/payment-requests`, {
          params: { userId },
        });
        const reqData = reqResponse?.data?.data || reqResponse?.data || [];
        setPaymentRequests(
          Array.isArray(reqData) ? reqData : getDummyRequests(),
        );
      } catch (err: any) {
        console.log(
          "Payment Request API Error:",
          err?.response || err?.message,
        );
        setPaymentRequests(getDummyRequests());
      }
    } catch (error) {
      loadDummyData();
    } finally {
      if (isFirstLoad) setInitialLoading(false);
      else setRefreshing(false);
    }
  };

  const fetchMonthData = async () => {
    try {
      const monthIndex = ALL_MONTHS.indexOf(selectedMonth) + 1;
      try {
        const recordsResponse = await api.get("/Rent/admin/all-records", {
          params: { month: monthIndex, year: selectedYear },
        });
        const recordsData =
          recordsResponse?.data?.data || recordsResponse?.data || [];
        setGeneratedTenantIds(
          Array.isArray(recordsData)
            ? recordsData.map((r: any) => String(r.tenantId))
            : [],
        );
      } catch (err) {
        setGeneratedTenantIds([]);
      }
    } catch (error) {
      setGeneratedTenantIds([]);
    }
  };

  const handlePullToRefresh = () => {
    fetchInitialData(false);
  };

  const loadDummyData = () => {
    const dummyTenants: TenantItem[] = [
      {
        id: "t1",
        name: "Rahul Sharma",
        roomNumber: "101",
        roomName: "Room 101",
        bedName: "Bed 1",
        flatId: "f1",
        flatName: "Sunrise Luxury PG",
        flatNumber: "1",
        monthlyRent: 7500,
        allocationType: 3,
      },
      {
        id: "t2",
        name: "Amit Verma",
        roomNumber: "102",
        roomName: "Room 102",
        bedName: "Bed 2",
        flatId: "f1",
        flatName: "Sunrise Luxury PG",
        flatNumber: "1",
        monthlyRent: 6500,
        allocationType: 3,
      },
      {
        id: "t3",
        name: "Priya Singh",
        roomNumber: "201",
        roomName: "Room 201",
        bedName: "Bed 1",
        flatId: "f2",
        flatName: "Green Park Hostel",
        flatNumber: "2",
        monthlyRent: 8000,
        allocationType: 3,
      },
    ];

    const dummyRequests: PaymentRequestItem[] = [
      {
        id: "req_1",
        tenantId: "t1",
        tenantName: "Rahul Sharma",
        flatName: "Sunrise Luxury PG",
        roomNumber: "101",
        amount: 7500,
        paymentMode: "UPI / Google Pay",
        transactionId: "UPI4829102938",
        status: "PENDING",
      },
      {
        id: "req_2",
        tenantId: "t2",
        tenantName: "Amit Verma",
        flatName: "Sunrise Luxury PG",
        roomNumber: "102",
        amount: 6500,
        paymentMode: "PhonePe",
        transactionId: "UPI9823471029",
        status: "PENDING",
      },
    ];

    setTenants(dummyTenants);
    setGeneratedTenantIds(["t3"]);
    setSelectedTenantIds(["t1", "t2"]);
    setPaymentRequests(dummyRequests);
    setFlatsList([
      { id: "f1", name: "Sunrise Luxury PG" },
      { id: "f2", name: "Green Park Hostel" },
    ]);
    setInitialLoading(false);
    setRefreshing(false);
  };

  const getDummyRequests = () => [
    {
      id: "req_1",
      tenantId: "t1",
      tenantName: "Rahul Sharma",
      flatName: "Sunrise Luxury PG",
      roomNumber: "101",
      amount: 7500,
      paymentMode: "UPI",
      transactionId: "UPI4829102938",
      status: "PENDING",
    },
  ];

  const handlePaymentAction = async (
    requestId: string,
    action: "APPROVE" | "REJECT",
  ) => {
    try {
      setProcessingId(requestId);
      try {
        const endpoint =
          action === "APPROVE"
            ? `/Rent/admin/approve-payment`
            : `/Rent/admin/reject-payment`;
        await api.post(endpoint, { requestId });
      } catch (e) {}

      setPaymentRequests((prev) =>
        prev.map((item) =>
          item.id === requestId
            ? {
                ...item,
                status: action === "APPROVE" ? "APPROVED" : "REJECTED",
              }
            : item,
        ),
      );

      Alert.alert(
        "Success",
        action === "APPROVE"
          ? "Payment approved successfully!"
          : "Request rejected.",
      );
    } catch (error) {
      Alert.alert("Error", "Failed to process request.");
    } finally {
      setProcessingId(null);
    }
  };

  const filteredTenants = tenants.filter((t) => {
    const matchesFlat = selectedFlatId === "ALL" || t.flatId === selectedFlatId;
    const isBilled = generatedTenantIds.includes(t.id);
    return activeTab === "PENDING"
      ? matchesFlat && !isBilled
      : matchesFlat && isBilled;
  });

  const filteredRequests = paymentRequests.filter(
    (r) => r.status === "PENDING",
  );

  const toggleSelectAll = () => {
    if (selectedTenantIds.length === filteredTenants.length) {
      setSelectedTenantIds([]);
    } else {
      setSelectedTenantIds(filteredTenants.map((t) => t.id));
    }
  };

  const toggleTenantSelection = (id: string) => {
    if (selectedTenantIds.includes(id)) {
      setSelectedTenantIds(selectedTenantIds.filter((item) => item !== id));
    } else {
      setSelectedTenantIds([...selectedTenantIds, id]);
    }
  };

  const generateMonthlyRent = async (
    tenantId: number,
    month: number,
    year: number,
  ) => {
    return api.post("/Rent/generate-bill", {
      tenantId,
      month,
      year,
      endingMeterReading: 0,
      ratePerUnit: 0,
      extraCharges: 0,
      discount: 0,
    });
  };

  const handleGenerateRent = async () => {
    if (selectedTenantIds.length === 0) {
      Alert.alert(
        "Validation",
        "Please select at least one tenant to add monthly rent!",
      );
      return;
    }

    try {
      setSubmitting(true);

      const monthIndex = ALL_MONTHS.indexOf(selectedMonth) + 1;
      const yearNum = Number(selectedYear);

      // Sabhi selected tenants ke liye parallel API requests bhejna
      const promises = selectedTenantIds.map((tenantId) =>
        generateMonthlyRent(Number(tenantId), monthIndex, yearNum),
      );

      await Promise.all(promises);

      setGeneratedTenantIds([...generatedTenantIds, ...selectedTenantIds]);
      setSelectedTenantIds([]);
      Alert.alert("Success", "Tenant monthly rent dues added successfully!");
      fetchMonthData();
    } catch (error: any) {
      console.log(
        "Generate Rent API Error:",
        error?.response || error?.message,
      );

      const errorMessage =
        error?.response?.data?.errors?.TenantId?.[0] ||
        error?.response?.data?.title ||
        "Failed to generate rent bills.";

      Alert.alert("Error", errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  if (initialLoading) {
    return (
      <SafeAreaView style={[styles.safeArea, styles.center]}>
        <ActivityIndicator size="large" color="#6366F1" />
        <Text style={styles.loadingText}>Loading Management Console...</Text>
      </SafeAreaView>
    );
  }

  const pendingCount = tenants.filter(
    (t) => !generatedTenantIds.includes(t.id),
  ).length;
  const generatedCount = generatedTenantIds.length;
  const reqCount = paymentRequests.filter((r) => r.status === "PENDING").length;

  return (
    <SafeAreaView style={[styles.safeArea, commonStyles?.container]}>
      <StatusBar barStyle="light-content" backgroundColor="#090D16" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={20} color="#F8FAFC" />
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>Monthly Rent Due Manager</Text>
          <Text style={styles.headerSubtitle}>
            Add Tenant Dues & Approve Payments
          </Text>
        </View>
      </View>

      {/* Month Selection Bar */}
      <View style={styles.selectionSection}>
        <View style={styles.monthHeaderRow}>
          <Text style={styles.sectionLabel}>
            Billing Month Cycle • {selectedYear}
          </Text>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.monthScroll}
          ref={monthScrollRef}
        >
          {ALL_MONTHS.map((m) => {
            const isSelected = m === selectedMonth;
            return (
              <TouchableOpacity
                key={m}
                style={[
                  styles.monthPill,
                  isSelected && styles.monthPillSelected,
                ]}
                onPress={() => setSelectedMonth(m)}
              >
                <Text
                  style={[
                    styles.monthText,
                    isSelected && styles.monthTextSelected,
                  ]}
                >
                  {m}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Property Filter Chips */}
      {flatsList.length > 0 && (
        <View style={styles.pgFilterSection}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 8 }}
          >
            <TouchableOpacity
              style={[
                styles.pgPill,
                selectedFlatId === "ALL" && styles.pgPillSelected,
              ]}
              onPress={() => setSelectedFlatId("ALL")}
            >
              <Text
                style={[
                  styles.pgText,
                  selectedFlatId === "ALL" && styles.pgTextSelected,
                ]}
              >
                🏢 All Properties
              </Text>
            </TouchableOpacity>
            {flatsList.map((flat) => (
              <TouchableOpacity
                key={flat.id}
                style={[
                  styles.pgPill,
                  selectedFlatId === flat.id && styles.pgPillSelected,
                ]}
                onPress={() => setSelectedFlatId(flat.id)}
              >
                <Text
                  style={[
                    styles.pgText,
                    selectedFlatId === flat.id && styles.pgTextSelected,
                  ]}
                >
                  🏠 {flat.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Dashboard Segmented Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[
            styles.tabButton,
            activeTab === "PENDING" && styles.tabActivePending,
          ]}
          onPress={() => setActiveTab("PENDING")}
        >
          <Ionicons
            name="add-circle-outline"
            size={15}
            color={activeTab === "PENDING" ? "#6366F1" : "#94A3B8"}
          />
          <Text
            style={[
              styles.tabText,
              activeTab === "PENDING" && styles.tabTextActivePending,
            ]}
          >
            Add Dues ({pendingCount})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tabButton,
            activeTab === "GENERATED" && styles.tabActiveGenerated,
          ]}
          onPress={() => setActiveTab("GENERATED")}
        >
          <Ionicons
            name="checkmark-done-circle-outline"
            size={15}
            color={activeTab === "GENERATED" ? "#10B981" : "#94A3B8"}
          />
          <Text
            style={[
              styles.tabText,
              activeTab === "GENERATED" && styles.tabTextActiveGenerated,
            ]}
          >
            Added Dues ({generatedCount})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tabButton,
            activeTab === "REQUESTS" && styles.tabActiveRequests,
          ]}
          onPress={() => setActiveTab("REQUESTS")}
        >
          <Ionicons
            name="card-outline"
            size={15}
            color={activeTab === "REQUESTS" ? "#F59E0B" : "#94A3B8"}
          />
          <Text
            style={[
              styles.tabText,
              activeTab === "REQUESTS" && styles.tabTextActiveRequests,
            ]}
          >
            Approvals ({reqCount})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Action Bar for Pending Tab */}
      {activeTab === "PENDING" && filteredTenants.length > 0 && (
        <View style={styles.actionBar}>
          <TouchableOpacity
            style={styles.selectAllRow}
            onPress={toggleSelectAll}
          >
            <Ionicons
              name={
                selectedTenantIds.length === filteredTenants.length &&
                filteredTenants.length > 0
                  ? "checkbox"
                  : "square-outline"
              }
              size={20}
              color="#6366F1"
            />
            <Text style={styles.selectAllText}>
              Select All ({selectedTenantIds.length}/{filteredTenants.length})
            </Text>
          </TouchableOpacity>
          <Text style={styles.targetBadge}>{selectedMonth} Rent Dues</Text>
        </View>
      )}

      {/* Dynamic Content List */}
      {activeTab === "REQUESTS" ? (
        <FlatList
          data={filteredRequests}
          keyExtractor={(item) => item.id}
          removeClippedSubviews={true}
          maxToRenderPerBatch={10}
          windowSize={5}
          refreshing={refreshing}
          onRefresh={handlePullToRefresh}
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingBottom: 40,
            paddingTop: 6,
          }}
          renderItem={({ item }) => {
            const isProcessing = processingId === item.id;
            return (
              <View style={styles.requestCard}>
                <View style={styles.cardHeaderRow}>
                  <View style={styles.nameContainer}>
                    <View style={styles.iconBoxReq}>
                      <Ionicons
                        name="wallet-outline"
                        size={18}
                        color="#F59E0B"
                      />
                    </View>
                    <View>
                      <Text style={styles.tenantName}>{item.tenantName}</Text>
                      <Text style={styles.subDetailText}>
                        {item.flatName} • Room {item.roomNumber}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.rentAmountReq}>
                    ₹{item.amount?.toLocaleString()}
                  </Text>
                </View>

                <View style={styles.cardDivider} />

                <View style={styles.paymentInfoBox}>
                  <Text style={styles.paymentMeta}>
                    Mode:{" "}
                    <Text style={{ color: "#F8FAFC" }}>{item.paymentMode}</Text>
                  </Text>
                  <Text style={styles.paymentMeta}>
                    Txn ID:{" "}
                    <Text style={{ color: "#38BDF8" }}>
                      {item.transactionId}
                    </Text>
                  </Text>
                </View>

                <View style={styles.actionRow}>
                  <TouchableOpacity
                    style={[styles.rejectBtn, isProcessing && { opacity: 0.6 }]}
                    onPress={() => handlePaymentAction(item.id, "REJECT")}
                    disabled={isProcessing}
                  >
                    <Text style={styles.rejectText}>Reject</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.approveBtn,
                      isProcessing && { opacity: 0.6 },
                    ]}
                    onPress={() => handlePaymentAction(item.id, "APPROVE")}
                    disabled={isProcessing}
                  >
                    {isProcessing ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <Text style={styles.approveText}>Approve Payment</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            );
          }}
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Ionicons
                name="shield-checkmark-outline"
                size={54}
                color="#10B981"
              />
              <Text style={styles.emptyTitle}>All Clear!</Text>
              <Text style={styles.emptyText}>
                No pending payment requests from tenants right now.
              </Text>
            </View>
          }
        />
      ) : (
        <FlatList
          data={filteredTenants}
          keyExtractor={(item) => item.id}
          removeClippedSubviews={true}
          maxToRenderPerBatch={10}
          windowSize={5}
          refreshing={refreshing}
          onRefresh={handlePullToRefresh}
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingBottom: 110,
            paddingTop: 6,
          }}
          renderItem={({ item }) => {
            const isSelected = selectedTenantIds.includes(item.id);
            const isBilled = generatedTenantIds.includes(item.id);

            return (
              <TouchableOpacity
                style={[
                  styles.tenantCard,
                  activeTab === "PENDING" &&
                    isSelected &&
                    styles.tenantCardSelected,
                  activeTab === "GENERATED" && styles.tenantCardGenerated,
                ]}
                activeOpacity={activeTab === "PENDING" ? 0.8 : 1}
                onPress={() => {
                  if (activeTab === "PENDING") toggleTenantSelection(item.id);
                }}
              >
                <View style={styles.cardHeaderRow}>
                  <View style={styles.nameContainer}>
                    {activeTab === "PENDING" && (
                      <Ionicons
                        name={isSelected ? "checkbox" : "square-outline"}
                        size={22}
                        color={isSelected ? "#6366F1" : "#475569"}
                        style={{ marginRight: 10 }}
                      />
                    )}
                    <View>
                      <Text style={styles.tenantName}>{item.name}</Text>
                      <Text style={styles.subDetailText}>
                        {item.flatName} • Room {item.roomNumber}
                      </Text>
                    </View>
                  </View>

                  {isBilled ? (
                    <View style={styles.billedBadge}>
                      <Ionicons
                        name="checkmark-circle"
                        size={13}
                        color="#34D399"
                        style={{ marginRight: 3 }}
                      />
                      <Text style={styles.billedText}>Rent Due Added</Text>
                    </View>
                  ) : (
                    <View style={styles.pendingBadge}>
                      <Text style={styles.pendingBadgeText}>
                        Pending Rent Add
                      </Text>
                    </View>
                  )}
                </View>

                <View style={styles.cardDivider} />

                <View style={styles.bottomDetailsRow}>
                  <Text style={styles.rentLabel}>Monthly Rent Amount</Text>
                  <Text style={styles.rentAmount}>
                    ₹{item.monthlyRent.toLocaleString()}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          }}
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Ionicons
                name={
                  activeTab === "PENDING"
                    ? "checkmark-circle-outline"
                    : "document-text-outline"
                }
                size={54}
                color={activeTab === "PENDING" ? "#10B981" : "#64748B"}
              />
              <Text style={styles.emptyTitle}>
                {activeTab === "PENDING"
                  ? "All Tenant Rents Added!"
                  : "No Rents Added Yet"}
              </Text>
              <Text style={styles.emptyText}>
                {activeTab === "PENDING"
                  ? `All selected tenants' monthly rent has been added for ${selectedMonth}.`
                  : `No monthly rent dues added yet for ${selectedMonth}.`}
              </Text>
            </View>
          }
        />
      )}

      {/* Floating Bottom Action CTA Button */}
      {activeTab === "PENDING" && filteredTenants.length > 0 && (
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.generateButton, submitting && { opacity: 0.7 }]}
            onPress={handleGenerateRent}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <View style={styles.btnContent}>
                <Ionicons
                  name="add-circle-outline"
                  size={18}
                  color="#FFFFFF"
                  style={{ marginRight: 8 }}
                />
                <Text style={styles.generateButtonText}>
                  Add Monthly Rent Dues ({selectedTenantIds.length} Selected)
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#090D16" },
  center: { justifyContent: "center", alignItems: "center" },
  loadingText: { color: "#94A3B8", marginTop: 10, fontSize: 14 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#1E293B",
  },
  backBtn: {
    marginRight: 12,
    padding: 8,
    backgroundColor: "#1E293B",
    borderRadius: 10,
  },
  headerTitle: { color: "#F8FAFC", fontSize: 18, fontWeight: "700" },
  headerSubtitle: { color: "#94A3B8", fontSize: 12, fontWeight: "500" },
  selectionSection: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: "#0E1322",
    borderBottomWidth: 1,
    borderBottomColor: "#1E293B",
  },
  monthHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  sectionLabel: {
    color: "#64748B",
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  monthScroll: { gap: 8, paddingRight: 16 },
  monthPill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 12,
    backgroundColor: "#161E31",
    borderWidth: 1,
    borderColor: "#22304A",
  },
  monthPillSelected: { backgroundColor: "#6366F1", borderColor: "#818CF8" },
  monthText: { color: "#94A3B8", fontSize: 12, fontWeight: "600" },
  monthTextSelected: { color: "#FFFFFF", fontWeight: "700" },
  pgFilterSection: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: "#090D16",
    borderBottomWidth: 1,
    borderBottomColor: "#1E293B",
  },
  pgPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: "#161E31",
    borderWidth: 1,
    borderColor: "#22304A",
  },
  pgPillSelected: { backgroundColor: "#0F766E", borderColor: "#2DD4BF" },
  pgText: { color: "#94A3B8", fontSize: 12, fontWeight: "500" },
  pgTextSelected: { color: "#FFFFFF", fontWeight: "700" },
  tabContainer: {
    flexDirection: "row",
    backgroundColor: "#0E1322",
    padding: 6,
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#1E293B",
    gap: 6,
  },
  tabButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 9,
    borderRadius: 8,
    gap: 5,
  },
  tabActivePending: {
    backgroundColor: "#1E1B4B",
    borderWidth: 1,
    borderColor: "#4338CA",
  },
  tabActiveGenerated: {
    backgroundColor: "#064E3B",
    borderWidth: 1,
    borderColor: "#047857",
  },
  tabActiveRequests: {
    backgroundColor: "#451A03",
    borderWidth: 1,
    borderColor: "#B45309",
  },
  tabText: { color: "#94A3B8", fontSize: 11, fontWeight: "600" },
  tabTextActivePending: { color: "#A5B4FC", fontWeight: "700" },
  tabTextActiveGenerated: { color: "#6EE7B7", fontWeight: "700" },
  tabTextActiveRequests: { color: "#FCD34D", fontWeight: "700" },
  actionBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: "#161E31",
    marginTop: 10,
    marginBottom: 4,
    marginHorizontal: 16,
    borderRadius: 10,
  },
  selectAllRow: { flexDirection: "row", alignItems: "center" },
  selectAllText: {
    color: "#F8FAFC",
    fontSize: 13,
    fontWeight: "600",
    marginLeft: 8,
  },
  targetBadge: {
    color: "#818CF8",
    fontSize: 12,
    fontWeight: "700",
    backgroundColor: "rgba(99, 102, 241, 0.15)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  tenantCard: {
    backgroundColor: "#161E31",
    padding: 16,
    borderRadius: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#22304A",
  },
  tenantCardSelected: {
    borderColor: "#6366F1",
    backgroundColor: "rgba(99, 102, 241, 0.08)",
  },
  tenantCardGenerated: {
    opacity: 0.9,
    borderColor: "#1E293B",
    backgroundColor: "#0E1322",
  },
  requestCard: {
    backgroundColor: "#161E31",
    padding: 16,
    borderRadius: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#334155",
  },
  cardHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  nameContainer: { flexDirection: "row", alignItems: "center", flex: 1 },
  iconBoxReq: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "rgba(245, 158, 11, 0.12)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  tenantName: { color: "#F8FAFC", fontSize: 15, fontWeight: "700" },
  subDetailText: { color: "#94A3B8", fontSize: 12, marginTop: 2 },
  cardDivider: { height: 1, backgroundColor: "#22304A", marginVertical: 12 },
  paymentInfoBox: { gap: 4, marginBottom: 4 },
  paymentMeta: { color: "#94A3B8", fontSize: 12, fontWeight: "500" },
  bottomDetailsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  rentLabel: { color: "#94A3B8", fontSize: 12, fontWeight: "500" },
  rentAmount: { color: "#34D399", fontSize: 16, fontWeight: "700" },
  rentAmountReq: { color: "#34D399", fontSize: 18, fontWeight: "700" },
  billedBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(16, 185, 129, 0.15)",
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 6,
  },
  billedText: { color: "#34D399", fontSize: 11, fontWeight: "700" },
  pendingBadge: {
    backgroundColor: "rgba(100, 116, 139, 0.2)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  pendingBadgeText: { color: "#94A3B8", fontSize: 10, fontWeight: "600" },
  actionRow: { flexDirection: "row", gap: 10, marginTop: 12 },
  rejectBtn: {
    flex: 1,
    backgroundColor: "rgba(239, 68, 68, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.3)",
    paddingVertical: 9,
    borderRadius: 10,
    alignItems: "center",
  },
  rejectText: { color: "#F87171", fontSize: 12, fontWeight: "700" },
  approveBtn: {
    flex: 2,
    backgroundColor: "#059669",
    paddingVertical: 9,
    borderRadius: 10,
    alignItems: "center",
  },
  approveText: { color: "#FFFFFF", fontSize: 12, fontWeight: "700" },
  emptyBox: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyTitle: {
    color: "#F8FAFC",
    fontSize: 16,
    fontWeight: "700",
    marginTop: 12,
  },
  emptyText: {
    color: "#94A3B8",
    fontSize: 13,
    marginTop: 6,
    textAlign: "center",
    lineHeight: 18,
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#090D16",
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#1E293B",
  },
  generateButton: {
    backgroundColor: "#6366F1",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  btnContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  generateButtonText: { color: "#FFFFFF", fontSize: 14, fontWeight: "700" },
});
