import { StyleSheet } from "react-native";
import { commonStyles } from "../commonStyles";
import { COLORS, RADIUS, SPACING } from "../../constants/theme";

export const styles = StyleSheet.create({
  container: commonStyles.container,
  scrollContent: commonStyles.scrollPadding,
  card: commonStyles.card,
  input: commonStyles.input,

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: SPACING.md,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTitle: { 
    fontSize: 17, 
    fontWeight: "bold", 
    color: COLORS.textPrimary 
  },
  backButton: { 
    padding: SPACING.xs 
  },

  pgBarContainer: {
    backgroundColor: COLORS.surface,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  scrollRow: { 
    paddingHorizontal: SPACING.lg 
  },
  pgChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.background,
    marginRight: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  pgChipActive: { 
    backgroundColor: COLORS.primary, 
    borderColor: COLORS.primary,
  },
  commonChip: { 
    borderWidth: 1, 
    borderColor: COLORS.primary, 
    borderStyle: "dashed" 
  },
  pgChipText: { 
    fontSize: 13, 
    fontWeight: "600", 
    color: COLORS.textSecondary 
  },
  pgChipTextActive: { 
    color: COLORS.textWhite 
  },

  tabContainer: {
    flexDirection: "row",
    backgroundColor: COLORS.surface,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  tabButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.background,
    marginHorizontal: 4,
  },
  activeTabButton: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  tabText: { 
    fontSize: 12, 
    fontWeight: "600", 
    color: COLORS.textSecondary 
  },
  activeTabText: { 
    color: COLORS.primary, 
    fontWeight: "bold" 
  },

  banner: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    padding: SPACING.xl,
    alignItems: "center",
    marginBottom: SPACING.xl,
    borderWidth: 1,
    borderColor: COLORS.border,
    elevation: 3,
  },
  commonBanner: { 
    backgroundColor: "#0369A1" 
  },
  bannerLabel: {
    color: "#38BDF8",
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 2,
    textAlign: "center",
  },
  bannerSubLabel: { 
    color: COLORS.textSecondary, 
    fontSize: 12, 
    fontWeight: "500" 
  },

  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: SPACING.sm,
  },
  tenantText: { 
    fontSize: 13, 
    fontWeight: "600", 
    color: COLORS.textSecondary 
  },
  branchSubText: {
    fontSize: 11,
    color: COLORS.primary,
    fontWeight: "600",
    marginTop: 2,
  },
  priorityBadge: { 
    paddingHorizontal: SPACING.sm, 
    paddingVertical: 4, 
    borderRadius: RADIUS.sm 
  },
  priorityText: { 
    fontSize: 10, 
    fontWeight: "bold" 
  },

  complaintTitle: {
    fontSize: 15,
    fontWeight: "bold",
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  categoryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: SPACING.sm,
  },
  catTag: {
    backgroundColor: COLORS.background,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: RADIUS.sm,
  },
  catTagText: { 
    fontSize: 11, 
    color: COLORS.textSecondary, 
    fontWeight: "500" 
  },
  dateText: { 
    fontSize: 11, 
    color: COLORS.textSecondary 
  },

  remarkBox: {
    backgroundColor: COLORS.background,
    padding: SPACING.sm,
    borderRadius: RADIUS.sm,
    marginBottom: SPACING.md,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.primary,
  },
  remarkLabel: {
    fontSize: 10,
    fontWeight: "bold",
    color: COLORS.textSecondary,
    marginBottom: 2,
  },
  remarkText: { 
    fontSize: 12, 
    color: COLORS.textPrimary 
  },

  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: SPACING.md,
    marginTop: SPACING.xs,
  },
  statusBadge: { 
    paddingHorizontal: SPACING.sm, 
    paddingVertical: SPACING.xs, 
    borderRadius: RADIUS.sm 
  },
  statusBadgeText: { 
    fontSize: 11, 
    fontWeight: "600" 
  },
  actionIconsRow: { 
    flexDirection: "row" 
  },
  actionIconBtn: {
    width: 32,
    height: 32,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.background,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: SPACING.xxl * 2,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  emptyText: { 
    color: COLORS.textSecondary, 
    fontSize: 12, 
    marginTop: SPACING.sm 
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "90%",
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    padding: SPACING.xl,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 6,
  },
  modalHeaderTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: SPACING.xs,
  },
  modalTitle: { 
    fontSize: 18, 
    fontWeight: "bold", 
    color: COLORS.textPrimary 
  },
  modalSubText: { 
    fontSize: 13, 
    color: COLORS.textSecondary, 
    marginBottom: SPACING.md 
  },

  inputLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  statusOptionsRow: {
    flexDirection: "row",
    marginBottom: SPACING.md,
  },
  statusOptionChip: {
    flex: 1,
    paddingVertical: SPACING.sm,
    alignItems: "center",
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.background,
    marginHorizontal: 3,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  statusOptionChipActive: {
    backgroundColor: COLORS.surface,
    borderColor: COLORS.primary,
  },
  statusOptionText: { 
    fontSize: 11, 
    fontWeight: "600", 
    color: COLORS.textSecondary 
  },
  statusOptionTextActive: { 
    color: COLORS.primary, 
    fontWeight: "bold" 
  },

  textArea: { 
    height: 80, 
    textAlignVertical: "top",
    paddingVertical: SPACING.sm,
    marginBottom: SPACING.md,
  },

  saveBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    alignItems: "center",
  },
  saveBtnText: { 
    color: COLORS.textWhite, 
    fontWeight: "bold", 
    fontSize: 15 
  },
});
export const styles1 = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8F9FA" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    backgroundColor: "#FFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  headerTitle: { fontSize: 17, fontWeight: "bold", color: "#1A1A1A" },
  backButton: { padding: 4 },

  pgBarContainer: {
    backgroundColor: "#FFF",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  scrollRow: { paddingHorizontal: 16 },
  pgChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#F3F4F6",
    marginRight: 8,
  },
  pgChipActive: { backgroundColor: "#0F172A" },
  commonChip: { borderWidth: 1, borderColor: "#06B6D4", borderStyle: "dashed" },
  pgChipText: { fontSize: 13, fontWeight: "600", color: "#4B5563" },
  pgChipTextActive: { color: "#FFF" },

  tabContainer: {
    flexDirection: "row",
    backgroundColor: "#FFF",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  tabButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: "#F3F4F6",
    marginHorizontal: 4,
  },
  activeTabButton: {
    backgroundColor: "#ECFEFF",
    borderWidth: 1,
    borderColor: "#06B6D4",
  },
  tabText: { fontSize: 12, fontWeight: "600", color: "#6B7280" },
  activeTabText: { color: "#0E7490", fontWeight: "bold" },

  scrollContent: { padding: 16 },
  banner: {
    backgroundColor: "#0369A1",
    borderRadius: 14,
    padding: 18,
    alignItems: "center",
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  bannerLabel: {
    color: "#38BDF8",
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 2,
    textAlign: "center",
  },
  bannerSubLabel: { color: "#94A3B8", fontSize: 12, fontWeight: "500" },

  card: {
    backgroundColor: "#FFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 6,
  },
  tenantText: { fontSize: 13, fontWeight: "600", color: "#4B5563" },
  branchSubText: {
    fontSize: 11,
    color: "#06B6D4",
    fontWeight: "600",
    marginTop: 2,
  },
  priorityBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  priorityText: { fontSize: 10, fontWeight: "bold" },

  complaintTitle: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#1F2937",
    marginBottom: 8,
  },
  categoryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  catTag: {
    backgroundColor: "#F3F4F6",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  catTagText: { fontSize: 11, color: "#4B5563", fontWeight: "500" },
  dateText: { fontSize: 11, color: "#9CA3AF" },

  remarkBox: {
    backgroundColor: "#F9FAFB",
    padding: 8,
    borderRadius: 6,
    marginBottom: 10,
    borderLeftWidth: 3,
    borderLeftColor: "#06B6D4",
  },
  remarkLabel: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#4B5563",
    marginBottom: 2,
  },
  remarkText: { fontSize: 12, color: "#1F2937" },

  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
    paddingTop: 10,
    marginTop: 4,
  },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  statusBadgeText: { fontSize: 11, fontWeight: "600" },
  actionIconsRow: { flexDirection: "row" },
  actionIconBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },

  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
    backgroundColor: "#FFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  emptyText: { color: "#9CA3AF", fontSize: 12, marginTop: 8 },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "90%",
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 6,
  },
  modalHeaderTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  modalTitle: { fontSize: 18, fontWeight: "bold", color: "#1A1A1A" },
  modalSubText: { fontSize: 13, color: "#6B7280", marginBottom: 14 },

  inputLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#4B5563",
    marginBottom: 6,
  },
  statusOptionsRow: {
    flexDirection: "row",
    marginBottom: 14,
  },
  statusOptionChip: {
    flex: 1,
    paddingVertical: 8,
    alignItems: "center",
    borderRadius: 6,
    backgroundColor: "#F3F4F6",
    marginHorizontal: 3,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  statusOptionChipActive: {
    backgroundColor: "#ECFEFF",
    borderColor: "#06B6D4",
  },
  statusOptionText: { fontSize: 11, fontWeight: "600", color: "#4B5563" },
  statusOptionTextActive: { color: "#0E7490", fontWeight: "bold" },

  input: {
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: "#1A1A1A",
    marginBottom: 14,
    backgroundColor: "#F9FAFB",
  },
  textArea: { height: 80, textAlignVertical: "top" },

  saveBtn: {
    backgroundColor: "#06B6D4",
    borderRadius: 8,
    padding: 14,
    alignItems: "center",
  },
  saveBtnText: { color: "#FFF", fontWeight: "bold", fontSize: 15 },
});
