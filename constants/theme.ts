/**
 * Theme Configuration for the Event Attendee App
 * Light theme with brand accent colors
 */

import { Platform } from "react-native";

export const Colors = {
  // Primary Brand Colors (used as accents)
  primary: {
    main: "#260848",
    dark: "#220444",
    light: "#2A0D4B",
    accent: "#4654A1",
  },

  // Background Colors (Light Theme)
  background: {
    primary: "#FFFFFF",
    secondary: "#F8F9FA",
    tertiary: "#F0F2F5",
    card: "#FFFFFF",
    elevated: "#FFFFFF",
  },

  // Text Colors
  text: {
    primary: "#1A1A2E",
    secondary: "#6B7280",
    tertiary: "#9CA3AF",
    inverse: "#FFFFFF",
    link: "#4654A1",
  },

  // Status Colors
  status: {
    success: "#10B981",
    warning: "#F59E0B",
    error: "#EF4444",
    info: "#3B82F6",
  },

  // Border Colors
  border: {
    primary: "#E5E7EB",
    secondary: "#F3F4F6",
    focus: "#4654A1",
  },

  // Gradient Colors
  gradients: {
    primary: ["#260848", "#4654A1"],
    light: ["#F8F9FA", "#FFFFFF"],
    accent: ["#4654A1", "#6366F1"],
    badge: ["#260848", "#2A0D4B", "#4654A1"],
  },

  // Overlay Colors
  overlay: {
    dark: "rgba(0, 0, 0, 0.5)",
    medium: "rgba(0, 0, 0, 0.3)",
    light: "rgba(0, 0, 0, 0.1)",
  },

  // Social Colors
  social: {
    like: "#EF4444",
    comment: "#4654A1",
    share: "#06B6D4",
  },

  // Legacy support for existing components
  light: {
    text: "#11181C",
    background: "#fff",
    tint: "#4654A1",
    icon: "#6B7280",
    tabIconDefault: "#9CA3AF",
    tabIconSelected: "#4654A1",
  },
  dark: {
    text: "#ECEDEE",
    background: "#151718",
    tint: "#fff",
    icon: "#9BA1A6",
    tabIconDefault: "#9BA1A6",
    tabIconSelected: "#fff",
  },
} as const;

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const BorderRadius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
} as const;

export const FontSizes = {
  xs: 10,
  sm: 12,
  md: 14,
  lg: 16,
  xl: 18,
  xxl: 24,
  xxxl: 32,
  display: 40,
} as const;

export const FontWeights = {
  regular: "400" as const,
  medium: "500" as const,
  semibold: "600" as const,
  bold: "700" as const,
};

export const Shadows = {
  sm: Platform.select({
    web: {
      boxShadow: "0px 1px 2px rgba(0, 0, 0, 0.2)",
    },
    default: {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.2,
      shadowRadius: 2,
      elevation: 2,
    },
  }),
  md: Platform.select({
    web: {
      boxShadow: "0px 2px 4px rgba(0, 0, 0, 0.25)",
    },
    default: {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 4,
      elevation: 4,
    },
  }),
  lg: Platform.select({
    web: {
      boxShadow: "0px 4px 8px rgba(0, 0, 0, 0.3)",
    },
    default: {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 8,
    },
  }),
  glow: Platform.select({
    web: {
      boxShadow: "0px 0px 20px rgba(70, 84, 161, 0.5)",
    },
    default: {
      shadowColor: "#4654A1",
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.5,
      shadowRadius: 20,
      elevation: 10,
    },
  }),
} as const;

export const Theme = {
  colors: Colors,
  spacing: Spacing,
  borderRadius: BorderRadius,
  fontSizes: FontSizes,
  fontWeights: FontWeights,
  shadows: Shadows,
} as const;

export type ThemeType = typeof Theme;

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: "system-ui",
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: "ui-serif",
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: "ui-rounded",
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: "ui-monospace",
  },
  default: {
    sans: "normal",
    serif: "serif",
    rounded: "normal",
    mono: "monospace",
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded:
      "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
