// src/constants/theme.ts

export const COLORS = {
  // Brand Colors
  primary: "#2563EB",
  primaryHover: "#1D4ED8",
  accent: "#38BDF8",
  accentBackground: "rgba(56, 189, 248, 0.1)",

  // Status Colors
  success: "#10B981",
  warning: "#D97706",
  danger: "#EF4444",
  dangerText: "#F87171",

  // Dark Theme Backgrounds
  background: "#0F172A", // Deep Navy Dark
  surface: "#1E293B",    // Dark Slate Card/Input background
  border: "#334155",     // Muted borders

  // Typography
  textPrimary: "#F8FAFC",
  textSecondary: "#94A3B8",
  textMuted: "#64748B",
  textWhite: "#FFFFFF",
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
};

export const RADIUS = {
  sm: 6,
  md: 10,
  lg: 12,
  xl: 14,
  full: 999,
};

export const TYPOGRAPHY = {
  headerTitle: {
    fontSize: 18,
    fontWeight: "700" as const,
    color: COLORS.textPrimary,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: COLORS.textPrimary,
    letterSpacing: 0.5,
  },
  label: {
    fontSize: 12,
    fontWeight: "500" as const,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  body: {
    fontSize: 14,
    color: COLORS.textPrimary,
  },
};
