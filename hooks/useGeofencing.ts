/**
 * useGeofencing Hook
 * Handles automatic check-in/check-out based on event location
 */

import * as Haptics from "expo-haptics";
import * as Location from "expo-location";
import * as TaskManager from "expo-task-manager";
import { useCallback, useEffect, useRef, useState } from "react";
import { useAuthStore } from "../stores/authStore";
import { useEventsStore } from "../stores/eventsStore";
import { usePermissionsStore } from "../stores/permissionsStore";
import { Event } from "../types";

// Task name for background geofencing
const GEOFENCING_TASK = "event-geofencing-task";

interface GeofenceRegion {
  identifier: string;
  latitude: number;
  longitude: number;
  radius: number;
  notifyOnEnter: boolean;
  notifyOnExit: boolean;
}

interface GeofenceEvent {
  eventType: Location.GeofencingEventType;
  region: GeofenceRegion;
}

interface UseGeofencingResult {
  isMonitoring: boolean;
  currentEventId: string | null;
  isInsideEvent: boolean;
  startMonitoring: (events: Event[]) => Promise<void>;
  stopMonitoring: () => Promise<void>;
  checkCurrentPosition: () => Promise<void>;
  error: string | null;
}

// Store callback for geofence events
let geofenceCallback: ((event: GeofenceEvent) => void) | null = null;

// Define the background task
TaskManager.defineTask(
  GEOFENCING_TASK,
  async ({ data, error }: any): Promise<void> => {
    if (error) {
      console.error("Geofencing task error:", error);
      return;
    }

    if (data && geofenceCallback) {
      const { eventType, region } = data;
      geofenceCallback({ eventType, region });
    }
  },
);

export const useGeofencing = (): UseGeofencingResult => {
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [currentEventId, setCurrentEventId] = useState<string | null>(null);
  const [isInsideEvent, setIsInsideEvent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const monitoredEventsRef = useRef<Event[]>([]);

  const { user } = useAuthStore();
  const { checkIn, fetchCheckIns, getLatestCheckIn } = useEventsStore();
  const { permissions, requestLocationBackground } = usePermissionsStore();

  /**
   * Handle geofence events (enter/exit)
   */
  const handleGeofenceEvent = useCallback(
    async (event: GeofenceEvent) => {
      const { eventType, region } = event;
      const eventId = region.identifier;

      if (!user) return;

      console.log(
        `Geofence event: ${eventType === Location.GeofencingEventType.Enter ? "Enter" : "Exit"} - ${eventId}`,
      );

      try {
        if (eventType === Location.GeofencingEventType.Enter) {
          // User entered event venue - check in
          setCurrentEventId(eventId);
          setIsInsideEvent(true);

          // Get current position for check-in
          const location = await Location.getCurrentPositionAsync();

          await checkIn(user.id, eventId, "check_in", {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          });

          // Haptic feedback for check-in
          await Haptics.notificationAsync(
            Haptics.NotificationFeedbackType.Success,
          );
        } else if (eventType === Location.GeofencingEventType.Exit) {
          // User left event venue - check out
          setIsInsideEvent(false);

          // Get current position for check-out
          const location = await Location.getCurrentPositionAsync();

          await checkIn(user.id, eventId, "check_out", {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          });

          // Haptic feedback for check-out
          await Haptics.notificationAsync(
            Haptics.NotificationFeedbackType.Warning,
          );

          setCurrentEventId(null);
        }
      } catch (err: any) {
        console.error("Handle geofence event error:", err);
        setError(err.message);
      }
    },
    [user, checkIn],
  );

  /**
   * Start monitoring events for geofencing
   */
  const startMonitoring = useCallback(
    async (events: Event[]) => {
      try {
        setError(null);

        // Check background location permission
        if (permissions.location_background !== "granted") {
          const status = await requestLocationBackground();
          if (status !== "granted") {
            throw new Error(
              "Background location permission required for auto check-in",
            );
          }
        }

        // Filter events with valid coordinates
        const validEvents = events.filter(
          (e) => e.latitude && e.longitude && e.radius_meters,
        );

        if (validEvents.length === 0) {
          console.log("No events with valid coordinates to monitor");
          return;
        }

        // Create geofence regions
        const regions: GeofenceRegion[] = validEvents.map((event) => ({
          identifier: event.id,
          latitude: event.latitude,
          longitude: event.longitude,
          radius: event.radius_meters,
          notifyOnEnter: true,
          notifyOnExit: true,
        }));

        // Set up callback
        geofenceCallback = handleGeofenceEvent;

        // Start geofencing
        await Location.startGeofencingAsync(GEOFENCING_TASK, regions);

        monitoredEventsRef.current = validEvents;
        setIsMonitoring(true);

        console.log(
          `Started monitoring ${regions.length} event(s) for geofencing`,
        );
      } catch (err: any) {
        console.error("Start geofencing error:", err);
        setError(err.message);
      }
    },
    [
      permissions.location_background,
      requestLocationBackground,
      handleGeofenceEvent,
    ],
  );

  /**
   * Stop geofencing monitoring
   */
  const stopMonitoring = useCallback(async () => {
    try {
      const hasStarted =
        await Location.hasStartedGeofencingAsync(GEOFENCING_TASK);

      if (hasStarted) {
        await Location.stopGeofencingAsync(GEOFENCING_TASK);
      }

      geofenceCallback = null;
      monitoredEventsRef.current = [];
      setIsMonitoring(false);
      setCurrentEventId(null);
      setIsInsideEvent(false);

      console.log("Stopped geofencing monitoring");
    } catch (err: any) {
      console.error("Stop geofencing error:", err);
      setError(err.message);
    }
  }, []);

  /**
   * Manually check if user is inside any event venue
   */
  const checkCurrentPosition = useCallback(async () => {
    try {
      if (permissions.location_foreground !== "granted") {
        throw new Error("Location permission required");
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const { latitude, longitude } = location.coords;

      // Check against all monitored events
      for (const event of monitoredEventsRef.current) {
        const distance = calculateDistance(
          latitude,
          longitude,
          event.latitude,
          event.longitude,
        );

        if (distance <= event.radius_meters) {
          setCurrentEventId(event.id);
          setIsInsideEvent(true);
          return;
        }
      }

      setCurrentEventId(null);
      setIsInsideEvent(false);
    } catch (err: any) {
      console.error("Check position error:", err);
      setError(err.message);
    }
  }, [permissions.location_foreground]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Don't stop monitoring on unmount - let it run in background
    };
  }, []);

  return {
    isMonitoring,
    currentEventId,
    isInsideEvent,
    startMonitoring,
    stopMonitoring,
    checkCurrentPosition,
    error,
  };
};

/**
 * Calculate distance between two coordinates using Haversine formula
 */
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
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
}

export default useGeofencing;
