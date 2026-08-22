import Ionicons from "@expo/vector-icons/Ionicons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { profileService } from "../src/services/profileService";
import { styles } from "../src/styles/Admin/ProfileStyles ";

const STORAGE_KEY = "@dashboard_cache_data";

export default function EditProfileScreen() {
  const [isUpdating, setIsUpdating] = useState(false);

  // Editable Form States
  const [editFullName, setEditFullName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editPgName, setEditPgName] = useState("");
  const [editAddress, setEditAddress] = useState("");
  const [editCity, setEditCity] = useState("");
  const [userId, setUserId] = useState("");

  useEffect(() => {
    loadExistingProfile();
  }, []);

  const loadExistingProfile = async () => {
    try {
      const storedData = await AsyncStorage.getItem(STORAGE_KEY);
      const standaloneUserId = await AsyncStorage.getItem("userId");

      if (storedData) {
        const parsed = JSON.parse(storedData);
        setUserId(
          standaloneUserId || parsed.userId || parsed.id || parsed._id || "",
        );
        setEditFullName(parsed.ownerName || parsed.fullName || "");
        setEditEmail(parsed.email || "");
        setEditPhone(parsed.phone || "");
        setEditPgName(parsed.pgName || "");
        setEditAddress(parsed.address || "");
        setEditCity(parsed.city || "");
      }
    } catch (error) {
      console.log("Error loading profile data for edit:", error);
    }
  };

  const handleSaveProfile = async () => {
    if (!editFullName.trim() || !editPgName.trim()) {
      Alert.alert("Validation Error", "Full Name and PG Name cannot be empty.");
      return;
    }

    if (!userId) {
      Alert.alert("Error", "User ID is missing. Please log in again.");
      return;
    }

    setIsUpdating(true);
    try {
      const payload = {
        userId,
        fullName: editFullName,
        email: editEmail,
        phone: editPhone,
        pgName: editPgName,
        address: editAddress,
        city: editCity,
      };

      // Call API Endpoint (PUT /User/update-profile)
      await profileService.updateProfile(payload);

      // Fetch existing cache, update fields, and save back
      const storedData = await AsyncStorage.getItem(STORAGE_KEY);
      if (storedData) {
        const parsed = JSON.parse(storedData);
        const updatedCache = {
          ...parsed,
          ownerName: editFullName,
          fullName: editFullName,
          email: editEmail,
          phone: editPhone,
          pgName: editPgName,
          address: editAddress,
          city: editCity,
          location: editCity,
        };
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedCache));
      }

      setIsUpdating(false);
      Alert.alert("Success", "Profile updated successfully!", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (error: any) {
      setIsUpdating(false);
      Alert.alert(
        "Update Failed",
        error?.response?.data?.message ||
          error?.message ||
          "Could not update profile details on server.",
      );
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: "#0F172A" }]}>
      <StatusBar barStyle="light-content" backgroundColor="#0F172A" />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        {/* Custom Header */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            paddingHorizontal: 20,
            paddingVertical: 16,
            borderBottomWidth: 1,
            borderBottomColor: "#1E293B",
          }}
        >
          <TouchableOpacity
            onPress={() => router.back()}
            style={{ flexDirection: "row", alignItems: "center", gap: 6 }}
          >
            <Ionicons name="arrow-back" size={20} color="#38BDF8" />
            <Text style={{ color: "#38BDF8", fontSize: 16, fontWeight: "600" }}>
              Back
            </Text>
          </TouchableOpacity>
          <Text style={{ color: "#F8FAFC", fontSize: 18, fontWeight: "bold" }}>
            Edit Profile
          </Text>
          <View style={{ width: 45 }} />
        </View>

        <ScrollView
          style={{ flex: 1, paddingHorizontal: 20 }}
          contentContainerStyle={{ paddingVertical: 20, paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
        >
          <Text style={[styles.filterLabel, { marginTop: 4 }]}>FULL NAME</Text>
          <View style={localStyles.inputWrapper}>
            <Ionicons
              name="person-outline"
              size={18}
              color="#64748B"
              style={localStyles.inputIcon}
            />
            <TextInput
              style={localStyles.inputField}
              placeholder="Enter full name"
              placeholderTextColor="#64748B"
              value={editFullName}
              onChangeText={setEditFullName}
            />
          </View>

          <Text style={styles.filterLabel}>EMAIL ADDRESS</Text>
          <View style={localStyles.inputWrapper}>
            <Ionicons
              name="mail-outline"
              size={18}
              color="#64748B"
              style={localStyles.inputIcon}
            />
            <TextInput
              style={localStyles.inputField}
              placeholder="Enter email address"
              placeholderTextColor="#64748B"
              keyboardType="email-address"
              autoCapitalize="none"
              value={editEmail}
              onChangeText={setEditEmail}
            />
          </View>

          <Text style={styles.filterLabel}>PHONE NUMBER</Text>
          <View style={localStyles.inputWrapper}>
            <Ionicons
              name="call-outline"
              size={18}
              color="#64748B"
              style={localStyles.inputIcon}
            />
            <TextInput
              style={localStyles.inputField}
              placeholder="Enter phone number"
              placeholderTextColor="#64748B"
              keyboardType="phone-pad"
              value={editPhone}
              onChangeText={setEditPhone}
            />
          </View>

          <Text style={styles.filterLabel}>PG PROPERTY NAME</Text>
          <View style={localStyles.inputWrapper}>
            <Ionicons
              name="business-outline"
              size={18}
              color="#64748B"
              style={localStyles.inputIcon}
            />
            <TextInput
              style={localStyles.inputField}
              placeholder="Enter PG Name"
              placeholderTextColor="#64748B"
              value={editPgName}
              onChangeText={setEditPgName}
            />
          </View>

          <Text style={styles.filterLabel}>STREET ADDRESS</Text>
          <View style={localStyles.inputWrapper}>
            <Ionicons
              name="location-outline"
              size={18}
              color="#64748B"
              style={localStyles.inputIcon}
            />
            <TextInput
              style={localStyles.inputField}
              placeholder="Enter address"
              placeholderTextColor="#64748B"
              value={editAddress}
              onChangeText={setEditAddress}
            />
          </View>

          <Text style={styles.filterLabel}>CITY / AREA</Text>
          <View style={localStyles.inputWrapper}>
            <Ionicons
              name="map-outline"
              size={18}
              color="#64748B"
              style={localStyles.inputIcon}
            />
            <TextInput
              style={localStyles.inputField}
              placeholder="Enter city"
              placeholderTextColor="#64748B"
              value={editCity}
              onChangeText={setEditCity}
            />
          </View>

          <TouchableOpacity
            style={[
              styles.downloadBtn,
              { backgroundColor: "#38BDF8", marginTop: 24, height: 50 },
            ]}
            onPress={handleSaveProfile}
            disabled={isUpdating}
          >
            {isUpdating ? (
              <ActivityIndicator color="#0F172A" size="small" />
            ) : (
              <Text
                style={[
                  styles.downloadBtnText,
                  { color: "#0F172A", fontWeight: "bold", fontSize: 16 },
                ]}
              >
                Save Changes
              </Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const localStyles = {
  inputWrapper: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    backgroundColor: "#1E293B",
    borderWidth: 1,
    borderColor: "#334155",
    borderRadius: 10,
    marginBottom: 16,
    paddingHorizontal: 12,
  },
  inputIcon: {
    marginRight: 8,
  },
  inputField: {
    flex: 1,
    color: "#F8FAFC",
    fontSize: 14,
    paddingVertical: 14,
  },
};
