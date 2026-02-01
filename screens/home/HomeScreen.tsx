/**
 * Home Screen
 * Main dashboard showing welcome, stats, today's schedule, and past events
 * Fetches real data from Supabase
 */

import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
    Image,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Avatar, Card, LoadingSpinner } from "../../components/ui";
import {
    BorderRadius,
    Colors,
    FontSizes,
    FontWeights,
    Shadows,
    Spacing,
} from "../../constants/theme";
import { supabase } from "../../services/supabase";
import { useAuthStore } from "../../stores/authStore";
import { useEventsStore } from "../../stores/eventsStore";
import { AgendaItem, Event } from "../../types";

interface ScheduleItem {
  id: string;
  time: string;
  title: string;
  location: string;
  speaker: string | null;
  type: 'keynote' | 'workshop' | 'panel' | 'break' | 'session';
}

/**
 * Format time string for display
 */
const formatTime = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
};

/**
 * Format date range for display
 */
const formatDateRange = (startDate: string, endDate: string): string => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
  const yearOptions: Intl.DateTimeFormatOptions = { year: 'numeric' };
  
  const startStr = start.toLocaleDateString('en-US', options);
  const endStr = end.toLocaleDateString('en-US', options);
  const year = start.toLocaleDateString('en-US', yearOptions);
  
  if (start.getMonth() === end.getMonth()) {
    return `${startStr}-${end.getDate()}, ${year}`;
  }
  return `${startStr} - ${endStr}, ${year}`;
};

/**
 * Determine session type from title
 */
const getSessionType = (title: string): ScheduleItem['type'] => {
  const lowerTitle = title.toLowerCase();
  if (lowerTitle.includes('keynote') || lowerTitle.includes('opening')) return 'keynote';
  if (lowerTitle.includes('workshop') || lowerTitle.includes('hands-on')) return 'workshop';
  if (lowerTitle.includes('panel') || lowerTitle.includes('discussion')) return 'panel';
  if (lowerTitle.includes('break') || lowerTitle.includes('lunch') || lowerTitle.includes('networking')) return 'break';
  return 'session';
};

export const HomeScreen: React.FC = () => {
  const [refreshing, setRefreshing] = useState(false);
  const [todaysSchedule, setTodaysSchedule] = useState<ScheduleItem[]>([]);
  const [loadingSchedule, setLoadingSchedule] = useState(false);

  const { user } = useAuthStore();
  const { registeredEvents, pastEvents, fetchRegisteredEvents, fetchEvents, loading } = useEventsStore();

  /**
   * Fetch today's agenda items for registered events
   */
  const fetchTodaysSchedule = async () => {
    if (!user || registeredEvents.length === 0) {
      setTodaysSchedule([]);
      return;
    }

    try {
      setLoadingSchedule(true);
      const eventIds = registeredEvents.map((e) => e.id);
      const today = new Date();
      const startOfDay = new Date(today.setHours(0, 0, 0, 0)).toISOString();
      const endOfDay = new Date(today.setHours(23, 59, 59, 999)).toISOString();

      const { data, error } = await supabase
        .from('agenda_items')
        .select('*')
        .in('event_id', eventIds)
        .gte('start_time', startOfDay)
        .lte('start_time', endOfDay)
        .order('start_time', { ascending: true });

      if (error) throw error;

      const scheduleItems: ScheduleItem[] = (data || []).map((item: AgendaItem) => ({
        id: item.id,
        time: formatTime(item.start_time),
        title: item.title,
        location: `${item.location_name} • Floor ${item.floor}`,
        speaker: null, // Speakers could be added to agenda_items table later
        type: getSessionType(item.title),
      }));

      setTodaysSchedule(scheduleItems);
    } catch (error) {
      console.error('Error fetching today\'s schedule:', error);
    } finally {
      setLoadingSchedule(false);
    }
  };

  /**
   * Load initial data
   */
  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (registeredEvents.length > 0) {
      fetchTodaysSchedule();
    }
  }, [registeredEvents]);

  const loadData = async () => {
    await fetchEvents({});
    if (user) {
      await fetchRegisteredEvents(user.id);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [user]);

  /**
   * Calculate days until next event
   */
  const getDaysUntilNextEvent = (): number => {
    const upcomingEvents = registeredEvents.filter(
      (e) => new Date(e.start_date) > new Date(),
    );
    if (upcomingEvents.length === 0) return 0;

    const nextEvent = upcomingEvents.sort(
      (a, b) =>
        new Date(a.start_date).getTime() - new Date(b.start_date).getTime(),
    )[0];

    const diff =
      new Date(nextEvent.start_date).getTime() - new Date().getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  /**
   * Get event type color
   */
  const getEventTypeColor = (type: string): string => {
    switch (type) {
      case "keynote":
        return Colors.primary.accent;
      case "workshop":
        return Colors.status.info;
      case "panel":
        return Colors.status.warning;
      case "break":
        return Colors.status.success;
      default:
        return Colors.text.secondary;
    }
  };

  if (loading && registeredEvents.length === 0) {
    return <LoadingSpinner fullScreen message="Loading your dashboard..." />;
  }

  const daysUntilNext = getDaysUntilNextEvent();
  const totalEvents = registeredEvents.length + pastEvents.length;
  const userName = user?.name?.split(" ")[0] || "Guest";

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.primary.accent}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Home</Text>
          <View style={styles.headerRight}>
            <TouchableOpacity style={styles.notificationButton}>
              <Ionicons
                name="notifications-outline"
                size={24}
                color={Colors.text.primary}
              />
              <View style={styles.notificationBadge} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.push("/edit-profile")}>
              <Avatar
                source={user?.avatar_url}
                name={user?.name}
                size="small"
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Welcome Card */}
        <Card variant="elevated" style={styles.welcomeCard}>
          <View style={styles.welcomeContent}>
            <View style={styles.welcomeLeft}>
              <Text style={styles.welcomeText}>Welcome back,</Text>
              <Text style={styles.welcomeName}>{userName}!</Text>
              <Text style={styles.welcomeSubtext}>
                You have {registeredEvents.length} upcoming events
              </Text>
            </View>
            <Image
              source={{
                uri: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=200",
              }}
              style={styles.welcomeImage}
            />
          </View>
        </Card>

        {/* Stats Cards */}
        <View style={styles.statsRow}>
          <Card variant="outlined" style={styles.statCard}>
            <View style={styles.statIconContainer}>
              <Ionicons
                name="calendar"
                size={20}
                color={Colors.primary.accent}
              />
            </View>
            <Text style={styles.statNumber}>{totalEvents}</Text>
            <Text style={styles.statLabel}>Events Attended</Text>
          </Card>
          <Card variant="outlined" style={styles.statCard}>
            <View
              style={[
                styles.statIconContainer,
                { backgroundColor: Colors.status.info + "20" },
              ]}
            >
              <Ionicons name="time" size={20} color={Colors.status.info} />
            </View>
            <Text style={styles.statNumber}>
              {daysUntilNext > 0 ? daysUntilNext : "--"}
            </Text>
            <Text style={styles.statLabel}>Days Until Next</Text>
          </Card>
        </View>

        {/* Today's Schedule */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Today's Schedule</Text>
            <TouchableOpacity onPress={() => router.push("/(tabs)/badge")}>
              <Text style={styles.viewAll}>View Agenda</Text>
            </TouchableOpacity>
          </View>

          {loadingSchedule ? (
            <View style={styles.scheduleLoading}>
              <LoadingSpinner message="Loading schedule..." />
            </View>
          ) : todaysSchedule.length === 0 ? (
            <Card variant="outlined" style={styles.emptyScheduleCard}>
              <Ionicons name="calendar-outline" size={40} color={Colors.text.tertiary} />
              <Text style={styles.emptyScheduleText}>No sessions scheduled for today</Text>
              <Text style={styles.emptyScheduleSubtext}>
                {registeredEvents.length > 0 
                  ? "Check your agenda for upcoming sessions"
                  : "Register for an event to see your schedule"
                }
              </Text>
            </Card>
          ) : (
            <View style={styles.scheduleList}>
              {todaysSchedule.map((item, index) => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.scheduleItem}
                  activeOpacity={0.7}
                >
                  <View style={styles.scheduleTime}>
                    <Text style={styles.scheduleTimeText}>{item.time}</Text>
                  </View>
                  <View
                    style={[
                      styles.scheduleLine,
                      { backgroundColor: getEventTypeColor(item.type) },
                    ]}
                  />
                  <View style={styles.scheduleContent}>
                    <View
                      style={[
                        styles.scheduleTypeBadge,
                        { backgroundColor: getEventTypeColor(item.type) + "20" },
                      ]}
                    >
                      <Text
                        style={[
                          styles.scheduleTypeText,
                          { color: getEventTypeColor(item.type) },
                        ]}
                      >
                        {item.type.toUpperCase()}
                      </Text>
                    </View>
                    <Text style={styles.scheduleTitle}>{item.title}</Text>
                    <View style={styles.scheduleDetails}>
                      <Ionicons
                        name="location-outline"
                        size={14}
                        color={Colors.text.secondary}
                      />
                      <Text style={styles.scheduleLocation}>{item.location}</Text>
                    </View>
                    {item.speaker && (
                      <View style={styles.scheduleDetails}>
                        <Ionicons
                          name="person-outline"
                          size={14}
                          color={Colors.text.secondary}
                        />
                        <Text style={styles.scheduleSpeaker}>{item.speaker}</Text>
                      </View>
                    )}
                  </View>
                  <Ionicons
                    name="chevron-forward"
                    size={20}
                    color={Colors.text.tertiary}
                  />
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Past Events */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Past Events</Text>
            <TouchableOpacity onPress={() => router.push("/(tabs)/events")}>
              <Text style={styles.viewAll}>View All</Text>
            </TouchableOpacity>
          </View>

          {pastEvents.length === 0 ? (
            <Card variant="outlined" style={styles.emptyScheduleCard}>
              <Ionicons name="time-outline" size={40} color={Colors.text.tertiary} />
              <Text style={styles.emptyScheduleText}>No past events yet</Text>
              <Text style={styles.emptyScheduleSubtext}>
                Attend events to build your history
              </Text>
            </Card>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.pastEventsScroll}
            >
              {pastEvents.slice(0, 5).map((event) => (
                <TouchableOpacity
                  key={event.id}
                  style={styles.pastEventCard}
                  activeOpacity={0.8}
                  onPress={() => router.push({ pathname: "/event/[id]", params: { id: event.id } })}
                >
                  <Image
                    source={{ uri: event.banner_url || event.logo_url || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=400' }}
                    style={styles.pastEventImage}
                  />
                  <View style={styles.pastEventOverlay}>
                    <View style={styles.badgeEarned}>
                      <Ionicons
                        name="ribbon"
                        size={16}
                        color={Colors.status.warning}
                      />
                    </View>
                  </View>
                  <View style={styles.pastEventContent}>
                    <Text style={styles.pastEventTitle} numberOfLines={1}>
                      {event.title}
                    </Text>
                    <Text style={styles.pastEventDate}>{formatDateRange(event.start_date, event.end_date)}</Text>
                    <View style={styles.pastEventLocation}>
                      <Ionicons
                        name="location-outline"
                        size={12}
                        color={Colors.text.secondary}
                      />
                      <Text style={styles.pastEventLocationText}>
                        {event.venue_name || 'TBA'}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActionsGrid}>
            <TouchableOpacity
              style={styles.quickAction}
              onPress={() => router.push("/(tabs)/events")}
            >
              <View
                style={[
                  styles.quickActionIcon,
                  { backgroundColor: Colors.primary.accent + "20" },
                ]}
              >
                <Ionicons
                  name="search"
                  size={24}
                  color={Colors.primary.accent}
                />
              </View>
              <Text style={styles.quickActionLabel}>Discover</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickAction}
              onPress={() => router.push("/ai-matches")}
            >
              <View
                style={[
                  styles.quickActionIcon,
                  { backgroundColor: Colors.status.info + "20" },
                ]}
              >
                <Ionicons name="people" size={24} color={Colors.status.info} />
              </View>
              <Text style={styles.quickActionLabel}>Connections</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickAction}
              onPress={() => router.push("/(tabs)/badge")}
            >
              <View
                style={[
                  styles.quickActionIcon,
                  { backgroundColor: Colors.status.success + "20" },
                ]}
              >
                <Ionicons
                  name="id-card"
                  size={24}
                  color={Colors.status.success}
                />
              </View>
              <Text style={styles.quickActionLabel}>My Badge</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickAction}
              onPress={() => router.push("/(tabs)/social")}
            >
              <View
                style={[
                  styles.quickActionIcon,
                  { backgroundColor: Colors.social.like + "20" },
                ]}
              >
                <Ionicons
                  name="chatbubbles"
                  size={24}
                  color={Colors.social.like}
                />
              </View>
              <Text style={styles.quickActionLabel}>Messages</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.primary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.xxl,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: Spacing.md,
  },
  headerTitle: {
    fontSize: FontSizes.xxl,
    fontWeight: FontWeights.bold,
    color: Colors.text.primary,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  notificationButton: {
    position: "relative",
  },
  notificationBadge: {
    position: "absolute",
    top: 0,
    right: 0,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.status.error,
  },
  welcomeCard: {
    backgroundColor: Colors.primary.accent,
    marginBottom: Spacing.md,
    overflow: "hidden",
  },
  welcomeContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  welcomeLeft: {
    flex: 1,
    paddingRight: Spacing.md,
  },
  welcomeText: {
    fontSize: FontSizes.md,
    color: "rgba(255, 255, 255, 0.8)",
  },
  welcomeName: {
    fontSize: FontSizes.xxl,
    fontWeight: FontWeights.bold,
    color: Colors.text.inverse,
    marginBottom: Spacing.xs,
  },
  welcomeSubtext: {
    fontSize: FontSizes.sm,
    color: "rgba(255, 255, 255, 0.7)",
  },
  welcomeImage: {
    width: 100,
    height: 80,
    borderRadius: BorderRadius.md,
    opacity: 0.8,
  },
  statsRow: {
    flexDirection: "row",
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  statCard: {
    flex: 1,
    alignItems: "center",
    paddingVertical: Spacing.md,
  },
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.primary.accent + "20",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.sm,
  },
  statNumber: {
    fontSize: FontSizes.xxl,
    fontWeight: FontWeights.bold,
    color: Colors.text.primary,
  },
  statLabel: {
    fontSize: FontSizes.sm,
    color: Colors.text.secondary,
    textAlign: "center",
  },
  section: {
    marginBottom: Spacing.lg,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.semibold,
    color: Colors.text.primary,
  },
  viewAll: {
    fontSize: FontSizes.sm,
    color: Colors.primary.accent,
    fontWeight: FontWeights.medium,
  },
  scheduleLoading: {
    padding: Spacing.xl,
    alignItems: 'center',
  },
  emptyScheduleCard: {
    padding: Spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyScheduleText: {
    fontSize: FontSizes.md,
    fontWeight: FontWeights.medium,
    color: Colors.text.secondary,
    marginTop: Spacing.sm,
  },
  emptyScheduleSubtext: {
    fontSize: FontSizes.sm,
    color: Colors.text.tertiary,
    marginTop: Spacing.xs,
    textAlign: 'center',
  },
  scheduleList: {
    gap: Spacing.sm,
  },
  scheduleItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: Colors.background.card,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    ...Shadows.sm,
  },
  scheduleTime: {
    width: 70,
  },
  scheduleTimeText: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.medium,
    color: Colors.text.secondary,
  },
  scheduleLine: {
    width: 3,
    alignSelf: "stretch",
    borderRadius: 2,
    marginRight: Spacing.md,
  },
  scheduleContent: {
    flex: 1,
  },
  scheduleTypeBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.xs,
  },
  scheduleTypeText: {
    fontSize: FontSizes.xs,
    fontWeight: FontWeights.semibold,
  },
  scheduleTitle: {
    fontSize: FontSizes.md,
    fontWeight: FontWeights.semibold,
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
  },
  scheduleDetails: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    marginTop: 2,
  },
  scheduleLocation: {
    fontSize: FontSizes.sm,
    color: Colors.text.secondary,
  },
  scheduleSpeaker: {
    fontSize: FontSizes.sm,
    color: Colors.text.secondary,
  },
  pastEventsScroll: {
    gap: Spacing.md,
    paddingRight: Spacing.md,
  },
  pastEventCard: {
    width: 200,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.background.card,
    overflow: "hidden",
    ...Shadows.sm,
  },
  pastEventImage: {
    width: "100%",
    height: 100,
  },
  pastEventOverlay: {
    position: "absolute",
    top: Spacing.sm,
    right: Spacing.sm,
  },
  badgeEarned: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.background.card,
    alignItems: "center",
    justifyContent: "center",
    ...Shadows.sm,
  },
  pastEventContent: {
    padding: Spacing.sm,
  },
  pastEventTitle: {
    fontSize: FontSizes.md,
    fontWeight: FontWeights.semibold,
    color: Colors.text.primary,
    marginBottom: 2,
  },
  pastEventDate: {
    fontSize: FontSizes.sm,
    color: Colors.text.secondary,
    marginBottom: 4,
  },
  pastEventLocation: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  pastEventLocationText: {
    fontSize: FontSizes.xs,
    color: Colors.text.secondary,
  },
  quickActionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.md,
    marginTop: Spacing.sm,
  },
  quickAction: {
    width: "47%",
    backgroundColor: Colors.background.card,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    ...Shadows.sm,
  },
  quickActionIcon: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  quickActionLabel: {
    fontSize: FontSizes.md,
    fontWeight: FontWeights.medium,
    color: Colors.text.primary,
  },
});

export default HomeScreen;
