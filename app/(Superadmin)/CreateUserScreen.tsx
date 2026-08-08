import Ionicons from "@expo/vector-icons/Ionicons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export const THEME = {
  colors: {
    bgDark: "#0F172A",
    cardBg: "#1E293B",
    cardBgSubtle: "#0F172A",
    primary: "#2563EB",
    primaryHover: "#1D4ED8",
    border: "#334155",
    textPrimary: "#F8FAFC",
    textSecondary: "#94A3B8",
    textMuted: "#64748B",
    accent: "#38BDF8",
    successBg: "#10B98115",
    successBorder: "#10B98140",
    successText: "#34D399",
    dangerBg: "#EF444415",
    dangerText: "#F87171",
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
  },
  radius: {
    sm: 6,
    md: 10,
    lg: 14,
    full: 9999,
  },
};

export default function CreateUserScreen() {
  // Form States
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"MANAGER" | "ADMIN">("MANAGER");
  const [loading, setLoading] = useState(false);

  // Permissions State (Granular Control)
  const [permissions, setPermissions] = useState({
    viewTenants: true,
    addTenant: false,
    editTenant: false,
    deleteTenant: false,
    viewProperties: true,
    manageProperties: false,
    viewPayments: true,
    managePayments: false,
  });

  const togglePermission = (key: keyof typeof permissions) => {
    setPermissions((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleCreateUser = async () => {
    if (!name || !email || !phone || !password) {
      Alert.alert("Error", "Kripya sabhi zaroori fields bharein.");
      return;
    }

    setLoading(true);
    try {
      const token = await AsyncStorage.getItem("userToken"); // SuperAdmin ka Auth Token

      const payload = {
        name,
        email,
        phone,
        password,
        role,
        permissions, // Ye permissions backend par jayengi
      };

      // TODO: Apni API yahan lagayein
      // const response = await createSubUserApi(payload, token);
      
      console.log("Submitting Payload:", JSON.stringify(payload, null, 2));

      // Simulated API call delay
      setTimeout(() => {
        setLoading(false);
        Alert.alert("Success", "User safaltapurvak create ho gaya hai!", [
          { text: "OK", onPress: () => router.back() },
        ]);
      }, 1000);
      
    } catch (error: any) {
      setLoading(false);
      Alert.alert("Error", error?.message || "User create karne mein samasya aayi.");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={THEME.colors.bgDark} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={22} color={THEME.colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Create New User</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Basic Details Section */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Basic Information</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Full Name</Text>
            <TextInput
              style={styles.input}
              placeholder="Jaise: Rahul Sharma"
              placeholderTextColor={THEME.colors.textMuted}
              value={name}
              onChangeText={setName}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email Address</Text>
            <TextInput
              style={styles.input}
              placeholder="rahul@example.com"
              placeholderTextColor={THEME.colors.textMuted}
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Phone Number</Text>
            <TextInput
              style={styles.input}
              placeholder="9876543210"
              placeholderTextColor={THEME.colors.textMuted}
              keyboardType="phone-pad"
              maxLength={10}
              value={phone}
              onChangeText={setPhone}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Password</Text>
            <TextInput
              style={styles.input}
              placeholder="Secure password"
              placeholderTextColor={THEME.colors.textMuted}
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Assign Role</Text>
            <View style={styles.roleRow}>
              <TouchableOpacity
                style={[styles.roleChip, role === "MANAGER" && styles.activeRoleChip]}
                onPress={() => setRole("MANAGER")}
              >
                <Text style={[styles.roleText, role === "MANAGER" && styles.activeRoleText]}>Manager</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.roleChip, role === "ADMIN" && styles.activeRoleChip]}
                onPress={() => setRole("ADMIN")}
              >
                <Text style={[styles.roleText, role === "ADMIN" && styles.activeRoleText]}>Admin</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Permissions Section */}
        <View style={styles.sectionCard}>
          <View style={styles.permissionHeaderRow}>
            <Ionicons name="shield-checkmark-outline" size={20} color={THEME.colors.accent} />
            <Text style={styles.sectionTitle}>Access & Permissions</Text>
          </View>
          <Text style={styles.sectionSubtitle}>Select what actions this user can perform.</Text>

          {/* Permission Toggles */}
          {[
            { key: "viewTenants", label: "View Tenants List", desc: "Can view tenant directory and profiles" },
            { key: "addTenant", label: "Add New Tenant", desc: "Can register new tenants into system" },
            { key: "editTenant", label: "Edit Tenant Details", desc: "Can modify tenant information" },
            { key: "deleteTenant", label: "Delete / Remove Tenant", desc: "Can checkout or delete tenant records" },
            { key: "viewProperties", label: "View Properties", desc: "Can view PG and room listings" },
            { key: "manageProperties", label: "Manage Properties", desc: "Can add/edit properties and rooms" },
            { key: "viewPayments", label: "View Payments", desc: "Can check rent history and dues" },
            { key: "managePayments", label: "Record / Manage Payments", desc: "Can collect and record rent transactions" },
          ].map((item) => {
            const isEnabled = permissions[item.key as keyof typeof permissions];
            return (
              <View key={item.key} style={styles.permissionRow}>
                <View style={styles.permissionTextContainer}>
                  <Text style={styles.permissionLabel}>{item.label}</Text>
                  <Text style={styles.permissionDesc}>{item.desc}</Text>
                </View>
                <Switch
                  trackColor={{ false: THEME.colors.border, true: THEME.colors.primary }}
                  thumbColor={isEnabled ? "#FFFFFF" : THEME.colors.textMuted}
                  ios_backgroundColor={THEME.colors.border}
                  onValueChange={() => togglePermission(item.key as keyof typeof permissions)}
                  value={isEnabled}
                />
              </View>
            );
          })}
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={styles.submitButton}
          activeOpacity={0.8}
          onPress={handleCreateUser}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <>
              <Ionicons name="checkmark-circle-outline" size={18} color="#FFFFFF" />
              <Text style={styles.submitButtonText}>Create User & Grant Permissions</Text>
            </>
          )}
        </TouchableOpacity>

      </ScrollView>
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
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: THEME.spacing.lg,
    paddingVertical: THEME.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.border,
  },
  backButton: {
    padding: 4,
  },
  title: {
    color: THEME.colors.textPrimary,
    fontSize: 18,
    fontWeight: "700",
  },
  scrollContent: {
    padding: THEME.spacing.lg,
    paddingBottom: 40,
  },
  sectionCard: {
    backgroundColor: THEME.colors.cardBg,
    borderRadius: THEME.radius.lg,
    padding: THEME.spacing.lg,
    marginBottom: THEME.spacing.lg,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  sectionTitle: {
    color: THEME.colors.textPrimary,
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  sectionSubtitle: {
    color: THEME.colors.textSecondary,
    fontSize: 12,
    marginBottom: THEME.spacing.md,
  },
  permissionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 2,
  },
  inputGroup: {
    marginBottom: THEME.spacing.md,
  },
  label: {
    color: THEME.colors.textSecondary,
    fontSize: 13,
    fontWeight: "500",
    marginBottom: 6,
  },
  input: {
    backgroundColor: THEME.colors.cardBgSubtle,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    borderRadius: THEME.radius.md,
    paddingHorizontal: THEME.spacing.md,
    height: 46,
    color: THEME.colors.textPrimary,
    fontSize: 14,
  },
  roleRow: {
    flexDirection: "row",
    gap: THEME.spacing.md,
  },
  roleChip: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 10,
    borderRadius: THEME.radius.md,
    backgroundColor: THEME.colors.cardBgSubtle,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  activeRoleChip: {
    backgroundColor: THEME.colors.primary,
    borderColor: THEME.colors.primaryHover,
  },
  roleText: {
    color: THEME.colors.textSecondary,
    fontWeight: "600",
    fontSize: 13,
  },
  activeRoleText: {
    color: THEME.colors.textPrimary,
  },
  permissionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.border,
  },
  permissionTextContainer: {
    flex: 1,
    paddingRight: 10,
  },
  permissionLabel: {
    color: THEME.colors.textPrimary,
    fontSize: 13,
    fontWeight: "600",
  },
  permissionDesc: {
    color: THEME.colors.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  submitButton: {
    flexDirection: "row",
    backgroundColor: THEME.colors.primary,
    height: 50,
    borderRadius: THEME.radius.md,
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  submitButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600",
  },
});