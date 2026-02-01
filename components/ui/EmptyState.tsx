/**
 * EmptyState Component
 * Displayed when lists or content are empty
 */

import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Colors, FontSizes, FontWeights, Spacing } from "../../constants/theme";
import Button from "./Button";

interface EmptyStateProps {
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon = "folder-open-outline",
  title,
  description,
  actionLabel,
  onAction,
}) => {
  return (
    <View style={styles.container}>
      <Ionicons
        name={icon}
        size={64}
        color={Colors.text.tertiary}
        style={styles.icon}
      />
      <Text style={styles.title}>{title}</Text>
      {description && <Text style={styles.description}>{description}</Text>}
      {actionLabel && onAction && (
        <Button
          title={actionLabel}
          onPress={onAction}
          variant="outline"
          style={styles.button}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.xl,
  },
  icon: {
    marginBottom: Spacing.md,
    opacity: 0.5,
  },
  title: {
    fontSize: FontSizes.xl,
    fontWeight: FontWeights.semibold,
    color: Colors.text.primary,
    textAlign: "center",
    marginBottom: Spacing.sm,
  },
  description: {
    fontSize: FontSizes.md,
    color: Colors.text.secondary,
    textAlign: "center",
    maxWidth: 280,
  },
  button: {
    marginTop: Spacing.lg,
  },
});

export default EmptyState;
