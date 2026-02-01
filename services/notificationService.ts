/**
 * Notification Service
 * Handle push notifications for the app
 */

import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { supabase } from "./supabase";

/**
 * Notification types
 */
export type NotificationType =
  | "event_reminder"
  | "check_in_reminder"
  | "friend_request"
  | "message"
  | "event_update"
  | "ai_match";

/**
 * Notification data structure
 */
export interface NotificationData {
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, string>;
}

/**
 * Configure notification handler
 */
export const configureNotifications = async () => {
  // Set notification handler
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
};

/**
 * Request notification permissions
 */
export const requestNotificationPermissions = async (): Promise<boolean> => {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== "granted") {
    console.log("Notification permission not granted");
    return false;
  }

  return true;
};

/**
 * Get push notification token
 */
export const getPushToken = async (): Promise<string | null> => {
  try {
    const hasPermission = await requestNotificationPermissions();
    if (!hasPermission) return null;

    // Configure for Android
    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("default", {
        name: "Default",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#4654A1",
      });
    }

    const token = await Notifications.getExpoPushTokenAsync({
      projectId: "your-project-id", // Replace with your Expo project ID
    });

    return token.data;
  } catch (error) {
    console.error("Error getting push token:", error);
    return null;
  }
};

/**
 * Save push token to user profile
 */
export const savePushToken = async (userId: string, token: string) => {
  try {
    const { error } = await supabase
      .from("users")
      .update({ push_token: token })
      .eq("id", userId);

    if (error) throw error;
    console.log("Push token saved");
  } catch (error) {
    console.error("Error saving push token:", error);
  }
};

/**
 * Schedule a local notification
 */
export const scheduleLocalNotification = async (
  notification: NotificationData,
  trigger?: Notifications.NotificationTriggerInput,
) => {
  try {
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: notification.title,
        body: notification.body,
        data: {
          type: notification.type,
          ...notification.data,
        },
        sound: true,
      },
      trigger: trigger || null, // null = immediate
    });

    return id;
  } catch (error) {
    console.error("Error scheduling notification:", error);
    return null;
  }
};

/**
 * Schedule event reminder notification
 */
export const scheduleEventReminder = async (
  eventId: string,
  eventTitle: string,
  eventDate: Date,
  minutesBefore: number = 30,
) => {
  const triggerDate = new Date(eventDate.getTime() - minutesBefore * 60 * 1000);

  if (triggerDate <= new Date()) {
    console.log("Event reminder time has passed");
    return null;
  }

  return scheduleLocalNotification(
    {
      type: "event_reminder",
      title: "Event Starting Soon",
      body: `${eventTitle} starts in ${minutesBefore} minutes`,
      data: { eventId },
    },
    { type: "date", date: triggerDate } as Notifications.DateTriggerInput,
  );
};

/**
 * Cancel a scheduled notification
 */
export const cancelNotification = async (notificationId: string) => {
  try {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  } catch (error) {
    console.error("Error canceling notification:", error);
  }
};

/**
 * Cancel all scheduled notifications
 */
export const cancelAllNotifications = async () => {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch (error) {
    console.error("Error canceling all notifications:", error);
  }
};

/**
 * Get badge count
 */
export const getBadgeCount = async (): Promise<number> => {
  return Notifications.getBadgeCountAsync();
};

/**
 * Set badge count
 */
export const setBadgeCount = async (count: number) => {
  await Notifications.setBadgeCountAsync(count);
};

/**
 * Clear badge
 */
export const clearBadge = async () => {
  await Notifications.setBadgeCountAsync(0);
};

/**
 * Add notification received listener
 */
export const addNotificationReceivedListener = (
  callback: (notification: Notifications.Notification) => void,
) => {
  return Notifications.addNotificationReceivedListener(callback);
};

/**
 * Add notification response listener (when user taps notification)
 */
export const addNotificationResponseListener = (
  callback: (response: Notifications.NotificationResponse) => void,
) => {
  return Notifications.addNotificationResponseReceivedListener(callback);
};

/**
 * Get last notification response (for deep linking)
 */
export const getLastNotificationResponse = async () => {
  return Notifications.getLastNotificationResponseAsync();
};

/**
 * Default export
 */
export const notificationService = {
  configure: configureNotifications,
  requestPermissions: requestNotificationPermissions,
  getPushToken,
  savePushToken,
  scheduleNotification: scheduleLocalNotification,
  scheduleEventReminder,
  cancelNotification,
  cancelAllNotifications,
  getBadgeCount,
  setBadgeCount,
  clearBadge,
  addReceivedListener: addNotificationReceivedListener,
  addResponseListener: addNotificationResponseListener,
  getLastResponse: getLastNotificationResponse,
};
