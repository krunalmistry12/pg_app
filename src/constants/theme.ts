// src/constants/theme.ts

export const COLORS = {
  // Brand & Primary Colors
  primary: "#3B82F6",       // Vibrant Blue
  primaryHover: "#2563EB",  // Deepened Blue for interaction
  accent: "#38BDF8",        // Sky Blue Accent
  accentBackground: "rgba(56, 189, 248, 0.12)", // Harmonized with accent
  whatsapp: "#25D366",      // WhatsApp Green

  // Status & Feedback Colors
  success: "#10B981",       // Emerald Green
  successBackground: "rgba(16, 185, 129, 0.12)",
  warning: "#F59E0B",       // Amber Warning
  warningBackground: "rgba(245, 158, 11, 0.12)",
  danger: "#EF4444",        // Rose Red Error/Delete
  dangerText: "#F87171",    // Softer Red for text contrast
  dangerBackground: "rgba(239, 68, 68, 0.12)",

  // Dark Theme Backgrounds & Surfaces (Polished Depth Hierarchy)
  background: "#0F172A",    // Deep Slate Base
  bgDark: "#0B0F19",        // Deepest Backdrop (Modals/Overlays)
  surface: "#1E293B",       // Cards & Inputs Background
  cardBg: "#131B2E",        // Alternate Elevated Cards
  border: "#26334D",        // Refined visible boundary stroke

  // Typography Palette
  textPrimary: "#F8FAFC",   // High Contrast White-Blue
  textSecondary: "#94A3B8", // Readable Subtitle Text
  textMuted: "#64748B",     // Disabled/Placeholder Text
  textWhite: "#FFFFFF",     // Absolute White

  
  successText: "#4ADE80",
  
  warningText: "#FBBF24",
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

export const THEME = {
  colors: COLORS,
  spacing: SPACING,
  radius: RADIUS,
  typography: TYPOGRAPHY,
};