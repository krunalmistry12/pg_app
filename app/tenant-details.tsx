import Ionicons from "@expo/vector-icons/Ionicons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router, useLocalSearchParams } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  Image,
  Linking,
  Modal,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { COLORS, RADIUS, SPACING, TYPOGRAPHY, THEME } from "../src/constants/theme";

export default function TenantDetailsScreen() {
  const params = useLocalSearchParams();

  // Full-Screen Media Viewer State
  const [viewerState, setViewerState] = useState<{
    visible: boolean;
    title: string;
    uri: string | null;
  }>({
    visible: false,
    title: "",
    uri: null,
  });

  // Try parsing JSON object if passed as params.tenant or params.item
  const parsedTenantObject = React.useMemo(() => {
    const rawObj = params.tenant || params.item || params.data;
    if (typeof rawObj === "string") {
      try {
        return JSON.parse(rawObj);
      } catch {
        return {};
      }
    } else if (typeof rawObj === "object" && rawObj !== null) {
      return rawObj;
    }
    return {};
  }, [params]);

  // Parameter Extractor
  const getParam = (keyAliases: string[], fallback: string = "N/A"): string => {
    for (const key of keyAliases) {
      const val = parsedTenantObject[key];
      if (val !== undefined && val !== null && String(val).trim() !== "") {
        return String(val).trim();
      }
    }
    for (const key of keyAliases) {
      const val = params[key];
      if (val !== undefined && val !== null) {
        const strVal = Array.isArray(val) ? val[0] : String(val);
        if (strVal.trim() !== "" && strVal !== "undefined" && strVal !== "null") {
          return strVal.trim();
        }
      }
    }
    return fallback;
  };

  // Safe Parameter Extraction
  const id = getParam(["id", "_id"]);
  const name = getParam(["name", "tenantName", "fullName"], "Tenant Name");
  const phone = getParam(["phone", "phoneNumber", "mobile", "contact"], "");

  // Emergency Contact Details
  const emergencyPhone = getParam(
    ["emergencyPhone", "emergencyContact", "emergencyNumber", "emergency_phone", "guardianPhone"],
    ""
  );
  const emergencyRelation = getParam(
    ["emergencyRelation", "emergencyName", "relation", "guardianName"],
    "Emergency Contact"
  );

  const room = getParam(["room", "roomNo", "roomNumber"], "N/A");
  const bed = getParam(["bed", "bedNo", "bedNumber"], "N/A");
  const status = getParam(["status"], "Active");
  const rent = getParam(["rent", "monthlyRent", "monthly_rent", "rentAmount", "amount"], "0");
  const deposit = getParam(["deposit", "securityDeposit", "security_deposit", "depositAmount"], "0");
  const joiningDate = getParam(["joiningDate", "dateOfJoining", "joining_date", "startDate", "joining"], "N/A");
  const hasAadhaar = getParam(["hasAadhaar", "aadhaarVerified"], "false");
  const hasPhoto = getParam(["hasPhoto"], "false");

  // Expanded Image & Document URI Key Mapping
  const photoUri = getParam(["photoUri", "photo", "image", "avatar", "profilePic"], "");
  const documentUri = getParam(
    ["documentUri", "aadhaarImage", "document", "idProofUri", "proofUri", "idProof", "idProofImage", "fileUri"],
    ""
  );

  const [currentStatus, setCurrentStatus] = useState<string>(status);
  const isActive = currentStatus.toLowerCase() === "active";

  const validPhotoUri =
    photoUri && photoUri !== "undefined" && photoUri !== "null" && String(photoUri).trim() !== ""
      ? String(photoUri).trim()
      : null;

  const validDocumentUri =
    documentUri && documentUri !== "undefined" && documentUri !== "null" && String(documentUri).trim() !== ""
      ? String(documentUri).trim()
      : null;

  const isPhotoAvailable = validPhotoUri !== null || String(hasPhoto).toLowerCase() === "true";
  const isAadhaarVerified = String(hasAadhaar).toLowerCase() === "true" || validDocumentUri !== null;

  const initials = String(name)
    .trim()
    .split(" ")
    .map((w) => w[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();

  // Helper to open media viewer modal or external document links safely
  const openViewer = async (title: string, uri: string | null) => {
    if (!uri) {
      Alert.alert("Notice", "No attachment available to view.");
      return;
    }

    const isPdf = uri.toLowerCase().includes(".pdf") || uri.toLowerCase().includes("application/pdf");

    if (isPdf) {
      try {
        const supported = await Linking.canOpenURL(uri);
        if (supported) {
          await Linking.openURL(uri);
        } else {
          Alert.alert("Error", "Cannot open this document format.");
        }
      } catch {
        Alert.alert("Error", "Failed to open document file.");
      }
    } else {
      setViewerState({ visible: true, title, uri });
    }
  };

  // Call Launcher
  const handlePhoneCall = async (phoneNumber: string) => {
    if (!phoneNumber || phoneNumber === "N/A") {
      Alert.alert("Notice", "No valid phone number available.");
      return;
    }
    const url = `tel:${phoneNumber}`;
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) await Linking.openURL(url);
      else Alert.alert("Error", "Phone call dialer is not supported.");
    } catch {
      Alert.alert("Error", "Unable to open phone dialer.");
    }
  };

  // Direct WhatsApp Launcher (No default text)
  const openWhatsApp = async (phoneNumber: string) => {
    if (!phoneNumber || phoneNumber === "N/A") {
      Alert.alert("Notice", "No valid phone number available.");
      return;
    }

    let cleanNumber = phoneNumber.replace(/[^0-9]/g, "");
    if (cleanNumber.length === 10) cleanNumber = `91${cleanNumber}`;

    const appUrl = `whatsapp://send?phone=${cleanNumber}`;
    const webUrl = `https://wa.me/${cleanNumber}`;

    try {
      const supported = await Linking.canOpenURL(appUrl);
      if (supported) await Linking.openURL(appUrl);
      else await Linking.openURL(webUrl);
    } catch {
      Alert.alert("Error", "Could not open WhatsApp.");
    }
  };

  // SMS Launcher
  const handleSMS = async (phoneNumber: string) => {
    if (!phoneNumber || phoneNumber === "N/A") {
      Alert.alert("Notice", "No valid phone number available.");
      return;
    }
    const url = `sms:${phoneNumber}`;
    try {
      await Linking.openURL(url);
    } catch {
      Alert.alert("Error", "Unable to open SMS app.");
    }
  };

  // Toggle Status
  const handleToggleStatus = () => {
    const nextStatus = isActive ? "Inactive" : "Active";
    const title = isActive ? "Deactivate Tenant" : "Re-activate Tenant";
    const message = isActive
      ? `Are you sure you want to mark ${name} as inactive? Room ${room} will be marked available.`
      : `Re-activate ${name} as an active resident?`;

    Alert.alert(title, message, [
      { text: "Cancel", style: "cancel" },
      {
        text: isActive ? "Deactivate" : "Activate",
        style: isActive ? "destructive" : "default",
        onPress: async () => {
          try {
            const data = await AsyncStorage.getItem("tenants");
            if (data) {
              const tenants = JSON.parse(data);
              const updated = tenants.map((t: any) =>
                String(t.id) === String(id) ? { ...t, status: nextStatus } : t
              );
              await AsyncStorage.setItem("tenants", JSON.stringify(updated));
            }
            setCurrentStatus(nextStatus);
            Alert.alert("Status Updated", `Tenant is now ${nextStatus}.`);
          } catch {
            Alert.alert("Error", "Failed to update tenant status.");
          }
        },
      },
    ]);
  };

  // Delete Record
  const handleDelete = () => {
    Alert.alert(
      "Delete Permanently",
      `Are you sure you want to delete ${name}'s record permanently?`,
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
                (t: { id: string }) => String(t.id) !== String(id)
              );
              await AsyncStorage.setItem("tenants", JSON.stringify(updated));
              Alert.alert("Deleted", "Tenant record deleted successfully.");
              router.back();
            } catch {
              Alert.alert("Error", "Failed to delete record.");
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={THEME.colors.bgDark} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.iconBtn} onPress={() => router.back()} activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={20} color={THEME.colors.textPrimary} />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Tenant Details</Text>

        <TouchableOpacity
          style={styles.iconBtn}
          onPress={() =>
            router.push({
              pathname: "/add-tenant" as any,
              params: { ...params, isEditing: "true" },
            })
          }
          activeOpacity={0.7}
        >
          <Ionicons name="create-outline" size={18} color={THEME.colors.accent} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Profile Card */}
        <View style={styles.profileCard}>
          <TouchableOpacity
            style={styles.avatarContainer}
            onPress={() => openViewer(`${name}'s Photo`, validPhotoUri)}
            activeOpacity={0.8}
          >
            {validPhotoUri ? (
              <Image source={{ uri: validPhotoUri }} style={styles.avatarImage} />
            ) : (
              <View style={styles.avatarFallback}>
                <Text style={styles.avatarText}>{initials || "T"}</Text>
              </View>
            )}
            <View
              style={[
                styles.avatarStatusBadge,
                { backgroundColor: isActive ? THEME.colors.success : THEME.colors.danger },
              ]}
            />
          </TouchableOpacity>

          <Text style={styles.name}>{name}</Text>
          <Text style={styles.subtitle}>
            Room {room} • Bed {bed}
          </Text>

          <View style={styles.toggleRow}>
            <View style={styles.statusIndicator}>
              <View
                style={[
                  styles.statusDot,
                  { backgroundColor: isActive ? THEME.colors.success : THEME.colors.danger },
                ]}
              />
              <Text
                style={[
                  styles.statusText,
                  { color: isActive ? THEME.colors.success : THEME.colors.danger },
                ]}
              >
                {isActive ? "Active Resident" : "Inactive / Checked Out"}
              </Text>
            </View>

            <Switch
              trackColor={{ false: "#1E293B", true: "#10B98140" }}
              thumbColor={isActive ? THEME.colors.success : "#94A3B8"}
              ios_backgroundColor="#1E293B"
              onValueChange={handleToggleStatus}
              value={isActive}
            />
          </View>
        </View>

        {/* Payment Reminder Card */}
        <TouchableOpacity
          style={styles.reminderCardBtn}
          onPress={() => {
            const message = `Hi ${name}, this is a gentle reminder that your monthly rent of ₹${rent} for Room ${room} is due. Please clear the dues at your earliest convenience. Thank you!`;
            let cleanNumber = phone.replace(/[^0-9]/g, "");
            if (cleanNumber.length === 10) cleanNumber = `91${cleanNumber}`;
            
            const appUrl = `whatsapp://send?phone=${cleanNumber}&text=${encodeURIComponent(message)}`;
            const webUrl = `https://wa.me/${cleanNumber}?text=${encodeURIComponent(message)}`;

            Linking.canOpenURL(appUrl)
              .then((supported) => {
                if (supported) {
                  return Linking.openURL(appUrl);
                } else {
                  return Linking.openURL(webUrl);
                }
              })
              .catch(() => Alert.alert("Error", "Could not open WhatsApp reminder."));
          }}
          activeOpacity={0.8}
        >
          <View style={styles.reminderIconWrapper}>
            <Ionicons name="notifications-outline" size={20} color={THEME.colors.warning} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.reminderTitle}>Send Payment Reminder</Text>
            <Text style={styles.reminderSubtitle}>
              WhatsApp notice for ₹{rent} due rent
            </Text>
          </View>
          <Ionicons name="logo-whatsapp" size={22} color={THEME.colors.whatsapp} />
        </TouchableOpacity>

        {/* Primary Contact Details */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Contact Details</Text>

          <View style={styles.contactRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.infoLabel}>Primary Phone Number</Text>
              <Text style={styles.infoValue}>{phone || "N/A"}</Text>
            </View>

            <View style={styles.contactActions}>
              <TouchableOpacity
                style={styles.actionBtnCircle}
                onPress={() => handlePhoneCall(phone)}
                activeOpacity={0.7}
              >
                <Ionicons name="call-outline" size={16} color={THEME.colors.accent} />
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionBtnCircle, { backgroundColor: "#25D36615", borderColor: "#25D36640" }]}
                onPress={() => openWhatsApp(phone)}
                activeOpacity={0.7}
              >
                <Ionicons name="logo-whatsapp" size={16} color={THEME.colors.whatsapp} />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionBtnCircle}
                onPress={() => handleSMS(phone)}
                activeOpacity={0.7}
              >
                <Ionicons name="chatbox-ellipses-outline" size={16} color={THEME.colors.textPrimary} />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Emergency Contact Card */}
        <View style={[styles.card, styles.emergencyCard]}>
          <View style={styles.emergencyHeaderRow}>
            <Ionicons name="warning-outline" size={15} color={THEME.colors.danger} />
            <Text style={styles.emergencyCardTitle}>Emergency Contact</Text>
          </View>

          <View style={styles.contactRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.infoLabel}>{emergencyRelation}</Text>
              <Text style={[styles.infoValue, { color: emergencyPhone ? THEME.colors.textPrimary : THEME.colors.textMuted }]}>
                {emergencyPhone || "Not Provided"}
              </Text>
            </View>

            {emergencyPhone ? (
              <View style={styles.contactActions}>
                <TouchableOpacity
                  style={[styles.actionBtnCircle, { borderColor: THEME.colors.danger + "40", backgroundColor: THEME.colors.danger + "15" }]}
                  onPress={() => handlePhoneCall(emergencyPhone)}
                  activeOpacity={0.7}
                >
                  <Ionicons name="call" size={16} color={THEME.colors.danger} />
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionBtnCircle, { backgroundColor: "#25D36615", borderColor: "#25D36640" }]}
                  onPress={() => openWhatsApp(emergencyPhone)}
                  activeOpacity={0.7}
                >
                  <Ionicons name="logo-whatsapp" size={16} color={THEME.colors.whatsapp} />
                </TouchableOpacity>
              </View>
            ) : null}
          </View>
        </View>

        {/* Verification & Media Attachments */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Verification & Attachments</Text>

          <View style={styles.verificationGrid}>
            <View style={[styles.tag, isAadhaarVerified ? styles.tagSuccess : styles.tagWarning]}>
              <Ionicons
                name={isAadhaarVerified ? "checkmark-circle" : "alert-circle"}
                size={15}
                color={isAadhaarVerified ? THEME.colors.success : THEME.colors.warning}
              />
              <Text
                style={[
                  styles.tagText,
                  { color: isAadhaarVerified ? THEME.colors.success : THEME.colors.warning },
                ]}
              >
                {isAadhaarVerified ? "ID Verified" : "ID Missing"}
              </Text>
            </View>

            <View style={[styles.tag, isPhotoAvailable ? styles.tagSuccess : styles.tagWarning]}>
              <Ionicons
                name={isPhotoAvailable ? "image" : "alert-circle"}
                size={15}
                color={isPhotoAvailable ? THEME.colors.success : THEME.colors.warning}
              />
              <Text
                style={[
                  styles.tagText,
                  { color: isPhotoAvailable ? THEME.colors.success : THEME.colors.warning },
                ]}
              >
                {isPhotoAvailable ? "Photo Attached" : "Photo Missing"}
              </Text>
            </View>
          </View>

          {/* Action Row for Viewing Attached Media */}
          <View style={styles.mediaActionsContainer}>
            {validPhotoUri ? (
              <TouchableOpacity
                style={styles.viewMediaBtn}
                onPress={() => openViewer(`${name}'s Photo`, validPhotoUri)}
                activeOpacity={0.8}
              >
                <Ionicons name="person-outline" size={16} color={THEME.colors.accent} />
                <Text style={styles.viewMediaBtnText}>View Photo</Text>
                <Ionicons name="eye-outline" size={15} color={THEME.colors.accent} />
              </TouchableOpacity>
            ) : null}

            {validDocumentUri ? (
              <TouchableOpacity
                style={[styles.viewMediaBtn, { backgroundColor: "#10B98110", borderColor: "#10B98130" }]}
                onPress={() => openViewer(`${name}'s ID Proof`, validDocumentUri)}
                activeOpacity={0.8}
              >
                <Ionicons name="document-text-outline" size={16} color={THEME.colors.success} />
                <Text style={[styles.viewMediaBtnText, { color: THEME.colors.success }]}>View ID Proof</Text>
                <Ionicons name="eye-outline" size={15} color={THEME.colors.success} />
              </TouchableOpacity>
            ) : null}
          </View>

          {!validPhotoUri && !validDocumentUri && (
            <Text style={styles.noDocText}>No photos or ID proof documents attached.</Text>
          )}
        </View>

        {/* Occupancy & Financial Details */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Occupancy & Financials</Text>

          {/* Joining Date */}
          <View style={styles.infoRow}>
            <View style={[styles.iconWrapper, { backgroundColor: "#38BDF815" }]}>
              <Ionicons name="calendar-outline" size={16} color={THEME.colors.accent} />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Joining Date</Text>
              <Text style={[styles.infoValue, { color: THEME.colors.accent, fontWeight: "600" }]}>
                {joiningDate}
              </Text>
            </View>
          </View>

          <View style={styles.divider} />

          {/* Monthly Rent */}
          <View style={styles.infoRow}>
            <View style={[styles.iconWrapper, { backgroundColor: "#10B98115" }]}>
              <Ionicons name="cash-outline" size={16} color={THEME.colors.success} />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Monthly Rent</Text>
              <Text style={styles.infoValue}>₹{rent} / month</Text>
            </View>
          </View>

          <View style={styles.divider} />

          {/* Security Deposit */}
          <View style={styles.infoRow}>
            <View style={[styles.iconWrapper, { backgroundColor: "#F59E0B15" }]}>
              <Ionicons name="shield-checkmark-outline" size={16} color={THEME.colors.warning} />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Security Deposit</Text>
              <Text style={styles.infoValue}>₹{deposit}</Text>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.adminActionSection}>
          <TouchableOpacity
            style={[
              styles.deactivateBtn,
              { backgroundColor: isActive ? "#EF444410" : "#10B98110" },
              { borderColor: isActive ? "#EF444430" : "#10B98130" },
            ]}
            onPress={handleToggleStatus}
            activeOpacity={0.8}
          >
            <Ionicons
              name={isActive ? "person-remove-outline" : "person-add-outline"}
              size={18}
              color={isActive ? THEME.colors.danger : THEME.colors.success}
            />
            <Text
              style={[
                styles.deactivateBtnText,
                { color: isActive ? THEME.colors.danger : THEME.colors.success },
              ]}
            >
              {isActive ? "Deactivate / Checkout Tenant" : "Re-activate Tenant Account"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.deleteButton} onPress={handleDelete} activeOpacity={0.8}>
            <Ionicons name="trash-outline" size={16} color={THEME.colors.danger} />
            <Text style={styles.deleteBtnText}>Delete Record</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Universal Fullscreen Image & ID Proof Viewer Modal */}
      <Modal visible={viewerState.visible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{viewerState.title}</Text>
            <TouchableOpacity
              style={styles.modalCloseBtn}
              onPress={() => setViewerState({ visible: false, title: "", uri: null })}
            >
              <Ionicons name="close" size={22} color={THEME.colors.textPrimary} />
            </TouchableOpacity>
          </View>

          <View style={styles.modalImageContainer}>
            {viewerState.uri ? (
              <Image source={{ uri: viewerState.uri }} style={styles.modalImage} resizeMode="contain" />
            ) : null}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.colors.bgDark,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 10,
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: THEME.radius.sm,
    backgroundColor: THEME.colors.cardBg,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    color: THEME.colors.textPrimary,
    fontSize: 17,
    fontWeight: "700",
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  profileCard: {
    backgroundColor: THEME.colors.cardBg,
    borderRadius: THEME.radius.xl,
    padding: 22,
    alignItems: "center",
    marginTop: 8,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  avatarContainer: {
    position: "relative",
    marginBottom: 10,
  },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    marginTop: 18,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: THEME.colors.border,
  },
  reminderCardBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: THEME.colors.cardBg,
    borderRadius: THEME.radius.lg,
    padding: 16,
    marginTop: 12,
    borderWidth: 1,
    borderColor: "#F59E0B30",
  },
  reminderIconWrapper: {
    width: 38,
    height: 38,
    borderRadius: THEME.radius.sm,
    backgroundColor: "#F59E0B15",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  reminderTitle: {
    color: THEME.colors.textPrimary,
    fontSize: 14,
    fontWeight: "700",
  },
  reminderSubtitle: {
    color: THEME.colors.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  statusIndicator: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatarImage: {
    width: 82,
    height: 82,
    borderRadius: 41,
    borderWidth: 2,
    borderColor: THEME.colors.primary,
  },
  avatarFallback: {
    width: 82,
    height: 82,
    borderRadius: 41,
    backgroundColor: THEME.colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    color: "#FFFFFF",
    fontSize: 24,
    fontWeight: "700",
  },
  avatarStatusBadge: {
    width: 14,
    height: 14,
    borderRadius: 7,
    position: "absolute",
    bottom: 2,
    right: 2,
    borderWidth: 2,
    borderColor: THEME.colors.cardBg,
  },
  name: {
    color: THEME.colors.textPrimary,
    fontSize: 20,
    fontWeight: "700",
    marginTop: 4,
  },
  subtitle: {
    color: THEME.colors.textSecondary,
    fontSize: 13,
    marginTop: 2,
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
    backgroundColor: THEME.colors.cardBg,
    borderRadius: THEME.radius.lg,
    padding: 16,
    marginTop: 12,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  emergencyCard: {
    borderColor: "#EF444430",
    backgroundColor: "#EF444405",
  },
  emergencyHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 10,
  },
  emergencyCardTitle: {
    color: THEME.colors.danger,
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  cardTitle: {
    color: THEME.colors.textSecondary,
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 12,
  },
  contactRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  contactActions: {
    flexDirection: "row",
    gap: 8,
  },
  actionBtnCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: THEME.colors.bgDark,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    justifyContent: "center",
    alignItems: "center",
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
    paddingVertical: 10,
    borderRadius: THEME.radius.sm,
    borderWidth: 1,
  },
  tagSuccess: {
    backgroundColor: "#10B98110",
    borderColor: "#10B98130",
  },
  tagWarning: {
    backgroundColor: "#F59E0B10",
    borderColor: "#F59E0B30",
  },
  tagText: {
    fontSize: 12,
    fontWeight: "600",
    marginLeft: 6,
  },
  mediaActionsContainer: {
    gap: 8,
    marginTop: 10,
  },
  viewMediaBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#38BDF810",
    borderWidth: 1,
    borderColor: "#38BDF830",
    borderRadius: THEME.radius.sm,
    padding: 12,
  },
  viewMediaBtnText: {
    color: THEME.colors.accent,
    fontWeight: "600",
    fontSize: 13,
    flex: 1,
    marginLeft: 8,
  },
  noDocText: {
    color: THEME.colors.textMuted,
    fontSize: 12,
    fontStyle: "italic",
    marginTop: 8,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconWrapper: {
    width: 34,
    height: 34,
    borderRadius: THEME.radius.sm,
    backgroundColor: THEME.colors.bgDark,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    color: THEME.colors.textMuted,
    fontSize: 11,
    fontWeight: "500",
  },
  infoValue: {
    color: THEME.colors.textPrimary,
    fontSize: 14,
    fontWeight: "600",
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: THEME.colors.border,
    marginVertical: 10,
  },
  adminActionSection: {
    marginTop: 20,
    gap: 10,
  },
  deactivateBtn: {
    width: "100%",
    height: 46,
    borderRadius: THEME.radius.md,
    borderWidth: 1,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  deactivateBtnText: {
    fontWeight: "700",
    fontSize: 13,
  },
  deleteButton: {
    width: "100%",
    height: 46,
    borderRadius: THEME.radius.md,
    backgroundColor: "#EF444410",
    borderWidth: 1,
    borderColor: "#EF444430",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
  },
  deleteBtnText: {
    color: THEME.colors.danger,
    fontWeight: "600",
    fontSize: 13,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(11, 15, 25, 0.95)",
    paddingTop: 40,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  modalTitle: {
    color: THEME.colors.textPrimary,
    fontSize: 17,
    fontWeight: "700",
  },
  modalCloseBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: THEME.colors.cardBg,
    justifyContent: "center",
    alignItems: "center",
  },
  modalImageContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  modalImage: {
    width: "100%",
    height: "100%",
  },
});