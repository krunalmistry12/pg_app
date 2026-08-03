import Ionicons from "@expo/vector-icons/Ionicons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import DateTimePicker from "@react-native-community/datetimepicker"; // <-- Imported Native Picker
import * as Print from "expo-print";
import { router } from "expo-router";
import * as Sharing from "expo-sharing";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { ReportFormatter } from "../../src/utils/ReportBuilder";

export default function Profile() {
  const [isReportModalVisible, setIsReportModalVisible] = useState(false);
  const [selectedReportType, setSelectedReportType] = useState<
    "rent" | "expense" | "tenants"
  >("rent");

  // Selection States
  const [selectedDate, setSelectedDate] = useState(new Date()); // Native Date object
  const [showDatePicker, setShowDatePicker] = useState(false); // Native picker visibility
  const [selectedBranch, setSelectedBranch] = useState(
    "Kunal PG - Main Branch",
  );

  const [isBranchDropdownOpen, setIsBranchDropdownOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const branchList = [
    "Kunal PG - Main Branch",
    "Kunal PG - Annex Branch",
    "Kunal PG - Executive Wing",
  ];

  // Helper to format date nicely (e.g., "August 2026")
  const formatMonthYear = (date: Date) => {
    return date.toLocaleString("default", { month: "long", year: "numeric" });
  };

  const onDateChange = (event: any, date?: Date) => {
    setShowDatePicker(Platform.OS === "ios"); // iOS ke liye open rakhte hain, Android par auto-close hota hai
    if (date) {
      setSelectedDate(date);
    }
  };

  const logout = async () => {
    Alert.alert("Logout", "Kya aap sach mein logout karna chahte hain?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          await AsyncStorage.removeItem("isLoggedIn");
          router.replace("/login");
        },
      },
    ]);
  };

  const handleActionAlert = (title: string, message: string) => {
    Alert.alert(title, message, [{ text: "OK" }]);
  };

  const generateAndDownloadPDF = async () => {
    if (isGenerating) return;
    setIsGenerating(true);

    try {
      const htmlContent = ReportFormatter.generateHTML({
        branch: selectedBranch,
        month: formatMonthYear(selectedDate),
        generatedBy: "Kunal Mistry (Admin)",
        reportType: selectedReportType,
      });

      const file = await Print.printToFileAsync({ html: htmlContent });

      if (!file || !file.uri) {
        throw new Error("PDF generation returned an invalid URI.");
      }

      setIsGenerating(false);

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(file.uri, {
          mimeType: "application/pdf",
          dialogTitle: "Save or Share Report PDF",
          UTI: "com.adobe.pdf",
        });
      } else {
        Alert.alert("Success", `PDF created successfully at: ${file.uri}`);
      }

      setIsReportModalVisible(false);
    } catch (error: any) {
      setIsGenerating(false);
      console.error("PDF Generation Error:", error);
      Alert.alert(
        "Error",
        `Failed to generate report PDF: ${error?.message || "Unknown error"}`,
      );
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#0F172A" />
      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        <Text style={styles.screenTitle}>Admin Account</Text>

        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>K</Text>
          </View>
          <Text style={styles.name}>Kunal Mistry</Text>
          <Text style={styles.role}>PG Owner & Administrator</Text>
          <Text style={styles.pg}>Kunal PG • Ahmedabad</Text>
        </View>

        {/* Core Directory */}
        <Text style={styles.sectionHeading}>Core Directory</Text>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => router.push("/tenants" as any)}
        >
          <View style={styles.menuLeft}>
            <View
              style={[
                styles.iconBg,
                { backgroundColor: "rgba(16, 185, 129, 0.12)" },
              ]}
            >
              <Ionicons name="people-outline" size={16} color="#10B981" />
            </View>
            <Text style={styles.menuText}>Tenants Directory</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color="#64748B" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => router.push("/rent" as any)}
        >
          <View style={styles.menuLeft}>
            <View
              style={[
                styles.iconBg,
                { backgroundColor: "rgba(245, 158, 11, 0.12)" },
              ]}
            >
              <Ionicons name="wallet-outline" size={16} color="#F59E0B" />
            </View>
            <Text style={styles.menuText}>Rent & Ledger Records</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color="#64748B" />
        </TouchableOpacity>

        {/* Advanced Admin Controls */}
        <Text style={styles.sectionHeading}>Advanced Admin Controls</Text>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => setIsReportModalVisible(true)}
        >
          <View style={styles.menuLeft}>
            <View
              style={[
                styles.iconBg,
                { backgroundColor: "rgba(14, 165, 233, 0.12)" },
              ]}
            >
              <Ionicons
                name="document-text-outline"
                size={16}
                color="#0EA5E9"
              />
            </View>
            <Text style={styles.menuText}>Export Custom Report (PDF)</Text>
          </View>
          <Ionicons name="download-outline" size={16} color="#0EA5E9" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() =>
            handleActionAlert("Notice Board", "Broadcast panel opened.")
          }
        >
          <View style={styles.menuLeft}>
            <View
              style={[
                styles.iconBg,
                { backgroundColor: "rgba(236, 72, 153, 0.12)" },
              ]}
            >
              <Ionicons name="megaphone-outline" size={16} color="#EC4899" />
            </View>
            <Text style={styles.menuText}>Broadcast Notice Board</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color="#64748B" />
        </TouchableOpacity>

        {/* Preferences */}
        <Text style={styles.sectionHeading}>Preferences</Text>

        <TouchableOpacity style={styles.menuItem}>
          <View style={styles.menuLeft}>
            <View
              style={[
                styles.iconBg,
                { backgroundColor: "rgba(100, 116, 139, 0.12)" },
              ]}
            >
              <Ionicons name="settings-outline" size={16} color="#94A3B8" />
            </View>
            <Text style={styles.menuText}>App Settings</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color="#64748B" />
        </TouchableOpacity>

        {/* Logout Option */}
        <TouchableOpacity
          onPress={logout}
          style={styles.logoutItem}
          activeOpacity={0.7}
        >
          <View style={styles.menuLeft}>
            <View
              style={[
                styles.iconBg,
                { backgroundColor: "rgba(239, 68, 68, 0.12)" },
              ]}
            >
              <Ionicons name="log-out-outline" size={16} color="#EF4444" />
            </View>
            <Text style={styles.logoutText}>Logout Account</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color="#EF4444" />
        </TouchableOpacity>
      </ScrollView>

      {/* Main Report Filter Modal */}
      <Modal
        visible={isReportModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsReportModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Download Filtered Report</Text>
              <TouchableOpacity onPress={() => setIsReportModalVisible(false)}>
                <Ionicons name="close" size={20} color="#94A3B8" />
              </TouchableOpacity>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 20 }}
            >
              {/* Select PG Branch Dropdown */}
              <Text style={styles.filterLabel}>Select Property / Branch</Text>
              <TouchableOpacity
                style={styles.dropdownSelector}
                onPress={() => setIsBranchDropdownOpen(!isBranchDropdownOpen)}
              >
                <Text style={styles.dropdownSelectorText}>
                  {selectedBranch}
                </Text>
                <Ionicons
                  name={isBranchDropdownOpen ? "chevron-up" : "chevron-down"}
                  size={16}
                  color="#94A3B8"
                />
              </TouchableOpacity>

              {isBranchDropdownOpen && (
                <View style={styles.dropdownList}>
                  {branchList.map((branch) => (
                    <TouchableOpacity
                      key={branch}
                      style={[
                        styles.dropdownItem,
                        selectedBranch === branch && styles.activeDropdownItem,
                      ]}
                      onPress={() => {
                        setSelectedBranch(branch);
                        setIsBranchDropdownOpen(false);
                      }}
                    >
                      <Text
                        style={[
                          styles.dropdownItemText,
                          selectedBranch === branch &&
                            styles.activeDropdownItemText,
                        ]}
                      >
                        {branch}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {/* CLICKABLE NATIVE DATE PICKER TRIGGER */}
              <Text style={styles.filterLabel}>
                Report Period (Month & Year)
              </Text>
              <TouchableOpacity
                style={styles.datePickerTrigger}
                onPress={() => setShowDatePicker(true)}
              >
                <View
                  style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
                >
                  <Ionicons name="calendar-outline" size={18} color="#3B82F6" />
                  <Text style={styles.datePickerTriggerText}>
                    {formatMonthYear(selectedDate)}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color="#94A3B8" />
              </TouchableOpacity>

              {/* Native DateTimePicker Popup Component */}
              {showDatePicker && (
                <DateTimePicker
                  value={selectedDate}
                  mode="date"
                  display="spinner" // Ya 'default' use kar sakte hain
                  onChange={onDateChange}
                />
              )}

              {/* Select Report Category */}
              <Text style={styles.filterLabel}>Report Category</Text>
              <TouchableOpacity
                style={[
                  styles.reportOptionCard,
                  selectedReportType === "rent" && styles.selectedReportOption,
                ]}
                onPress={() => setSelectedReportType("rent")}
              >
                <Ionicons name="wallet" size={18} color="#F59E0B" />
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={styles.reportOptTitle}>
                    Rent Collection Report
                  </Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.reportOptionCard,
                  selectedReportType === "expense" &&
                    styles.selectedReportOption,
                ]}
                onPress={() => setSelectedReportType("expense")}
              >
                <Ionicons name="flash" size={18} color="#0EA5E9" />
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={styles.reportOptTitle}>
                    Utility & Expense Statement
                  </Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.reportOptionCard,
                  selectedReportType === "tenants" &&
                    styles.selectedReportOption,
                ]}
                onPress={() => setSelectedReportType("tenants")}
              >
                <Ionicons name="people" size={18} color="#10B981" />
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={styles.reportOptTitle}>
                    Active Tenants Directory
                  </Text>
                </View>
              </TouchableOpacity>

              {/* Download Button */}
              <TouchableOpacity
                style={styles.downloadBtn}
                onPress={generateAndDownloadPDF}
                disabled={isGenerating}
              >
                {isGenerating ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <>
                    <Ionicons
                      name="download-outline"
                      size={18}
                      color="#FFFFFF"
                    />
                    <Text style={styles.downloadBtnText}>
                      Download PDF Report
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#0F172A" },
  container: { flex: 1, paddingHorizontal: 20, paddingTop: 15 },
  screenTitle: {
    color: "#F8FAFC",
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 15,
  },
  profileCard: {
    backgroundColor: "#1E293B",
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#334155",
  },
  avatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "#2563EB",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
    borderWidth: 2,
    borderColor: "#3B82F6",
  },
  avatarText: { color: "#FFFFFF", fontSize: 26, fontWeight: "bold" },
  name: { color: "#FFFFFF", fontSize: 18, fontWeight: "700" },
  role: { color: "#94A3B8", fontSize: 12, marginTop: 2 },
  pg: { color: "#64748B", fontSize: 11, marginTop: 2 },
  sectionHeading: {
    color: "#64748B",
    fontSize: 11,
    fontWeight: "600",
    marginBottom: 8,
    marginTop: 10,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  menuItem: {
    backgroundColor: "#1E293B",
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    marginBottom: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#334155",
  },
  logoutItem: {
    backgroundColor: "rgba(239, 68, 68, 0.05)",
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    marginTop: 10,
    marginBottom: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.2)",
  },
  menuLeft: { flexDirection: "row", alignItems: "center" },
  iconBg: {
    width: 30,
    height: 30,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  menuText: { color: "#F1F5F9", fontSize: 14, fontWeight: "500" },
  logoutText: { color: "#EF4444", fontWeight: "600", fontSize: 14 },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.85)",
    justifyContent: "flex-end",
  },
  modalContainer: {
    backgroundColor: "#1E293B",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: "#334155",
    maxHeight: "90%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  modalTitle: { color: "#F8FAFC", fontSize: 18, fontWeight: "700" },
  filterLabel: {
    color: "#94A3B8",
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 6,
    marginTop: 12,
  },
  dropdownSelector: {
    backgroundColor: "#0F172A",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#334155",
  },
  dropdownSelectorText: { color: "#F8FAFC", fontSize: 13, fontWeight: "600" },
  dropdownList: {
    backgroundColor: "#0F172A",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#334155",
    marginTop: 4,
    overflow: "hidden",
  },
  dropdownItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#1E293B",
  },
  activeDropdownItem: { backgroundColor: "rgba(59, 130, 246, 0.15)" },
  dropdownItemText: { color: "#94A3B8", fontSize: 13 },
  activeDropdownItemText: { color: "#3B82F6", fontWeight: "700" },
  datePickerTrigger: {
    backgroundColor: "#0F172A",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#334155",
  },
  datePickerTriggerText: { color: "#F8FAFC", fontSize: 13, fontWeight: "600" },
  reportOptionCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#0F172A",
    padding: 12,
    borderRadius: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#334155",
    marginTop: 4,
  },
  selectedReportOption: {
    borderColor: "#3B82F6",
    backgroundColor: "rgba(25, 103, 228, 0.1)",
  },
  reportOptTitle: { color: "#F8FAFC", fontSize: 13, fontWeight: "600" },
  downloadBtn: {
    backgroundColor: "#2563EB",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 20,
    gap: 8,
  },
  downloadBtnText: { color: "#FFFFFF", fontSize: 14, fontWeight: "700" },
});
