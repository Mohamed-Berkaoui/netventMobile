/**
 * useLocation Hook
 * Custom hook for location tracking and management
 */

import * as Location from "expo-location";
import { useCallback, useEffect, useRef, useState } from "react";
import { usePermissionsStore } from "../stores/permissionsStore";

interface LocationData {
  latitude: number;
  longitude: number;
  accuracy: number | null;
  altitude: number | null;
  heading: number | null;
  speed: number | null;
  timestamp: number;
}

interface UseLocationOptions {
  enableHighAccuracy?: boolean;
  distanceInterval?: number; // meters
  timeInterval?: number; // milliseconds
}

export const useLocation = (options: UseLocationOptions = {}) => {
  const {
    enableHighAccuracy = true,
    distanceInterval = 10,
    timeInterval = 5000,
  } = options;

  const [location, setLocation] = useState<LocationData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [watching, setWatching] = useState(false);

  const watcherRef = useRef<Location.LocationSubscription | null>(null);
  const { permissions, requestLocationForeground } = usePermissionsStore();

  /**
   * Get current location once
   */
  const getCurrentLocation = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Check permission
      if (permissions.location_foreground !== "granted") {
        const status = await requestLocationForeground();
        if (status !== "granted") {
          throw new Error("Location permission not granted");
        }
      }

      const result = await Location.getCurrentPositionAsync({
        accuracy: enableHighAccuracy
          ? Location.Accuracy.High
          : Location.Accuracy.Balanced,
      });

      const locationData: LocationData = {
        latitude: result.coords.latitude,
        longitude: result.coords.longitude,
        accuracy: result.coords.accuracy,
        altitude: result.coords.altitude,
        heading: result.coords.heading,
        speed: result.coords.speed,
        timestamp: result.timestamp,
      };

      setLocation(locationData);
      setLoading(false);

      return locationData;
    } catch (err: any) {
      console.error("Get location error:", err);
      setError(err.message);
      setLoading(false);
      return null;
    }
  }, [
    permissions.location_foreground,
    requestLocationForeground,
    enableHighAccuracy,
  ]);

  /**
   * Start watching location
   */
  const startWatching = useCallback(async () => {
    try {
      setError(null);

      // Check permission
      if (permissions.location_foreground !== "granted") {
        const status = await requestLocationForeground();
        if (status !== "granted") {
          throw new Error("Location permission not granted");
        }
      }

      // Stop existing watcher
      if (watcherRef.current) {
        watcherRef.current.remove();
      }

      watcherRef.current = await Location.watchPositionAsync(
        {
          accuracy: enableHighAccuracy
            ? Location.Accuracy.High
            : Location.Accuracy.Balanced,
          distanceInterval,
          timeInterval,
        },
        (result) => {
          const locationData: LocationData = {
            latitude: result.coords.latitude,
            longitude: result.coords.longitude,
            accuracy: result.coords.accuracy,
            altitude: result.coords.altitude,
            heading: result.coords.heading,
            speed: result.coords.speed,
            timestamp: result.timestamp,
          };

          setLocation(locationData);
        },
      );

      setWatching(true);
    } catch (err: any) {
      console.error("Watch location error:", err);
      setError(err.message);
    }
  }, [
    permissions.location_foreground,
    requestLocationForeground,
    enableHighAccuracy,
    distanceInterval,
    timeInterval,
  ]);

  /**
   * Stop watching location
   */
  const stopWatching = useCallback(() => {
    if (watcherRef.current) {
      watcherRef.current.remove();
      watcherRef.current = null;
    }
    setWatching(false);
  }, []);

  /**
   * Calculate distance between two coordinates in meters
   */
  const calculateDistance = useCallback(
    (lat1: number, lon1: number, lat2: number, lon2: number): number => {
      const R = 6371e3; // Earth's radius in meters
      const φ1 = (lat1 * Math.PI) / 180;
      const φ2 = (lat2 * Math.PI) / 180;
      const Δφ = ((lat2 - lat1) * Math.PI) / 180;
      const Δλ = ((lon2 - lon1) * Math.PI) / 180;

      const a =
        Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
        Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

      return R * c;
    },
    [],
  );

  /**
   * Check if current location is within a radius of a point
   */
  const isWithinRadius = useCallback(
    (targetLat: number, targetLon: number, radiusMeters: number): boolean => {
      if (!location) return false;

      const distance = calculateDistance(
        location.latitude,
        location.longitude,
        targetLat,
        targetLon,
      );

      return distance <= radiusMeters;
    },
    [location, calculateDistance],
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (watcherRef.current) {
        watcherRef.current.remove();
      }
    };
  }, []);

  return {
    location,
    loading,
    error,
    watching,
    getCurrentLocation,
    startWatching,
    stopWatching,
    calculateDistance,
    isWithinRadius,
  };
};

export default useLocation;
