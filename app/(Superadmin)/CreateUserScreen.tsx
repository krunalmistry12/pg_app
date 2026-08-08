import Ionicons from "@expo/vector-icons/Ionicons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router, useFocusEffect } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { userService } from "../../src/services/userService";

export const THEME = {
  colors: {
    bgDark: "#121212",
    cardBg: "#1A1A1A",
    cardBgSubtle: "#262626",
    border: "#333333",
    primary: "#6366F1",
    textPrimary: "#FFFFFF",
    textSecondary: "#D4D4D8",
    textMuted: "#A1A1AA",
    successText: "#10B981",
    dangerText: "#EF4444",
    accent: "#818CF8",
  },
  spacing: { sm: 8, md: 12, lg: 16 },
  radius: { sm: 6, md: 8, lg: 12 },
};

const getRoleName = (roleId: number): string => {
  switch (roleId) {
    case 1:
      return "SuperAdmin";
    case 2:
      return "Admin";
    case 3:
      return "Staff";
    case 4:
      return "Tenant";
    default:
      return "Unknown";
  }
};

export interface UserMaster {
  userId?: string;
  id?: string;
  fullName?: string;
  name?: string;
  userName?: string;
  email: string;
  phone?: string;
  phoneNumber?: string;
  mobile?: string;
  roleId: number;
  isActive: boolean;
  createdAt?: string;
}

export default function UserDashboardScreen() {
  const [users, setUsers] = useState<UserMaster[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await userService.getAllUsers();
      const userList = Array.isArray(response)
        ? response
        : response?.data || response?.users || [];
      setUsers(userList);
    } catch (error: any) {
      console.error("Fetch Users Error:", error);
      Alert.alert("Error", "Failed to load users from the server.");
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchUsers();
    }, []),
  );

  // Handle Logout Function
  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to log out of your account?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          try {
            await AsyncStorage.removeItem("token");
            await AsyncStorage.removeItem("user");
            router.replace("/login" as any);
          } catch (error) {
            console.error("Logout Error:", error);
            Alert.alert("Error", "Failed to log out successfully.");
          }
        },
      },
    ]);
  };

  const handleToggleStatus = async (item: UserMaster) => {
    const uId = String(item.userId || item.id || "");
    const currentStatus = item.isActive;
    const newStatus = !currentStatus;

    // Optimistic UI update
    setUsers((prev) =>
      prev.map((u) =>
        u.userId === uId || u.id === uId ? { ...u, isActive: newStatus } : u,
      ),
    );

    try {
      await userService.updateUserStatus(uId, newStatus, {
        fullName: item.fullName || item.name || item.userName,
        email: item.email,
        phone: item.phone || item.phoneNumber || item.mobile,
        roleId: item.roleId,
        isActive: newStatus,
      });
    } catch (error: any) {
      console.error(
        "Toggle Status Error:",
        error?.response?.data || error.message,
      );
      setUsers((prev) =>
        prev.map((u) =>
          u.userId === uId || u.id === uId
            ? { ...u, isActive: currentStatus }
            : u,
        ),
      );
      Alert.alert("Error", "Failed to update user status on the server.");
    }
  };

  const handleDeleteUser = (userId: string, userName: string) => {
    Alert.alert(
      "Delete User",
      `Are you sure you want to delete '${userName}'?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await userService.deleteUser(userId);
              setUsers((prev) =>
                prev.filter((u) => u.userId !== userId && u.id !== userId),
              );
              Alert.alert("Success", "User has been deleted successfully.");
            } catch (error: any) {
              Alert.alert("Error", "Failed to delete the user.");
            }
          },
        },
      ],
    );
  };

  const handleEditUser = (userId: string) => {
    router.push(`/create-user?userId=${userId}` as any);
  };

  const filteredUsers = users.filter((u) => {
    const name = u.fullName || u.name || u.userName || "";
    const email = u.email || "";
    const phone = u.phone || u.phoneNumber || u.mobile || "";
    const query = searchQuery.toLowerCase();
    return (
      name.toLowerCase().includes(query) ||
      email.toLowerCase().includes(query) ||
      phone.includes(query)
    );
  });

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        barStyle="light-content"
        backgroundColor={THEME.colors.bgDark}
      />

      {/* Header */}
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>User Management</Text>
          <Text style={styles.headerSub}>Manage system users & access</Text>
        </View>

        <View style={styles.headerRightContainer}>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => router.push("/create-user" as any)}
          >
            <Ionicons name="add" size={16} color="#FFFFFF" />
            <Text style={styles.addButtonText}>Add</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Ionicons
              name="log-out-outline"
              size={18}
              color={THEME.colors.dangerText}
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Search Bar */}
      <View style={styles.searchBar}>
        <Ionicons name="search" size={18} color={THEME.colors.textMuted} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name, email, phone..."
          placeholderTextColor={THEME.colors.textMuted}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery ? (
          <TouchableOpacity onPress={() => setSearchQuery("")}>
            <Ionicons
              name="close-circle"
              size={16}
              color={THEME.colors.textMuted}
            />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* User List */}
      {loading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={THEME.colors.primary} />
          <Text style={styles.loaderText}>Loading Users...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredUsers}
          keyExtractor={(item, index) =>
            String(item.userId || item.id || index)
          }
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => {
            const roleName = getRoleName(item.roleId);
            const uId = String(item.userId || item.id || "");
            const displayName =
              item.fullName || item.name || item.userName || "Unknown User";
            const displayPhone =
              item.phone || item.phoneNumber || item.mobile || "No Phone";

            return (
              <View
                style={[styles.userCard, !item.isActive && styles.inactiveCard]}
              >
                <View style={styles.cardTopRow}>
                  <View style={styles.userInfo}>
                    <Text style={styles.userName} numberOfLines={1}>
                      {displayName}
                    </Text>

                    <View style={styles.contactRow}>
                      <Ionicons
                        name="mail-outline"
                        size={13}
                        color={THEME.colors.textSecondary}
                      />
                      <Text style={styles.userMetaText} numberOfLines={1}>
                        {item.email || "No Email"}
                      </Text>
                    </View>

                    <View style={styles.contactRow}>
                      <Ionicons
                        name="call-outline"
                        size={13}
                        color={THEME.colors.textSecondary}
                      />
                      <Text style={styles.userMetaText}>{displayPhone}</Text>
                    </View>
                  </View>

                  <View style={styles.roleBadge}>
                    <Text style={styles.roleBadgeText}>{roleName}</Text>
                  </View>
                </View>

                <View style={styles.cardBottomRow}>
                  <View style={styles.statusContainer}>
                    <Switch
                      trackColor={{
                        false: THEME.colors.border,
                        true: THEME.colors.primary,
                      }}
                      thumbColor="#FFFFFF"
                      onValueChange={() => handleToggleStatus(item)}
                      value={item.isActive}
                      style={{ transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] }}
                    />
                    <Text
                      style={[
                        styles.statusText,
                        {
                          color: item.isActive
                            ? THEME.colors.successText
                            : THEME.colors.dangerText,
                        },
                      ]}
                    >
                      {item.isActive ? "Active" : "Inactive"}
                    </Text>
                  </View>

                  <View style={styles.actionButtons}>
                    <TouchableOpacity
                      onPress={() => handleEditUser(uId)}
                      style={styles.actionBtn}
                    >
                      <Ionicons
                        name="create-outline"
                        size={18}
                        color={THEME.colors.accent}
                      />
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => handleDeleteUser(uId, displayName)}
                      style={[styles.actionBtn, styles.deleteBtnBg]}
                    >
                      <Ionicons
                        name="trash-outline"
                        size={18}
                        color={THEME.colors.dangerText}
                      />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            );
          }}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons
                name="people-outline"
                size={48}
                color={THEME.colors.textMuted}
              />
              <Text style={styles.emptyText}>No users found.</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.colors.bgDark,
    paddingHorizontal: THEME.spacing.lg,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: THEME.spacing.md,
    marginBottom: THEME.spacing.md,
  },
  headerTitle: {
    color: THEME.colors.textPrimary,
    fontSize: 20,
    fontWeight: "700",
  },
  headerSub: { color: THEME.colors.textMuted, fontSize: 12, marginTop: 2 },
  headerRightContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  addButton: {
    flexDirection: "row",
    backgroundColor: THEME.colors.primary,
    paddingHorizontal: THEME.spacing.md,
    paddingVertical: 8,
    borderRadius: THEME.radius.md,
    alignItems: "center",
    gap: 4,
  },
  addButtonText: { color: "#FFFFFF", fontWeight: "600", fontSize: 13 },
  logoutButton: {
    backgroundColor: THEME.colors.cardBgSubtle,
    padding: 8,
    borderRadius: THEME.radius.md,
    borderWidth: 1,
    borderColor: THEME.colors.dangerText + "40",
    justifyContent: "center",
    alignItems: "center",
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: THEME.colors.cardBg,
    borderRadius: THEME.radius.md,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    paddingHorizontal: THEME.spacing.md,
    height: 44,
    marginBottom: THEME.spacing.md,
    gap: 8,
  },
  searchInput: { flex: 1, color: THEME.colors.textPrimary, fontSize: 13 },
  listContent: { paddingBottom: 30 },
  userCard: {
    backgroundColor: THEME.colors.cardBg,
    borderRadius: THEME.radius.lg,
    padding: THEME.spacing.md,
    marginBottom: THEME.spacing.md,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  inactiveCard: { opacity: 0.6, borderColor: THEME.colors.dangerText + "40" },
  cardTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  userInfo: { flex: 1, paddingRight: 8 },
  userName: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "800",
    letterSpacing: 0.3,
    marginBottom: 6,
  },
  contactRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 3,
  },
  userMetaText: { color: THEME.colors.textSecondary, fontSize: 13 },
  roleBadge: {
    backgroundColor: THEME.colors.cardBgSubtle,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: THEME.radius.sm,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  roleBadgeText: {
    color: THEME.colors.accent,
    fontSize: 11,
    fontWeight: "700",
  },
  cardBottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: THEME.colors.border,
    paddingTop: 10,
  },
  statusContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
  },
  actionButtons: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  actionBtn: {
    backgroundColor: THEME.colors.cardBgSubtle,
    padding: 8,
    borderRadius: THEME.radius.sm,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  deleteBtnBg: {
    borderColor: THEME.colors.dangerText + "40",
  },
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 60,
  },
  loaderText: {
    color: THEME.colors.textSecondary,
    fontSize: 13,
    marginTop: 10,
  },
  emptyContainer: {
    alignItems: "center",
    marginTop: 80,
  },
  emptyText: { color: THEME.colors.textMuted, fontSize: 14, marginTop: 8 },
});
