// src/styles/commonStyles.ts
import { StyleSheet } from "react-native";
import { COLORS, RADIUS, SPACING } from "../constants/theme";

export const commonStyles = StyleSheet.create({
  // Safe Container
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollPadding: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xxl * 2,
  },

  // Base Card Component
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  // Standard Form Input
  input: {
    backgroundColor: COLORS.background,
    color: COLORS.textPrimary,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    height: 44,
    borderWidth: 1,
    borderColor: COLORS.border,
    fontSize: 14,
  },

  // Layout Helpers
  row: {
    flexDirection: "row",
    gap: SPACING.md,
  },
  flex1: {
    flex: 1,
  },

  // Primary Button
  primaryButton: {
    backgroundColor: COLORS.primary,
    height: 50,
    borderRadius: RADIUS.lg,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: SPACING.sm,
  },
  primaryButtonText: {
    color: COLORS.textWhite,
    fontSize: 15,
    fontWeight: "700",
  },
});
