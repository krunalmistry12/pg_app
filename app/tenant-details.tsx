import Ionicons from "@expo/vector-icons/Ionicons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router, useLocalSearchParams } from "expo-router";
import React from "react";
import {
  Alert,
  Linking,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function TenantDetailsScreen() {
  const params = useLocalSearchParams();

  // Route parameters with fallbacks
  const {
    id,
    name = "Tenant Name",
    phone = "N/A",
    room = "N/A",
    bed = "N/A",
    status = "Active",
    deposit = "0",
    dueDate = "N/A",
    hasAadhaar = "false",
    hasPhoto = "false",
    emergencyContact = "",
  } = params;

  const isAadhaarVerified = String(hasAadhaar).toLowerCase() === "true";
  const isPhotoAttached = String(hasPhoto).toLowerCase() === "true";
  const isActive = String(status ?? "").toLowerCase() === "active";

  const initials = String(name)
    .trim()
    .split(" ")
    .map((word) => word[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();

  const handlePhoneCall = async (phoneNumber: string) => {
    if (!phoneNumber || phoneNumber === "N/A") return;
    const url = `tel:${phoneNumber}`;
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert(
          "Error",
          "Phone call function is not supported on this device.",
        );
      }
    } catch {
      Alert.alert("Error", "Unable to open phone dialer.");
    }
  };

  const handleDelete = () => {
    Alert.alert(
      "Delete Tenant",
      `Are you sure you want to remove ${name} from records?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              const data = await AsyncStorage.getItem("tenants");
              const tenants = data ? JSON.parse(data) : [];
              const updated = tenants.filter(
                (t: { id: string }) => t.id !== id,
              );

              await AsyncStorage.setItem("tenants", JSON.stringify(updated));

              Alert.alert("Success", "Tenant record deleted successfully.");
              router.back();
            } catch (error) {
              console.error("Delete Error:", error);
              Alert.alert(
                "Error",
                "Failed to delete tenant. Please try again.",
              );
            }
          },
        },
      ],
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0F172A" />

      {/* Navigation Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.iconBtn}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={22} color="#FFFFFF" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Tenant Profile</Text>

        <TouchableOpacity
          style={styles.iconBtn}
          onPress={handleDelete}
          activeOpacity={0.7}
        >
          <Ionicons name="trash-outline" size={20} color="#EF4444" />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Profile Card Header */}
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials || "T"}</Text>
          </View>

          <Text style={styles.name}>{name}</Text>
          <Text style={styles.subtitle}>
            Room {room} • Bed {bed}
          </Text>

          <View
            style={[
              styles.statusBadge,
              { backgroundColor: isActive ? "#14532D" : "#7F1D1D" },
            ]}
          >
            <View
              style={[
                styles.statusDot,
                { backgroundColor: isActive ? "#22C55E" : "#EF4444" },
              ]}
            />
            <Text
              style={[
                styles.statusText,
                { color: isActive ? "#4ADE80" : "#FCA5A5" },
              ]}
            >
              {isActive ? "Active Tenant" : "Inactive Tenant"}
            </Text>
          </View>
        </View>

        {/* Verification Status */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Identity Verification</Text>

          <View style={styles.verificationGrid}>
            <View
              style={[
                styles.tag,
                isAadhaarVerified ? styles.tagSuccess : styles.tagWarning,
              ]}
            >
              <Ionicons
                name={
                  isAadhaarVerified
                    ? "checkmark-circle-outline"
                    : "alert-circle-outline"
                }
                size={16}
                color={isAadhaarVerified ? "#22C55E" : "#F59E0B"}
              />
              <Text
                style={[
                  styles.tagText,
                  { color: isAadhaarVerified ? "#22C55E" : "#F59E0B" },
                ]}
              >
                {isAadhaarVerified ? "Aadhaar Verified" : "Aadhaar Missing"}
              </Text>
            </View>

            <View
              style={[
                styles.tag,
                isPhotoAttached ? styles.tagSuccess : styles.tagWarning,
              ]}
            >
              <Ionicons
                name={
                  isPhotoAttached ? "image-outline" : "alert-circle-outline"
                }
                size={16}
                color={isPhotoAttached ? "#22C55E" : "#F59E0B"}
              />
              <Text
                style={[
                  styles.tagText,
                  { color: isPhotoAttached ? "#22C55E" : "#F59E0B" },
                ]}
              >
                {isPhotoAttached ? "Photo On File" : "No Photo"}
              </Text>
            </View>
          </View>
        </View>

        {/* Room & Payment Details */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Occupancy & Financials</Text>

          <View style={styles.infoRow}>
            <View style={styles.iconWrapper}>
              <Ionicons name="business-outline" size={18} color="#3B82F6" />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Assigned Unit</Text>
              <Text style={styles.infoValue}>
                Room {room} • Bed {bed}
              </Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <View style={styles.iconWrapper}>
              <Ionicons name="cash-outline" size={18} color="#10B981" />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Security Deposit</Text>
              <Text style={styles.infoValue}>₹{deposit || "0"}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <View style={styles.iconWrapper}>
              <Ionicons name="calendar-outline" size={18} color="#F59E0B" />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Rent Cycle</Text>
              <Text style={styles.infoValue}>
                {dueDate ? dueDate : "Due monthly"}
              </Text>
            </View>
          </View>
        </View>

        {/* Contact Information */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Contact Details</Text>

          <TouchableOpacity
            style={styles.infoRow}
            onPress={() => handlePhoneCall(String(phone))}
            activeOpacity={0.7}
          >
            <View style={styles.iconWrapper}>
              <Ionicons name="call-outline" size={18} color="#10B981" />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Primary Phone</Text>
              <Text style={styles.infoValueActive}>{phone}</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#64748B" />
          </TouchableOpacity>

          {emergencyContact ? (
            <>
              <View style={styles.divider} />
              <TouchableOpacity
                style={styles.infoRow}
                onPress={() => handlePhoneCall(String(emergencyContact))}
                activeOpacity={0.7}
              >
                <View style={styles.iconWrapper}>
                  <Ionicons name="warning-outline" size={18} color="#EF4444" />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Emergency Contact</Text>
                  <Text style={styles.infoValueActive}>{emergencyContact}</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color="#64748B" />
              </TouchableOpacity>
            </>
          ) : null}
        </View>

        {/* Action Buttons */}
        <View style={styles.actionContainer}>
          <TouchableOpacity
            style={styles.editButton}
            onPress={() =>
              router.push({
                pathname: "/add-tenant" as any,
                params: { ...params, isEditing: "true" },
              })
            }
            activeOpacity={0.8}
          >
            <Ionicons name="create-outline" size={18} color="#FFFFFF" />
            <Text style={styles.editBtnText}>Edit Details</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.deleteButton}
            onPress={handleDelete}
            activeOpacity={0.8}
          >
            <Ionicons name="trash-outline" size={18} color="#EF4444" />
            <Text style={styles.deleteBtnText}>Remove</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0F172A",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#1E293B",
    borderWidth: 1,
    borderColor: "#334155",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "700",
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  profileCard: {
    backgroundColor: "#1E293B",
    borderRadius: 20,
    padding: 20,
    alignItems: "center",
    marginTop: 10,
    borderWidth: 1,
    borderColor: "#334155",
  },
  avatar: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: "#2563EB",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#2563EB",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  avatarText: {
    color: "#FFFFFF",
    fontSize: 26,
    fontWeight: "700",
  },
  name: {
    color: "#F8FAFC",
    fontSize: 22,
    fontWeight: "700",
    marginTop: 12,
  },
  subtitle: {
    color: "#94A3B8",
    fontSize: 14,
    marginTop: 4,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginTop: 14,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
  },
  card: {
    backgroundColor: "#1E293B",
    borderRadius: 18,
    padding: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: "#334155",
  },
  cardTitle: {
    color: "#94A3B8",
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 14,
  },
  verificationGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
  },
  tag: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  tagSuccess: {
    backgroundColor: "#10B98110",
    borderColor: "#10B98140",
  },
  tagWarning: {
    backgroundColor: "#F59E0B10",
    borderColor: "#F59E0B40",
  },
  tagText: {
    fontSize: 12,
    fontWeight: "600",
    marginLeft: 6,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#0F172A",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    color: "#64748B",
    fontSize: 12,
    fontWeight: "500",
  },
  infoValue: {
    color: "#F8FAFC",
    fontSize: 15,
    fontWeight: "600",
    marginTop: 2,
  },
  infoValueActive: {
    color: "#38BDF8",
    fontSize: 15,
    fontWeight: "600",
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: "#334155",
    marginVertical: 12,
  },
  actionContainer: {
    flexDirection: "row",
    marginTop: 24,
    gap: 12,
  },
  editButton: {
    flex: 2,
    height: 50,
    borderRadius: 14,
    backgroundColor: "#2563EB",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  editBtnText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 15,
    marginLeft: 8,
  },
  deleteButton: {
    flex: 1,
    height: 50,
    borderRadius: 14,
    backgroundColor: "#EF444415",
    borderWidth: 1,
    borderColor: "#EF444440",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  deleteBtnText: {
    color: "#EF4444",
    fontWeight: "600",
    fontSize: 15,
    marginLeft: 6,
  },
});
