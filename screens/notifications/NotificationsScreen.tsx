/**
 * Notifications Screen
 * Shows notifications like friend activity and nearby events
 *
 * Features:
 * - Friend joining events notifications
 * - Nearby events notifications
 * - Friend request notifications
 * - Event reminders
 */

import { Icon } from "@/components/TabIcon";
import { router } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    RefreshControl,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Avatar, Card, EmptyState } from "../../components/ui";
import {
    BorderRadius,
    Colors,
    FontSizes,
    FontWeights,
    Spacing,
} from "../../constants/theme";
import { supabase } from "../../services/supabase";
import { useAuthStore } from "../../stores/authStore";
import { useEventsStore } from "../../stores/eventsStore";
import { useSocialStore } from "../../stores/socialStore";

// Notification types
type NotificationType =
  | "friend_joining_event"
  | "nearby_event"
  | "friend_request"
  | "event_reminder"
  | "new_message";

interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  data?: {
    userId?: string;
    eventId?: string;
    userName?: string;
    userAvatar?: string;
    eventTitle?: string;
    eventDate?: string;
  };
}

export const NotificationsScreen: React.FC = () => {
  const { user } = useAuthStore();
  const { events, fetchEvents } = useEventsStore();
  const { friends, pendingRequests, fetchFriends } = useSocialStore();

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  /**
   * Generate notifications from real data
   */
  const generateNotifications = useCallback(async () => {
    if (!user) return;

    const notifs: Notification[] = [];
    const now = new Date();

    // 1. Friend request notifications
    pendingRequests.forEach((request) => {
      const friend = request.friend;
      if (friend) {
        notifs.push({
          id: `friend-request-${request.id}`,
          type: "friend_request",
          title: "New Connection Request",
          message: `${friend.name} wants to connect with you`,
          timestamp: request.created_at,
          read: false,
          data: {
            userId: friend.id,
            userName: friend.name,
            userAvatar: friend.avatar_url,
          },
        });
      }
    });

    // 2. Get friends' registrations for events
    try {
      const friendIds = friends.map((f) => f.friend?.id).filter(Boolean);

      if (friendIds.length > 0) {
        const { data: friendRegistrations } = await supabase
          .from("registrations")
          .select(
            `
            *,
            user:users!registrations_user_id_fkey(*),
            event:events!registrations_event_id_fkey(*)
          `,
          )
          .in("user_id", friendIds)
          .gte(
            "registered_at",
            new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          );

        friendRegistrations?.forEach((reg: any) => {
          if (reg.user && reg.event) {
            notifs.push({
              id: `friend-event-${reg.id}`,
              type: "friend_joining_event",
              title: "Friend Joining Event",
              message: `${reg.user.name} is attending ${reg.event.title}`,
              timestamp: reg.registered_at,
              read: false,
              data: {
                userId: reg.user.id,
                eventId: reg.event.id,
                userName: reg.user.name,
                userAvatar: reg.user.avatar_url,
                eventTitle: reg.event.title,
                eventDate: reg.event.start_date,
              },
            });
          }
        });
      }
    } catch (error) {
      console.error("Error fetching friend registrations:", error);
    }

    // 3. Nearby/Upcoming events notifications
    const upcomingEvents = events.filter((event) => {
      const eventDate = new Date(event.start_date);
      const daysUntil =
        (eventDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
      return daysUntil > 0 && daysUntil <= 30;
    });

    upcomingEvents.slice(0, 3).forEach((event) => {
      const eventDate = new Date(event.start_date);
      const daysUntil = Math.ceil(
        (eventDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
      );

      notifs.push({
        id: `nearby-event-${event.id}`,
        type: "nearby_event",
        title: "Upcoming Event Near You",
        message: `${event.title} starts in ${daysUntil} day${daysUntil !== 1 ? "s" : ""}`,
        timestamp: new Date(
          now.getTime() - Math.random() * 24 * 60 * 60 * 1000,
        ).toISOString(),
        read: true,
        data: {
          eventId: event.id,
          eventTitle: event.title,
          eventDate: event.start_date,
        },
      });
    });

    // 4. Get user's registered events for reminders
    try {
      const { data: userRegistrations } = await supabase
        .from("registrations")
        .select(
          `
          *,
          event:events!registrations_event_id_fkey(*)
        `,
        )
        .eq("user_id", user.id);

      userRegistrations?.forEach((reg: any) => {
        if (reg.event) {
          const eventDate = new Date(reg.event.start_date);
          const daysUntil =
            (eventDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);

          if (daysUntil > 0 && daysUntil <= 7) {
            notifs.push({
              id: `reminder-${reg.id}`,
              type: "event_reminder",
              title: "Event Reminder",
              message: `${reg.event.title} is coming up in ${Math.ceil(daysUntil)} day${Math.ceil(daysUntil) !== 1 ? "s" : ""}!`,
              timestamp: new Date(
                now.getTime() - 2 * 60 * 60 * 1000,
              ).toISOString(),
              read: false,
              data: {
                eventId: reg.event.id,
                eventTitle: reg.event.title,
                eventDate: reg.event.start_date,
              },
            });
          }
        }
      });
    } catch (error) {
      console.error("Error fetching user registrations:", error);
    }

    // Sort by timestamp (newest first)
    notifs.sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    );

    setNotifications(notifs);
  }, [user, friends, pendingRequests, events]);

  useEffect(() => {
    const loadData = async () => {
      if (!user) return;
      setLoading(true);

      await Promise.all([fetchFriends(user.id), fetchEvents()]);

      setLoading(false);
    };

    loadData();
  }, [user]);

  useEffect(() => {
    if (!loading) {
      generateNotifications();
    }
  }, [loading, friends, pendingRequests, events, generateNotifications]);

  const handleRefresh = useCallback(async () => {
    if (!user) return;
    setRefreshing(true);
    await Promise.all([fetchFriends(user.id), fetchEvents()]);
    await generateNotifications();
    setRefreshing(false);
  }, [user, generateNotifications]);

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const getNotificationIcon = (type: NotificationType): string => {
    switch (type) {
      case "friend_joining_event":
        return "people";
      case "nearby_event":
        return "location";
      case "friend_request":
        return "person-add";
      case "event_reminder":
        return "calendar";
      case "new_message":
        return "chatbubble";
      default:
        return "notifications";
    }
  };

  const getNotificationColor = (type: NotificationType): string => {
    switch (type) {
      case "friend_joining_event":
        return Colors.status.success;
      case "nearby_event":
        return Colors.primary.accent;
      case "friend_request":
        return Colors.status.info;
      case "event_reminder":
        return Colors.status.warning;
      case "new_message":
        return Colors.primary.accent;
      default:
        return Colors.text.tertiary;
    }
  };

  const handleNotificationPress = (notification: Notification) => {
    switch (notification.type) {
      case "friend_joining_event":
        if (notification.data?.eventId) {
          router.push(`/event/${notification.data.eventId}`);
        }
        break;
      case "nearby_event":
        if (notification.data?.eventId) {
          router.push(`/event/${notification.data.eventId}`);
        }
        break;
      case "friend_request":
        // Navigate to social tab
        router.push("/(tabs)/social");
        break;
      case "event_reminder":
        if (notification.data?.eventId) {
          router.push(`/event/${notification.data.eventId}`);
        }
        break;
      case "new_message":
        if (notification.data?.userId) {
          router.push(`/chat/${notification.data.userId}`);
        }
        break;
    }
  };

  const renderNotification = ({ item }: { item: Notification }) => {
    const iconName = getNotificationIcon(item.type);
    const iconColor = getNotificationColor(item.type);

    return (
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => handleNotificationPress(item)}
      >
        <Card
          variant="default"
          style={[styles.notificationCard, !item.read && styles.unreadCard]}
        >
          <View style={styles.notificationContent}>
            {/* Icon or Avatar */}
            {item.data?.userAvatar ? (
              <View style={styles.avatarContainer}>
                <Avatar
                  source={item.data.userAvatar}
                  name={item.data.userName || "User"}
                  size="medium"
                />
                <View
                  style={[styles.iconBadge, { backgroundColor: iconColor }]}
                >
                  <Icon
                    name={iconName as any}
                    size={10}
                    color={Colors.text.inverse}
                  />
                </View>
              </View>
            ) : (
              <View
                style={[
                  styles.iconContainer,
                  { backgroundColor: `${iconColor}20` },
                ]}
              >
                <Icon name={iconName as any} size={24} color={iconColor} />
              </View>
            )}

            {/* Content */}
            <View style={styles.textContainer}>
              <Text style={styles.notificationTitle}>{item.title}</Text>
              <Text style={styles.notificationMessage} numberOfLines={2}>
                {item.message}
              </Text>
              <Text style={styles.notificationTime}>
                {formatTime(item.timestamp)}
              </Text>
            </View>

            {/* Unread indicator */}
            {!item.read && <View style={styles.unreadDot} />}
          </View>
        </Card>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Notifications</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary.accent} />
          <Text style={styles.loadingText}>Loading notifications...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Notifications</Text>
        {notifications.filter((n) => !n.read).length > 0 && (
          <View style={styles.headerBadge}>
            <Text style={styles.headerBadgeText}>
              {notifications.filter((n) => !n.read).length}
            </Text>
          </View>
        )}
      </View>

      {/* Notifications List */}
      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        renderItem={renderNotification}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[Colors.primary.accent]}
            tintColor={Colors.primary.accent}
          />
        }
        ListEmptyComponent={
          <EmptyState
            icon="notifications-outline"
            title="No notifications yet"
            description="You'll see updates about events and connections here"
          />
        }
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
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
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
  },
  headerTitle: {
    fontSize: FontSizes.xxl,
    fontWeight: FontWeights.bold,
    color: Colors.text.primary,
  },
  headerBadge: {
    marginLeft: Spacing.sm,
    backgroundColor: Colors.primary.accent,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
    minWidth: 24,
    alignItems: "center",
  },
  headerBadgeText: {
    fontSize: FontSizes.xs,
    fontWeight: FontWeights.bold,
    color: Colors.text.inverse,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    marginTop: Spacing.md,
    fontSize: FontSizes.md,
    color: Colors.text.secondary,
  },
  listContent: {
    paddingHorizontal: Spacing.md,
    paddingBottom: 100,
  },
  notificationCard: {
    padding: Spacing.md,
  },
  unreadCard: {
    backgroundColor: Colors.background.secondary,
    borderLeftWidth: 3,
    borderLeftColor: Colors.primary.accent,
  },
  notificationContent: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  avatarContainer: {
    position: "relative",
    marginRight: Spacing.md,
  },
  iconBadge: {
    position: "absolute",
    bottom: -2,
    right: -2,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: Colors.background.primary,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.full,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
  },
  textContainer: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: FontSizes.md,
    fontWeight: FontWeights.semibold,
    color: Colors.text.primary,
    marginBottom: 2,
  },
  notificationMessage: {
    fontSize: FontSizes.sm,
    color: Colors.text.secondary,
    lineHeight: 20,
    marginBottom: 4,
  },
  notificationTime: {
    fontSize: FontSizes.xs,
    color: Colors.text.tertiary,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary.accent,
    marginLeft: Spacing.sm,
    marginTop: 4,
  },
  separator: {
    height: Spacing.sm,
  },
});

export default NotificationsScreen;
