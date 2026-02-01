/**
 * Button Component
 * Reusable button with multiple variants
 */

import * as Haptics from "expo-haptics";
import React from "react";
import {
    ActivityIndicator,
    StyleSheet,
    Text,
    TextStyle,
    TouchableOpacity,
    ViewStyle,
} from "react-native";
import {
    BorderRadius,
    Colors,
    FontSizes,
    FontWeights,
    Shadows,
    Spacing,
} from "../../constants/theme";

type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "danger";
type ButtonSize = "small" | "medium" | "large";

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  iconPosition?: "left" | "right";
  fullWidth?: boolean;
  haptic?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = "primary",
  size = "medium",
  loading = false,
  disabled = false,
  icon,
  iconPosition = "left",
  fullWidth = false,
  haptic = true,
  style,
  textStyle,
}) => {
  const handlePress = () => {
    if (haptic) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onPress();
  };

  const buttonStyles = [
    styles.base,
    styles[variant],
    styles[`${size}Size`],
    fullWidth && styles.fullWidth,
    disabled && styles.disabled,
    style,
  ];

  const textStyles = [
    styles.text,
    styles[`${variant}Text`],
    styles[`${size}Text`],
    disabled && styles.disabledText,
    textStyle,
  ];

  return (
    <TouchableOpacity
      style={buttonStyles}
      onPress={handlePress}
      disabled={disabled || loading}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator
          color={
            variant === "outline" || variant === "ghost"
              ? Colors.primary.accent
              : Colors.text.inverse
          }
          size="small"
        />
      ) : (
        <>
          {icon && iconPosition === "left" && icon}
          <Text style={textStyles}>{title}</Text>
          {icon && iconPosition === "right" && icon}
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
    ...Shadows.sm,
  },

  // Variants
  primary: {
    backgroundColor: Colors.primary.accent,
  },
  secondary: {
    backgroundColor: Colors.background.elevated,
  },
  outline: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: Colors.primary.accent,
  },
  ghost: {
    backgroundColor: "transparent",
  },
  danger: {
    backgroundColor: Colors.status.error,
  },

  // Sizes
  smallSize: {
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.md,
    minHeight: 32,
  },
  mediumSize: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    minHeight: 44,
  },
  largeSize: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    minHeight: 56,
  },

  fullWidth: {
    width: "100%",
  },

  disabled: {
    opacity: 0.5,
  },

  // Text styles
  text: {
    fontWeight: FontWeights.semibold,
    textAlign: "center",
  },
  primaryText: {
    color: Colors.text.inverse,
  },
  secondaryText: {
    color: Colors.text.primary,
  },
  outlineText: {
    color: Colors.primary.accent,
  },
  ghostText: {
    color: Colors.primary.accent,
  },
  dangerText: {
    color: Colors.text.inverse,
  },

  smallText: {
    fontSize: FontSizes.sm,
  },
  mediumText: {
    fontSize: FontSizes.md,
  },
  largeText: {
    fontSize: FontSizes.lg,
  },

  disabledText: {
    opacity: 0.7,
  },
});

export default Button;
