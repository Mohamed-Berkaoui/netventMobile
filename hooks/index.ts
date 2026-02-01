/**
 * Hooks exports
 * Central export file for all custom hooks
 */

export { useAuth, default as useAuthHook } from "./useAuth";
export { useBluetooth, default as useBluetoothHook } from "./useBluetooth";
export { useGeofencing, default as useGeofencingHook } from "./useGeofencing";
export { useLocation, default as useLocationHook } from "./useLocation";

// Re-export existing hooks if they exist
export * from "./use-color-scheme";
export * from "./use-theme-color";

