/**
 * Permissions Store
 * Manages location, Bluetooth and notification permissions
 */

import * as Location from "expo-location";
import * as Notifications from "expo-notifications";
import { Alert, Linking, Platform } from "react-native";
import { create } from "zustand";
import { Permissions, PermissionStatus } from "../types";

export interface PermissionsState {
  // State
  permissions: Permissions;
  loading: boolean;
  notificationsEnabled: boolean;

  // Computed convenience getters
  locationEnabled: boolean;
  bluetoothEnabled: boolean;

  // Actions
  checkPermissions: () => Promise<void>;
  requestLocationForeground: () => Promise<PermissionStatus>;
  requestLocationBackground: () => Promise<PermissionStatus>;
  requestBluetooth: () => Promise<PermissionStatus>;
  requestNotifications: () => Promise<PermissionStatus>;
  requestAllPermissions: () => Promise<void>;
  openSettings: () => void;

  // Convenience setters (for UI updates)
  setLocationEnabled: (enabled: boolean) => void;
  setBluetoothEnabled: (enabled: boolean) => void;
  setNotificationsEnabled: (enabled: boolean) => void;
}

export const usePermissionsStore = create<PermissionsState>((set, get) => ({
  // Initial State
  permissions: {
    location_foreground: "undetermined",
    location_background: "undetermined",
    bluetooth: "undetermined",
  },
  loading: false,
  notificationsEnabled: false,

  // Computed getters (will be updated when permissions change)
  locationEnabled: false,
  bluetoothEnabled: false,

  /**
   * Check current permission status
   */
  checkPermissions: async () => {
    try {
      set({ loading: true });

      // Check foreground location
      const { status: foregroundStatus } =
        await Location.getForegroundPermissionsAsync();

      // Check background location
      const { status: backgroundStatus } =
        await Location.getBackgroundPermissionsAsync();

      // Check notifications
      const { status: notifStatus } = await Notifications.getPermissionsAsync();

      const locationEnabled = foregroundStatus === "granted";
      const notificationsEnabled = notifStatus === "granted";

      set({
        permissions: {
          location_foreground: foregroundStatus as PermissionStatus,
          location_background: backgroundStatus as PermissionStatus,
          bluetooth: "undetermined", // Will be set when needed
        },
        locationEnabled,
        notificationsEnabled,
        loading: false,
      });
    } catch (error) {
      console.error("Check permissions error:", error);
      set({ loading: false });
    }
  },

  /**
   * Request foreground location permission
   */
  requestLocationForeground: async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();

      set((state) => ({
        permissions: {
          ...state.permissions,
          location_foreground: status as PermissionStatus,
        },
        locationEnabled: status === "granted",
      }));

      if (status === "denied") {
        Alert.alert(
          "Location Permission Required",
          "This app needs location access to check you into events automatically. Please enable location access in your device settings.",
          [
            { text: "Cancel", style: "cancel" },
            { text: "Open Settings", onPress: () => get().openSettings() },
          ],
        );
      }

      return status as PermissionStatus;
    } catch (error) {
      console.error("Request foreground location error:", error);
      return "denied" as PermissionStatus;
    }
  },

  /**
   * Request background location permission
   * Must be called after foreground permission is granted
   */
  requestLocationBackground: async () => {
    try {
      const { permissions } = get();

      // Foreground must be granted first
      if (permissions.location_foreground !== "granted") {
        await get().requestLocationForeground();
      }

      const { status } = await Location.requestBackgroundPermissionsAsync();

      set((state) => ({
        permissions: {
          ...state.permissions,
          location_background: status as PermissionStatus,
        },
      }));

      if (status === "denied") {
        Alert.alert(
          "Background Location Required",
          'For automatic check-in/check-out at events, please enable "Always" location access in settings.',
          [
            { text: "Cancel", style: "cancel" },
            { text: "Open Settings", onPress: () => get().openSettings() },
          ],
        );
      }

      return status as PermissionStatus;
    } catch (error) {
      console.error("Request background location error:", error);
      return "denied" as PermissionStatus;
    }
  },

  /**
   * Request Bluetooth permission
   * Note: Bluetooth permissions are handled differently per platform
   */
  requestBluetooth: async () => {
    try {
      // On iOS, Bluetooth is typically enabled/disabled system-wide
      // On Android, we need BLUETOOTH and BLUETOOTH_ADMIN permissions

      if (Platform.OS === "android") {
        // For Android, we would use expo-bluetooth or similar
        // This is a placeholder for the actual implementation
        set((state) => ({
          permissions: {
            ...state.permissions,
            bluetooth: "granted",
          },
        }));
        return "granted" as PermissionStatus;
      } else {
        // iOS - Bluetooth access through CoreBluetooth
        set((state) => ({
          permissions: {
            ...state.permissions,
            bluetooth: "granted",
          },
        }));
        return "granted" as PermissionStatus;
      }
    } catch (error) {
      console.error("Request Bluetooth error:", error);
      return "denied" as PermissionStatus;
    }
  },

  /**
   * Request all required permissions
   */
  requestAllPermissions: async () => {
    set({ loading: true });

    await get().requestLocationForeground();
    await get().requestLocationBackground();
    await get().requestBluetooth();

    set({ loading: false });
  },

  /**
   * Open device settings for permission management
   */
  openSettings: () => {
    if (Platform.OS === "ios") {
      Linking.openURL("app-settings:");
    } else {
      Linking.openSettings();
    }
  },

  /**
   * Request notification permission
   */
  requestNotifications: async () => {
    try {
      const { status } = await Notifications.requestPermissionsAsync();

      set({ notificationsEnabled: status === "granted" });

      if (status === "denied") {
        Alert.alert(
          "Notifications Required",
          "Enable notifications to receive event reminders and updates.",
          [
            { text: "Cancel", style: "cancel" },
            { text: "Open Settings", onPress: () => get().openSettings() },
          ],
        );
      }

      return status as PermissionStatus;
    } catch (error) {
      console.error("Request notifications error:", error);
      return "denied" as PermissionStatus;
    }
  },

  /**
   * Convenience setters for UI updates
   */
  setLocationEnabled: (enabled: boolean) => {
    set({ locationEnabled: enabled });
  },

  setBluetoothEnabled: (enabled: boolean) => {
    set({ bluetoothEnabled: enabled });
  },

  setNotificationsEnabled: (enabled: boolean) => {
    set({ notificationsEnabled: enabled });
  },
}));
