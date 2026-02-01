/**
 * Card Component
 * Reusable card container with variants
 */

import React from "react";
import {
    StyleProp,
    StyleSheet,
    TouchableOpacity,
    View,
    ViewStyle,
} from "react-native";
import { BorderRadius, Colors, Shadows, Spacing } from "../../constants/theme";

interface CardProps {
  children: React.ReactNode;
  onPress?: () => void;
  variant?: "default" | "elevated" | "outlined";
  padding?: "none" | "small" | "medium" | "large";
  style?: StyleProp<ViewStyle>;
}

export const Card: React.FC<CardProps> = ({
  children,
  onPress,
  variant = "default",
  padding = "medium",
  style,
}) => {
  const cardStyles = [
    styles.base,
    styles[variant],
    styles[`${padding}Padding`],
    style,
  ];

  if (onPress) {
    return (
      <TouchableOpacity
        style={cardStyles}
        onPress={onPress}
        activeOpacity={0.7}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return <View style={cardStyles}>{children}</View>;
};

const styles = StyleSheet.create({
  base: {
    borderRadius: BorderRadius.lg,
    overflow: "hidden",
  },

  // Variants
  default: {
    backgroundColor: Colors.background.card,
    borderWidth: 1,
    borderColor: Colors.border.secondary,
  },
  elevated: {
    backgroundColor: Colors.background.card,
    borderWidth: 1,
    borderColor: Colors.border.secondary,
    ...Shadows.md,
  },
  outlined: {
    backgroundColor: Colors.background.card,
    borderWidth: 1,
    borderColor: Colors.border.primary,
  },

  // Padding
  nonePadding: {
    padding: 0,
  },
  smallPadding: {
    padding: Spacing.sm,
  },
  mediumPadding: {
    padding: Spacing.md,
  },
  largePadding: {
    padding: Spacing.lg,
  },
});

export default Card;
