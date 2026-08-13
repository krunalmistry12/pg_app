import { StyleSheet } from "react-native";

export const createStyles = (isDarkMode: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isDarkMode ? "#0B0F19" : "#F8FAFC",
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 16,
      paddingVertical: 12,
      backgroundColor: isDarkMode ? "#111827" : "#FFFFFF",
      borderBottomWidth: 1,
      borderBottomColor: isDarkMode ? "#1F2937" : "#E2E8F0",
    },
    backButton: {
      padding: 6,
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: "700",
      color: isDarkMode ? "#F9FAFB" : "#1E293B",
    },
    addButtonHeader: {
      backgroundColor: "#06B6D4",
      padding: 8,
      borderRadius: 8,
      marginLeft: 4,
    },
    pgBarContainer: {
      paddingVertical: 10,
      backgroundColor: isDarkMode ? "#111827" : "#FFFFFF",
      borderBottomWidth: 1,
      borderBottomColor: isDarkMode ? "#1F2937" : "#E2E8F0",
    },
    scrollRow: {
      paddingHorizontal: 16,
      alignItems: "center",
    },
    pgChip: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 20,
      backgroundColor: isDarkMode ? "#1F2937" : "#F1F5F9",
      marginRight: 8,
      borderWidth: 1,
      borderColor: isDarkMode ? "#374151" : "#E2E8F0",
    },
    commonChip: {
      borderStyle: "dashed",
    },
    pgChipActive: {
      backgroundColor: "#06B6D4",
      borderColor: "#06B6D4",
    },
    pgChipText: {
      fontSize: 13,
      fontWeight: "600",
      color: isDarkMode ? "#CBD5E1" : "#4B5563",
    },
    pgChipTextActive: {
      color: "#FFFFFF",
    },
    tabContainer: {
      flexDirection: "row",
      padding: 12,
      backgroundColor: isDarkMode ? "#0B0F19" : "#F8FAFC",
    },
    tabButton: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 10,
      borderRadius: 10,
      backgroundColor: isDarkMode ? "#111827" : "#FFFFFF",
      marginHorizontal: 4,
      borderWidth: 1,
      borderColor: isDarkMode ? "#1F2937" : "#E2E8F0",
    },
    activeTabButton: {
      borderColor: "#06B6D4",
      backgroundColor: isDarkMode
        ? "rgba(6, 182, 212, 0.1)"
        : "rgba(6, 182, 212, 0.05)",
    },
    tabText: {
      fontSize: 12,
      fontWeight: "600",
      color: isDarkMode ? "#64748B" : "#6B7280",
    },
    activeTabText: {
      color: "#06B6D4",
      fontWeight: "700",
    },
    scrollContent: {
      padding: 16,
      paddingBottom: 40,
    },
    banner: {
      backgroundColor: isDarkMode ? "#111827" : "#FFFFFF",
      borderRadius: 14,
      padding: 16,
      alignItems: "center",
      marginBottom: 16,
      borderWidth: 1,
      borderColor: isDarkMode ? "#1F2937" : "#E2E8F0",
    },
    commonBanner: {
      borderColor: "rgba(6, 182, 212, 0.4)",
    },
    bannerLabel: {
      fontSize: 15,
      fontWeight: "700",
      color: isDarkMode ? "#F9FAFB" : "#1E293B",
      marginTop: 4,
    },
    bannerSubLabel: {
      fontSize: 12,
      color: isDarkMode ? "#94A3B8" : "#64748B",
      marginTop: 2,
    },
    emptyContainer: {
      alignItems: "center",
      justifyContent: "center",
      marginTop: 40,
      padding: 20,
    },
    emptyText: {
      textAlign: "center",
      marginTop: 10,
      fontSize: 14,
      color: isDarkMode ? "#64748B" : "#9CA3AF",
    },
    card: {
      backgroundColor: isDarkMode ? "#111827" : "#FFFFFF",
      borderRadius: 14,
      padding: 16,
      marginBottom: 14,
      borderWidth: 1,
      borderColor: isDarkMode ? "#1F2937" : "#E2E8F0",
    },
    urgentCard: {
      borderColor: "#EF4444",
      backgroundColor: isDarkMode
        ? "rgba(239, 68, 68, 0.05)"
        : "rgba(239, 68, 68, 0.02)",
    },
    archiveCard: {
      opacity: 0.85,
    },
    cardHeaderTop: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
      marginBottom: 10,
    },
    titleRow: {
      flexDirection: "row",
      alignItems: "center",
      flex: 1,
      marginRight: 8,
    },
    iconContainer: {
      width: 36,
      height: 36,
      borderRadius: 8,
      backgroundColor: isDarkMode
        ? "rgba(6, 182, 212, 0.1)"
        : "rgba(6, 182, 212, 0.08)",
      justifyContent: "center",
      alignItems: "center",
      marginRight: 10,
    },
    urgentIconContainer: {
      backgroundColor: "rgba(239, 68, 68, 0.1)",
    },
    archiveIconContainer: {
      backgroundColor: isDarkMode ? "#1F2937" : "#F1F5F9",
    },
    noticeTitle: {
      fontSize: 15,
      fontWeight: "700",
      color: isDarkMode ? "#F9FAFB" : "#1E293B",
    },
    noticeCategory: {
      fontSize: 11,
      color: isDarkMode ? "#94A3B8" : "#64748B",
      marginTop: 2,
    },
    urgentBadge: {
      backgroundColor: "#EF4444",
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 4,
    },
    urgentText: {
      color: "#FFFFFF",
      fontSize: 9,
      fontWeight: "bold",
    },
    noticeDesc: {
      fontSize: 13,
      color: isDarkMode ? "#CBD5E1" : "#4B5563",
      lineHeight: 18,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: "rgba(0, 0, 0, 0.6)",
      justifyContent: "flex-end",
    },
    modalContent: {
      backgroundColor: isDarkMode ? "#111827" : "#FFFFFF",
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      padding: 20,
      maxHeight: "90%",
      borderWidth: 1,
      borderColor: isDarkMode ? "#1F2937" : "#E2E8F0",
    },
    modalHeaderTop: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 10,
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: "700",
      color: isDarkMode ? "#F9FAFB" : "#1E293B",
    },
    targetPgText: {
      fontSize: 12,
      color: isDarkMode ? "#94A3B8" : "#64748B",
      marginBottom: 16,
    },
    inputLabel: {
      fontSize: 12,
      fontWeight: "600",
      color: isDarkMode ? "#CBD5E1" : "#4B5563",
      marginBottom: 6,
      marginTop: 10,
    },
    input: {
      backgroundColor: isDarkMode ? "#1F2937" : "#F8FAFC",
      borderWidth: 1,
      borderColor: isDarkMode ? "#374151" : "#E2E8F0",
      borderRadius: 10,
      paddingHorizontal: 12,
      paddingVertical: 10,
      fontSize: 14,
      color: isDarkMode ? "#F9FAFB" : "#1E293B",
    },
    textArea: {
      height: 90,
      textAlignVertical: "top",
    },
    switchRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginTop: 16,
      paddingVertical: 4,
    },
    switchLabel: {
      fontSize: 13,
      fontWeight: "600",
      color: isDarkMode ? "#F9FAFB" : "#1E293B",
    },
    switchSub: {
      fontSize: 11,
      color: isDarkMode ? "#94A3B8" : "#64748B",
    },
    saveBtn: {
      backgroundColor: "#06B6D4",
      borderRadius: 10,
      paddingVertical: 14,
      alignItems: "center",
      marginTop: 24,
      marginBottom: 10,
    },
    saveBtnText: {
      color: "#FFFFFF",
      fontSize: 15,
      fontWeight: "700",
    },
  });
