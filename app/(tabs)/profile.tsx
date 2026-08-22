import Ionicons from "@expo/vector-icons/Ionicons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Location from "expo-location";
import { router, useFocusEffect } from "expo-router"; // Added useFocusEffect to reload on return
import React, { useCallback, useState } from "react";
import {
  Alert,
  Modal,
  SafeAreaView,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { styles } from "../../src/styles/Admin/ProfileStyles ";

interface AdminProfileData {
  userId: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  pgName: string;
  location: string;
  address: string;
  city: string;
  branches: string[];
  subscriptionPlan?: string;
  subscriptionExpiry?: string;
}

const STORAGE_KEY = "@dashboard_cache_data";

export default function Profile() {
  const [isSubModalVisible, setIsSubModalVisible] = useState(false);
  const [isSupportModalVisible, setIsSupportModalVisible] = useState(false);

  const [adminProfile, setAdminProfile] = useState<AdminProfileData>({
    userId: "",
    name: "Loading...",
    email: "",
    phone: "",
    role: "PG Administrator",
    pgName: "My PG Property",
    location: "Fetching location...",
    address: "",
    city: "Ahmedabad",
    branches: ["Main Branch"],
    subscriptionPlan: "Pro Business Plan",
    subscriptionExpiry: "Dec 31, 2026",
  });

  // Reload admin details automatically whenever you navigate back from the edit screen
  useFocusEffect(
    useCallback(() => {
      loadAdminDetails();
    }, []),
  );

  const fetchCurrentLocationArea = async (): Promise<string> => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") return "Ahmedabad";

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const reverseGeocode = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      if (reverseGeocode && reverseGeocode.length > 0) {
        return (
          reverseGeocode[0].district || reverseGeocode[0].city || "Ahmedabad"
        );
      }
    } catch (error) {
      console.log("Error fetching location:", error);
    }
    return "Ahmedabad";
  };

  const loadAdminDetails = async () => {
    try {
      const storedData = await AsyncStorage.getItem(STORAGE_KEY);
      const standaloneUserId = await AsyncStorage.getItem("userId");
      const realCurrentArea = await fetchCurrentLocationArea();

      if (storedData) {
        const parsed = JSON.parse(storedData);
        const resolvedUserId =
          standaloneUserId || parsed.userId || parsed.id || parsed._id || "";

        const mappedProfile: AdminProfileData = {
          userId: resolvedUserId,
          name: parsed.ownerName || parsed.fullName || "",
          email: parsed.email || "",
          phone: parsed.phone || "",
          role: parsed.role || "PG Administrator",
          pgName: parsed.pgName || "",
          location: parsed.city || parsed.location || realCurrentArea,
          address: parsed.address || "",
          city: parsed.city || realCurrentArea,
          branches: parsed.branches || [],
          subscriptionPlan: parsed.subscriptionPlan || "",
          subscriptionExpiry: parsed.subscriptionExpiry || "",
        };

        setAdminProfile(mappedProfile);
      }
    } catch (e) {
      console.log("Error loading profile:", e);
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
          await AsyncStorage.removeItem("userId");
          await AsyncStorage.removeItem(STORAGE_KEY);
          router.replace("/login");
        },
      },
    ]);
  };

  const handleActionAlert = (title: string, message: string) => {
    Alert.alert(title, message, [{ text: "OK" }]);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#0F172A" />
      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        <View
          style={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 10 }}
        >
          <Text style={styles.screenTitle}>Admin Profile</Text>
        </View>

        {/* User Details Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={28} color="#38BDF8" />
          </View>
          <Text style={styles.name}>{adminProfile.name}</Text>
          <Text style={styles.role}>{adminProfile.role}</Text>

          <View style={styles.pgBadge}>
            <Ionicons name="business-outline" size={12} color="#38BDF8" />
            <Text style={styles.pgBadgeText}>
              {adminProfile.pgName} • {adminProfile.location}
            </Text>
          </View>

          <View
            style={[
              styles.pgBadge,
              {
                marginTop: 6,
                backgroundColor: "rgba(16, 185, 129, 0.1)",
                borderColor: "rgba(16, 185, 129, 0.2)",
              },
            ]}
          >
            <Ionicons name="call-outline" size={12} color="#10B981" />
            <Text style={[styles.pgBadgeText, { color: "#10B981" }]}>
              {adminProfile.phone}
            </Text>
          </View>
        </View>

        {/* Subscription Simple Banner */}
        <View
          style={{
            marginHorizontal: 16,
            marginBottom: 20,
            backgroundColor: "#1E293B",
            borderRadius: 14,
            padding: 16,
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            borderWidth: 1,
            borderColor: "rgba(56, 189, 248, 0.2)",
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
            <Ionicons name="ribbon" size={20} color="#38BDF8" />
            <View>
              <Text
                style={{
                  color: "#94A3B8",
                  fontSize: 11,
                  textTransform: "uppercase",
                }}
              >
                Subscription
              </Text>
              <Text
                style={{ color: "#F8FAFC", fontSize: 14, fontWeight: "bold" }}
              >
                {adminProfile.subscriptionPlan}
              </Text>
            </View>
          </View>
          <TouchableOpacity
            style={{
              backgroundColor: "#38BDF8",
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: 8,
            }}
            onPress={() => setIsSubModalVisible(true)}
            activeOpacity={0.8}
          >
            <Text
              style={{ color: "#0F172A", fontWeight: "bold", fontSize: 12 }}
            >
              Manage
            </Text>
          </TouchableOpacity>
        </View>

        {/* Business Controls */}
        <Text style={styles.sectionHeading}>Management</Text>

        {/* Routes to separate edit profile page */}
        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => router.push("/edit-profile" as any)}
          activeOpacity={0.8}
        >
          <View style={styles.menuLeft}>
            <View style={styles.iconBg}>
              <Ionicons name="create" size={16} color="#38BDF8" />
            </View>
            <View>
              <Text style={styles.menuText}>Edit Profile & PG Name</Text>
              <Text style={styles.menuSubText}>
                Update name, email, PG details & location
              </Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={16} color="#64748B" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => router.push("/reports")}
          activeOpacity={0.8}
        >
          <View style={styles.menuLeft}>
            <View style={styles.iconBg}>
              <Ionicons name="document-text" size={16} color="#0EA5E9" />
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
              "Staff Access",
              "Warden & Manager permissions panel opened.",
            )
          }
          activeOpacity={0.8}
        >
          <View style={styles.menuLeft}>
            <View style={styles.iconBg}>
              <Ionicons name="shield-checkmark" size={16} color="#10B981" />
            </View>
            <View>
              <Text style={styles.menuText}>Staff & Warden Management</Text>
              <Text style={styles.menuSubText}>Assign sub-admin rights</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={16} color="#64748B" />
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
            <View style={styles.iconBg}>
              <Ionicons name="megaphone" size={16} color="#EC4899" />
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

        {/* Preferences & Support */}
        <Text style={styles.sectionHeading}>Preferences</Text>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() =>
            handleActionAlert(
              "Security Lock",
              "App Biometric/PIN lock is active.",
            )
          }
          activeOpacity={0.8}
        >
          <View style={styles.menuLeft}>
            <View style={styles.iconBg}>
              <Ionicons name="lock-closed" size={16} color="#F59E0B" />
            </View>
            <View>
              <Text style={styles.menuText}>App Security & PIN Lock</Text>
              <Text style={styles.menuSubText}>
                Biometric & passcode settings
              </Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={16} color="#64748B" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => setIsSupportModalVisible(true)}
          activeOpacity={0.8}
        >
          <View style={styles.menuLeft}>
            <View style={styles.iconBg}>
              <Ionicons name="help-circle" size={16} color="#8B5CF6" />
            </View>
            <View>
              <Text style={styles.menuText}>Help & WhatsApp Support</Text>
              <Text style={styles.menuSubText}>
                Get assistance or raise a ticket
              </Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={16} color="#64748B" />
        </TouchableOpacity>

        {/* Logout */}
        <TouchableOpacity
          onPress={logout}
          style={styles.logoutItem}
          activeOpacity={0.8}
        >
          <View style={styles.menuLeft}>
            <View
              style={[
                styles.iconBg,
                { backgroundColor: "rgba(239, 68, 68, 0.15)" },
              ]}
            >
              <Ionicons name="log-out" size={16} color="#EF4444" />
            </View>
            <Text style={styles.logoutText}>Logout Account</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color="#EF4444" />
        </TouchableOpacity>
      </ScrollView>

      {/* Subscription Modal */}
      <Modal
        visible={isSubModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsSubModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setIsSubModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={[styles.modalContainer, { padding: 24 }]}>
                <Text style={[styles.modalTitle, { marginBottom: 15 }]}>
                  Subscription Details
                </Text>
                <Text
                  style={{ color: "#94A3B8", fontSize: 14, marginBottom: 8 }}
                >
                  Active Plan:{" "}
                  <Text style={{ color: "#38BDF8", fontWeight: "bold" }}>
                    {adminProfile.subscriptionPlan}
                  </Text>
                </Text>
                <Text
                  style={{ color: "#94A3B8", fontSize: 14, marginBottom: 20 }}
                >
                  Valid Till:{" "}
                  <Text style={{ color: "#10B981", fontWeight: "bold" }}>
                    {adminProfile.subscriptionExpiry}
                  </Text>
                </Text>

                <TouchableOpacity
                  style={[
                    styles.downloadBtn,
                    { backgroundColor: "#38BDF8", marginTop: 10 },
                  ]}
                  onPress={() => {
                    setIsSubModalVisible(false);
                    Alert.alert("Upgrade", "Redirecting to payment gateway...");
                  }}
                >
                  <Text style={[styles.downloadBtnText, { color: "#0F172A" }]}>
                    Renew / Upgrade Plan
                  </Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Support Modal */}
      <Modal
        visible={isSupportModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsSupportModalVisible(false)}
      >
        <TouchableWithoutFeedback
          onPress={() => setIsSupportModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={[styles.modalContainer, { padding: 24 }]}>
                <Text style={[styles.modalTitle, { marginBottom: 15 }]}>
                  Help & Support
                </Text>
                <Text
                  style={{
                    color: "#94A3B8",
                    fontSize: 14,
                    lineHeight: 22,
                    marginBottom: 20,
                  }}
                >
                  Need assistance with your PG property setup or payment
                  integration? Reach out to our technical team directly.
                </Text>

                <TouchableOpacity
                  style={[
                    styles.downloadBtn,
                    { backgroundColor: "#10B981", marginBottom: 12 },
                  ]}
                  onPress={() => {
                    setIsSupportModalVisible(false);
                    handleActionAlert(
                      "WhatsApp Support",
                      "Connecting to support line...",
                    );
                  }}
                >
                  <Ionicons
                    name="logo-whatsapp"
                    size={18}
                    color="#FFFFFF"
                    style={{ marginRight: 8 }}
                  />
                  <Text style={styles.downloadBtnText}>Chat on WhatsApp</Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </SafeAreaView>
  );
}
