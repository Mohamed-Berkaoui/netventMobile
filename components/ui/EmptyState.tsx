/**
 * EmptyState Component
 * Displayed when lists or content are empty
 */

import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Colors, FontSizes, FontWeights, Spacing } from "../../constants/theme";
import { Icon, IconName } from "../TabIcon";
import Button from "./Button";

interface EmptyStateProps {
  icon?: IconName;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon = "home-outline",
  title,
  description,
  actionLabel,
  onAction,
}) => {
  return (
    <View style={styles.container}>
      <Icon name={icon} size={64} color={Colors.text.tertiary} />
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
