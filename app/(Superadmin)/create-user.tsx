import Ionicons from "@expo/vector-icons/Ionicons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { userService } from "../../src/services/userService";

const THEME = {
  colors: {
    bgDark: "#121212",
    cardBg: "#1A1A1A",
    border: "#333333",
    primary: "#6366F1",
    textPrimary: "#FFFFFF",
    textSecondary: "#D4D4D8",
    textMuted: "#A1A1AA",
    dangerText: "#EF4444",
  },
};

export default function CreateEditUserScreen() {
  const params = useLocalSearchParams();
  const userId = params?.userId as string | undefined;
  const isEditMode = !!userId;

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [roleId, setRoleId] = useState<number>(4); // Default Role: Tenant (4)
  const [loading, setLoading] = useState(false);
  const [fetchingUser, setFetchingUser] = useState(false);

  // Fetch existing user details if in Edit Mode
  useEffect(() => {
    if (isEditMode && userId) {
      fetchUserDetails(userId);
    }
  }, [userId]);

  const fetchUserDetails = async (id: string) => {
    setFetchingUser(true);
    try {
      const response = await userService.getAllUsers();
      const userList = Array.isArray(response)
        ? response
        : response?.data || [];
      const currentUser = userList.find(
        (u: any) => String(u.userId || u.id) === String(id),
      );

      if (currentUser) {
        setFullName(
          currentUser.fullName ||
            currentUser.name ||
            currentUser.userName ||
            "",
        );
        setEmail(currentUser.email || "");
        setPhone(
          currentUser.phone ||
            currentUser.phoneNumber ||
            currentUser.mobile ||
            "",
        );
        setRoleId(currentUser.roleId || 4);
      }
    } catch (error) {
      console.error("Error fetching user details:", error);
      Alert.alert("Error", "Failed to load user details.");
    } finally {
      setFetchingUser(false);
    }
  };

  const handleSave = async () => {
    // 1. Empty field validation
    if (!fullName.trim() || !email.trim() || !phone.trim()) {
      Alert.alert("Validation Error", "Please fill in all required fields.");
      return;
    }

    // 2. Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      Alert.alert("Validation Error", "Please enter a valid email address.");
      return;
    }

    // 3. Indian mobile number validation (10 digits starting with 6-9)
    const phoneRegex = /^[6-9]\d{9}$/;
    if (!phoneRegex.test(phone.trim())) {
      Alert.alert(
        "Validation Error",
        "Please enter a valid 10-digit mobile number starting with 6-9.",
      );
      return;
    }

    // 4. Password validation for create mode or if updated in edit mode
    if (!isEditMode) {
      if (!password) {
        Alert.alert("Validation Error", "Password is required for a new user.");
        return;
      }
      if (password.length < 6) {
        Alert.alert(
          "Validation Error",
          "Password must be at least 6 characters long.",
        );
        return;
      }
    } else if (password && password.length < 6) {
      Alert.alert(
        "Validation Error",
        "Password must be at least 6 characters long.",
      );
      return;
    }

    setLoading(true);
    try {
      if (isEditMode && userId) {
        const updatePayload: any = {
          fullName: fullName.trim(),
          email: email.trim(),
          phone: phone.trim(),
          roleId: Number(roleId),
        };
        if (password) {
          updatePayload.passwordHash = password;
        }

        await userService.updateUser(userId, updatePayload);
        Alert.alert("Success", "User details updated successfully.", [
          { text: "OK", onPress: () => router.back() },
        ]);
      } else {
        const createPayload = {
          fullName: fullName.trim(),
          email: email.trim(),
          phone: phone.trim(),
          passwordHash: password,
          roleId: Number(roleId),
        };

        await userService.createUser(createPayload);
        Alert.alert("Success", "New user created successfully.", [
          { text: "OK", onPress: () => router.back() },
        ]);
      }
    } catch (error: any) {
      console.error("Save User Error:", error);

      let errorMessage = "Operation failed. Please try again.";
      if (error?.response?.data) {
        if (typeof error.response.data === "string") {
          errorMessage = error.response.data;
        } else if (error.response.data.message) {
          errorMessage = error.response.data.message;
        } else if (error.response.data.errors) {
          const validationErrors = error.response.data.errors;
          errorMessage = Object.values(validationErrors).flat().join("\n");
        }
      }

      Alert.alert("Error", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (fetchingUser) {
    return (
      <View style={[styles.container, styles.centerLoader]}>
        <ActivityIndicator size="large" color={THEME.colors.primary} />
        <Text style={{ color: THEME.colors.textSecondary, marginTop: 10 }}>
          Loading User Info...
        </Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        barStyle="light-content"
        backgroundColor={THEME.colors.bgDark}
      />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {isEditMode ? "Edit User" : "Add New User"}
        </Text>
        <View style={{ width: 32 }} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.formContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* Full Name */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Full Name</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter full name"
              placeholderTextColor={THEME.colors.textMuted}
              value={fullName}
              onChangeText={setFullName}
            />
          </View>

          {/* Email */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email Address</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter email address"
              placeholderTextColor={THEME.colors.textMuted}
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
            />
          </View>

          {/* Phone */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Phone Number</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter 10-digit mobile number"
              placeholderTextColor={THEME.colors.textMuted}
              keyboardType="phone-pad"
              maxLength={10}
              value={phone}
              onChangeText={setPhone}
            />
          </View>

          {/* Password */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              {isEditMode
                ? "Password (Leave blank to keep unchanged)"
                : "Password"}
            </Text>
            <TextInput
              style={styles.input}
              placeholder="Enter password (min 6 chars)"
              placeholderTextColor={THEME.colors.textMuted}
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />
          </View>

          {/* Role Selection */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Select Role</Text>
            <View style={styles.roleRow}>
              {[
                { id: 1, label: "SuperAdmin" },
                { id: 2, label: "Admin" },
                { id: 3, label: "Staff" },
                { id: 4, label: "Tenant" },
              ].map((role) => (
                <TouchableOpacity
                  key={role.id}
                  style={[
                    styles.roleChip,
                    roleId === role.id && styles.roleChipActive,
                  ]}
                  onPress={() => setRoleId(role.id)}
                >
                  <Text
                    style={[
                      styles.roleChipText,
                      roleId === role.id && styles.roleChipTextActive,
                    ]}
                  >
                    {role.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={styles.submitBtn}
            onPress={handleSave}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.submitBtnText}>
                {isEditMode ? "Update User" : "Create User"}
              </Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.colors.bgDark,
  },
  centerLoader: {
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.border,
  },
  backBtn: {
    padding: 4,
  },
  headerTitle: {
    color: THEME.colors.textPrimary,
    fontSize: 18,
    fontWeight: "700",
  },
  formContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    color: THEME.colors.textSecondary,
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 6,
  },
  input: {
    backgroundColor: THEME.colors.cardBg,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 46,
    color: THEME.colors.textPrimary,
    fontSize: 14,
  },
  roleRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 4,
  },
  roleChip: {
    backgroundColor: THEME.colors.cardBg,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
  },
  roleChipActive: {
    backgroundColor: THEME.colors.primary,
    borderColor: THEME.colors.primary,
  },
  roleChipText: {
    color: THEME.colors.textSecondary,
    fontSize: 12,
    fontWeight: "600",
  },
  roleChipTextActive: {
    color: "#FFFFFF",
  },
  submitBtn: {
    backgroundColor: THEME.colors.primary,
    height: 48,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 20,
  },
  submitBtnText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
});
