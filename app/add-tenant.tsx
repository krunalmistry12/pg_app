import Ionicons from "@expo/vector-icons/Ionicons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  Image,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

interface Bed {
  id: number;
  bedNo: string;
  rent: number;
}

interface Room {
  id: number;
  roomNo: string;
  availableBeds: Bed[];
}

const rooms: Room[] = [
  {
    id: 1,
    roomNo: "101",
    availableBeds: [{ id: 1, bedNo: "A4", rent: 6500 }],
  },
  {
    id: 2,
    roomNo: "201",
    availableBeds: [
      { id: 2, bedNo: "A2", rent: 7000 },
      { id: 3, bedNo: "A3", rent: 7000 },
    ],
  },
];

export default function AddTenantScreen() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [emergencyPhone, setEmergencyPhone] = useState("");
  const [deposit, setDeposit] = useState("");
  const [dueDate, setDueDate] = useState("5th of every month");
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [selectedBed, setSelectedBed] = useState<Bed | null>(null);

  // Attachment URIs
  const [aadhaarImage, setAadhaarImage] = useState<string | null>(null);
  const [tenantPhoto, setTenantPhoto] = useState<string | null>(null);

  // Helper function to show options (Camera vs Gallery)
  const handleImagePick = (type: "aadhaar" | "photo") => {
    Alert.alert(
      "Upload Document",
      "Choose an option to upload",
      [
        {
          text: "Take Photo (Camera)",
          onPress: () => openCamera(type),
        },
        {
          text: "Choose from Gallery",
          onPress: () => openGallery(type),
        },
        {
          text: "Cancel",
          style: "cancel",
        },
      ],
      { cancelable: true },
    );
  };

  // Open Camera
  const openCamera = async (type: "aadhaar" | "photo") => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(
        "Permission Required",
        "Camera access is required to take photos.",
      );
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.7,
    });

    if (!result.canceled && result.assets[0].uri) {
      if (type === "aadhaar") {
        setAadhaarImage(result.assets[0].uri);
      } else {
        setTenantPhoto(result.assets[0].uri);
      }
    }
  };

  // Open Gallery
  const openGallery = async (type: "aadhaar" | "photo") => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(
        "Permission Required",
        "Gallery access is required to select photos.",
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.7,
    });

    if (!result.canceled && result.assets[0].uri) {
      if (type === "aadhaar") {
        setAadhaarImage(result.assets[0].uri);
      } else {
        setTenantPhoto(result.assets[0].uri);
      }
    }
  };

  const handleCreateTenant = async () => {
    if (!name.trim()) {
      Alert.alert("Validation Error", "Please enter tenant name");
      return;
    }
    if (!phone.trim() || phone.length < 10) {
      Alert.alert("Validation Error", "Please enter a valid phone number");
      return;
    }
    if (!selectedRoom) {
      Alert.alert("Validation Error", "Please select a room");
      return;
    }
    if (!selectedBed) {
      Alert.alert("Validation Error", "Please select a bed");
      return;
    }

    const newTenant = {
      id: Date.now().toString(),
      name,
      phone,
      emergencyContact: emergencyPhone,
      deposit,
      dueDate,
      room: selectedRoom.roomNo,
      bed: selectedBed.bedNo,
      status: "Active",
      hasAadhaar: Boolean(aadhaarImage),
      hasPhoto: Boolean(tenantPhoto),
      aadhaarImageUri: aadhaarImage || "",
      tenantPhotoUri: tenantPhoto || "",
    };

    try {
      const existing = await AsyncStorage.getItem("tenants");
      const tenants = existing ? JSON.parse(existing) : [];
      tenants.push(newTenant);
      await AsyncStorage.setItem("tenants", JSON.stringify(tenants));

      Alert.alert("Success", "Tenant created successfully", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (e) {
      Alert.alert("Error", "Failed to save tenant");
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#0F172A" />
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header Bar */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.title}>Add New Tenant</Text>
        </View>

        {/* Basic Info */}
        <Text style={styles.sectionTitle}>Basic Information</Text>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Full Name</Text>
          <View style={styles.inputWrapper}>
            <Ionicons name="person-outline" size={20} color="#94A3B8" />
            <TextInput
              value={name}
              onChangeText={setName}
              style={styles.input}
              placeholder="e.g. Rahul Sharma"
              placeholderTextColor="#64748B"
            />
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Phone Number</Text>
          <View style={styles.inputWrapper}>
            <Ionicons name="call-outline" size={20} color="#94A3B8" />
            <TextInput
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              maxLength={10}
              style={styles.input}
              placeholder="e.g. 9876543210"
              placeholderTextColor="#64748B"
            />
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Emergency Contact (Optional)</Text>
          <View style={styles.inputWrapper}>
            <Ionicons name="call-outline" size={20} color="#94A3B8" />
            <TextInput
              value={emergencyPhone}
              onChangeText={setEmergencyPhone}
              keyboardType="phone-pad"
              maxLength={10}
              style={styles.input}
              placeholder="Parent/Guardian Phone"
              placeholderTextColor="#64748B"
            />
          </View>
        </View>

        {/* Room & Bed Selection */}
        <Text style={styles.sectionTitle}>Room Allocation</Text>

        <Text style={styles.label}>Select Room</Text>
        <View style={styles.chipGrid}>
          {rooms.map((room) => {
            const isSelected = selectedRoom?.id === room.id;
            return (
              <TouchableOpacity
                key={room.id}
                style={[styles.chip, isSelected && styles.chipSelected]}
                onPress={() => {
                  setSelectedRoom(room);
                  setSelectedBed(null);
                }}
              >
                <Ionicons
                  name="business-outline"
                  size={16}
                  color={isSelected ? "#FFFFFF" : "#94A3B8"}
                />
                <Text
                  style={[
                    styles.chipText,
                    isSelected && styles.chipTextSelected,
                  ]}
                >
                  Room {room.roomNo}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {selectedRoom && (
          <>
            <Text style={styles.label}>Select Available Bed</Text>
            <View style={styles.chipGrid}>
              {selectedRoom.availableBeds.map((bed) => {
                const isSelected = selectedBed?.id === bed.id;
                return (
                  <TouchableOpacity
                    key={bed.id}
                    style={[styles.chip, isSelected && styles.chipSelected]}
                    onPress={() => setSelectedBed(bed)}
                  >
                    <Ionicons
                      name="bed-outline"
                      size={16}
                      color={isSelected ? "#FFFFFF" : "#94A3B8"}
                    />
                    <Text
                      style={[
                        styles.chipText,
                        isSelected && styles.chipTextSelected,
                      ]}
                    >
                      Bed {bed.bedNo}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </>
        )}

        {/* Financials */}
        <Text style={styles.sectionTitle}>Financials</Text>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Security Deposit (₹)</Text>
          <View style={styles.inputWrapper}>
            <Ionicons name="wallet-outline" size={20} color="#94A3B8" />
            <TextInput
              value={deposit}
              onChangeText={setDeposit}
              keyboardType="number-pad"
              style={styles.input}
              placeholder="e.g. 10000"
              placeholderTextColor="#64748B"
            />
          </View>
        </View>

        {selectedBed && (
          <View style={styles.rentCard}>
            <View>
              <Text style={styles.rentTitle}>Monthly Rent</Text>
              <Text style={styles.rentSubText}>Due: {dueDate}</Text>
            </View>
            <Text style={styles.rentAmount}>₹{selectedBed.rent}</Text>
          </View>
        )}

        {/* Verification Attachments */}
        <Text style={styles.sectionTitle}>Verification Documents</Text>

        <View style={styles.uploadRow}>
          {/* Aadhaar / ID Card Upload */}
          <View style={styles.uploadContainer}>
            {aadhaarImage ? (
              <View style={styles.previewBox}>
                <Image
                  source={{ uri: aadhaarImage }}
                  style={styles.previewImage}
                />
                <TouchableOpacity
                  style={styles.removeBadge}
                  onPress={() => setAadhaarImage(null)}
                >
                  <Ionicons name="close" size={14} color="#FFFFFF" />
                </TouchableOpacity>
                <Text style={styles.previewLabel}>Aadhaar / ID</Text>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.uploadBox}
                onPress={() => handleImagePick("aadhaar")}
              >
                <Ionicons name="card-outline" size={26} color="#38BDF8" />
                <Text style={styles.uploadText}>ID Proof / Card</Text>
                <Text style={styles.uploadSubText}>Camera / Gallery</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Tenant Photo Upload */}
          <View style={styles.uploadContainer}>
            {tenantPhoto ? (
              <View style={styles.previewBox}>
                <Image
                  source={{ uri: tenantPhoto }}
                  style={styles.previewImage}
                />
                <TouchableOpacity
                  style={styles.removeBadge}
                  onPress={() => setTenantPhoto(null)}
                >
                  <Ionicons name="close" size={14} color="#FFFFFF" />
                </TouchableOpacity>
                <Text style={styles.previewLabel}>Tenant Photo</Text>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.uploadBox}
                onPress={() => handleImagePick("photo")}
              >
                <Ionicons name="camera-outline" size={26} color="#38BDF8" />
                <Text style={styles.uploadText}>Tenant Photo</Text>
                <Text style={styles.uploadSubText}>Camera / Gallery</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={styles.button}
          activeOpacity={0.8}
          onPress={handleCreateTenant}
        >
          <Text style={styles.buttonText}>Confirm & Add Tenant</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#0F172A",
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 15,
    marginBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#1E293B",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  title: {
    color: "#FFFFFF",
    fontSize: 22,
    fontWeight: "700",
  },
  sectionTitle: {
    color: "#38BDF8",
    fontSize: 15,
    fontWeight: "600",
    marginTop: 15,
    marginBottom: 10,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  inputGroup: {
    marginBottom: 14,
  },
  label: {
    color: "#CBD5E1",
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 6,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1E293B",
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 52,
    borderWidth: 1,
    borderColor: "#334155",
  },
  input: {
    flex: 1,
    color: "#FFFFFF",
    marginLeft: 10,
    fontSize: 15,
  },
  chipGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 10,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1E293B",
    borderWidth: 1,
    borderColor: "#334155",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginRight: 10,
    marginBottom: 10,
  },
  chipSelected: {
    backgroundColor: "#2563EB",
    borderColor: "#3B82F6",
  },
  chipText: {
    color: "#94A3B8",
    fontSize: 14,
    fontWeight: "500",
    marginLeft: 8,
  },
  chipTextSelected: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  rentCard: {
    backgroundColor: "#1E3A8A",
    borderRadius: 16,
    padding: 18,
    marginVertical: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#2563EB",
  },
  rentTitle: {
    color: "#93C5FD",
    fontSize: 14,
    fontWeight: "500",
  },
  rentSubText: {
    color: "#60A5FA",
    fontSize: 12,
    marginTop: 2,
  },
  rentAmount: {
    color: "#FFFFFF",
    fontSize: 26,
    fontWeight: "800",
  },
  uploadRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  uploadContainer: {
    width: "48%",
  },
  uploadBox: {
    backgroundColor: "#1E293B",
    borderRadius: 14,
    paddingVertical: 20,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#334155",
    borderStyle: "dashed",
  },
  uploadText: {
    color: "#F8FAFC",
    fontSize: 13,
    fontWeight: "600",
    marginTop: 8,
  },
  uploadSubText: {
    color: "#64748B",
    fontSize: 11,
    marginTop: 2,
  },
  previewBox: {
    position: "relative",
    borderRadius: 14,
    overflow: "hidden",
    backgroundColor: "#1E293B",
    borderWidth: 1,
    borderColor: "#10B981",
    alignItems: "center",
    paddingBottom: 8,
  },
  previewImage: {
    width: "100%",
    height: 100,
    borderRadius: 12,
  },
  previewLabel: {
    color: "#10B981",
    fontSize: 12,
    fontWeight: "600",
    marginTop: 6,
  },
  removeBadge: {
    position: "absolute",
    top: 6,
    right: 6,
    backgroundColor: "#EF4444",
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  button: {
    backgroundColor: "#2563EB",
    height: 54,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
    marginBottom: 40,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
});
