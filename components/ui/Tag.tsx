/**
 * Tag/Chip Component
 * For displaying interests, categories, etc.
 */

import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    ViewStyle,
} from "react-native";
import {
    BorderRadius,
    Colors,
    FontSizes,
    FontWeights,
    Spacing,
} from "../../constants/theme";

interface TagProps {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  onRemove?: () => void;
  variant?: "default" | "primary" | "success" | "warning" | "error";
  size?: "small" | "medium";
  style?: ViewStyle;
}

export const Tag: React.FC<TagProps> = ({
  label,
  selected = false,
  onPress,
  onRemove,
  variant = "default",
  size = "medium",
  style,
}) => {
  const containerStyles = [
    styles.container,
    styles[variant],
    styles[`${size}Size`],
    selected && styles.selected,
    style,
  ];

  const textStyles = [
    styles.text,
    styles[`${variant}Text`],
    styles[`${size}Text`],
    selected && styles.selectedText,
  ];

  const content = (
    <>
      <Text style={textStyles}>{label}</Text>
      {onRemove && (
        <TouchableOpacity
          onPress={onRemove}
          hitSlop={{ top: 10, bottom: 10, left: 5, right: 10 }}
        >
          <Ionicons
            name="close-circle"
            size={size === "small" ? 14 : 18}
            color={selected ? Colors.text.primary : Colors.text.secondary}
          />
        </TouchableOpacity>
      )}
    </>
  );

  if (onPress) {
    return (
      <TouchableOpacity
        style={containerStyles}
        onPress={onPress}
        activeOpacity={0.7}
      >
        {content}
      </TouchableOpacity>
    );
  }

  return <View style={containerStyles}>{content}</View>;
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: BorderRadius.full,
    gap: Spacing.xs,
  },

  // Variants
  default: {
    backgroundColor: Colors.background.elevated,
    borderWidth: 1,
    borderColor: Colors.border.primary,
  },
  primary: {
    backgroundColor: Colors.primary.light,
    borderWidth: 1,
    borderColor: Colors.primary.accent,
  },
  success: {
    backgroundColor: "rgba(76, 175, 80, 0.2)",
    borderWidth: 1,
    borderColor: Colors.status.success,
  },
  warning: {
    backgroundColor: "rgba(255, 193, 7, 0.2)",
    borderWidth: 1,
    borderColor: Colors.status.warning,
  },
  error: {
    backgroundColor: "rgba(244, 67, 54, 0.2)",
    borderWidth: 1,
    borderColor: Colors.status.error,
  },

  selected: {
    backgroundColor: Colors.primary.accent,
    borderColor: Colors.primary.accent,
  },

  // Sizes
  smallSize: {
    paddingVertical: Spacing.xs - 2,
    paddingHorizontal: Spacing.sm,
  },
  mediumSize: {
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.md,
  },

  // Text styles
  text: {
    fontWeight: FontWeights.medium,
  },
  defaultText: {
    color: Colors.text.secondary,
  },
  primaryText: {
    color: Colors.primary.accent,
  },
  successText: {
    color: Colors.status.success,
  },
  warningText: {
    color: Colors.status.warning,
  },
  errorText: {
    color: Colors.status.error,
  },
  selectedText: {
    color: Colors.text.primary,
  },

  smallText: {
    fontSize: FontSizes.xs,
  },
  mediumText: {
    fontSize: FontSizes.sm,
  },
});

export default Tag;
