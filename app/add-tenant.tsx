import Ionicons from "@expo/vector-icons/Ionicons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Image,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import api from "@/src/services/api";
import { createTenantApi, CreateTenantPayload } from "@/src/services/tenantApi";
import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from "../src/constants/theme";
import { commonStyles } from "../src/styles/commonStyles";

type AllocationType = "FULL_FLAT" | "ROOM" | "BED";

interface Attachment {
  uri: string;
  type: "image" | "document";
  name: string;
}

interface Bed {
  id: string;
  bedNo: string;
  rent: number;
  isOccupied?: boolean;
}

interface Room {
  id: string;
  roomName: string;
  rent: number;
  isOccupied?: boolean;
  beds: Bed[];
}

interface Flat {
  id: string;
  flatNo: string;
  type: string;
  fullFlatRent: number;
  isOccupied?: boolean;
  rooms: Room[];
}

interface Property {
  id: string;
  name: string;
  flats: Flat[];
}

export default function AddTenantScreen() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [emergencyPhone, setEmergencyPhone] = useState("");
  const [deposit, setDeposit] = useState("");
  const [advancePaid, setAdvancePaid] = useState("");
  const [dueDate] = useState("5");
  const [lockInPeriodMonths, setLockInPeriodMonths] = useState("6");
  const [startingMeterReading, setStartingMeterReading] = useState("");
  const [idProofType, setIdProofType] = useState("AADHAAR");
  const [idProofNumber, setIdProofNumber] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("UPI");
  const [loading, setLoading] = useState(false);

  // Dynamic Properties & Flats State
  const [properties, setProperties] = useState<Property[]>([]);
  const [loadingProperties, setLoadingProperties] = useState(false);

  // Selection Hierarchy States
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(
    null,
  );
  const [selectedFlat, setSelectedFlat] = useState<Flat | null>(null);
  const [allocationType, setAllocationType] =
    useState<AllocationType>("FULL_FLAT");
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [selectedBed, setSelectedBed] = useState<Bed | null>(null);

  // Attachments
  const [idProof, setIdProof] = useState<Attachment | null>(null);
  const [tenantPhoto, setTenantPhoto] = useState<Attachment | null>(null);

  // Fetch Properties, Flats, Rooms & Beds on Mount
  useEffect(() => {
    fetchPropertiesData();
  }, []);

  // Fetch Flats Data on Mount
  const fetchPropertiesData = async () => {
    try {
      setLoadingProperties(true);
      const storedUserId = await AsyncStorage.getItem("userId");

      if (!storedUserId) {
        Alert.alert(
          "Authentication Error",
          "User ID not found. Please log in again.",
        );
        return;
      }

      // Swagger ke mutabiq correct endpoint
      const response = await api.get(`/Flats/user/${storedUserId}`);
      const responseData = response.data;

      const flatList = Array.isArray(responseData)
        ? responseData
        : responseData?.flats || responseData?.data || [];

      // Agar aapka backend direct flats ki list deta hai
      setProperties(flatList); // Yahan state variable ko flats ke hisaab se map kar sakte hain
      if (flatList.length > 0) {
        setSelectedFlat(flatList[0]); // Seedha flat select ho jayega
      }
    } catch (error: any) {
      console.error("Error fetching flats:", error?.message);
      setProperties([]);
    } finally {
      setLoadingProperties(false);
    }
  };

  const handleIdProofPick = () => {
    Alert.alert(
      "Upload ID Proof",
      "Choose document type or photo source",
      [
        { text: "Take Photo", onPress: () => openCamera("idProof") },
        {
          text: "Choose Photo from Gallery",
          onPress: () => openGallery("idProof"),
        },
        { text: "Upload CAN / PDF File", onPress: pickDocument },
        { text: "Cancel", style: "cancel" },
      ],
      { cancelable: true },
    );
  };

  const handlePhotoPick = () => {
    Alert.alert(
      "Upload Tenant Photo",
      "Choose photo source",
      [
        { text: "Take Photo", onPress: () => openCamera("photo") },
        { text: "Choose from Gallery", onPress: () => openGallery("photo") },
        { text: "Cancel", style: "cancel" },
      ],
      { cancelable: true },
    );
  };

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["application/pdf", "image/*"],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const file = result.assets[0];
        setIdProof({
          uri: file.uri,
          type: "document",
          name: file.name || "ID_Proof_Document.pdf",
        });
      }
    } catch {
      Alert.alert("Error", "Failed to select document.");
    }
  };

  const openCamera = async (target: "idProof" | "photo") => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Permission Required", "Camera access is required.");
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.7,
    });

    if (!result.canceled && result.assets && result.assets[0]) {
      const attachment: Attachment = {
        uri: result.assets[0].uri,
        type: "image",
        name: target === "idProof" ? "ID_Proof_Image.jpg" : "Tenant_Photo.jpg",
      };
      if (target === "idProof") setIdProof(attachment);
      else setTenantPhoto(attachment);
    }
  };

  const openGallery = async (target: "idProof" | "photo") => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Permission Required", "Gallery access is required.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.7,
    });

    if (!result.canceled && result.assets && result.assets[0]) {
      const attachment: Attachment = {
        uri: result.assets[0].uri,
        type: "image",
        name: target === "idProof" ? "ID_Proof_Image.jpg" : "Tenant_Photo.jpg",
      };
      if (target === "idProof") setIdProof(attachment);
      else setTenantPhoto(attachment);
    }
  };

  const getCalculatedRent = (): number => {
    if (allocationType === "FULL_FLAT" && selectedFlat)
      return selectedFlat.fullFlatRent;
    if (allocationType === "ROOM" && selectedRoom) return selectedRoom.rent;
    if (allocationType === "BED" && selectedBed) return selectedBed.rent;
    return 0;
  };

  const handleCreateTenant = async () => {
    if (!name.trim()) {
      Alert.alert("Validation Error", "Please enter tenant name.");
      return;
    }
    if (!phone.trim() || phone.length < 10) {
      Alert.alert("Validation Error", "Please enter a valid phone number.");
      return;
    }
    if (!selectedProperty || !selectedFlat) {
      Alert.alert("Allocation Required", "Please select a property and flat.");
      return;
    }
    if (allocationType === "ROOM" && !selectedRoom) {
      Alert.alert("Allocation Required", "Please select a room.");
      return;
    }
    if (allocationType === "BED" && (!selectedRoom || !selectedBed)) {
      Alert.alert("Allocation Required", "Please select a room and bed.");
      return;
    }

    setLoading(true);

    try {
      const joiningDate = new Date();
      const lockInMonths = parseInt(lockInPeriodMonths) || 6;
      const agreementEndDate = new Date(joiningDate);
      agreementEndDate.setMonth(agreementEndDate.getMonth() + lockInMonths);

      const getAllocationTypeCode = (type: string): number => {
        switch (type) {
          case "FULL_FLAT":
            return 1;
          case "ROOM":
            return 2;
          case "BED":
            return 3;
          default:
            return 1;
        }
      };

      const tenantPayload: CreateTenantPayload = {
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        emergencyPhone: emergencyPhone.trim(),
        propertyId: Number(selectedProperty.id) || 1,
        flatId: selectedFlat.id,
        roomId: selectedRoom ? selectedRoom.id : null,
        bedId: selectedBed ? selectedBed.id : null,
        allocationType: getAllocationTypeCode(allocationType),
        rent: getCalculatedRent(),
        deposit: Number(deposit) || 0,
        advancePaid: Number(advancePaid) || 0,
        dueDate: Number(dueDate) || 5,
        paymentMethod: paymentMethod,
        startingMeterReading: Number(startingMeterReading) || 0,
        lockInPeriodMonths: lockInMonths,
        joiningDate: joiningDate.toISOString(),
        agreementEndDate: agreementEndDate.toISOString(),
        idProofType: idProofType,
        idProofNumber: idProofNumber.trim(),
        policeVerificationStatus: "NOT_STARTED",
        status: 1,
      };

      await createTenantApi(tenantPayload, idProof, tenantPhoto);

      Alert.alert("Success", "Tenant added successfully!", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (error: any) {
      console.error(error);
      const msg =
        error?.response?.data?.message || "Failed to save tenant information.";
      Alert.alert("Error", msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />

      {/* Fixed Header Bar */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={22} color={COLORS.textPrimary} />
        </TouchableOpacity>

        <View style={styles.titleContainer}>
          <Text style={TYPOGRAPHY.headerTitle}>Add New Tenant</Text>
        </View>

        <View style={styles.headerRightPlaceholder} />
      </View>

      {/* Scrollable Form Body */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Basic Info Section */}
        <Text style={styles.sectionHeader}>Basic Information</Text>
        <View style={styles.sectionCard}>
          <View style={styles.inputGroup}>
            <Text style={TYPOGRAPHY.label}>Full Name *</Text>
            <TextInput
              value={name}
              onChangeText={setName}
              style={commonStyles.input}
              placeholder="e.g. Rahul Sharma"
              placeholderTextColor={COLORS.textMuted}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={TYPOGRAPHY.label}>Phone Number *</Text>
            <TextInput
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              maxLength={10}
              style={commonStyles.input}
              placeholder="e.g. 9876543210"
              placeholderTextColor={COLORS.textMuted}
            />
          </View>

          <View style={styles.inputGroupLast}>
            <Text style={TYPOGRAPHY.label}>Emergency Contact (Optional)</Text>
            <TextInput
              value={emergencyPhone}
              onChangeText={setEmergencyPhone}
              keyboardType="phone-pad"
              maxLength={10}
              style={commonStyles.input}
              placeholder="Parent/Guardian Contact"
              placeholderTextColor={COLORS.textMuted}
            />
          </View>
        </View>

        {/* Property & Flat Allocation */}
        <Text style={styles.sectionHeader}>Property & Flat Allocation</Text>

        <View style={styles.sectionCard}>
          <Text style={TYPOGRAPHY.label}>Select Property</Text>
          {loadingProperties ? (
            <Text style={styles.subText}>Loading properties...</Text>
          ) : properties.length === 0 ? (
            <Text style={styles.subText}>No properties found.</Text>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.horizontalScroll}
            >
              {properties.map((prop) => {
                const isSelected = selectedProperty?.id === prop.id;
                return (
                  <TouchableOpacity
                    key={prop.id}
                    style={[styles.chip, isSelected && styles.chipSelected]}
                    onPress={() => {
                      setSelectedProperty(prop);
                      setSelectedFlat(null);
                      setSelectedRoom(null);
                      setSelectedBed(null);
                    }}
                  >
                    <Ionicons
                      name="business-outline"
                      size={16}
                      color={
                        isSelected ? COLORS.textWhite : COLORS.textSecondary
                      }
                    />
                    <Text
                      style={[
                        styles.chipText,
                        isSelected && styles.chipTextSelected,
                      ]}
                    >
                      {prop.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          )}

          <Text style={TYPOGRAPHY.label}>Select Flat</Text>
          {selectedProperty && selectedProperty.flats ? (
            <View style={{ gap: SPACING.xs }}>
              {selectedProperty.flats.map((flat) => {
                const isSelected = selectedFlat?.id === flat.id;
                return (
                  <TouchableOpacity
                    key={flat.id}
                    disabled={flat.isOccupied}
                    style={[
                      styles.flatCard,
                      isSelected && styles.selectedBorder,
                      flat.isOccupied && styles.disabledCard,
                    ]}
                    onPress={() => {
                      setSelectedFlat(flat);
                      setSelectedRoom(null);
                      setSelectedBed(null);
                    }}
                  >
                    <View style={styles.flatHeader}>
                      <Text style={styles.flatTitle}>
                        {flat.flatNo} ({flat.type})
                      </Text>
                      <Text style={styles.badgeText}>
                        ₹{flat.fullFlatRent}/mo
                      </Text>
                    </View>
                    <Text style={styles.subText}>
                      {flat.isOccupied
                        ? "Status: Occupied"
                        : "Status: Available"}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          ) : (
            <Text style={styles.subText}>Please select a property first.</Text>
          )}

          {/* Allocation Type Selection */}
          {selectedFlat && (
            <View style={{ marginTop: SPACING.md }}>
              <Text style={TYPOGRAPHY.label}>Allocation Type</Text>
              <View style={styles.tabContainer}>
                <TouchableOpacity
                  style={[
                    styles.tabButton,
                    allocationType === "FULL_FLAT" && styles.activeTab,
                  ]}
                  onPress={() => {
                    setAllocationType("FULL_FLAT");
                    setSelectedRoom(null);
                    setSelectedBed(null);
                  }}
                >
                  <Text
                    style={[
                      styles.tabText,
                      allocationType === "FULL_FLAT" && styles.activeTabText,
                    ]}
                  >
                    Full Flat
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.tabButton,
                    allocationType === "ROOM" && styles.activeTab,
                  ]}
                  onPress={() => {
                    setAllocationType("ROOM");
                    setSelectedBed(null);
                  }}
                >
                  <Text
                    style={[
                      styles.tabText,
                      allocationType === "ROOM" && styles.activeTabText,
                    ]}
                  >
                    Single Room
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.tabButton,
                    allocationType === "BED" && styles.activeTab,
                  ]}
                  onPress={() => setAllocationType("BED")}
                >
                  <Text
                    style={[
                      styles.tabText,
                      allocationType === "BED" && styles.activeTabText,
                    ]}
                  >
                    Bed
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Room Selection */}
          {selectedFlat &&
            (allocationType === "ROOM" || allocationType === "BED") && (
              <View style={{ marginTop: SPACING.sm }}>
                <Text style={TYPOGRAPHY.label}>Select Room</Text>
                <View style={{ gap: SPACING.xs }}>
                  {selectedFlat.rooms?.map((room) => {
                    const isSelected = selectedRoom?.id === room.id;
                    return (
                      <TouchableOpacity
                        key={room.id}
                        disabled={room.isOccupied}
                        style={[
                          styles.selectableCard,
                          isSelected && styles.selectedBorder,
                          room.isOccupied && styles.disabledCard,
                        ]}
                        onPress={() => {
                          setSelectedRoom(room);
                          setSelectedBed(null);
                        }}
                      >
                        <View>
                          <Text style={styles.itemTitle}>{room.roomName}</Text>
                          <Text style={styles.subText}>
                            Rent: ₹{room.rent}/month
                          </Text>
                        </View>
                        {isSelected && (
                          <Ionicons
                            name="checkmark-circle"
                            size={22}
                            color={COLORS.accent}
                          />
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            )}

          {/* Bed Selection */}
          {selectedRoom && allocationType === "BED" && (
            <View style={{ marginTop: SPACING.sm }}>
              <Text style={TYPOGRAPHY.label}>
                Select Bed in {selectedRoom.roomName}
              </Text>
              <View style={{ gap: SPACING.xs }}>
                {selectedRoom.beds?.map((bed) => {
                  const isSelected = selectedBed?.id === bed.id;
                  return (
                    <TouchableOpacity
                      key={bed.id}
                      disabled={bed.isOccupied}
                      style={[
                        styles.selectableCard,
                        isSelected && styles.selectedSuccessBorder,
                        bed.isOccupied && styles.disabledCard,
                      ]}
                      onPress={() => setSelectedBed(bed)}
                    >
                      <View>
                        <Text style={styles.itemTitle}>{bed.bedNo}</Text>
                        <Text style={styles.subText}>₹{bed.rent} / month</Text>
                      </View>

                      {bed.isOccupied ? (
                        <Text style={styles.occupiedText}>Occupied</Text>
                      ) : isSelected ? (
                        <Ionicons
                          name="checkmark-circle"
                          size={22}
                          color={COLORS.success}
                        />
                      ) : (
                        <Ionicons
                          name="ellipse-outline"
                          size={22}
                          color={COLORS.textMuted}
                        />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}
        </View>

        {/* Financial Info */}
        <Text style={styles.sectionHeader}>Financial Setup</Text>
        <View style={styles.sectionCard}>
          <View style={styles.inputGroup}>
            <Text style={TYPOGRAPHY.label}>Security Deposit (₹)</Text>
            <TextInput
              value={deposit}
              onChangeText={setDeposit}
              keyboardType="number-pad"
              style={commonStyles.input}
              placeholder="e.g. 20000"
              placeholderTextColor={COLORS.textMuted}
            />
          </View>

          <View style={styles.rentSummary}>
            <View>
              <Text style={styles.rentSummaryLabel}>Calculated Rent</Text>
              <Text style={styles.rentSummarySub}>
                Based on current selection
              </Text>
            </View>
            <Text style={styles.rentSummaryValue}>
              ₹{getCalculatedRent()}/mo
            </Text>
          </View>
        </View>

        {/* Document Uploads */}
        <Text style={styles.sectionHeader}>Documents & Proofs</Text>
        <View style={commonStyles.row}>
          <View style={commonStyles.flex1}>
            {idProof ? (
              <View style={styles.previewContainer}>
                {idProof.type === "image" ? (
                  <Image
                    source={{ uri: idProof.uri }}
                    style={styles.previewImage}
                  />
                ) : (
                  <View style={styles.documentPreview}>
                    <Ionicons
                      name="document-text"
                      size={32}
                      color={COLORS.accent}
                    />
                    <Text numberOfLines={1} style={styles.docNameText}>
                      {idProof.name}
                    </Text>
                    <Text style={styles.docTag}>CAN / PDF</Text>
                  </View>
                )}
                <TouchableOpacity
                  style={styles.removeBtn}
                  onPress={() => setIdProof(null)}
                >
                  <Ionicons name="close" size={14} color={COLORS.textWhite} />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.uploadCard}
                onPress={handleIdProofPick}
              >
                <Ionicons name="card-outline" size={26} color={COLORS.accent} />
                <Text style={styles.uploadTitle}>ID Proof</Text>
                <Text style={styles.uploadSubtext}>Image or CAN/PDF</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={commonStyles.flex1}>
            {tenantPhoto ? (
              <View style={styles.previewContainer}>
                <Image
                  source={{ uri: tenantPhoto.uri }}
                  style={styles.previewImage}
                />
                <TouchableOpacity
                  style={styles.removeBtn}
                  onPress={() => setTenantPhoto(null)}
                >
                  <Ionicons name="close" size={14} color={COLORS.textWhite} />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.uploadCard}
                onPress={handlePhotoPick}
              >
                <Ionicons
                  name="camera-outline"
                  size={26}
                  color={COLORS.accent}
                />
                <Text style={styles.uploadTitle}>Tenant Photo</Text>
                <Text style={styles.uploadSubtext}>JPG or PNG</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Primary Action Button */}
        <TouchableOpacity
          style={[commonStyles.primaryButton, styles.submitBtn]}
          activeOpacity={0.8}
          onPress={handleCreateTenant}
          disabled={loading}
        >
          <Text style={commonStyles.primaryButtonText}>
            {loading ? "Saving..." : "Confirm & Add Tenant"}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.background,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
    zIndex: 10,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surface,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  titleContainer: {
    flex: 1,
    alignItems: "center",
  },
  headerRightPlaceholder: {
    width: 40,
  },
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.xs,
    paddingBottom: SPACING.xl * 2,
  },
  sectionHeader: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
    marginTop: SPACING.xs,
  },
  sectionCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.md,
  },
  inputGroup: {
    marginBottom: SPACING.md,
  },
  inputGroupLast: {
    marginBottom: 0,
  },
  horizontalScroll: {
    marginBottom: SPACING.md,
  },
  flatCard: {
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  flatTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.textPrimary,
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: "500",
    color: COLORS.textPrimary,
  },
  subText: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  badgeText: {
    fontSize: 11,
    color: COLORS.accent,
    fontWeight: "600",
    backgroundColor: COLORS.surface,
    paddingHorizontal: SPACING.xs,
    paddingVertical: 2,
    borderRadius: RADIUS.sm,
  },
  flatHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: SPACING.xs,
  },
  selectedBorder: {
    borderColor: COLORS.accent,
    borderWidth: 1.5,
  },
  selectedSuccessBorder: {
    borderColor: COLORS.success,
    borderWidth: 1.5,
  },
  disabledCard: {
    opacity: 0.4,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.md,
    marginRight: SPACING.sm,
    gap: SPACING.xs,
  },
  chipSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primaryHover,
  },
  chipText: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontWeight: "500",
  },
  chipTextSelected: {
    color: COLORS.textWhite,
  },
  tabContainer: {
    flexDirection: "row",
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.md,
    padding: 4,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  tabButton: {
    flex: 1,
    paddingVertical: SPACING.sm,
    alignItems: "center",
    borderRadius: RADIUS.sm,
  },
  activeTab: {
    backgroundColor: COLORS.primary,
  },
  tabText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: "500",
  },
  activeTabText: {
    color: COLORS.textWhite,
    fontWeight: "600",
  },
  selectableCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: COLORS.background,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  occupiedText: {
    color: COLORS.dangerText,
    fontSize: 12,
    fontWeight: "600",
  },
  rentSummary: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  rentSummaryLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.textPrimary,
  },
  rentSummarySub: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
  rentSummaryValue: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.accent,
  },
  uploadCard: {
    backgroundColor: COLORS.surface,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderStyle: "dashed",
    borderRadius: RADIUS.lg,
    height: 110,
    justifyContent: "center",
    alignItems: "center",
    gap: 2,
  },
  uploadTitle: {
    color: COLORS.textPrimary,
    fontSize: 13,
    fontWeight: "600",
    marginTop: 4,
  },
  uploadSubtext: {
    color: COLORS.textMuted,
    fontSize: 11,
  },
  previewContainer: {
    height: 110,
    borderRadius: RADIUS.lg,
    overflow: "hidden",
    position: "relative",
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  previewImage: {
    width: "100%",
    height: "100%",
  },
  documentPreview: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: SPACING.xs,
  },
  docNameText: {
    fontSize: 11,
    color: COLORS.textPrimary,
    fontWeight: "500",
    marginTop: 4,
    paddingHorizontal: 8,
  },
  docTag: {
    fontSize: 10,
    color: COLORS.accent,
    fontWeight: "700",
    marginTop: 2,
  },
  removeBtn: {
    position: "absolute",
    top: 6,
    right: 6,
    backgroundColor: "rgba(0,0,0,0.6)",
    width: 24,
    height: 24,
    borderRadius: RADIUS.full,
    justifyContent: "center",
    alignItems: "center",
  },
  submitBtn: {
    marginTop: SPACING.md,
    marginBottom: SPACING.xl,
  },
});
