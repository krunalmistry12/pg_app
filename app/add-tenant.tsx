import Ionicons from "@expo/vector-icons/Ionicons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
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
import {
  createTenantApi,
  CreateTenantPayload,
  updateTenantApi,
} from "@/src/services/tenantApi";
import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from "../src/constants/theme";
import { commonStyles } from "../src/styles/commonStyles";

type AllocationType = "FULL_FLAT" | "ROOM" | "BED";
type PoliceVerificationStatus =
  | "NOT_STARTED"
  | "IN_PROGRESS"
  | "VERIFIED"
  | "REJECTED";

interface Attachment {
  uri: string;
  type: "image" | "document";
  name: string;
}

interface Bed {
  id?: string | number;
  bedId?: string | number;
  bedNumber?: string;
  bedNo?: string;
  rent?: number;
  bedRent?: number;
  isOccupied?: boolean;
  status?: number;
  tenantName?: string;
  currentTenant?: string;
}

interface Room {
  id?: string | number;
  zoneId?: string | number;
  roomId?: string | number;
  zoneName?: string;
  roomName?: string;
  name?: string;
  rent?: number;
  roomRent?: number;
  capacity?: number;
  isOccupied?: boolean;
  status?: number;
  tenantName?: string;
  currentTenant?: string;
  beds?: Bed[];
  bedBreakup?: Bed[];
  zoneBeds?: Bed[];
  roomBeds?: Bed[];
}

interface Flat {
  id: string | number;
  flatId?: string | number;
  apartmentName: string;
  flatNumber: string;
  pricingType: string;
  totalFlatExpectedRent?: number;
  totalBeds?: number;
  vacantBeds?: number;
  totalRooms?: number;
  isOccupied?: boolean;
  status?: number;
  tenantName?: string;
  currentTenant?: string;
  zones?: Room[];
  roomBreakup?: Room[];
}

// 🛠️ Safe entity ID comparison helper to eliminate type mismatch bugs
const areEntitiesEqual = (id1: any, id2: any): boolean => {
  if (id1 === undefined || id1 === null || id2 === undefined || id2 === null)
    return false;
  return String(id1) === String(id2);
};

const getEntityId = (item: any): string => {
  if (!item) return "";
  const candidates = [
    item.id,
    item.zoneId,
    item.roomId,
    item.bedId,
    item.flatId,
    item.uuid,
    item._id,
  ];
  for (const cand of candidates) {
    if (cand !== undefined && cand !== null && cand !== "") {
      return String(cand);
    }
  }
  return "";
};

export default function AddTenantScreen() {
  const params = useLocalSearchParams();

  // Edit Mode Checking
  const isEditing = params.isEditing === "true";
  const parsedTenantData = useMemo(() => {
    if (params.tenantData && typeof params.tenantData === "string") {
      try {
        return JSON.parse(params.tenantData);
      } catch {
        return null;
      }
    }
    return null;
  }, [params]);

  // Current Tenant's existing bed ID for edit mode validation bypass
  const currentTenantBedId = isEditing ? parsedTenantData?.bedId : null;

  // Tenant Details
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [emergencyPhone, setEmergencyPhone] = useState("");

  // Financial & Lease Details
  const [deposit, setDeposit] = useState("");
  const [advancePaid, setAdvancePaid] = useState("");
  const [dueDate, setDueDate] = useState("5");
  const [startingMeterReading, setStartingMeterReading] = useState("");
  const [lockInPeriodMonths, setLockInPeriodMonths] = useState("6");
  const [paymentMethod, setPaymentMethod] = useState("UPI");

  // ID & Verification Details
  const [idProofType, setIdProofType] = useState("AADHAAR");
  const [idProofNumber, setIdProofNumber] = useState("");
  const [policeVerificationStatus, setPoliceVerificationStatus] =
    useState<PoliceVerificationStatus>("NOT_STARTED");

  const [loading, setLoading] = useState(false);

  // Flats State
  const [flats, setFlats] = useState<Flat[]>([]);
  const [loadingFlats, setLoadingFlats] = useState(false);

  // Selection States
  const [selectedFlat, setSelectedFlat] = useState<Flat | null>(null);
  const [allocationType, setAllocationType] =
    useState<AllocationType>("FULL_FLAT");
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [selectedBed, setSelectedBed] = useState<Bed | null>(null);

  // Attachments
  const [idProof, setIdProof] = useState<Attachment | null>(null);
  const [tenantPhoto, setTenantPhoto] = useState<Attachment | null>(null);

  useEffect(() => {
    fetchFlatsData();

    if (isEditing && parsedTenantData) {
      setName(parsedTenantData.name || "");
      setPhone(parsedTenantData.phone || "");
      setEmail(parsedTenantData.email || "");
      setEmergencyPhone(parsedTenantData.emergencyPhone || "");
      setDeposit(
        parsedTenantData.deposit ? String(parsedTenantData.deposit) : "",
      );
      setAdvancePaid(
        parsedTenantData.advancePaid
          ? String(parsedTenantData.advancePaid)
          : "",
      );
      setDueDate(
        parsedTenantData.dueDate ? String(parsedTenantData.dueDate) : "5",
      );
      setStartingMeterReading(
        parsedTenantData.startingMeterReading
          ? String(parsedTenantData.startingMeterReading)
          : "",
      );
      setLockInPeriodMonths(
        parsedTenantData.lockInPeriodMonths
          ? String(parsedTenantData.lockInPeriodMonths)
          : "6",
      );
      setPaymentMethod(parsedTenantData.paymentMethod || "UPI");
      setIdProofType(parsedTenantData.idProofType || "AADHAAR");
      setIdProofNumber(parsedTenantData.idProofNumber || "");
      setPoliceVerificationStatus(
        parsedTenantData.policeVerificationStatus || "NOT_STARTED",
      );

      const typeMapping: Record<number, AllocationType> = {
        1: "FULL_FLAT",
        2: "ROOM",
        3: "BED",
      };
      if (parsedTenantData.allocationType) {
        setAllocationType(
          typeMapping[parsedTenantData.allocationType] || "FULL_FLAT",
        );
      }
    }
  }, []);

  // =========================================================
  // BOOKING / AVAILABILITY HELPERS
  // =========================================================

  const isBedOccupied = (bed: Bed): boolean => {
    // Agar ye wahi bed hai jo is tenant ke paas pehle se allocated tha, toh occupied mat maano
    if (currentTenantBedId && areEntitiesEqual(bed.id || bed.bedId, currentTenantBedId)) {
      return false;
    }
    return bed.isOccupied === true || bed.status === 2;
  };

  const getRoomBeds = (room: Room | null): Bed[] => {
    if (!room) return [];

    const actualBeds =
      room.beds || room.bedBreakup || room.zoneBeds || room.roomBeds || [];

    if (actualBeds.length > 0) {
      return actualBeds.map((bed, index) => ({
        ...bed,
        id: bed.id ?? bed.bedId ?? index + 1,
      }));
    }

    if (room.capacity && room.capacity > 0) {
      const perBedRent = Math.round(
        (room.roomRent || room.rent || 0) / room.capacity,
      );

      return Array.from({ length: room.capacity }, (_, index) => ({
        id: index + 1,
        bedId: index + 1,
        bedNumber: `Bed ${index + 1}`,
        bedRent: perBedRent,
        isOccupied: false,
      }));
    }

    return [];
  };

  const isRoomFullyBooked = (room: Room): boolean => {
    const beds = getRoomBeds(room);
    if (room.isOccupied === true || room.status === 2) return true;
    if (beds.length === 0) return false;
    return beds.every(isBedOccupied);
  };

  const isRoomPartiallyBooked = (room: Room): boolean => {
    const beds = getRoomBeds(room);
    if (beds.length === 0) return false;
    const occupiedCount = beds.filter(isBedOccupied).length;
    return occupiedCount > 0 && occupiedCount < beds.length;
  };

  const getAvailableBedCount = (room: Room): number => {
    return getRoomBeds(room).filter((bed) => !isBedOccupied(bed)).length;
  };

  const isFlatFullyBooked = (flat: Flat): boolean => {
    const rooms = flat.roomBreakup || flat.zones || [];
    if (rooms.length === 0) return false;
    return rooms.every((room) => isRoomFullyBooked(room));
  };

  const isFlatPartiallyOrFullyBooked = (flat: Flat): boolean => {
    const rooms = flat.roomBreakup || flat.zones || [];
    return rooms.some((room) => {
      if (room.isOccupied === true || room.status === 2) return true;
      return getRoomBeds(room).some(isBedOccupied);
    });
  };

  const getAvailableRooms = (flat: Flat | null): Room[] => {
    if (!flat) return [];
    const rawRooms = flat.roomBreakup || flat.zones || [];
    return rawRooms.map((room, index) => ({
      ...room,
      id: room.id || room.zoneId || room.roomId || index + 1,
    }));
  };

  const fetchFlatsData = async () => {
    try {
      setLoadingFlats(true);
      const storedUserId = await AsyncStorage.getItem("userId");

      if (!storedUserId) {
        Alert.alert(
          "Authentication Error",
          "User ID not found. Please log in again.",
        );
        return;
      }

      const response = await api.get(`/Flats/user/${storedUserId}`);
      const responseData = response.data;
      const flatList: Flat[] = Array.isArray(responseData)
        ? responseData
        : responseData?.data || [];

      setFlats(flatList);

      if (flatList.length > 0) {
        let targetFlat = flatList[0];

        // 1. Handle Flat Selection in Edit Mode
        if (isEditing && parsedTenantData?.flatId) {
          const matched = flatList.find((f) =>
            areEntitiesEqual(f.id || f.flatId, parsedTenantData.flatId),
          );
          if (matched) targetFlat = matched;
        } else {
          targetFlat =
            flatList.find((f) => !isFlatFullyBooked(f)) || flatList[0];
        }

        setSelectedFlat(targetFlat);

        // 2. Handle Allocation Type properly for Edit Mode vs Normal Mode
        if (isEditing && parsedTenantData?.allocationType) {
          const rawType = parsedTenantData.allocationType;
          let resolvedType: AllocationType = "FULL_FLAT";

          if (rawType === 1 || rawType === "1" || rawType === "FULL_FLAT") {
            resolvedType = "FULL_FLAT";
          } else if (rawType === 2 || rawType === "2" || rawType === "ROOM") {
            resolvedType = "ROOM";
          } else if (rawType === 3 || rawType === "3" || rawType === "BED") {
            resolvedType = "BED";
          }
          setAllocationType(resolvedType);
        } else {
          const flatHasOccupiedUnit = isFlatPartiallyOrFullyBooked(targetFlat);
          setAllocationType(flatHasOccupiedUnit ? "BED" : "FULL_FLAT");
        }

        // 3. Handle Room Selection
        const rooms = getAvailableRooms(targetFlat);
        if (rooms.length > 0) {
          let targetRoom = rooms[0];
          if (isEditing && parsedTenantData?.roomId) {
            const matchedRoom = rooms.find((r) =>
              areEntitiesEqual(
                r.id || r.zoneId || r.roomId,
                parsedTenantData.roomId,
              ),
            );
            if (matchedRoom) targetRoom = matchedRoom;
          } else {
            targetRoom =
              rooms.find((room) => !isRoomFullyBooked(room)) || rooms[0];
          }
          setSelectedRoom(targetRoom);

          // 4. Handle Bed Selection
          if (isEditing && parsedTenantData?.bedId) {
            const beds = getRoomBeds(targetRoom);
            const matchedBed = beds.find((b) =>
              areEntitiesEqual(b.id || b.bedId, parsedTenantData.bedId),
            );
            if (matchedBed) setSelectedBed(matchedBed);
          }
        }
      }
    } catch (error: any) {
      console.error("🔴 [ERROR FETCHING FLATS]:", error?.message);
      setFlats([]);
    } finally {
      setLoadingFlats(false);
    }
  };

  const handleIdProofPick = () => {
    Alert.alert("Upload ID Proof", "Choose document type or photo source", [
      { text: "Take Photo", onPress: () => openCamera("idProof") },
      {
        text: "Choose Photo from Gallery",
        onPress: () => openGallery("idProof"),
      },
      { text: "Upload File", onPress: pickDocument },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  const handlePhotoPick = () => {
    Alert.alert("Upload Tenant Photo", "Choose photo source", [
      { text: "Take Photo", onPress: () => openCamera("photo") },
      { text: "Choose from Gallery", onPress: () => openGallery("photo") },
      { text: "Cancel", style: "cancel" },
    ]);
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
    let calculated = 0;
    if (allocationType === "FULL_FLAT" && selectedFlat)
      calculated = selectedFlat.totalFlatExpectedRent || 0;
    else if (allocationType === "ROOM" && selectedRoom)
      calculated = selectedRoom.roomRent || selectedRoom.rent || 0;
    else if (allocationType === "BED" && selectedBed)
      calculated = selectedBed.bedRent || selectedBed.rent || 0;
    return calculated;
  };

  const handleCreateOrUpdateTenant = async () => {
    if (!name.trim()) {
      Alert.alert("Validation Error", "Please enter tenant name.");
      return;
    }
    if (!phone.trim() || phone.length < 10) {
      Alert.alert("Validation Error", "Please enter a valid phone number.");
      return;
    }
    if (!selectedFlat) {
      Alert.alert("Allocation Required", "Please select a flat.");
      return;
    }

    if (allocationType === "ROOM" && !selectedRoom) {
      Alert.alert("Room Required", "Please select a room for room allocation.");
      return;
    }

    if (allocationType === "BED") {
      if (!selectedRoom) {
        Alert.alert("Room Required", "Please select a room.");
        return;
      }
      if (!selectedBed) {
        Alert.alert("Bed Required", "Please select an available bed.");
        return;
      }
      if (isBedOccupied(selectedBed)) {
        Alert.alert("Bed Not Available", "This bed is already booked.");
        return;
      }
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

      const parseId = (value: any) => {
        if (value === null || value === undefined) return null;
        const parsed = Number(value);
        return isNaN(parsed) ? value : parsed;
      };

      const tenantPayload: CreateTenantPayload = {
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        emergencyPhone: emergencyPhone.trim(),
        propertyId: 1,
        flatId: parseId(selectedFlat?.id ?? selectedFlat?.flatId)!,
        roomId:
          allocationType === "FULL_FLAT"
            ? null
            : parseId(
                selectedRoom?.id ??
                  selectedRoom?.zoneId ??
                  selectedRoom?.roomId,
              ),
        bedId:
          allocationType === "BED"
            ? parseId(selectedBed?.id ?? selectedBed?.bedId)
            : null,
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
        policeVerificationStatus: policeVerificationStatus,
        status: 1,
      };

      if (isEditing) {
        const tenantId = parsedTenantData?.id || parsedTenantData?._id;
        await updateTenantApi(tenantId, tenantPayload, idProof, tenantPhoto);
        Alert.alert("Success", "Tenant updated successfully!", [
          { text: "OK", onPress: () => router.back() },
        ]);
      } else {
        await createTenantApi(tenantPayload, idProof, tenantPhoto);
        Alert.alert("Success", "Tenant added successfully!", [
          { text: "OK", onPress: () => router.back() },
        ]);
      }
    } catch (error: any) {
      console.error("🔴 [ERROR]:", error);
      const msg =
        error?.response?.data?.message || "Failed to save tenant information.";
      Alert.alert("Error", msg);
    } finally {
      setLoading(false);
    }
  };

  const currentRooms = useMemo(
    () => getAvailableRooms(selectedFlat),
    [selectedFlat],
  );
  const currentBeds = useMemo(() => getRoomBeds(selectedRoom), [selectedRoom]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={22} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <View style={styles.titleContainer}>
          <Text style={TYPOGRAPHY.headerTitle}>
            {isEditing ? "Edit Tenant" : "Add New Tenant"}
          </Text>
        </View>
        <View style={styles.headerRightPlaceholder} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Basic Information */}
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

          <View style={styles.inputGroup}>
            <Text style={TYPOGRAPHY.label}>Email Address</Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              style={commonStyles.input}
              placeholder="e.g. rahul@example.com"
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

        {/* Flat Allocation */}
        <Text style={styles.sectionHeader}>Flat Allocation</Text>
        <View style={styles.sectionCard}>
          <Text style={TYPOGRAPHY.label}>Select Flat / Apartment</Text>
          {loadingFlats ? (
            <Text style={styles.subText}>Loading flats...</Text>
          ) : flats.length === 0 ? (
            <Text style={styles.subText}>No flats found.</Text>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.horizontalScroll}
            >
              {flats.map((flat, index) => {
                const flatId = getEntityId(flat) || `flat-${index}`;
                const isSelected = areEntitiesEqual(
                  selectedFlat?.id || selectedFlat?.flatId,
                  flat.id || flat.flatId,
                );
                const isBooked = isFlatFullyBooked(flat);
                const tenantLabel = flat.tenantName || flat.currentTenant;

                return (
                  <TouchableOpacity
                    key={flatId}
                    disabled={isBooked}
                    style={[
                      styles.chip,
                      isSelected && styles.chipSelected,
                      isBooked && styles.disabledCard,
                    ]}
                    onPress={() => {
                      if (!isBooked) {
                        setSelectedFlat(flat);
                        const flatHasOccupiedUnit =
                          isFlatPartiallyOrFullyBooked(flat);
                        setAllocationType(
                          flatHasOccupiedUnit ? "BED" : "FULL_FLAT",
                        );

                        const rooms = getAvailableRooms(flat);
                        if (rooms.length > 0) {
                          const firstAvailableRoom =
                            rooms.find((room) => !isRoomFullyBooked(room)) ||
                            rooms[0];
                          setSelectedRoom(firstAvailableRoom);
                        } else {
                          setSelectedRoom(null);
                        }
                        setSelectedBed(null);
                      }
                    }}
                  >
                    <Ionicons
                      name="business-outline"
                      size={16}
                      color={
                        isBooked
                          ? COLORS.textMuted
                          : isSelected
                            ? COLORS.textWhite
                            : COLORS.textSecondary
                      }
                    />
                    <View>
                      <Text
                        style={[
                          styles.chipText,
                          isSelected && styles.chipTextSelected,
                          isBooked && styles.disabledText,
                        ]}
                      >
                        {`${flat.apartmentName} (${flat.flatNumber})`}
                      </Text>
                      {isBooked && (
                        <Text style={styles.chipBookedSub}>
                          {tenantLabel
                            ? `Booked: ${tenantLabel}`
                            : "Fully Booked"}
                        </Text>
                      )}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          )}

          {/* Allocation Type Switch */}
          {selectedFlat && !isFlatFullyBooked(selectedFlat) && (
            <View style={{ marginTop: SPACING.md }}>
              <Text style={TYPOGRAPHY.label}>Allocation Type</Text>
              <View style={styles.tabContainer}>
                {!isFlatPartiallyOrFullyBooked(selectedFlat) && (
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
                )}

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
                    Full Room
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
                  {currentRooms.length === 0 ? (
                    <Text style={styles.subText}>
                      No rooms available in this flat.
                    </Text>
                  ) : (
                    currentRooms.map((room, roomIndex) => {
                      const roomKey = getEntityId(room) || `room-${roomIndex}`;
                      const roomName =
                        room.zoneName ||
                        room.roomName ||
                        room.name ||
                        `Room ${roomIndex + 1}`;

                      const isSelected = areEntitiesEqual(
                        selectedRoom?.id ||
                          selectedRoom?.zoneId ||
                          selectedRoom?.roomId,
                        room.id || room.zoneId || room.roomId,
                      );
                      const roomRent = room.roomRent || room.rent || 0;
                      const isOccupied = isRoomFullyBooked(room);
                      const isPartiallyBooked = isRoomPartiallyBooked(room);
                      const availableBedCount = getAvailableBedCount(room);
                      const tenantLabel = room.tenantName || room.currentTenant;

                      return (
                        <TouchableOpacity
                          key={roomKey}
                          disabled={isOccupied}
                          style={[
                            styles.selectableCard,
                            isSelected && styles.selectedBorder,
                            isOccupied && styles.disabledCard,
                          ]}
                          onPress={() => {
                            if (!isOccupied) {
                              setSelectedRoom(room);
                              setSelectedBed(null);
                            }
                          }}
                        >
                          <View style={styles.cardInfoContainer}>
                            <Text
                              style={[
                                styles.itemTitle,
                                isOccupied && styles.disabledText,
                              ]}
                              numberOfLines={1}
                            >
                              {roomName}
                            </Text>
                            <Text style={styles.subText} numberOfLines={1}>
                              Rent: ₹{roomRent}/mo | Capacity:{" "}
                              {room.capacity || "N/A"}
                            </Text>
                            {isOccupied ? (
                              <Text
                                style={styles.occupiedByText}
                                numberOfLines={1}
                              >
                                {tenantLabel
                                  ? `Booked by: ${tenantLabel}`
                                  : "Room Fully Booked"}
                              </Text>
                            ) : isPartiallyBooked ? (
                              <Text style={styles.availableSubText}>
                                {availableBedCount} bed
                                {availableBedCount !== 1 ? "s" : ""} available
                              </Text>
                            ) : null}
                          </View>
                          <View style={styles.cardActionContainer}>
                            {isOccupied ? (
                              <Text style={styles.occupiedText}>
                                Fully Booked
                              </Text>
                            ) : isSelected ? (
                              <Ionicons
                                name="checkmark-circle"
                                size={22}
                                color={COLORS.accent}
                              />
                            ) : (
                              <Text style={styles.vacantText}>Select</Text>
                            )}
                          </View>
                        </TouchableOpacity>
                      );
                    })
                  )}
                </View>
              </View>
            )}

          {/* Bed Selection */}
          {selectedRoom && allocationType === "BED" && (
            <View style={{ marginTop: SPACING.sm }}>
              <Text style={TYPOGRAPHY.label}>
                Select Bed in{" "}
                {selectedRoom.zoneName || selectedRoom.roomName || "Room"}
              </Text>

              <ScrollView
                style={styles.bedsScrollContainer}
                contentContainerStyle={{ gap: SPACING.xs }}
                showsVerticalScrollIndicator={false}
              >
                {currentBeds.length === 0 ? (
                  <Text style={styles.subText}>
                    No beds available in this room.
                  </Text>
                ) : (
                  currentBeds.map((bed, bedIndex) => {
                    const bedKey = getEntityId(bed) || `bed-${bedIndex}`;
                    const isSelected = areEntitiesEqual(
                      selectedBed?.id || selectedBed?.bedId,
                      bed.id || bed.bedId,
                    );
                    const bedName =
                      bed.bedNumber || bed.bedNo || `Bed ${bedIndex + 1}`;
                    const bedRent = bed.bedRent || bed.rent || 0;
                    const isOccupied = isBedOccupied(bed);
                    const tenantLabel = bed.tenantName || bed.currentTenant;

                    return (
                      <TouchableOpacity
                        key={bedKey}
                        disabled={isOccupied}
                        style={[
                          styles.selectableCard,
                          isSelected && styles.selectedSuccessBorder,
                          isOccupied && styles.disabledCard,
                        ]}
                        onPress={() => {
                          if (!isOccupied) setSelectedBed(bed);
                        }}
                      >
                        <View style={styles.cardInfoContainer}>
                          <Text
                            style={[
                              styles.itemTitle,
                              isOccupied && styles.disabledText,
                            ]}
                            numberOfLines={1}
                          >
                            {bedName}
                          </Text>
                          <Text style={styles.subText} numberOfLines={1}>
                            ₹{bedRent} / month
                          </Text>
                          {isOccupied && tenantLabel ? (
                            <Text
                              style={styles.occupiedByText}
                              numberOfLines={1}
                            >
                              Booked by: {tenantLabel}
                            </Text>
                          ) : null}
                        </View>
                        <View style={styles.cardActionContainer}>
                          {isOccupied ? (
                            <Text style={styles.occupiedText}>Booked</Text>
                          ) : isSelected ? (
                            <Ionicons
                              name="checkmark-circle"
                              size={22}
                              color={COLORS.success}
                            />
                          ) : (
                            <Text style={styles.vacantText}>Select</Text>
                          )}
                        </View>
                      </TouchableOpacity>
                    );
                  })
                )}
              </ScrollView>
            </View>
          )}
        </View>

        {/* Financial Details */}
        <Text style={styles.sectionHeader}>Financial & Agreement Details</Text>
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

          <View style={styles.inputGroup}>
            <Text style={TYPOGRAPHY.label}>Advance Paid (₹)</Text>
            <TextInput
              value={advancePaid}
              onChangeText={setAdvancePaid}
              keyboardType="number-pad"
              style={commonStyles.input}
              placeholder="e.g. 12000"
              placeholderTextColor={COLORS.textMuted}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={TYPOGRAPHY.label}>Due Date Day of Month (1-30)</Text>
            <TextInput
              value={dueDate}
              onChangeText={setDueDate}
              keyboardType="number-pad"
              maxLength={2}
              style={commonStyles.input}
              placeholder="e.g. 5"
              placeholderTextColor={COLORS.textMuted}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={TYPOGRAPHY.label}>Starting Meter Reading (kWh)</Text>
            <TextInput
              value={startingMeterReading}
              onChangeText={setStartingMeterReading}
              keyboardType="numeric"
              style={commonStyles.input}
              placeholder="e.g. 120.5"
              placeholderTextColor={COLORS.textMuted}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={TYPOGRAPHY.label}>Lock-in Period (Months)</Text>
            <TextInput
              value={lockInPeriodMonths}
              onChangeText={setLockInPeriodMonths}
              keyboardType="number-pad"
              style={commonStyles.input}
              placeholder="e.g. 6"
              placeholderTextColor={COLORS.textMuted}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={TYPOGRAPHY.label}>Payment Method</Text>
            <View style={styles.tabContainer}>
              {["UPI", "CASH", "BANK_TRANSFER"].map((method) => (
                <TouchableOpacity
                  key={method}
                  style={[
                    styles.tabButton,
                    paymentMethod === method && styles.activeTab,
                  ]}
                  onPress={() => setPaymentMethod(method)}
                >
                  <Text
                    style={[
                      styles.tabText,
                      paymentMethod === method && styles.activeTabText,
                    ]}
                  >
                    {method.replace("_", " ")}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.rentSummary}>
            <View>
              <Text style={styles.rentSummaryLabel}>Calculated Rent</Text>
              <Text style={styles.rentSummarySub}>Based on selection</Text>
            </View>
            <Text style={styles.rentSummaryValue}>
              ₹{getCalculatedRent()}/mo
            </Text>
          </View>
        </View>

        {/* Identity Details */}
        <Text style={styles.sectionHeader}>Identity Details</Text>
        <View style={styles.sectionCard}>
          <View style={styles.inputGroup}>
            <Text style={TYPOGRAPHY.label}>ID Proof Type</Text>
            <View style={styles.tabContainer}>
              {["AADHAAR", "PAN", "PASSPORT"].map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.tabButton,
                    idProofType === type && styles.activeTab,
                  ]}
                  onPress={() => setIdProofType(type)}
                >
                  <Text
                    style={[
                      styles.tabText,
                      idProofType === type && styles.activeTabText,
                    ]}
                  >
                    {type}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.inputGroupLast}>
            <Text style={TYPOGRAPHY.label}>ID Proof Number</Text>
            <TextInput
              value={idProofNumber}
              onChangeText={setIdProofNumber}
              style={commonStyles.input}
              placeholder="e.g. ID Document Number"
              placeholderTextColor={COLORS.textMuted}
            />
          </View>
        </View>

        {/* Police Verification */}
        <Text style={styles.sectionHeader}>Police Verification</Text>
        <View style={styles.sectionCard}>
          <Text style={TYPOGRAPHY.label}>Verification Status</Text>
          <View style={styles.tabContainer}>
            {[
              { label: "Not Started", value: "NOT_STARTED" },
              { label: "In Progress", value: "IN_PROGRESS" },
              { label: "Verified", value: "VERIFIED" },
            ].map((item) => (
              <TouchableOpacity
                key={item.value}
                style={[
                  styles.tabButton,
                  policeVerificationStatus === item.value && styles.activeTab,
                ]}
                onPress={() =>
                  setPoliceVerificationStatus(
                    item.value as PoliceVerificationStatus,
                  )
                }
              >
                <Text
                  style={[
                    styles.tabText,
                    policeVerificationStatus === item.value &&
                      styles.activeTabText,
                  ]}
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Document Uploads */}
        <Text style={styles.sectionHeader}>Documents & Photos</Text>
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
                <Text style={styles.uploadSubtext}>Image or File</Text>
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

        {/* Submit Button */}
        <TouchableOpacity
          style={[commonStyles.primaryButton, styles.submitBtn]}
          activeOpacity={0.8}
          onPress={handleCreateOrUpdateTenant}
          disabled={loading}
        >
          <Text style={commonStyles.primaryButtonText}>
            {loading
              ? "Saving..."
              : isEditing
                ? "Update Tenant Details"
                : "Confirm & Add Tenant"}
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
  titleContainer: { flex: 1, alignItems: "center" },
  headerRightPlaceholder: { width: 40 },
  safeArea: { flex: 1, backgroundColor: COLORS.background },
  scrollView: { flex: 1 },
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
  inputGroup: { marginBottom: SPACING.md },
  inputGroupLast: { marginBottom: 0 },
  horizontalScroll: { marginBottom: SPACING.md },
  itemTitle: { fontSize: 14, fontWeight: "500", color: COLORS.textPrimary },
  subText: { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },
  selectedBorder: { borderColor: COLORS.accent, borderWidth: 1.5, margin: -0.5 },
  selectedSuccessBorder: { borderColor: COLORS.success, borderWidth: 1.5, margin: -0.5 },
  disabledCard: {
    opacity: 0.6,
    backgroundColor: COLORS.border + "44",
  },
  disabledText: {
    color: COLORS.textMuted,
  },
  occupiedText: {
    color: "#E53935",
    fontSize: 12,
    fontWeight: "600",
  },
  occupiedByText: {
    color: "#E53935",
    fontSize: 11,
    marginTop: 2,
    fontWeight: "500",
  },
  chipBookedSub: {
    color: "#E53935",
    fontSize: 10,
    marginTop: 2,
    fontWeight: "600",
  },
  availableSubText: {
    color: COLORS.accent,
    fontSize: 11,
    marginTop: 2,
    fontWeight: "500",
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
  bedsScrollContainer: {
    maxHeight: 220,
    marginTop: 4,
  },
  chipSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primaryHover,
  },
  chipText: { color: COLORS.textSecondary, fontSize: 13, fontWeight: "500" },
  chipTextSelected: { color: COLORS.textWhite },
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
  activeTab: { backgroundColor: COLORS.primary },
  tabText: { fontSize: 12, color: COLORS.textSecondary, fontWeight: "500" },
  activeTabText: { color: COLORS.textWhite, fontWeight: "600" },
  selectableCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: COLORS.background,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: "hidden",
  },
  cardInfoContainer: {
    flex: 1,
    marginRight: SPACING.sm,
  },
  cardActionContainer: {
    minWidth: 60,
    alignItems: "flex-end",
  },
  vacantText: { color: COLORS.accent, fontSize: 12, fontWeight: "600" },
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
  rentSummarySub: { fontSize: 11, color: COLORS.textMuted },
  rentSummaryValue: { fontSize: 18, fontWeight: "700", color: COLORS.accent },
  uploadCard: {
    backgroundColor: COLORS.surface,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderStyle: "dashed",
    borderRadius: RADIUS.lg,
    height: 110,
    justifyContent: "center",
    alignItems: "center",
  },
  uploadTitle: {
    color: COLORS.textPrimary,
    fontSize: 13,
    fontWeight: "600",
    marginTop: 4,
  },
  uploadSubtext: { color: COLORS.textMuted, fontSize: 11 },
  previewContainer: {
    height: 110,
    borderRadius: RADIUS.lg,
    overflow: "hidden",
    position: "relative",
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  previewImage: { width: "100%", height: "100%" },
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
  submitBtn: { marginTop: SPACING.md, marginBottom: SPACING.xl },
});