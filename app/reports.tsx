import Ionicons from "@expo/vector-icons/Ionicons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Print from "expo-print";
import { router } from "expo-router";
import * as Sharing from "expo-sharing";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  SafeAreaView,
  ScrollView,
  StatusBar,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { ReportFormatter } from "../src/utils/ReportBuilder";

const STORAGE_KEY = "@dashboard_cache_data";

const MONTH_NAMES = [
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

const DAYS_OF_WEEK = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

export default function ReportsScreen() {
  const [selectedReportType, setSelectedReportType] = useState<
    "rent" | "expense" | "tenants"
  >("rent");
  const [selectedBranch, setSelectedBranch] = useState("Main Branch");
  const [branches, setBranches] = useState<string[]>(["Main Branch"]);
  const [isBranchDropdownOpen, setIsBranchDropdownOpen] = useState(false);

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePickerModal, setShowDatePickerModal] = useState(false);

  // Calendar Picker temporary states
  const [tempYear, setTempYear] = useState(selectedDate.getFullYear());
  const [tempMonth, setTempMonth] = useState(selectedDate.getMonth());
  const [tempDay, setTempDay] = useState(selectedDate.getDate());

  const [isGenerating, setIsGenerating] = useState(false);
  const [adminName, setAdminName] = useState("Administrator");
  const [includeDetailedBreakdown, setIncludeDetailedBreakdown] =
    useState(true);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      const storedData = await AsyncStorage.getItem(STORAGE_KEY);
      if (storedData) {
        const parsed = JSON.parse(storedData);
        if (parsed.branches && parsed.branches.length > 0) {
          setBranches(parsed.branches);
          setSelectedBranch(parsed.branches[0]);
        }
        if (parsed.ownerName) {
          setAdminName(parsed.ownerName);
        }
      }
    } catch (error) {
      console.log("Error loading storage data for reports:", error);
    }
  };

  const formatDateString = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const handleOpenDatePicker = () => {
    setTempYear(selectedDate.getFullYear());
    setTempMonth(selectedDate.getMonth());
    setTempDay(selectedDate.getDate());
    setShowDatePickerModal(true);
  };

  const handleConfirmDate = () => {
    const newDate = new Date(tempYear, tempMonth, tempDay);
    setSelectedDate(newDate);
    setShowDatePickerModal(false);
  };

  const getAccentColor = () => {
    switch (selectedReportType) {
      case "rent":
        return "#D97706"; // Rich amber
      case "expense":
        return "#0284C7"; // Professional Blue
      case "tenants":
        return "#059669"; // Emerald Green
      default:
        return "#0284C7";
    }
  };

  const handleGeneratePDF = async () => {
    if (isGenerating) return;
    setIsGenerating(true);

    try {
      const htmlContent = ReportFormatter.generateHTML({
        branch: selectedBranch,
        month: formatDateString(selectedDate),
        generatedBy: `${adminName} (Admin)`,
        reportType: selectedReportType,
        detailed: includeDetailedBreakdown,
      } as any);

      const file = await Print.printToFileAsync({ html: htmlContent });
      if (!file?.uri) throw new Error("Invalid file URI generated");

      setIsGenerating(false);

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(file.uri, {
          mimeType: "application/pdf",
          dialogTitle: `PG Report - ${selectedBranch} (${formatDateString(selectedDate)})`,
          UTI: "com.adobe.pdf",
        });
      } else {
        Alert.alert("Success", `PDF successfully created at: ${file.uri}`);
      }
    } catch (error: any) {
      setIsGenerating(false);
      Alert.alert(
        "PDF Generation Error",
        `Failed to export report: ${error?.message || "Unknown error"}`,
      );
    }
  };

  const accentColor = getAccentColor();

  // Calendar helper calculations
  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
  };

  const totalDays = getDaysInMonth(tempYear, tempMonth);
  const startDay = getFirstDayOfMonth(tempYear, tempMonth);

  const handlePrevMonth = () => {
    if (tempMonth === 0) {
      setTempMonth(11);
      setTempYear(tempYear - 1);
    } else {
      setTempMonth(tempMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (tempMonth === 11) {
      setTempMonth(0);
      setTempYear(tempYear + 1);
    } else {
      setTempMonth(tempMonth + 1);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#F1F5F9" }}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Top Header */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingHorizontal: 20,
          paddingVertical: 14,
          backgroundColor: "#FFFFFF",
          borderBottomWidth: 1,
          borderBottomColor: "#E2E8F0",
          elevation: 2,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.05,
          shadowRadius: 2,
        }}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          style={{
            width: 38,
            height: 38,
            borderRadius: 10,
            backgroundColor: "#F8FAFC",
            justifyContent: "center",
            alignItems: "center",
            borderWidth: 1,
            borderColor: "#E2E8F0",
          }}
          activeOpacity={0.8}
        >
          <Ionicons name="arrow-back" size={18} color="#334155" />
        </TouchableOpacity>
        <Text style={{ fontSize: 16, fontWeight: "700", color: "#1E293B" }}>
          Reports & Export Center
        </Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
      >
        {/* Section 1: Parameters Card */}
        <View
          style={{
            backgroundColor: "#FFFFFF",
            borderRadius: 16,
            padding: 16,
            marginBottom: 16,
            borderWidth: 1,
            borderColor: "#E2E8F0",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.03,
            shadowRadius: 3,
          }}
        >
          <Text
            style={{
              fontSize: 11,
              fontWeight: "700",
              color: "#64748B",
              letterSpacing: 0.8,
              marginBottom: 12,
            }}
          >
            REPORT CONFIGURATION
          </Text>

          {/* Property Select */}
          <View style={{ marginBottom: 12 }}>
            <Text
              style={{
                color: "#475569",
                fontSize: 12,
                fontWeight: "600",
                marginBottom: 6,
              }}
            >
              Property Branch
            </Text>
            <TouchableOpacity
              style={{
                backgroundColor: "#F8FAFC",
                borderRadius: 10,
                paddingHorizontal: 14,
                paddingVertical: 12,
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                borderWidth: 1,
                borderColor: "#CBD5E1",
              }}
              onPress={() => setIsBranchDropdownOpen(!isBranchDropdownOpen)}
              activeOpacity={0.8}
            >
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
              >
                <Ionicons name="business-outline" size={16} color="#0284C7" />
                <Text
                  style={{ color: "#1E293B", fontSize: 14, fontWeight: "600" }}
                >
                  {selectedBranch}
                </Text>
              </View>
              <Ionicons
                name={isBranchDropdownOpen ? "chevron-up" : "chevron-down"}
                size={16}
                color="#64748B"
              />
            </TouchableOpacity>

            {/* Dropdown list */}
            {isBranchDropdownOpen && (
              <View
                style={{
                  backgroundColor: "#FFFFFF",
                  borderRadius: 10,
                  borderWidth: 1,
                  borderColor: "#CBD5E1",
                  marginTop: 6,
                  overflow: "hidden",
                }}
              >
                {branches.map((branch, index) => (
                  <TouchableOpacity
                    key={branch}
                    style={{
                      paddingVertical: 12,
                      paddingHorizontal: 14,
                      borderBottomWidth: index === branches.length - 1 ? 0 : 1,
                      borderBottomColor: "#E2E8F0",
                      backgroundColor:
                        selectedBranch === branch ? "#F0F9FF" : "transparent",
                    }}
                    onPress={() => {
                      setSelectedBranch(branch);
                      setIsBranchDropdownOpen(false);
                    }}
                  >
                    <Text
                      style={{
                        color:
                          selectedBranch === branch ? "#0284C7" : "#334155",
                        fontSize: 13,
                        fontWeight: selectedBranch === branch ? "600" : "400",
                      }}
                    >
                      {branch}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* Date Picker Select */}
          <View>
            <Text
              style={{
                color: "#475569",
                fontSize: 12,
                fontWeight: "600",
                marginBottom: 6,
              }}
            >
              Statement Date
            </Text>
            <TouchableOpacity
              style={{
                backgroundColor: "#F8FAFC",
                borderRadius: 10,
                paddingHorizontal: 14,
                paddingVertical: 12,
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                borderWidth: 1,
                borderColor: "#CBD5E1",
              }}
              onPress={handleOpenDatePicker}
              activeOpacity={0.8}
            >
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
              >
                <Ionicons name="calendar-outline" size={16} color="#0284C7" />
                <Text
                  style={{ color: "#1E293B", fontSize: 14, fontWeight: "600" }}
                >
                  {formatDateString(selectedDate)}
                </Text>
              </View>
              <Text
                style={{ color: "#0284C7", fontSize: 12, fontWeight: "600" }}
              >
                Select Date
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Section 2: Report Categories */}
        <Text
          style={{
            fontSize: 11,
            fontWeight: "700",
            color: "#64748B",
            letterSpacing: 0.8,
            marginBottom: 10,
          }}
        >
          SELECT REPORT TYPE
        </Text>

        <View style={{ gap: 10, marginBottom: 16 }}>
          {/* Rent Report */}
          <TouchableOpacity
            style={{
              backgroundColor: "#FFFFFF",
              borderRadius: 14,
              padding: 14,
              flexDirection: "row",
              alignItems: "center",
              borderWidth: 1.5,
              borderColor:
                selectedReportType === "rent" ? "#D97706" : "#E2E8F0",
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.02,
              shadowRadius: 2,
            }}
            onPress={() => setSelectedReportType("rent")}
            activeOpacity={0.85}
          >
            <View
              style={{
                width: 38,
                height: 38,
                borderRadius: 10,
                backgroundColor: "#FEF3C7",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Ionicons name="wallet-outline" size={18} color="#D97706" />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text
                style={{ color: "#1E293B", fontSize: 14, fontWeight: "600" }}
              >
                Rent Collection Statement
              </Text>
              <Text style={{ color: "#64748B", fontSize: 11, marginTop: 2 }}>
                Incomes, pending payments & dues
              </Text>
            </View>
            <View
              style={{
                width: 20,
                height: 20,
                borderRadius: 10,
                borderWidth: 2,
                borderColor:
                  selectedReportType === "rent" ? "#D97706" : "#CBD5E1",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              {selectedReportType === "rent" && (
                <View
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: 5,
                    backgroundColor: "#D97706",
                  }}
                />
              )}
            </View>
          </TouchableOpacity>

          {/* Expense Report */}
          <TouchableOpacity
            style={{
              backgroundColor: "#FFFFFF",
              borderRadius: 14,
              padding: 14,
              flexDirection: "row",
              alignItems: "center",
              borderWidth: 1.5,
              borderColor:
                selectedReportType === "expense" ? "#0284C7" : "#E2E8F0",
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.02,
              shadowRadius: 2,
            }}
            onPress={() => setSelectedReportType("expense")}
            activeOpacity={0.85}
          >
            <View
              style={{
                width: 38,
                height: 38,
                borderRadius: 10,
                backgroundColor: "#E0F2FE",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Ionicons name="receipt-outline" size={18} color="#0284C7" />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text
                style={{ color: "#1E293B", fontSize: 14, fontWeight: "600" }}
              >
                Utility & Expense Statement
              </Text>
              <Text style={{ color: "#64748B", fontSize: 11, marginTop: 2 }}>
                Bills, maintenance & outlays
              </Text>
            </View>
            <View
              style={{
                width: 20,
                height: 20,
                borderRadius: 10,
                borderWidth: 2,
                borderColor:
                  selectedReportType === "expense" ? "#0284C7" : "#CBD5E1",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              {selectedReportType === "expense" && (
                <View
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: 5,
                    backgroundColor: "#0284C7",
                  }}
                />
              )}
            </View>
          </TouchableOpacity>

          {/* Tenants Report */}
          <TouchableOpacity
            style={{
              backgroundColor: "#FFFFFF",
              borderRadius: 14,
              padding: 14,
              flexDirection: "row",
              alignItems: "center",
              borderWidth: 1.5,
              borderColor:
                selectedReportType === "tenants" ? "#059669" : "#E2E8F0",
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.02,
              shadowRadius: 2,
            }}
            onPress={() => setSelectedReportType("tenants")}
            activeOpacity={0.85}
          >
            <View
              style={{
                width: 38,
                height: 38,
                borderRadius: 10,
                backgroundColor: "#D1FAE5",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Ionicons name="people-outline" size={18} color="#059669" />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text
                style={{ color: "#1E293B", fontSize: 14, fontWeight: "600" }}
              >
                Active Tenants Directory
              </Text>
              <Text style={{ color: "#64748B", fontSize: 11, marginTop: 2 }}>
                Occupancy records & contact listings
              </Text>
            </View>
            <View
              style={{
                width: 20,
                height: 20,
                borderRadius: 10,
                borderWidth: 2,
                borderColor:
                  selectedReportType === "tenants" ? "#059669" : "#CBD5E1",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              {selectedReportType === "tenants" && (
                <View
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: 5,
                    backgroundColor: "#059669",
                  }}
                />
              )}
            </View>
          </TouchableOpacity>
        </View>

        {/* Section 3: Detailed Breakdown Switch */}
        <View
          style={{
            backgroundColor: "#FFFFFF",
            borderRadius: 14,
            padding: 16,
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            borderWidth: 1,
            borderColor: "#E2E8F0",
            marginBottom: 20,
          }}
        >
          <View style={{ flex: 1, paddingRight: 10 }}>
            <Text style={{ color: "#1E293B", fontSize: 13, fontWeight: "600" }}>
              Include Detailed Breakdown
            </Text>
            <Text style={{ color: "#64748B", fontSize: 11, marginTop: 2 }}>
              Append individual ledger entries into PDF layout
            </Text>
          </View>
          <Switch
            value={includeDetailedBreakdown}
            onValueChange={setIncludeDetailedBreakdown}
            trackColor={{ false: "#CBD5E1", true: accentColor }}
            thumbColor={"#FFFFFF"}
          />
        </View>

        {/* Generate Action Button */}
        <TouchableOpacity
          style={{
            backgroundColor: accentColor,
            borderRadius: 14,
            paddingVertical: 16,
            flexDirection: "row",
            justifyContent: "center",
            alignItems: "center",
            gap: 10,
            shadowColor: accentColor,
            shadowOffset: { width: 0, height: 3 },
            shadowOpacity: 0.25,
            shadowRadius: 5,
            elevation: 3,
          }}
          onPress={handleGeneratePDF}
          disabled={isGenerating}
          activeOpacity={0.85}
        >
          {isGenerating ? (
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
            >
              <ActivityIndicator color="#FFFFFF" size="small" />
              <Text
                style={{ color: "#FFFFFF", fontSize: 15, fontWeight: "bold" }}
              >
                Compiling Secure PDF...
              </Text>
            </View>
          ) : (
            <>
              <Ionicons
                name="cloud-download-outline"
                size={20}
                color="#FFFFFF"
              />
              <Text
                style={{ color: "#FFFFFF", fontSize: 15, fontWeight: "bold" }}
              >
                Generate & Export PDF
              </Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>

      {/* Professional Calendar Modal */}
      <Modal
        visible={showDatePickerModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowDatePickerModal(false)}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(15, 23, 42, 0.5)",
            justifyContent: "center",
            alignItems: "center",
            padding: 20,
          }}
        >
          <View
            style={{
              backgroundColor: "#FFFFFF",
              borderRadius: 20,
              padding: 20,
              width: "100%",
              maxWidth: 340,
              borderWidth: 1,
              borderColor: "#E2E8F0",
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.1,
              shadowRadius: 8,
              elevation: 5,
            }}
          >
            {/* Calendar Header with Month/Year Navigation */}
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 16,
              }}
            >
              <Text
                style={{ color: "#1E293B", fontSize: 16, fontWeight: "bold" }}
              >
                {MONTH_NAMES[tempMonth]} {tempYear}
              </Text>
              <View style={{ flexDirection: "row", gap: 4 }}>
                <TouchableOpacity
                  onPress={handlePrevMonth}
                  style={{
                    padding: 8,
                    borderRadius: 8,
                    backgroundColor: "#F1F5F9",
                  }}
                >
                  <Ionicons name="chevron-back" size={16} color="#334155" />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleNextMonth}
                  style={{
                    padding: 8,
                    borderRadius: 8,
                    backgroundColor: "#F1F5F9",
                  }}
                >
                  <Ionicons name="chevron-forward" size={16} color="#334155" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Days of Week Header */}
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-around",
                marginBottom: 8,
              }}
            >
              {DAYS_OF_WEEK.map((day) => (
                <Text
                  key={day}
                  style={{
                    color: "#64748B",
                    fontSize: 12,
                    fontWeight: "600",
                    width: 36,
                    textAlign: "center",
                  }}
                >
                  {day}
                </Text>
              ))}
            </View>

            {/* Calendar Days Grid */}
            <View
              style={{
                flexDirection: "row",
                flexWrap: "wrap",
                justifyContent: "flex-start",
                marginBottom: 20,
              }}
            >
              {/* Empty slots for offset */}
              {Array.from({ length: startDay }).map((_, index) => (
                <View
                  key={`empty-${index}`}
                  style={{ width: 42, height: 38 }}
                />
              ))}

              {/* Actual Days */}
              {Array.from({ length: totalDays }).map((_, index) => {
                const dayNum = index + 1;
                const isSelected = tempDay === dayNum;
                return (
                  <TouchableOpacity
                    key={`day-${dayNum}`}
                    style={{
                      width: 42,
                      height: 38,
                      justifyContent: "center",
                      alignItems: "center",
                      backgroundColor: isSelected ? accentColor : "transparent",
                      borderRadius: 10,
                      marginBottom: 4,
                    }}
                    onPress={() => setTempDay(dayNum)}
                  >
                    <Text
                      style={{
                        color: isSelected ? "#FFFFFF" : "#1E293B",
                        fontSize: 13,
                        fontWeight: isSelected ? "bold" : "500",
                      }}
                    >
                      {dayNum}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Modal Actions */}
            <View style={{ flexDirection: "row", gap: 10 }}>
              <TouchableOpacity
                style={{
                  flex: 1,
                  paddingVertical: 12,
                  borderRadius: 10,
                  backgroundColor: "#F1F5F9",
                  alignItems: "center",
                }}
                onPress={() => setShowDatePickerModal(false)}
              >
                <Text
                  style={{ color: "#475569", fontSize: 13, fontWeight: "600" }}
                >
                  Cancel
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={{
                  flex: 1,
                  paddingVertical: 12,
                  borderRadius: 10,
                  backgroundColor: accentColor,
                  alignItems: "center",
                }}
                onPress={handleConfirmDate}
              >
                <Text
                  style={{ color: "#FFFFFF", fontSize: 13, fontWeight: "bold" }}
                >
                  Confirm Date
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
