import Ionicons from "@expo/vector-icons/Ionicons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import DateTimePicker from "@react-native-community/datetimepicker";
import * as Location from "expo-location";
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
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { styles } from "../../src/styles/Admin/ProfileStyles ";
import { ReportFormatter } from "../../src/utils/ReportBuilder";

interface AdminProfileData {
  name: string;
  email: string;
  role: string;
  pgName: string;
  location: string;
  branches: string[];
}

const STORAGE_KEY = "@dashboard_cache_data";

export default function Profile() {
  const [isReportModalVisible, setIsReportModalVisible] = useState(false);
  const [selectedReportType, setSelectedReportType] = useState<
    "rent" | "expense" | "tenants"
  >("rent");

  // Initial state
  const [adminProfile, setAdminProfile] = useState<AdminProfileData>({
    name: "Loading...",
    email: "",
    role: "PG Administrator",
    pgName: "My PG Property",
    location: "Fetching location...",
    branches: ["Main Branch"],
  });

  // Selection States
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState("Main Branch");

  const [isBranchDropdownOpen, setIsBranchDropdownOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    loadAdminDetails();
  }, []);

  const fetchCurrentLocationArea = async (): Promise<string> => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        console.log("Location permission denied");
        return "Ahmedabad"; // Fallback location
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const reverseGeocode = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      if (reverseGeocode && reverseGeocode.length > 0) {
        const address = reverseGeocode[0];
        const area = address.district || address.city || "Ahmedabad";
        return area;
      }
    } catch (error) {
      console.log("Error fetching location:", error);
    }
    return "Ahmedabad";
  };

  const loadAdminDetails = async () => {
    try {
      console.log(
        `Attempting to load admin profile from AsyncStorage using key: ${STORAGE_KEY}`,
      );
      const storedData = await AsyncStorage.getItem(STORAGE_KEY);

      // Fetch dynamic location area
      const currentArea = await fetchCurrentLocationArea();

      if (storedData) {
        const parsed = JSON.parse(storedData);
        console.log("Admin profile successfully loaded from cache:", parsed);

        const mappedProfile: AdminProfileData = {
          name: parsed.ownerName || "Administrator",
          email: parsed.email || "",
          role: "PG Owner & Administrator",
          pgName: parsed.pgName || "My PG Property",
          location: parsed.location || currentArea,
          branches:
            parsed.branches && parsed.branches.length > 0
              ? parsed.branches
              : ["Main Branch"],
        };

        setAdminProfile(mappedProfile);
        if (mappedProfile.branches.length > 0) {
          setSelectedBranch(mappedProfile.branches[0]);
        }
      } else {
        console.log(
          `Log: Cannot show user detail - No data found in AsyncStorage for key: ${STORAGE_KEY}`,
        );

        const freshData: AdminProfileData = {
          name: "Administrator",
          email: "",
          role: "PG Owner & Administrator",
          pgName: "My PG Property",
          location: currentArea,
          branches: ["Main Branch"],
        };

        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(freshData));
        setAdminProfile(freshData);
        if (freshData.branches.length > 0) {
          setSelectedBranch(freshData.branches[0]);
        }
      }
    } catch (e) {
      console.log("Error loading/saving admin profile from storage:", e);
    }
  };

  const formatMonthYear = (date: Date) => {
    return date.toLocaleString("default", { month: "long", year: "numeric" });
  };

  const onDateChange = (event: any, date?: Date) => {
    if (Platform.OS === "android") {
      setShowDatePicker(false);
    }
    if (date) {
      setSelectedDate(date);
    }
  };

  const logout = async () => {
    Alert.alert("Logout", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          await AsyncStorage.removeItem("isLoggedIn");
          await AsyncStorage.removeItem(STORAGE_KEY);
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
      console.log("Generating HTML content...");
      const htmlContent = ReportFormatter.generateHTML({
        branch: selectedBranch,
        month: formatMonthYear(selectedDate),
        generatedBy: `${adminProfile.name} (Admin)`,
        reportType: selectedReportType,
      });

      console.log("Calling Print.printToFileAsync...");
      const file = await Print.printToFileAsync({ html: htmlContent });
      console.log("Print result file:", file);

      if (!file || !file.uri) {
        throw new Error("PDF generation returned an invalid URI.");
      }

      setIsGenerating(false);

      const isSharingAvailable = await Sharing.isAvailableAsync();
      if (isSharingAvailable) {
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
      console.error("PDF Generation Detailed Error:", error);
      Alert.alert(
        "PDF Error",
        `Failed: ${error?.message || "Unknown error"}. Check console logs.`,
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
        <Text style={styles.screenTitle}>Admin Dashboard</Text>

        {/* Dynamic Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatarGlowContainer}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {adminProfile.name && adminProfile.name !== "Loading..."
                  ? adminProfile.name.charAt(0).toUpperCase()
                  : "A"}
              </Text>
            </View>
          </View>
          <Text style={styles.name}>{adminProfile.name}</Text>
          <Text style={styles.role}>{adminProfile.role}</Text>
          <View style={styles.pgBadge}>
            <Ionicons name="business-outline" size={12} color="#38BDF8" />
            <Text style={styles.pgBadgeText}>
              {adminProfile.pgName} • {adminProfile.location}
            </Text>
          </View>
        </View>

        {/* Core Directory */}
        <Text style={styles.sectionHeading}>Core Directory</Text>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => router.push("/tenants" as any)}
          activeOpacity={0.8}
        >
          <View style={styles.menuLeft}>
            <View
              style={[
                styles.iconBg,
                { backgroundColor: "rgba(16, 185, 129, 0.12)" },
              ]}
            >
              <Ionicons name="people-outline" size={18} color="#10B981" />
            </View>
            <View>
              <Text style={styles.menuText}>Tenants Directory</Text>
              <Text style={styles.menuSubText}>
                Manage active residents & rooms
              </Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={16} color="#64748B" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => router.push("/rent" as any)}
          activeOpacity={0.8}
        >
          <View style={styles.menuLeft}>
            <View
              style={[
                styles.iconBg,
                { backgroundColor: "rgba(245, 158, 11, 0.12)" },
              ]}
            >
              <Ionicons name="wallet-outline" size={18} color="#F59E0B" />
            </View>
            <View>
              <Text style={styles.menuText}>Rent & Ledger Records</Text>
              <Text style={styles.menuSubText}>
                Track dues, collections & receipts
              </Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={16} color="#64748B" />
        </TouchableOpacity>

        {/* Advanced Admin Controls */}
        <Text style={styles.sectionHeading}>Advanced Admin Controls</Text>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => setIsReportModalVisible(true)}
          activeOpacity={0.8}
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
                size={18}
                color="#0EA5E9"
              />
            </View>
            <View>
              <Text style={styles.menuText}>Export Custom Report (PDF)</Text>
              <Text style={styles.menuSubText}>
                Rent, expenses & tenant logs
              </Text>
            </View>
          </View>
          <Ionicons name="download-outline" size={16} color="#0EA5E9" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() =>
            handleActionAlert(
              "Notice Board",
              "Broadcast panel opened successfully.",
            )
          }
          activeOpacity={0.8}
        >
          <View style={styles.menuLeft}>
            <View
              style={[
                styles.iconBg,
                { backgroundColor: "rgba(236, 72, 153, 0.12)" },
              ]}
            >
              <Ionicons name="megaphone-outline" size={18} color="#EC4899" />
            </View>
            <View>
              <Text style={styles.menuText}>Broadcast Notice Board</Text>
              <Text style={styles.menuSubText}>
                Send instant alerts to all flats
              </Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={16} color="#64748B" />
        </TouchableOpacity>

        {/* Preferences */}
        <Text style={styles.sectionHeading}>Preferences</Text>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() =>
            handleActionAlert(
              "App Settings",
              "Settings configuration is up to date.",
            )
          }
          activeOpacity={0.8}
        >
          <View style={styles.menuLeft}>
            <View
              style={[
                styles.iconBg,
                { backgroundColor: "rgba(100, 116, 139, 0.12)" },
              ]}
            >
              <Ionicons name="settings-outline" size={18} color="#94A3B8" />
            </View>
            <View>
              <Text style={styles.menuText}>App Settings</Text>
              <Text style={styles.menuSubText}>
                Preferences & configurations
              </Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={16} color="#64748B" />
        </TouchableOpacity>

        {/* Logout Option */}
        <TouchableOpacity
          onPress={logout}
          style={styles.logoutItem}
          activeOpacity={0.8}
        >
          <View style={styles.menuLeft}>
            <View
              style={[
                styles.iconBg,
                { backgroundColor: "rgba(239, 68, 68, 0.12)" },
              ]}
            >
              <Ionicons name="log-out-outline" size={18} color="#EF4444" />
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
        <TouchableWithoutFeedback
          onPress={() => setIsReportModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.modalContainer}>
                {/* Drag Handle Bar */}
                <View style={{ alignItems: "center", marginBottom: 8 }}>
                  <View
                    style={{
                      width: 40,
                      height: 4,
                      borderRadius: 2,
                      backgroundColor: "rgba(255, 255, 255, 0.2)",
                    }}
                  />
                </View>

                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>
                    Download Filtered Report
                  </Text>
                  <TouchableOpacity
                    onPress={() => setIsReportModalVisible(false)}
                    style={{
                      backgroundColor: "rgba(255, 255, 255, 0.08)",
                      borderRadius: 16,
                      padding: 5,
                    }}
                  >
                    <Ionicons name="close" size={18} color="#94A3B8" />
                  </TouchableOpacity>
                </View>

                <ScrollView
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={{ paddingBottom: 25 }}
                >
                  {/* Select PG Branch Dropdown */}
                  <Text style={styles.filterLabel}>
                    SELECT PROPERTY / BRANCH
                  </Text>
                  <TouchableOpacity
                    style={styles.dropdownSelector}
                    onPress={() =>
                      setIsBranchDropdownOpen(!isBranchDropdownOpen)
                    }
                    activeOpacity={0.8}
                  >
                    <Text style={styles.dropdownSelectorText}>
                      {selectedBranch}
                    </Text>
                    <Ionicons
                      name={
                        isBranchDropdownOpen ? "chevron-up" : "chevron-down"
                      }
                      size={16}
                      color="#94A3B8"
                    />
                  </TouchableOpacity>

                  {isBranchDropdownOpen && (
                    <View style={styles.dropdownList}>
                      {adminProfile.branches.map((branch) => (
                        <TouchableOpacity
                          key={branch}
                          style={[
                            styles.dropdownItem,
                            selectedBranch === branch &&
                              styles.activeDropdownItem,
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
                    REPORT PERIOD (MONTH & YEAR)
                  </Text>
                  <TouchableOpacity
                    style={styles.datePickerTrigger}
                    onPress={() => setShowDatePicker(true)}
                    activeOpacity={0.8}
                  >
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 8,
                      }}
                    >
                      <Ionicons
                        name="calendar-outline"
                        size={18}
                        color="#38BDF8"
                      />
                      <Text style={styles.datePickerTriggerText}>
                        {formatMonthYear(selectedDate)}
                      </Text>
                    </View>
                    <Ionicons
                      name="chevron-forward"
                      size={16}
                      color="#94A3B8"
                    />
                  </TouchableOpacity>

                  {/* Native DateTimePicker Popup Component */}
                  {showDatePicker && (
                    <DateTimePicker
                      value={selectedDate}
                      mode="date"
                      display={Platform.OS === "ios" ? "spinner" : "default"}
                      onChange={onDateChange}
                    />
                  )}

                  {/* Select Report Category */}
                  <Text style={styles.filterLabel}>REPORT CATEGORY</Text>
                  <TouchableOpacity
                    style={[
                      styles.reportOptionCard,
                      selectedReportType === "rent" &&
                        styles.selectedReportOption,
                    ]}
                    onPress={() => setSelectedReportType("rent")}
                    activeOpacity={0.8}
                  >
                    <View
                      style={[
                        styles.iconBg,
                        { backgroundColor: "rgba(245, 158, 11, 0.15)" },
                      ]}
                    >
                      <Ionicons name="wallet" size={16} color="#F59E0B" />
                    </View>
                    <View style={{ flex: 1, marginLeft: 10 }}>
                      <Text style={styles.reportOptTitle}>
                        Rent Collection Report
                      </Text>
                      <Text style={styles.reportOptSub}>
                        Overall paid & pending balances
                      </Text>
                    </View>
                    {selectedReportType === "rent" && (
                      <Ionicons
                        name="checkmark-circle"
                        size={18}
                        color="#F59E0B"
                      />
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.reportOptionCard,
                      selectedReportType === "expense" &&
                        styles.selectedReportOption,
                    ]}
                    onPress={() => setSelectedReportType("expense")}
                    activeOpacity={0.8}
                  >
                    <View
                      style={[
                        styles.iconBg,
                        { backgroundColor: "rgba(14, 165, 233, 0.15)" },
                      ]}
                    >
                      <Ionicons name="flash" size={16} color="#0EA5E9" />
                    </View>
                    <View style={{ flex: 1, marginLeft: 10 }}>
                      <Text style={styles.reportOptTitle}>
                        Utility & Expense Statement
                      </Text>
                      <Text style={styles.reportOptSub}>
                        Electricity, maintenance & bills
                      </Text>
                    </View>
                    {selectedReportType === "expense" && (
                      <Ionicons
                        name="checkmark-circle"
                        size={18}
                        color="#0EA5E9"
                      />
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.reportOptionCard,
                      selectedReportType === "tenants" &&
                        styles.selectedReportOption,
                    ]}
                    onPress={() => setSelectedReportType("tenants")}
                    activeOpacity={0.8}
                  >
                    <View
                      style={[
                        styles.iconBg,
                        { backgroundColor: "rgba(16, 185, 129, 0.15)" },
                      ]}
                    >
                      <Ionicons name="people" size={16} color="#10B981" />
                    </View>
                    <View style={{ flex: 1, marginLeft: 10 }}>
                      <Text style={styles.reportOptTitle}>
                        Active Tenants Directory
                      </Text>
                      <Text style={styles.reportOptSub}>
                        Occupancy details & contact directory
                      </Text>
                    </View>
                    {selectedReportType === "tenants" && (
                      <Ionicons
                        name="checkmark-circle"
                        size={18}
                        color="#10B981"
                      />
                    )}
                  </TouchableOpacity>

                  {/* Download Button */}
                  <TouchableOpacity
                    style={styles.downloadBtn}
                    onPress={generateAndDownloadPDF}
                    disabled={isGenerating}
                    activeOpacity={0.85}
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
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </SafeAreaView>
  );
}
