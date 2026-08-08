import Ionicons from "@expo/vector-icons/Ionicons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import { THEME } from "./CreateUserScreen"; // 👈 Fixed import 

export default function EditUserScreen() {
  const params = useLocalSearchParams(); // List screen se pass ki gayi details receive karne ke liye

  // States pre-filled with existing data
  const [name, setName] = useState(params.name ? String(params.name) : "");
  const [email, setEmail] = useState(params.email ? String(params.email) : "");
  const [phone, setPhone] = useState(params.phone ? String(params.phone) : "");
  const [role, setRole] = useState<"MANAGER" | "ADMIN">(
    params.role === "ADMIN" ? "ADMIN" : "MANAGER",
  );
  const [loading, setLoading] = useState(false);

  const handleUpdateUser = async () => {
    if (!name || !email || !phone) {
      Alert.alert("Error", "Kripya sabhi zaroori fields bharein.");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        id: params.id,
        name,
        email,
        phone,
        role,
      };

      console.log("Updating User Payload:", JSON.stringify(payload, null, 2));

      // 👈 Real API call to update user details
      // await userService.updateUser(params.id, payload);

      setLoading(false);
      Alert.alert(
        "Success",
        "User details safaltapurvak update ho gayi hain!",
        [{ text: "OK", onPress: () => router.back() }],
      );
    } catch (error: any) {
      setLoading(false);
      Alert.alert(
        "Error",
        error?.response?.data?.message || "Update karne mein samasya aayi.",
      );
    }
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
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons
            name="arrow-back"
            size={22}
            color={THEME.colors.textPrimary}
          />
        </TouchableOpacity>
        <Text style={styles.title}>Edit User Details</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>User Information</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Full Name</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholderTextColor={THEME.colors.textMuted}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email Address</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              placeholderTextColor={THEME.colors.textMuted}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Phone Number</Text>
            <TextInput
              style={styles.input}
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              maxLength={10}
              placeholderTextColor={THEME.colors.textMuted}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Assign Role</Text>
            <View style={styles.roleRow}>
              <TouchableOpacity
                style={[
                  styles.roleChip,
                  role === "MANAGER" && styles.activeRoleChip,
                ]}
                onPress={() => setRole("MANAGER")}
              >
                <Text
                  style={[
                    styles.roleText,
                    role === "MANAGER" && styles.activeRoleText,
                  ]}
                >
                  Manager
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.roleChip,
                  role === "ADMIN" && styles.activeRoleChip,
                ]}
                onPress={() => setRole("ADMIN")}
              >
                <Text
                  style={[
                    styles.roleText,
                    role === "ADMIN" && styles.activeRoleText,
                  ]}
                >
                  Admin
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Update Button */}
        <TouchableOpacity
          style={styles.submitButton}
          activeOpacity={0.8}
          onPress={handleUpdateUser}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <>
              <Ionicons name="save-outline" size={18} color="#FFFFFF" />
              <Text style={styles.submitButtonText}>Save Changes</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: THEME.colors.bgDark },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: THEME.spacing.lg,
    paddingVertical: THEME.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.border,
  },
  backButton: { padding: 4 },
  title: { color: THEME.colors.textPrimary, fontSize: 18, fontWeight: "700" },
  scrollContent: { padding: THEME.spacing.lg, paddingBottom: 40 },
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
    marginBottom: 12,
  },
  inputGroup: { marginBottom: THEME.spacing.md },
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
  roleRow: { flexDirection: "row", gap: THEME.spacing.md },
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
    borderColor: THEME.colors.primary,
  },
  roleText: {
    color: THEME.colors.textSecondary,
    fontWeight: "600",
    fontSize: 13,
  },
  activeRoleText: { color: THEME.colors.textPrimary },
  submitButton: {
    flexDirection: "row",
    backgroundColor: THEME.colors.primary,
    height: 50,
    borderRadius: THEME.radius.md,
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  submitButtonText: { color: "#FFFFFF", fontSize: 15, fontWeight: "600" },
});
