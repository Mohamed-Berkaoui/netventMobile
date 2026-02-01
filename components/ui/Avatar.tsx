/**
 * Avatar Component
 * User avatar with fallback initials
 */

import { Image } from "expo-image";
import React from "react";
import {
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    ViewStyle,
} from "react-native";
import {
    Colors,
    FontSizes,
    FontWeights
} from "../../constants/theme";

type AvatarSize = "small" | "medium" | "large" | "xlarge";

interface AvatarProps {
  source?: string | null;
  name?: string;
  size?: AvatarSize;
  onPress?: () => void;
  showBorder?: boolean;
  style?: ViewStyle;
}

const SIZES = {
  small: 32,
  medium: 48,
  large: 64,
  xlarge: 96,
};

const FONT_SIZES = {
  small: FontSizes.sm,
  medium: FontSizes.lg,
  large: FontSizes.xxl,
  xlarge: FontSizes.xxxl,
};

/**
 * Get initials from name
 */
const getInitials = (name?: string): string => {
  if (!name) return "?";

  const parts = name.trim().split(" ");
  if (parts.length === 1) {
    return parts[0].charAt(0).toUpperCase();
  }

  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
};

/**
 * Generate consistent color from string
 */
const getColorFromString = (str: string): string => {
  const colors = [
    "#E91E63",
    "#9C27B0",
    "#673AB7",
    "#3F51B5",
    "#2196F3",
    "#00BCD4",
    "#009688",
    "#4CAF50",
    "#FF9800",
    "#FF5722",
  ];

  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }

  return colors[Math.abs(hash) % colors.length];
};

export const Avatar: React.FC<AvatarProps> = ({
  source,
  name,
  size = "medium",
  onPress,
  showBorder = false,
  style,
}) => {
  const dimension = SIZES[size];
  const fontSize = FONT_SIZES[size];
  const initials = getInitials(name);
  const backgroundColor = getColorFromString(name || "default");

  const containerStyles: ViewStyle[] = [
    styles.container,
    {
      width: dimension,
      height: dimension,
      borderRadius: dimension / 2,
    },
  ];

  if (showBorder) {
    containerStyles.push(styles.border);
  }

  if (style) {
    containerStyles.push(style as ViewStyle);
  }

  const content = source ? (
    <Image
      source={{ uri: source }}
      style={[
        styles.image,
        {
          width: dimension,
          height: dimension,
          borderRadius: dimension / 2,
        },
      ]}
      contentFit="cover"
      transition={200}
    />
  ) : (
    <View
      style={[
        styles.fallback,
        {
          width: dimension,
          height: dimension,
          borderRadius: dimension / 2,
          backgroundColor,
        },
      ]}
    >
      <Text style={[styles.initials, { fontSize }]}>{initials}</Text>
    </View>
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
    overflow: "hidden",
  },
  image: {
    backgroundColor: Colors.background.secondary,
  },
  fallback: {
    alignItems: "center",
    justifyContent: "center",
  },
  initials: {
    color: Colors.text.primary,
    fontWeight: FontWeights.bold,
  },
  border: {
    borderWidth: 2,
    borderColor: Colors.primary.accent,
  },
});

export default Avatar;
