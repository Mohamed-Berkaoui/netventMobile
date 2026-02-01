/**
 * LoadingSpinner Component
 * Full screen or inline loading indicator
 */

import React from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { Colors, FontSizes, Spacing } from "../../constants/theme";

interface LoadingSpinnerProps {
  size?: "small" | "large";
  color?: string;
  message?: string;
  fullScreen?: boolean;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = "large",
  color = Colors.primary.accent,
  message,
  fullScreen = false,
}) => {
  if (fullScreen) {
    return (
      <View style={styles.fullScreen}>
        <ActivityIndicator size={size} color={color} />
        {message && <Text style={styles.message}>{message}</Text>}
      </View>
    );
  }

  return (
    <View style={styles.inline}>
      <ActivityIndicator size={size} color={color} />
      {message && <Text style={styles.message}>{message}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  fullScreen: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.background.primary,
  },
  inline: {
    padding: Spacing.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  message: {
    marginTop: Spacing.md,
    fontSize: FontSizes.md,
    color: Colors.text.secondary,
    textAlign: "center",
  },
});

export default LoadingSpinner;
