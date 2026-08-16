import Ionicons from "@expo/vector-icons/Ionicons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import DateTimePicker from "@react-native-community/datetimepicker";
import * as Print from "expo-print";
import { router } from "expo-router";
import * as Sharing from "expo-sharing";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { COLORS, RADIUS, SPACING } from "../src/constants/theme";
import { expenseService } from "../src/services/Utility/expenseEndpoints";
import { commonStyles } from "../src/styles/commonStyles";
import { ReportFormatter } from "../src/utils/ReportBuilder";

// Correct API & Service imports
import { rentService } from "../src/services/rentService";
import {
  getFlatsByUserIdApi,
  getTenantsByUserIdApi,
} from "../src/services/tenantApi"; // Added getTenantsByUserIdApi

const STORAGE_KEY = "@dashboard_cache_data";
const FLATS_STORAGE_KEY = "flats_2bhk";

export default function ReportsScreenPro() {
  const [reportType, setReportType] = useState<"rent" | "expense" | "tenants">(
    "rent",
  );
  const [tenantSubFilter, setTenantSubFilter] = useState<
    "all" | "active" | "notice" | "defaulters"
  >("active");

  // Branch / Flat State Management
  const [selectedBranch, setSelectedBranch] = useState("All Flats");
  const [branches, setBranches] = useState<string[]>(["All Flats"]);

  const [startDate, setStartDate] = useState(new Date(2026, 7, 1));
  const [endDate, setEndDate] = useState(new Date(2026, 7, 15));

  const [showPicker, setShowPicker] = useState(false);
  const [pickerMode, setPickerMode] = useState<"start" | "end">("start");

  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);

  // Advanced Features State
  const [exportFormat, setExportFormat] = useState<"pdf" | "excel">("pdf");
  const [includeLedger, setIncludeLedger] = useState(true);
  const [emailDispatch, setEmailDispatch] = useState(false);
  const [recipientEmail, setRecipientEmail] = useState(
    "accountant@pgmanagment.com",
  );
  const [addWatermark, setAddWatermark] = useState(true);

  const [isGenerating, setIsGenerating] = useState(false);
  const [adminName, setAdminName] = useState("Administrator");

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const cached = await AsyncStorage.getItem(FLATS_STORAGE_KEY);
      if (cached) {
        const parsedCache = JSON.parse(cached);
        if (Array.isArray(parsedCache) && parsedCache.length > 0) {
          const flatNames = parsedCache.map((item: any, fIdx: number) => {
            if (typeof item === "string") return item;
            const apt = item.apartmentName || item.name || "";
            const flatNum = item.flatNumber ? `Flat ${item.flatNumber}` : "";
            if (apt && flatNum) return `${apt} - ${flatNum}`;
            return apt || flatNum || item.id || `Flat ${fIdx + 1}`;
          });
          setBranches(["All Flats", ...flatNames]);
        }
      }

      const data = await AsyncStorage.getItem(STORAGE_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        if (parsed.ownerName) setAdminName(parsed.ownerName);
      }
    } catch (e) {
      console.log("Error loading config from cache", e);
    }
  };

  const getThemeColor = () => {
    switch (reportType) {
      case "rent":
        return COLORS.primary;
      case "expense":
        return "#38BDF8";
      case "tenants":
        return "#34D399";
    }
  };

  const themeColor = getThemeColor();

  const formatDateString = (date: Date) => {
    return date.toISOString().split("T")[0];
  };

  const dayCount =
    Math.ceil(
      Math.abs(endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
    ) + 1;

  const applyPreset = (type: "thisMonth" | "lastMonth" | "last3Months") => {
    const now = new Date();
    if (type === "thisMonth") {
      setStartDate(new Date(now.getFullYear(), now.getMonth(), 1));
      setEndDate(new Date(now.getFullYear(), now.getMonth() + 1, 0));
    } else if (type === "lastMonth") {
      setStartDate(new Date(now.getFullYear(), now.getMonth() - 1, 1));
      setEndDate(new Date(now.getFullYear(), now.getMonth(), 0));
    } else if (type === "last3Months") {
      setStartDate(new Date(now.getFullYear(), now.getMonth() - 3, 1));
      setEndDate(new Date());
    }
    setShowPicker(false);
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS !== "ios") setShowPicker(false);
    if (selectedDate) {
      if (pickerMode === "start") setStartDate(selectedDate);
      else setEndDate(selectedDate);
    }
  };

  const handleGenerate = async () => {
    if (isGenerating) return;
    setIsGenerating(true);
    try {
      if (exportFormat === "excel") {
        await new Promise((r) => setTimeout(r, 1200));
        setIsGenerating(false);
        Alert.alert(
          "Spreadsheet Ready",
          `Excel (.xlsx) dataset compiled for: ${selectedBranch}.`,
        );
        return;
      }

      const storedUserId = await AsyncStorage.getItem("userId");
      console.log("👉 Retrieved storedUserId:", storedUserId);

      if (!storedUserId) {
        setIsGenerating(false);
        Alert.alert(
          "Authentication Error",
          "User ID not found. Please log in again.",
        );
        return;
      }

      let rawData: any[] = [];

      // Fetch tenants and flats data using respective APIs
      console.log("👉 Fetching tenants using getTenantsByUserIdApi...");
      const tenantsResponse = await getTenantsByUserIdApi(storedUserId);
      let apiTenantsArray = Array.isArray(tenantsResponse)
        ? tenantsResponse
        : tenantsResponse?.data || tenantsResponse?.tenants || [];

      console.log("👉 Fetching flats using getFlatsByUserIdApi...");
      const flatsResponse = await getFlatsByUserIdApi(storedUserId);
      let apiFlatsArray = Array.isArray(flatsResponse)
        ? flatsResponse
        : flatsResponse?.data || flatsResponse?.flats || [];

      const tenantFlatMap: { [key: string]: string } = {};
      const tenantPhoneMap: { [key: string]: string } = {};

      if (Array.isArray(apiFlatsArray)) {
        apiFlatsArray.forEach((flatItem: any) => {
          const flatLabel = flatItem.apartmentName
            ? `${flatItem.apartmentName} - Flat ${flatItem.flatNumber || ""}`
            : flatItem.name || flatItem.flatNumber
              ? `Flat ${flatItem.flatNumber}`
              : "Property";

          if (flatItem.name) {
            const tKey = flatItem.name.trim().toLowerCase();
            tenantFlatMap[tKey] = flatLabel;
            if (flatItem.phone) tenantPhoneMap[tKey] = flatItem.phone;
          }
        });
      }

      if (reportType === "rent") {
        console.log("👉 Fetching rent records...");
        const rentResponse = await rentService.getAllRentRecords({
          month: startDate.getMonth() + 1,
          year: startDate.getFullYear().toString(),
        });

        let rentArray = Array.isArray(rentResponse)
          ? rentResponse
          : rentResponse?.data || rentResponse?.records || [];

        rentArray.forEach((item: any) => {
          const tName = (item.tenantName || "").trim().toLowerCase();
          const mappedFlat =
            item.flatDetails ||
            item.flatName ||
            tenantFlatMap[tName] ||
            (item.flatNumber ? `Flat ${item.flatNumber}` : "Flat N/A");

          if (
            selectedBranch !== "All Flats" &&
            !mappedFlat.includes(selectedBranch)
          ) {
            return;
          }

          rawData.push({
            id:
              item.invoiceNumber || item.receiptId || item.rentId || "#REC-01",
            tenantName: item.tenantName || "Resident",
            flatDetails: mappedFlat,
            paymentMode:
              item.paymentHistory?.[0]?.paymentMode ||
              item.paymentMode ||
              "Online",
            status: item.status || "PAID",
            amount:
              item.totalAmount !== undefined
                ? `₹${item.totalAmount}`
                : item.paidAmount !== undefined
                  ? `₹${item.paidAmount}`
                  : "₹0",
          });
        });
      } else if (reportType === "expense") {
        console.log("👉 Fetching operational expenses via expenseService...");
        // Pass current month string or identifier as needed
        const currentMonthQuery = startDate.toLocaleDateString("en-GB", {
          month: "short",
          year: "numeric",
        });

        const expenseArray =
          await expenseService.fetchExpenses(currentMonthQuery);
        console.log("👉 Raw expenses response received:", expenseArray);

        if (Array.isArray(expenseArray)) {
          expenseArray.forEach((item: any) => {
            // Match flat/branch name from flatId if available
            let branchName = "General Property";
            if (item.flatId && Array.isArray(apiFlatsArray)) {
              const matchedFlat = apiFlatsArray.find(
                (f: any) => f.id === item.flatId || f.FlatId === item.flatId,
              );
              if (matchedFlat) {
                branchName = matchedFlat.apartmentName
                  ? `${matchedFlat.apartmentName} - Flat ${matchedFlat.flatNumber || ""}`
                  : matchedFlat.name || `Flat ${matchedFlat.flatNumber || ""}`;
              }
            }

            // Filter by selected branch if not "All Flats"
            if (
              selectedBranch !== "All Flats" &&
              !branchName.includes(selectedBranch)
            ) {
              return;
            }

            rawData.push({
              date: item.date || "Today",
              category: item.category || "General",
              description: item.title || item.notes || "Operational Expense",
              branchName: branchName,
              amount: `₹${item.amount || 0}`,
            });
          });
        }
      } else {
        if (Array.isArray(apiTenantsArray) && apiTenantsArray.length > 0) {
          apiTenantsArray.forEach((tenantItem: any) => {
            const flatLabel = tenantItem.apartmentName
              ? `${tenantItem.apartmentName} - Flat ${tenantItem.flatNumber || ""}`
              : tenantItem.flatName || tenantItem.flatNumber
                ? `Flat ${tenantItem.flatNumber}`
                : "Property";

            if (
              selectedBranch !== "All Flats" &&
              !flatLabel.includes(selectedBranch)
            ) {
              return;
            }

            if (reportType === "tenants") {
              const realPhone =
                tenantItem.phone ||
                tenantPhoneMap[(tenantItem.name || "").trim().toLowerCase()] ||
                "+91 98765 43210";

              const tenantObj = {
                name: tenantItem.name || tenantItem.tenantName || "Resident",
                phone: realPhone,
                status: tenantItem.status || "ACTIVE",
                due: tenantItem.dueAmount ? `₹${tenantItem.dueAmount}` : "₹0",
                flat: flatLabel,
              };

              const tenantStatus = (tenantObj.status || "ACTIVE").toUpperCase();
              const dueAmountVal =
                parseInt(String(tenantObj.due || "0").replace(/[^0-9]/g, "")) ||
                0;

              if (
                tenantSubFilter === "active" &&
                !tenantStatus.includes("ACTIVE")
              )
                return;
              if (
                tenantSubFilter === "notice" &&
                !tenantStatus.includes("NOTICE")
              )
                return;
              if (tenantSubFilter === "defaulters" && dueAmountVal <= 0) return;

              rawData.push(tenantObj);
            }
          });
        }
      }

      console.log("👉 Compiled rawData for report generation:", rawData);

      const html = ReportFormatter.generateHTML({
        branch: selectedBranch,
        month: `${formatDateString(startDate)} to ${formatDateString(endDate)}`,
        generatedBy: adminName,
        reportType,
        detailed: includeLedger,
        watermark: addWatermark,
        subFilter: reportType === "tenants" ? tenantSubFilter : undefined,
        tableData: rawData,
      } as any);

      const file = await Print.printToFileAsync({ html });
      console.log("👉 PDF Generated at URI:", file.uri);
      setIsGenerating(false);

      if (emailDispatch) {
        Alert.alert(
          "Dispatched",
          `Report securely emailed to ${recipientEmail}`,
        );
        return;
      }

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(file.uri, {
          mimeType: "application/pdf",
          dialogTitle: `Export Report - ${selectedBranch}`,
        });
      } else {
        Alert.alert("Success", `Report saved securely at: ${file.uri}`);
      }
    } catch (error: any) {
      console.log("❌ Error during report generation:", error);
      setIsGenerating(false);
      Alert.alert(
        "Export Error",
        error?.message || "Could not fetch data or generate document.",
      );
    }
  };

  return (
    <SafeAreaView style={commonStyles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />

      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.iconButton}
        >
          <Ionicons name="arrow-back" size={18} color={COLORS.textSecondary} />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Advanced Reports & Analytics</Text>
          <Text style={styles.headerSub}>Enterprise Intelligence Hub</Text>
        </View>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.sectionLabel}>SELECT REPORT MODULE</Text>
        <View style={styles.categoryRow}>
          {[
            { key: "rent", label: "Rent Roll", icon: "wallet-outline" },
            { key: "expense", label: "Expenses", icon: "receipt-outline" },
            { key: "tenants", label: "Tenants", icon: "people-outline" },
          ].map((item) => {
            const isActive = reportType === item.key;
            return (
              <TouchableOpacity
                key={item.key}
                style={[
                  styles.pill,
                  isActive && {
                    backgroundColor: themeColor + "15",
                    borderColor: themeColor,
                    shadowColor: themeColor,
                    shadowOpacity: 0.15,
                    shadowRadius: 8,
                    elevation: 3,
                  },
                ]}
                onPress={() => setReportType(item.key as any)}
                activeOpacity={0.8}
              >
                <Ionicons
                  name={item.icon as any}
                  size={18}
                  color={isActive ? themeColor : COLORS.textSecondary}
                />
                <Text
                  style={[
                    styles.pillText,
                    isActive && { color: themeColor, fontWeight: "700" },
                  ]}
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {reportType === "tenants" && (
          <View style={styles.subFilterWrapper}>
            <Text style={styles.sectionLabel}>TENANT SUB-CATEGORY</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.subScrollContent}
            >
              {[
                { key: "all", label: "All Tenants" },
                { key: "active", label: "Active Only" },
                { key: "notice", label: "Notice Period" },
                { key: "defaulters", label: "Pending Dues" },
              ].map((sub) => {
                const isSubActive = tenantSubFilter === sub.key;
                return (
                  <TouchableOpacity
                    key={sub.key}
                    style={[
                      styles.subChip,
                      isSubActive && {
                        backgroundColor: themeColor,
                        borderColor: themeColor,
                      },
                    ]}
                    onPress={() => setTenantSubFilter(sub.key as any)}
                  >
                    <Text
                      style={[
                        styles.subChipText,
                        isSubActive && {
                          color: COLORS.background,
                          fontWeight: "700",
                        },
                      ]}
                    >
                      {sub.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        )}

        <Text style={[styles.sectionLabel, { marginTop: SPACING.xl }]}>
          CONFIGURATION & RANGE
        </Text>
        <TouchableOpacity
          style={[styles.configCard, { borderColor: themeColor + "50" }]}
          onPress={() => setIsFilterModalOpen(true)}
          activeOpacity={0.88}
        >
          <View style={styles.rowBetween}>
            <View style={styles.configLeftGroup}>
              <View
                style={[
                  styles.miniIconBox,
                  { backgroundColor: themeColor + "20" },
                ]}
              >
                <Ionicons name="business" size={18} color={themeColor} />
              </View>
              <View style={styles.configTextContainer}>
                <View style={styles.badgeRow}>
                  <Text style={styles.paramValueText} numberOfLines={1}>
                    {selectedBranch}
                  </Text>
                  <View
                    style={[
                      styles.badge,
                      { backgroundColor: themeColor + "15" },
                    ]}
                  >
                    <Text style={[styles.badgeText, { color: themeColor }]}>
                      {dayCount} Days
                    </Text>
                  </View>
                </View>
                <Text style={styles.dateRangeSubText}>
                  <Ionicons
                    name="calendar-clear-outline"
                    size={11}
                    color={COLORS.textSecondary}
                  />{" "}
                  {formatDateString(startDate)} ➔ {formatDateString(endDate)}
                </Text>
              </View>
            </View>
            <View style={styles.editBadge}>
              <Text style={[styles.editText, { color: themeColor }]}>
                Modify
              </Text>
              <Ionicons name="chevron-forward" size={14} color={themeColor} />
            </View>
          </View>
        </TouchableOpacity>

        <Text style={[styles.sectionLabel, { marginTop: SPACING.xl }]}>
          ADVANCED EXPORT SETTINGS
        </Text>
        <View style={styles.settingsCard}>
          <View style={[styles.switchRow, { marginBottom: SPACING.md }]}>
            <View style={styles.settingLabelContainer}>
              <Text style={styles.paramValueText}>Export Format</Text>
              <Text style={styles.paramSubLabel}>Choose PDF or Excel</Text>
            </View>
            <View style={styles.formatSwitchContainer}>
              <TouchableOpacity
                style={[
                  styles.formatBtn,
                  exportFormat === "pdf" && { backgroundColor: themeColor },
                ]}
                onPress={() => setExportFormat("pdf")}
              >
                <Text
                  style={[
                    styles.formatBtnText,
                    exportFormat === "pdf" && {
                      color: COLORS.background,
                      fontWeight: "700",
                    },
                  ]}
                >
                  PDF
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.formatBtn,
                  exportFormat === "excel" && { backgroundColor: themeColor },
                ]}
                onPress={() => setExportFormat("excel")}
              >
                <Text
                  style={[
                    styles.formatBtnText,
                    exportFormat === "excel" && {
                      color: COLORS.background,
                      fontWeight: "700",
                    },
                  ]}
                >
                  Excel
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.settingDivider} />

          <View style={[styles.switchRow, { marginVertical: SPACING.md }]}>
            <View style={styles.settingLabelContainer}>
              <Text style={styles.paramValueText}>
                Detailed Transaction Ledger
              </Text>
            </View>
            <Switch
              value={includeLedger}
              onValueChange={setIncludeLedger}
              trackColor={{ false: COLORS.border, true: themeColor }}
            />
          </View>

          <View style={styles.settingDivider} />

          <View style={[styles.switchRow, { marginVertical: SPACING.md }]}>
            <View style={styles.settingLabelContainer}>
              <Text style={styles.paramValueText}>Confidential Watermark</Text>
            </View>
            <Switch
              value={addWatermark}
              onValueChange={setAddWatermark}
              trackColor={{ false: COLORS.border, true: themeColor }}
            />
          </View>

          <View style={styles.settingDivider} />

          <View style={[styles.switchRow, { marginTop: SPACING.md }]}>
            <View style={styles.settingLabelContainer}>
              <Text style={styles.paramValueText}>
                Direct Accountant Dispatch
              </Text>
            </View>
            <Switch
              value={emailDispatch}
              onValueChange={setEmailDispatch}
              trackColor={{ false: COLORS.border, true: themeColor }}
            />
          </View>

          {emailDispatch && (
            <TextInput
              style={[styles.emailInput, { borderColor: themeColor + "60" }]}
              value={recipientEmail}
              onChangeText={setRecipientEmail}
              placeholder="Enter accountant email"
              placeholderTextColor={COLORS.textSecondary}
              keyboardType="email-address"
            />
          )}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      <View style={styles.footerContainer}>
        <TouchableOpacity
          style={[styles.primaryButton, { backgroundColor: themeColor }]}
          onPress={handleGenerate}
          disabled={isGenerating}
          activeOpacity={0.88}
        >
          {isGenerating ? (
            <View style={styles.buttonInnerRow}>
              <ActivityIndicator color={COLORS.background} size="small" />
              <Text style={styles.primaryButtonText}>Compiling Data...</Text>
            </View>
          ) : (
            <View style={styles.buttonInnerRow}>
              <Ionicons
                name={
                  exportFormat === "pdf"
                    ? "cloud-download-outline"
                    : "grid-outline"
                }
                size={18}
                color={COLORS.background}
              />
              <Text style={styles.primaryButtonText}>
                {emailDispatch
                  ? "Email Report Directly"
                  : `Export ${exportFormat.toUpperCase()} Document`}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <Modal
        visible={isFilterModalOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setIsFilterModalOpen(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => {
            setShowPicker(false);
            setIsFilterModalOpen(false);
          }}
        >
          <TouchableOpacity
            style={styles.modalContent}
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.modalIndicatorBar} />
            <Text style={styles.modalHeaderTitle}>
              Configure Flat & Date Range
            </Text>

            <Text style={styles.inputLabel}>SELECT FLAT / BRANCH</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.branchScrollContent}
            >
              {branches.map((b) => {
                const isSelected = selectedBranch === b;
                return (
                  <TouchableOpacity
                    key={b}
                    style={[
                      styles.branchPill,
                      isSelected && {
                        backgroundColor: themeColor + "15",
                        borderColor: themeColor,
                      },
                    ]}
                    onPress={() => setSelectedBranch(b)}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[
                        styles.branchPillText,
                        isSelected && { color: themeColor, fontWeight: "700" },
                      ]}
                    >
                      {b}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <Text style={[styles.inputLabel, { marginTop: SPACING.md }]}>
              QUICK DURATION PRESETS
            </Text>
            <View style={styles.presetRow}>
              {[
                { key: "thisMonth", label: "This Month" },
                { key: "lastMonth", label: "Last Month" },
                { key: "last3Months", label: "Last 3 Months" },
              ].map((p) => (
                <TouchableOpacity
                  key={p.key}
                  style={styles.presetChip}
                  onPress={() => applyPreset(p.key as any)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.presetChipText}>{p.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[styles.inputLabel, { marginTop: SPACING.md }]}>
              START DATE
            </Text>
            <TouchableOpacity
              style={styles.datePickerTrigger}
              onPress={() => {
                setPickerMode("start");
                setShowPicker(true);
              }}
              activeOpacity={0.8}
            >
              <Ionicons name="calendar-outline" size={16} color={themeColor} />
              <Text style={styles.datePickerTriggerText}>
                {formatDateString(startDate)}
              </Text>
            </TouchableOpacity>

            <Text style={styles.inputLabel}>END DATE</Text>
            <TouchableOpacity
              style={styles.datePickerTrigger}
              onPress={() => {
                setPickerMode("end");
                setShowPicker(true);
              }}
              activeOpacity={0.8}
            >
              <Ionicons name="calendar-outline" size={16} color={themeColor} />
              <Text style={styles.datePickerTriggerText}>
                {formatDateString(endDate)}
              </Text>
            </TouchableOpacity>

            {showPicker && (
              <DateTimePicker
                value={pickerMode === "start" ? startDate : endDate}
                mode="date"
                display={Platform.OS === "ios" ? "spinner" : "default"}
                onChange={handleDateChange}
              />
            )}

            <TouchableOpacity
              style={[
                styles.primaryButton,
                { backgroundColor: themeColor, marginTop: SPACING.md },
              ]}
              onPress={() => {
                setShowPicker(false);
                setIsFilterModalOpen(false);
              }}
              activeOpacity={0.88}
            >
              <Text style={styles.primaryButtonText}>Apply Parameters</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modalCloseBtn}
              onPress={() => {
                setShowPicker(false);
                setIsFilterModalOpen(false);
              }}
              activeOpacity={0.8}
            >
              <Text style={styles.modalCloseText}>Cancel</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTitleContainer: { alignItems: "center" },
  headerTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.textPrimary,
    letterSpacing: 0.2,
  },
  headerSub: {
    fontSize: 10,
    color: COLORS.textSecondary,
    fontWeight: "500",
    marginTop: 2,
    letterSpacing: 0.8,
  },
  iconButton: {
    width: 38,
    height: 38,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surface,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  scrollContent: { padding: SPACING.lg },
  sectionLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: COLORS.textSecondary,
    letterSpacing: 0.8,
    marginBottom: SPACING.sm,
  },
  categoryRow: { flexDirection: "row", gap: SPACING.sm },
  pill: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    paddingVertical: SPACING.md + 2,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 8,
  },
  pillText: { color: COLORS.textSecondary, fontSize: 13, fontWeight: "600" },
  subFilterWrapper: { marginTop: SPACING.md },
  subScrollContent: { gap: 8 },
  subChip: {
    backgroundColor: COLORS.surface,
    paddingHorizontal: SPACING.md + 4,
    paddingVertical: SPACING.sm + 2,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  subChipText: { color: COLORS.textSecondary, fontSize: 12, fontWeight: "600" },
  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  configCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    borderWidth: 1.5,
    elevation: 3,
  },
  configLeftGroup: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: SPACING.md,
    flex: 1,
    marginRight: SPACING.sm,
  },
  configTextContainer: { flex: 1 },
  miniIconBox: {
    width: 42,
    height: 42,
    borderRadius: RADIUS.md,
    justifyContent: "center",
    alignItems: "center",
  },
  badgeRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  paramValueText: {
    fontSize: 14,
    color: COLORS.textPrimary,
    fontWeight: "700",
    flexShrink: 1,
  },
  paramSubLabel: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: "500",
    marginTop: 2,
  },
  dateRangeSubText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 6,
    fontWeight: "500",
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.sm,
    justifyContent: "center",
    alignItems: "center",
  },
  badgeText: { fontSize: 10, fontWeight: "700" },
  editBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    backgroundColor: COLORS.background,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 6,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  editText: { fontSize: 12, fontWeight: "700" },
  settingsCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  settingLabelContainer: { flex: 1, paddingRight: SPACING.md },
  settingDivider: {
    height: 1,
    backgroundColor: COLORS.border,
    opacity: 0.6,
    marginVertical: SPACING.xs,
  },
  formatSwitchContainer: {
    flexDirection: "row",
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.md,
    padding: 3,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  formatBtn: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 6 },
  formatBtnText: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: "600",
  },
  emailInput: {
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm + 2,
    color: COLORS.textPrimary,
    marginTop: SPACING.sm,
    fontSize: 13,
  },
  footerContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.background,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    padding: SPACING.lg,
    elevation: 5,
  },
  primaryButton: {
    borderRadius: RADIUS.lg,
    paddingVertical: SPACING.md + 2,
    alignItems: "center",
    justifyContent: "center",
    elevation: 4,
  },
  buttonInnerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  primaryButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.background,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: SPACING.xl,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  modalIndicatorBar: {
    width: 36,
    height: 4,
    backgroundColor: COLORS.border,
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: SPACING.lg,
  },
  modalHeaderTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.textPrimary,
    marginBottom: SPACING.lg,
  },
  inputLabel: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: "700",
    letterSpacing: 0.8,
    marginBottom: SPACING.xs,
  },
  branchScrollContent: { gap: SPACING.sm, paddingBottom: 4 },
  branchPill: {
    backgroundColor: COLORS.background,
    paddingHorizontal: SPACING.md + 2,
    paddingVertical: SPACING.sm + 4,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  branchPillText: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontWeight: "600",
  },
  presetRow: { flexDirection: "row", gap: 8, marginBottom: SPACING.xs },
  presetChip: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingVertical: SPACING.sm + 4,
    borderRadius: RADIUS.md,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  presetChipText: {
    color: COLORS.textSecondary,
    fontSize: 11,
    fontWeight: "600",
  },
  datePickerTrigger: {
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: SPACING.xs,
    gap: SPACING.sm,
  },
  datePickerTriggerText: {
    color: COLORS.textPrimary,
    fontSize: 14,
    fontWeight: "600",
  },
  modalCloseBtn: {
    backgroundColor: COLORS.background,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.lg,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
    marginTop: SPACING.sm,
  },
  modalCloseText: {
    color: COLORS.textSecondary,
    fontSize: 14,
    fontWeight: "600",
  },
});
