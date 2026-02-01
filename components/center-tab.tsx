import { BottomTabBarButtonProps } from "@react-navigation/bottom-tabs";
import { PlatformPressable } from "@react-navigation/elements";
import * as Haptics from "expo-haptics";
import React from "react";
import { View, StyleSheet, Platform } from "react-native";
import { BorderRadius, Colors, Spacing, Shadows } from "@/constants/theme";

export function CenterTab(props: BottomTabBarButtonProps) {
  const focused = props.accessibilityState?.selected;

  return (
    <PlatformPressable
      {...props}
      onPressIn={(ev) => {
        // stronger haptic for center primary action
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        props.onPressIn?.(ev);
      }}
      style={{ alignItems: "center", justifyContent: "center" }}
    >
      <View style={[styles.container, focused && styles.containerFocused]}>
        {props.children}
      </View>
    </PlatformPressable>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 64,
    height: 64,
    borderRadius: 32,
    marginTop: Platform.OS === "ios" ? -12 : -8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.primary.accent, // always accent for visibility
    ...Shadows.md,
    borderWidth: 2,
    borderColor: Colors.primary.accent,
  },
  containerFocused: {
    // Slight visual feedback on focus (scale up)
    transform: [{ scale: 1.06 }],
    ...Shadows.lg,
  },
});
