/**
 * Permissions Screen
 * Request and manage app permissions
 */

import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    Alert,
    Linking,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withSequence,
    withSpring,
    withTiming,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button, Card } from "../../components/ui";
import {
    BorderRadius,
    Colors,
    FontSizes,
    FontWeights,
    Spacing,
} from "../../constants/theme";
import { usePermissionsStore } from "../../stores/permissionsStore";

/**
 * Permission item configuration
 */
interface PermissionConfig {
  id: string;
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  required: boolean;
  enabled: boolean;
  onRequest: () => Promise<void>;
}

export const PermissionsScreen: React.FC = () => {
  const {
    locationEnabled,
    bluetoothEnabled,
    notificationsEnabled,
    setLocationEnabled,
    setBluetoothEnabled,
    setNotificationsEnabled,
    requestAllPermissions,
  } = usePermissionsStore();

  const [requesting, setRequesting] = useState<string | null>(null);

  /**
   * Request location permission
   */
  const requestLocationPermission = async () => {
    try {
      setRequesting("location");

      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status === "granted") {
        // Also request background location for geofencing
        const { status: bgStatus } =
          await Location.requestBackgroundPermissionsAsync();
        setLocationEnabled(true);

        if (bgStatus !== "granted") {
          Alert.alert(
            "Background Location",
            "Background location access is recommended for automatic check-in/check-out. You can enable it in Settings.",
            [
              { text: "Later", style: "cancel" },
              { text: "Open Settings", onPress: () => Linking.openSettings() },
            ],
          );
        }
      } else {
        Alert.alert(
          "Permission Denied",
          "Location access is required for event check-in and navigation features. You can enable it in Settings.",
          [
            { text: "Cancel", style: "cancel" },
            { text: "Open Settings", onPress: () => Linking.openSettings() },
          ],
        );
      }
    } catch (error) {
      console.error("Error requesting location permission:", error);
    } finally {
      setRequesting(null);
    }
  };

  /**
   * Request Bluetooth permission
   * Note: On iOS, Bluetooth is handled differently
   */
  const requestBluetoothPermission = async () => {
    try {
      setRequesting("bluetooth");

      // In a real app, you would use react-native-ble-plx or similar
      // For demo, we'll simulate the permission request
      await new Promise((resolve) => setTimeout(resolve, 1000));

      if (Platform.OS === "android") {
        // Android requires location permission for BLE scanning
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === "granted") {
          setBluetoothEnabled(true);
        }
      } else {
        // iOS handles Bluetooth permissions automatically
        setBluetoothEnabled(true);
      }
    } catch (error) {
      console.error("Error requesting Bluetooth permission:", error);
    } finally {
      setRequesting(null);
    }
  };

  /**
   * Request notification permission
   */
  const requestNotificationPermission = async () => {
    try {
      setRequesting("notifications");

      // In a real app, you would use expo-notifications
      // For demo, we'll simulate the permission request
      await new Promise((resolve) => setTimeout(resolve, 1000));

      setNotificationsEnabled(true);
    } catch (error) {
      console.error("Error requesting notification permission:", error);
    } finally {
      setRequesting(null);
    }
  };

  /**
   * Permission configurations
   */
  const permissions: PermissionConfig[] = [
    {
      id: "location",
      title: "Location",
      description:
        "Required for event check-in, navigation, and finding nearby attendees",
      icon: "location",
      required: true,
      enabled: locationEnabled,
      onRequest: requestLocationPermission,
    },
    {
      id: "bluetooth",
      title: "Bluetooth",
      description: "Used for indoor positioning and proximity-based features",
      icon: "bluetooth",
      required: false,
      enabled: bluetoothEnabled,
      onRequest: requestBluetoothPermission,
    },
    {
      id: "notifications",
      title: "Notifications",
      description: "Receive event updates, messages, and check-in reminders",
      icon: "notifications",
      required: false,
      enabled: notificationsEnabled,
      onRequest: requestNotificationPermission,
    },
  ];

  /**
   * Request all permissions at once
   */
  const handleRequestAll = async () => {
    setRequesting("all");
    await requestAllPermissions();
    setRequesting(null);
  };

  /**
   * Check if all required permissions are granted
   */
  const allRequiredGranted = permissions
    .filter((p) => p.required)
    .every((p) => p.enabled);

  /**
   * Continue to app
   */
  const handleContinue = () => {
    if (!allRequiredGranted) {
      Alert.alert(
        "Required Permissions",
        "Please enable location access to continue. This is required for event check-in functionality.",
        [{ text: "OK" }],
      );
      return;
    }

    router.back();
  };

  /**
   * Permission Item Component
   */
  const PermissionItem: React.FC<{ permission: PermissionConfig }> = ({
    permission,
  }) => {
    const checkScale = useSharedValue(permission.enabled ? 1 : 0);

    useEffect(() => {
      if (permission.enabled) {
        checkScale.value = withSequence(
          withTiming(0, { duration: 0 }),
          withSpring(1, { damping: 10, stiffness: 200 }),
        );
      } else {
        checkScale.value = withTiming(0, { duration: 200 });
      }
    }, [permission.enabled]);

    const checkAnimatedStyle = useAnimatedStyle(() => ({
      transform: [{ scale: checkScale.value }],
    }));

    const isRequesting = requesting === permission.id || requesting === "all";

    return (
      <Card
        style={[
          styles.permissionCard,
          permission.enabled ? styles.permissionEnabled : undefined,
        ]}
      >
        <View style={styles.permissionHeader}>
          <View
            style={[
              styles.iconContainer,
              permission.enabled
                ? styles.iconContainerEnabled
                : styles.iconContainerDisabled,
            ]}
          >
            <Ionicons
              name={permission.icon}
              size={24}
              color={
                permission.enabled ? Colors.text.primary : Colors.text.tertiary
              }
            />
          </View>

          <View style={styles.permissionInfo}>
            <View style={styles.titleRow}>
              <Text style={styles.permissionTitle}>{permission.title}</Text>
              {permission.required && (
                <View style={styles.requiredBadge}>
                  <Text style={styles.requiredText}>Required</Text>
                </View>
              )}
            </View>
            <Text style={styles.permissionDescription}>
              {permission.description}
            </Text>
          </View>

          {permission.enabled ? (
            <Animated.View style={[styles.checkmark, checkAnimatedStyle]}>
              <Ionicons
                name="checkmark-circle"
                size={28}
                color={Colors.status.success}
              />
            </Animated.View>
          ) : (
            <Button
              title="Enable"
              size="small"
              variant="secondary"
              onPress={permission.onRequest}
              loading={isRequesting}
              style={styles.enableButton}
            />
          )}
        </View>
      </Card>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color={Colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.title}>Permissions</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Intro */}
        <View style={styles.intro}>
          <View style={styles.introIcon}>
            <Ionicons
              name="shield-checkmark"
              size={48}
              color={Colors.primary.accent}
            />
          </View>
          <Text style={styles.introTitle}>App Permissions</Text>
          <Text style={styles.introDescription}>
            To provide the best experience, we need access to some device
            features. Your data is secure and never shared without your consent.
          </Text>
        </View>

        {/* Permission List */}
        <View style={styles.permissionsList}>
          {permissions.map((permission) => (
            <PermissionItem key={permission.id} permission={permission} />
          ))}
        </View>

        {/* Request All Button */}
        {!permissions.every((p) => p.enabled) && (
          <Button
            title="Enable All Permissions"
            onPress={handleRequestAll}
            variant="secondary"
            loading={requesting === "all"}
            style={styles.requestAllButton}
          />
        )}

        {/* Privacy Note */}
        <View style={styles.privacyNote}>
          <Ionicons name="lock-closed" size={16} color={Colors.text.tertiary} />
          <Text style={styles.privacyText}>
            We value your privacy. Location data is only used during events and
            is never sold to third parties.{" "}
            <Text
              style={styles.privacyLink}
              onPress={() => Linking.openURL("https://example.com/privacy")}
            >
              Learn more
            </Text>
          </Text>
        </View>
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <Button
          title={allRequiredGranted ? "Continue" : "Skip for Now"}
          onPress={handleContinue}
          variant={allRequiredGranted ? "primary" : "secondary"}
          fullWidth
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.primary,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.primary,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.semibold,
    color: Colors.text.primary,
  },
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.md,
    paddingBottom: Spacing.xxl,
  },
  intro: {
    alignItems: "center",
    paddingVertical: Spacing.xl,
  },
  introIcon: {
    width: 80,
    height: 80,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.background.elevated,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.md,
  },
  introTitle: {
    fontSize: FontSizes.xl,
    fontWeight: FontWeights.bold,
    color: Colors.text.primary,
    marginBottom: Spacing.sm,
  },
  introDescription: {
    fontSize: FontSizes.md,
    color: Colors.text.secondary,
    textAlign: "center",
    lineHeight: 22,
    paddingHorizontal: Spacing.md,
  },
  permissionsList: {
    gap: Spacing.md,
  },
  permissionCard: {
    padding: Spacing.md,
  },
  permissionEnabled: {
    borderColor: Colors.status.success,
    borderWidth: 1,
  },
  permissionHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  iconContainerEnabled: {
    backgroundColor: Colors.status.success,
  },
  iconContainerDisabled: {
    backgroundColor: Colors.background.elevated,
  },
  permissionInfo: {
    flex: 1,
    marginLeft: Spacing.md,
    marginRight: Spacing.sm,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  permissionTitle: {
    fontSize: FontSizes.md,
    fontWeight: FontWeights.semibold,
    color: Colors.text.primary,
  },
  requiredBadge: {
    backgroundColor: Colors.status.error,
    paddingHorizontal: Spacing.xs,
    paddingVertical: 2,
    borderRadius: BorderRadius.xs,
  },
  requiredText: {
    fontSize: FontSizes.xs,
    fontWeight: FontWeights.medium,
    color: Colors.text.primary,
  },
  permissionDescription: {
    fontSize: FontSizes.sm,
    color: Colors.text.secondary,
    lineHeight: 18,
  },
  checkmark: {
    width: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  enableButton: {
    minWidth: 80,
  },
  requestAllButton: {
    marginTop: Spacing.lg,
  },
  privacyNote: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginTop: Spacing.xl,
    padding: Spacing.md,
    backgroundColor: Colors.background.elevated,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
  },
  privacyText: {
    flex: 1,
    fontSize: FontSizes.sm,
    color: Colors.text.tertiary,
    lineHeight: 20,
  },
  privacyLink: {
    color: Colors.primary.accent,
    textDecorationLine: "underline",
  },
  footer: {
    padding: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border.primary,
    backgroundColor: Colors.background.secondary,
  },
});

export default PermissionsScreen;
