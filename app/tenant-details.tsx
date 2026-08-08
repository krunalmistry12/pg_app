import Ionicons from "@expo/vector-icons/Ionicons";
import { useFocusEffect } from "@react-navigation/native";
import { router, useLocalSearchParams } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  Modal,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { THEME } from "../src/constants/theme";
import { updateTenantStatusApi } from "../src/services/tenantApi";

// Tenant Status Enum Mapping
const TenantStatusEnum = {
  ACTIVE: 1,
  INACTIVE: 2,
  NOTICE_PERIOD: 3,
} as const;

export default function TenantDetailsScreen() {
  const params = useLocalSearchParams();

  // Loading States for API Actions
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

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

  // Helper function to parse tenant object safely from params
  const getParsedTenant = () => {
    const rawObj =
      params.tenantData || params.tenant || params.item || params.data;
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
  };

  const [parsedTenantObject, setParsedTenantObject] =
    useState(getParsedTenant());

  // Robust Status Initialization Helper
  const extractStatus = (tenantObj: any): number => {
    const rawStatus =
      tenantObj.status ??
      tenantObj.tenantStatus ??
      tenantObj.statusId ??
      params.status ??
      params.tenantStatus;

    if (rawStatus !== undefined && rawStatus !== null && rawStatus !== "") {
      const num = Number(rawStatus);
      if (!isNaN(num)) return num;

      const stringVal = String(rawStatus).toUpperCase().trim();
      if (
        stringVal.includes("INACTIVE") ||
        stringVal.includes("CHECKED") ||
        stringVal === "2"
      ) {
        return TenantStatusEnum.INACTIVE;
      }
      if (stringVal.includes("NOTICE") || stringVal === "3") {
        return TenantStatusEnum.NOTICE_PERIOD;
      }
      if (stringVal.includes("ACTIVE") || stringVal === "1") {
        return TenantStatusEnum.ACTIVE;
      }
    }
    return TenantStatusEnum.ACTIVE;
  };

  const [currentStatus, setCurrentStatus] = useState<number>(() =>
    extractStatus(parsedTenantObject),
  );

  // Focus effect to ensure UI updates dynamically when returning from edit screen
  useFocusEffect(
    useCallback(() => {
      const updatedTenant = getParsedTenant();
      setParsedTenantObject(updatedTenant);
      setCurrentStatus(extractStatus(updatedTenant));
    }, []),
  );

  // Parameter Extractor with fallback support
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
        if (
          strVal.trim() !== "" &&
          strVal !== "undefined" &&
          strVal !== "null"
        ) {
          return strVal.trim();
        }
      }
    }
    return fallback;
  };

  // 1. Basic Info Extractions
  const id = getParam(["id", "_id", "tenantId"]);
  const name = getParam(["name", "tenantName", "fullName"], "Tenant Name");
  const phone = getParam(["phone", "phoneNumber", "mobile", "contact"], "");
  const email = getParam(["email", "emailAddress"], "");

  // 2. Allocation Type, Room & Bed Extractions
  const rawAllocationType = getParam(
    ["allocationType", "type", "bookingType", "allocation_type"],
    "FULL_FLAT",
  );

  const getAllocationTypeNumber = (type: string) => {
    const upper = String(type).toUpperCase().trim();
    if (upper === "3" || upper.includes("BED")) return 3;
    if (upper === "2" || upper.includes("ROOM")) return 2;
    return 1;
  };

  const allocationTypeNum = getAllocationTypeNumber(rawAllocationType);

  const room = getParam(
    ["room", "roomName", "roomNumber", "flatNumber", "flat", "apartmentName"],
    parsedTenantObject.roomId || parsedTenantObject.flatNumber
      ? `Room/Flat: ${String(parsedTenantObject.roomId || parsedTenantObject.flatNumber)}`
      : "N/A",
  );

  const rawBed = getParam(["bed", "bedNumber", "bedName", "bedId"], "");
  const bed =
    allocationTypeNum === 3 &&
    rawBed !== "N/A" &&
    rawBed !== "" &&
    !rawBed.toLowerCase().includes("tenant")
      ? rawBed
      : "";

  // 3. Financial & Agreement Extractions
  const rent = getParam(
    ["rent", "monthlyRent", "monthly_rent", "rentAmount"],
    "0",
  );
  const deposit = getParam(
    ["deposit", "securityDeposit", "security_deposit"],
    "0",
  );
  const advancePaid = getParam(["advancePaid", "advance_paid"], "0");
  const dueDate = getParam(["dueDate", "rentDueDate"], "N/A");
  const paymentMethod = getParam(["paymentMethod", "payment_method"], "CASH");
  const startingMeterReading = getParam(
    ["startingMeterReading", "meterReading"],
    "0",
  );
  const lockInPeriod = getParam(["lockInPeriodMonths", "lockInPeriod"], "0");

  const rawJoiningDate = getParam(
    ["joiningDate", "dateOfJoining", "startDate"],
    "N/A",
  );
  const joiningDate =
    rawJoiningDate !== "N/A" && rawJoiningDate.includes("T")
      ? rawJoiningDate.split("T")[0]
      : rawJoiningDate;

  const rawAgreementEnd = getParam(["agreementEndDate", "agreementEnd"], "N/A");
  const agreementEndDate =
    rawAgreementEnd !== "N/A" && rawAgreementEnd.includes("T")
      ? rawAgreementEnd.split("T")[0]
      : rawAgreementEnd;

  // 4. Verification & ID Extractions
  const idProofType = getParam(
    ["idProofType", "idType", "documentType", "proofType", "identityType"],
    "ID Proof",
  );
  const idProofNumber = getParam(
    [
      "idProofNumber",
      "idNumber",
      "documentNumber",
      "proofNumber",
      "identityNumber",
    ],
    "[ID Proof Redacted]",
  );
  const policeVerificationStatus = getParam(
    ["policeVerificationStatus"],
    "PENDING",
  );

  // 5. Emergency Contacts
  const emergencyPhone = getParam(["emergencyPhone", "emergencyContact"], "");
  const emergencyRelation = getParam(
    ["emergencyRelation", "relation"],
    "Emergency Contact",
  );

  const getStatusDetails = (st: number | string) => {
    const numericSt = Number(st);
    switch (numericSt) {
      case TenantStatusEnum.ACTIVE:
        return {
          label: "Active Resident",
          color: THEME.colors.successText,
          bg: "#10B98115",
        };
      case TenantStatusEnum.INACTIVE:
        return {
          label: "Inactive / Checked Out",
          color: THEME.colors.dangerText,
          bg: "#EF444415",
        };
      case TenantStatusEnum.NOTICE_PERIOD:
        return {
          label: "Notice Period",
          color: THEME.colors.warningText,
          bg: "#F59E0B15",
        };
      default:
        return {
          label: "Active Resident",
          color: THEME.colors.successText,
          bg: "#10B98115",
        };
    }
  };

  const currentStatusInfo = getStatusDetails(currentStatus);

  const photoUri = getParam(
    ["photoUri", "photo", "image", "avatar", "tenantPhotoUrl"],
    "",
  );
  const documentUri = getParam(
    ["documentUri", "idProofUri", "document", "idProofUrl"],
    "",
  );

  const validPhotoUri =
    photoUri && photoUri !== "undefined" && photoUri !== "null"
      ? photoUri
      : null;
  const validDocumentUri =
    documentUri && documentUri !== "undefined" && documentUri !== "null"
      ? documentUri
      : null;

  const initials = String(name)
    .trim()
    .split(" ")
    .map((w) => w[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();

  const openViewer = async (title: string, uri: string | null) => {
    if (!uri) {
      Alert.alert("Notice", "No attachment available to view.");
      return;
    }

    if (uri.toLowerCase().endsWith(".pdf") || uri.includes("pdf")) {
      try {
        await Linking.openURL(uri);
      } catch {
        Alert.alert("Error", "Unable to open PDF document.");
      }
      return;
    }

    setViewerState({ visible: true, title, uri });
  };

  const handlePhoneCall = async (phoneNumber: string) => {
    if (!phoneNumber || phoneNumber === "N/A") {
      Alert.alert("Notice", "Phone number is not available.");
      return;
    }
    try {
      await Linking.openURL(`tel:${phoneNumber}`);
    } catch {
      Alert.alert("Error", "Unable to open dialer.");
    }
  };

  const openWhatsApp = async (phoneNumber: string, customMessage?: string) => {
    if (!phoneNumber || phoneNumber === "N/A") {
      Alert.alert("Notice", "WhatsApp number is not available.");
      return;
    }
    let cleanNumber = phoneNumber.replace(/[^0-9]/g, "");
    if (cleanNumber.length === 10) cleanNumber = `91${cleanNumber}`;
    const encodedMsg = customMessage
      ? `&text=${encodeURIComponent(customMessage)}`
      : "";
    try {
      await Linking.openURL(
        `whatsapp://send?phone=${cleanNumber}${encodedMsg}`,
      );
    } catch {
      try {
        await Linking.openURL(`https://wa.me/${cleanNumber}`);
      } catch {
        Alert.alert("Error", "Unable to open WhatsApp.");
      }
    }
  };

  const handleEmail = async (emailAddr: string) => {
    if (!emailAddr || emailAddr === "N/A") {
      Alert.alert("Notice", "Email address is not available.");
      return;
    }
    try {
      await Linking.openURL(`mailto:${emailAddr}`);
    } catch {
      Alert.alert("Error", "Unable to open mail app.");
    }
  };

  const handleToggleStatus = () => {
    Alert.alert(
      "Update Tenant Status",
      `Current Status: ${currentStatusInfo.label}\n\nSelect new status option:`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "🟢 Set Active",
          onPress: () => submitStatusUpdate(TenantStatusEnum.ACTIVE),
        },
        {
          text: "🟡 Set Notice Period",
          onPress: () => submitStatusUpdate(TenantStatusEnum.NOTICE_PERIOD),
        },
        {
          text: "🔴 Set Inactive (Vacate Bed)",
          onPress: () => submitStatusUpdate(TenantStatusEnum.INACTIVE),
        },
      ],
    );
  };

  const submitStatusUpdate = async (newStatusValue: number) => {
    if (currentStatus === newStatusValue) {
      Alert.alert("Info", "Tenant is already in this status.");
      return;
    }

    try {
      setIsUpdatingStatus(true);
      const tenantId = parsedTenantObject.id || parsedTenantObject._id || id;

      if (!tenantId || tenantId === "N/A") {
        Alert.alert("Error", "Tenant ID is missing.");
        return;
      }

      await updateTenantStatusApi(tenantId, newStatusValue);

      setCurrentStatus(newStatusValue);
      setParsedTenantObject((prev: any) => ({
        ...prev,
        status: newStatusValue,
      }));

      Alert.alert("Success", "Tenant status updated successfully.");
    } catch (error: any) {
      Alert.alert(
        "Error",
        error?.response?.data?.message ||
          "Failed to update tenant status. Please check your network connection.",
      );
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      "Delete Record",
      `Are you sure you want to permanently delete record for ${name}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              setIsDeleting(true);
              // Add actual delete API call here if available, e.g. await deleteTenantApi(id);
              Alert.alert("Success", "Record removed successfully.");
              router.back();
            } catch (error) {
              Alert.alert("Error", "Failed to delete record.");
            } finally {
              setIsDeleting(false);
            }
          },
        },
      ],
    );
  };

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 800);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        barStyle="light-content"
        backgroundColor={THEME.colors.bgDark}
      />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.iconBtn}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Ionicons
            name="chevron-back"
            size={20}
            color={THEME.colors.textPrimary}
          />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Tenant Details</Text>
        <TouchableOpacity
          style={styles.iconBtn}
          onPress={() =>
            router.push({
              pathname: "/add-tenant" as any,
              params: {
                ...params,
                isEditing: "true",
                tenantData: JSON.stringify(parsedTenantObject),
              },
            })
          }
          activeOpacity={0.7}
        >
          <Ionicons
            name="create-outline"
            size={18}
            color={THEME.colors.accent}
          />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={THEME.colors.accent}
          />
        }
      >
        {/* Profile Card */}
        <View style={styles.profileCard}>
          <TouchableOpacity
            style={styles.avatarContainer}
            onPress={() => openViewer(`${name}'s Photo`, validPhotoUri)}
            activeOpacity={0.8}
          >
            {validPhotoUri ? (
              <Image
                source={{ uri: validPhotoUri }}
                style={styles.avatarImage}
              />
            ) : (
              <View style={styles.avatarFallback}>
                <Text style={styles.avatarText}>{initials || "T"}</Text>
              </View>
            )}
            <View
              style={[
                styles.avatarStatusBadge,
                { backgroundColor: currentStatusInfo.color },
              ]}
            />
          </TouchableOpacity>

          <Text style={styles.name}>{name}</Text>

          {/* Dynamic Location Badge */}
          <View
            style={[
              styles.locationBadge,
              currentStatus === TenantStatusEnum.INACTIVE &&
                styles.vacatedLocationBadge,
            ]}
          >
            <Ionicons
              name={
                allocationTypeNum === 1 ? "home-outline" : "business-outline"
              }
              size={13}
              color={
                currentStatus === TenantStatusEnum.INACTIVE
                  ? THEME.colors.dangerText
                  : THEME.colors.accent
              }
            />
            <Text
              style={[
                styles.locationBadgeText,
                currentStatus === TenantStatusEnum.INACTIVE && {
                  color: THEME.colors.dangerText,
                },
              ]}
            >
              {currentStatus === TenantStatusEnum.INACTIVE
                ? `Vacated / ${room} (Past Record)`
                : allocationTypeNum === 1
                  ? `${room}`
                  : allocationTypeNum === 2
                    ? `${room} (Room)`
                    : `${room} • Bed ${bed}`}
            </Text>
          </View>

          <View style={styles.toggleRow}>
            <View style={styles.statusIndicator}>
              <View
                style={[
                  styles.statusDot,
                  { backgroundColor: currentStatusInfo.color },
                ]}
              />
              <Text
                style={[styles.statusText, { color: currentStatusInfo.color }]}
              >
                {currentStatusInfo.label}
              </Text>
            </View>

            <TouchableOpacity
              style={[
                styles.changeStatusBtnInline,
                {
                  borderColor: currentStatusInfo.color,
                  backgroundColor: currentStatusInfo.bg,
                },
              ]}
              onPress={handleToggleStatus}
              disabled={isUpdatingStatus}
              activeOpacity={0.8}
            >
              {isUpdatingStatus ? (
                <ActivityIndicator
                  size="small"
                  color={currentStatusInfo.color}
                />
              ) : (
                <Text
                  style={[
                    styles.changeStatusBtnText,
                    { color: currentStatusInfo.color },
                  ]}
                >
                  Change Status
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* WhatsApp Reminder Banner */}
        {currentStatus !== TenantStatusEnum.INACTIVE && (
          <TouchableOpacity
            style={styles.reminderCardBtn}
            onPress={() => {
              const message = `Hi ${name}, gentle reminder that your monthly rent of ₹${rent} is due on ${dueDate}th of every month. Thank you!`;
              openWhatsApp(phone, message);
            }}
            activeOpacity={0.8}
          >
            <View style={styles.reminderIconWrapper}>
              <Ionicons
                name="notifications-outline"
                size={20}
                color={THEME.colors.warningText}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.reminderTitle}>Send Payment Reminder</Text>
              <Text style={styles.reminderSubtitle}>
                Due on {dueDate}th every month (₹{rent})
              </Text>
            </View>
            <Ionicons name="logo-whatsapp" size={22} color="#25D366" />
          </TouchableOpacity>
        )}

        {/* Contact Information */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Contact Information</Text>

          <View style={styles.contactRow}>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Primary Phone</Text>
              <Text style={styles.infoValue}>{phone || "N/A"}</Text>
            </View>
            <View style={styles.contactActions}>
              <TouchableOpacity
                style={styles.actionBtnCircle}
                onPress={() => handlePhoneCall(phone)}
              >
                <Ionicons
                  name="call-outline"
                  size={15}
                  color={THEME.colors.successText}
                />
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.actionBtnCircle,
                  { backgroundColor: "#25D36615" },
                ]}
                onPress={() => openWhatsApp(phone)}
              >
                <Ionicons name="logo-whatsapp" size={15} color="#25D366" />
              </TouchableOpacity>
            </View>
          </View>

          {email !== "N/A" && email !== "" && (
            <>
              <View style={styles.divider} />
              <View style={styles.contactRow}>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Email Address</Text>
                  <Text style={styles.infoValue}>{email}</Text>
                </View>
                <TouchableOpacity
                  style={styles.actionBtnCircle}
                  onPress={() => handleEmail(email)}
                >
                  <Ionicons
                    name="mail-outline"
                    size={15}
                    color={THEME.colors.accent}
                  />
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>

        {/* Financials & Payment Details */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Financials & Payment Setup</Text>

          <View style={styles.gridRow}>
            <View style={styles.gridItem}>
              <Text style={styles.infoLabel}>Monthly Rent</Text>
              <Text
                style={[styles.infoValue, { color: THEME.colors.successText }]}
              >
                ₹{rent}
              </Text>
            </View>
            <View style={styles.gridItem}>
              <Text style={styles.infoLabel}>Security Deposit</Text>
              <Text style={styles.infoValue}>₹{deposit}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.gridRow}>
            <View style={styles.gridItem}>
              <Text style={styles.infoLabel}>Advance Paid</Text>
              <Text style={styles.infoValue}>₹{advancePaid}</Text>
            </View>
            <View style={styles.gridItem}>
              <Text style={styles.infoLabel}>Rent Due Date</Text>
              <Text style={styles.infoValue}>Every {dueDate}th</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.gridRow}>
            <View style={styles.gridItem}>
              <Text style={styles.infoLabel}>Payment Mode</Text>
              <Text style={[styles.infoValue, { color: THEME.colors.accent }]}>
                {paymentMethod}
              </Text>
            </View>
            <View style={styles.gridItem}>
              <Text style={styles.infoLabel}>Meter Reading (Initial)</Text>
              <Text style={styles.infoValue}>{startingMeterReading} units</Text>
            </View>
          </View>
        </View>

        {/* Agreement & Tenancy Timeline */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Agreement & Tenancy Period</Text>

          <View style={styles.gridRow}>
            <View style={styles.gridItem}>
              <Text style={styles.infoLabel}>Joining Date</Text>
              <Text style={styles.infoValue}>{joiningDate}</Text>
            </View>
            <View style={styles.gridItem}>
              <Text style={styles.infoLabel}>Agreement End Date</Text>
              <Text style={styles.infoValue}>{agreementEndDate}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <View
              style={[styles.iconWrapper, { backgroundColor: "#F59E0B15" }]}
            >
              <Ionicons
                name="time-outline"
                size={16}
                color={THEME.colors.warningText}
              />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Lock-in Period</Text>
              <Text style={styles.infoValue}>{lockInPeriod} Months</Text>
            </View>
          </View>
        </View>

        {/* ID Proof & Police Verification */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Identity & Verification</Text>

          <View style={styles.gridRow}>
            <View style={styles.gridItem}>
              <Text style={styles.infoLabel}>{idProofType}</Text>
              <Text style={styles.infoValue}>{idProofNumber}</Text>
            </View>
            <View style={styles.gridItem}>
              <Text style={styles.infoLabel}>Police Verification</Text>
              <Text
                style={[
                  styles.infoValue,
                  {
                    color:
                      policeVerificationStatus === "COMPLETED"
                        ? THEME.colors.successText
                        : THEME.colors.warningText,
                  },
                ]}
              >
                {policeVerificationStatus}
              </Text>
            </View>
          </View>

          {validDocumentUri && (
            <TouchableOpacity
              style={[styles.viewMediaBtn, { marginTop: 12 }]}
              onPress={() =>
                openViewer(`${idProofType} Document`, validDocumentUri)
              }
            >
              <Ionicons
                name="document-text-outline"
                size={15}
                color={THEME.colors.successText}
              />
              <Text
                style={[
                  styles.viewMediaBtnText,
                  { color: THEME.colors.successText },
                ]}
              >
                View Uploaded {idProofType}
              </Text>
              <Ionicons
                name="eye-outline"
                size={15}
                color={THEME.colors.successText}
              />
            </TouchableOpacity>
          )}
        </View>

        {/* Emergency Contact */}
        {emergencyPhone ? (
          <View style={[styles.card, styles.emergencyCard]}>
            <View style={styles.emergencyHeaderRow}>
              <Ionicons
                name="warning-outline"
                size={15}
                color={THEME.colors.dangerText}
              />
              <Text style={styles.emergencyCardTitle}>
                Emergency Contact ({emergencyRelation})
              </Text>
            </View>
            <View style={styles.contactRow}>
              <View style={styles.infoContent}>
                <Text style={styles.infoValue}>{emergencyPhone}</Text>
              </View>
              <TouchableOpacity
                style={[
                  styles.actionBtnCircle,
                  { backgroundColor: "#EF444415" },
                ]}
                onPress={() => handlePhoneCall(emergencyPhone)}
              >
                <Ionicons
                  name="call"
                  size={15}
                  color={THEME.colors.dangerText}
                />
              </TouchableOpacity>
            </View>
          </View>
        ) : null}

        {/* Action Controls */}
        <View style={styles.adminActionSection}>
          <TouchableOpacity
            style={[
              styles.deactivateBtn,
              {
                backgroundColor:
                  currentStatus === TenantStatusEnum.ACTIVE
                    ? "#EF444415"
                    : "#10B98115",
                borderColor:
                  currentStatus === TenantStatusEnum.ACTIVE
                    ? THEME.colors.dangerText
                    : THEME.colors.successText,
              },
            ]}
            onPress={handleToggleStatus}
            disabled={isUpdatingStatus}
            activeOpacity={0.8}
          >
            {isUpdatingStatus ? (
              <ActivityIndicator
                size="small"
                color={
                  currentStatus === TenantStatusEnum.ACTIVE
                    ? THEME.colors.dangerText
                    : THEME.colors.successText
                }
              />
            ) : (
              <>
                <Ionicons
                  name="swap-horizontal-outline"
                  size={18}
                  color={
                    currentStatus === TenantStatusEnum.ACTIVE
                      ? THEME.colors.dangerText
                      : THEME.colors.successText
                  }
                />
                <Text
                  style={[
                    styles.deactivateBtnText,
                    {
                      color:
                        currentStatus === TenantStatusEnum.ACTIVE
                          ? THEME.colors.dangerText
                          : THEME.colors.successText,
                    },
                  ]}
                >
                  {currentStatus === TenantStatusEnum.ACTIVE
                    ? "Switch to Inactive / Vacate Bed"
                    : "Set Resident Active"}
                </Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.deleteButton}
            onPress={handleDelete}
            disabled={isDeleting}
            activeOpacity={0.8}
          >
            {isDeleting ? (
              <ActivityIndicator size="small" color={THEME.colors.dangerText} />
            ) : (
              <>
                <Ionicons
                  name="trash-outline"
                  size={16}
                  color={THEME.colors.dangerText}
                />
                <Text style={styles.deleteBtnText}>Delete Record</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Fullscreen Viewer Modal */}
      <Modal visible={viewerState.visible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{viewerState.title}</Text>
            <TouchableOpacity
              style={styles.modalCloseBtn}
              onPress={() =>
                setViewerState({ visible: false, title: "", uri: null })
              }
            >
              <Ionicons
                name="close"
                size={22}
                color={THEME.colors.textPrimary}
              />
            </TouchableOpacity>
          </View>
          <View style={styles.modalImageContainer}>
            {viewerState.uri ? (
              <Image
                source={{ uri: viewerState.uri }}
                style={styles.modalImage}
                resizeMode="contain"
              />
            ) : null}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: THEME.colors.bgDark },
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
  scrollContent: { paddingHorizontal: 20, paddingBottom: 40 },
  profileCard: {
    backgroundColor: THEME.colors.cardBg,
    borderRadius: THEME.radius.lg,
    padding: 22,
    alignItems: "center",
    marginTop: 8,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  avatarContainer: { position: "relative", marginBottom: 10 },
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
  avatarText: { color: "#FFFFFF", fontSize: 24, fontWeight: "700" },
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
  locationBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#38BDF815",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 6,
    borderWidth: 1,
    borderColor: "#38BDF830",
  },
  vacatedLocationBadge: {
    backgroundColor: "#EF444415",
    borderColor: "#EF444430",
  },
  locationBadgeText: {
    color: THEME.colors.accent,
    fontSize: 12,
    fontWeight: "600",
    marginLeft: 5,
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
  statusIndicator: { flexDirection: "row", alignItems: "center" },
  statusDot: { width: 6, height: 6, borderRadius: 3, marginRight: 6 },
  statusText: { fontSize: 12, fontWeight: "600" },
  changeStatusBtnInline: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    minWidth: 90,
    alignItems: "center",
    justifyContent: "center",
  },
  changeStatusBtnText: { fontSize: 11, fontWeight: "700" },
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
  card: {
    backgroundColor: THEME.colors.cardBg,
    borderRadius: THEME.radius.lg,
    padding: 16,
    marginTop: 12,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  emergencyCard: { borderColor: "#EF444430", backgroundColor: "#EF444405" },
  emergencyHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 10,
  },
  emergencyCardTitle: {
    color: THEME.colors.dangerText,
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
  contactActions: { flexDirection: "row", gap: 8 },
  actionBtnCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: THEME.colors.bgDark,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    justifyContent: "center",
    alignItems: "center",
  },
  gridRow: { flexDirection: "row", justifyContent: "space-between", gap: 10 },
  gridItem: { flex: 1 },
  infoLabel: { color: THEME.colors.textMuted, fontSize: 11, fontWeight: "500" },
  infoValue: {
    color: THEME.colors.textPrimary,
    fontSize: 14,
    fontWeight: "600",
    marginTop: 2,
  },
  infoContent: { flex: 1 },
  iconWrapper: {
    width: 34,
    height: 34,
    borderRadius: THEME.radius.sm,
    backgroundColor: THEME.colors.bgDark,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  infoRow: { flexDirection: "row", alignItems: "center" },
  divider: {
    height: 1,
    backgroundColor: THEME.colors.border,
    marginVertical: 10,
  },
  viewMediaBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#10B98110",
    borderWidth: 1,
    borderColor: "#10B98130",
    borderRadius: THEME.radius.sm,
    padding: 12,
  },
  viewMediaBtnText: { fontWeight: "600", fontSize: 13, flex: 1, marginLeft: 8 },
  adminActionSection: { marginTop: 20, gap: 10 },
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
  deactivateBtnText: { fontWeight: "700", fontSize: 13 },
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
    color: THEME.colors.dangerText,
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
  modalImage: { width: "100%", height: "100%" },
});
