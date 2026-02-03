/**
 * Agenda Screen (Screen 1: My Agenda - The Schedule & Navigation Hub)
 * Primary co-pilot for a user's day at a conference
 *
 * Features:
 * - Calendar header (month view)
 * - Today's agenda timeline with session cards
 * - Progress tracking per session
 * - Mini-map with customized journey
 * - Start Navigation button
 */

import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
    Dimensions,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Icon } from "../../components/TabIcon";
import { Card, EmptyState, LoadingSpinner } from "../../components/ui";
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
import { AgendaItem, Event } from "../../types";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

// Calendar data
const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

interface AgendaItemWithEvent extends AgendaItem {
  event?: Event;
}

interface AgendaItemCardProps {
  item: AgendaItemWithEvent;
  isActive: boolean;
  onPress: () => void;
}

const formatTime = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
};

const getDuration = (startTime: string, endTime: string) => {
  const start = new Date(startTime);
  const end = new Date(endTime);
  const diffMs = end.getTime() - start.getTime();
  const diffMins = Math.round(diffMs / 60000);

  if (diffMins >= 60) {
    const hours = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  }
  return `${diffMins}m`;
};

const AgendaItemCard: React.FC<AgendaItemCardProps> = ({
  item,
  isActive,
  onPress,
}) => {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
      <Card
        variant={isActive ? "elevated" : "default"}
        style={[styles.agendaCard, isActive && styles.agendaCardActive]}
      >
        <View style={styles.agendaCardContent}>
          {/* Time Column */}
          <View style={styles.timeColumn}>
            <Text style={styles.timeText}>{formatTime(item.start_time)}</Text>
            <Text style={styles.durationText}>
              {getDuration(item.start_time, item.end_time)}
            </Text>
          </View>

          {/* Timeline Indicator */}
          <View style={styles.timelineIndicator}>
            <View
              style={[styles.timelineDot, isActive && styles.timelineDotActive]}
            />
            <View style={styles.timelineLine} />
          </View>

          {/* Content Column */}
          <View style={styles.contentColumn}>
            <Text style={styles.sessionTitle} numberOfLines={2}>
              {item.title}
            </Text>

            {item.description && (
              <Text style={styles.descriptionText} numberOfLines={2}>
                {item.description}
              </Text>
            )}

            <View style={styles.locationRow}>
              <Icon
                name="location-outline"
                size={14}
                color={Colors.text.secondary}
              />
              <Text style={styles.locationText}>
                {item.location_name} • Floor {item.floor}
              </Text>
            </View>

            {/* Event Tag */}
            {item.event && (
              <View style={styles.tagsRow}>
                <View style={styles.tag}>
                  <Text style={styles.tagText}>{item.event.title}</Text>
                </View>
              </View>
            )}
          </View>
        </View>
      </Card>
    </TouchableOpacity>
  );
};

export const AgendaScreen: React.FC = () => {
  const [refreshing, setRefreshing] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [agendaItems, setAgendaItems] = useState<AgendaItemWithEvent[]>([]);
  const [loadingAgenda, setLoadingAgenda] = useState(false);
  const [eventDates, setEventDates] = useState<Set<number>>(new Set());

  const { user } = useAuthStore();
  const { registeredEvents, loading, fetchRegisteredEvents } = useEventsStore();

  // Fetch agenda items for registered events
  const fetchAgendaItems = useCallback(async () => {
    if (!user || registeredEvents.length === 0) {
      setAgendaItems([]);
      return;
    }

    try {
      setLoadingAgenda(true);
      const eventIds = registeredEvents.map((e) => e.id);

      const { data, error } = await supabase
        .from("agenda_items")
        .select(
          `
          *,
          event:events(*)
        `,
        )
        .in("event_id", eventIds)
        .order("start_time", { ascending: true });

      if (error) throw error;

      setAgendaItems((data || []) as AgendaItemWithEvent[]);

      // Get unique event dates for calendar
      const dates = new Set<number>();
      registeredEvents.forEach((event) => {
        const startDate = new Date(event.start_date);
        const endDate = new Date(event.end_date);

        // Add all dates between start and end
        const current = new Date(startDate);
        while (current <= endDate) {
          if (
            current.getMonth() === currentMonth.getMonth() &&
            current.getFullYear() === currentMonth.getFullYear()
          ) {
            dates.add(current.getDate());
          }
          current.setDate(current.getDate() + 1);
        }
      });
      setEventDates(dates);
    } catch (error) {
      console.error("Error fetching agenda items:", error);
    } finally {
      setLoadingAgenda(false);
    }
  }, [user, registeredEvents, currentMonth]);

  useEffect(() => {
    if (user) {
      fetchRegisteredEvents(user.id);
    }
  }, [user]);

  useEffect(() => {
    fetchAgendaItems();
  }, [fetchAgendaItems]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    if (user) {
      await fetchRegisteredEvents(user.id);
      await fetchAgendaItems();
    }
    setRefreshing(false);
  }, [user, fetchAgendaItems]);

  // Filter agenda items for selected date
  const filteredAgendaItems = agendaItems.filter((item) => {
    const itemDate = new Date(item.start_time);
    return (
      itemDate.getDate() === selectedDate.getDate() &&
      itemDate.getMonth() === selectedDate.getMonth() &&
      itemDate.getFullYear() === selectedDate.getFullYear()
    );
  });

  // Get calendar days for current month
  const getCalendarDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();

    const days: (number | null)[] = [];
    // Add empty cells for days before the 1st
    for (let i = 0; i < startingDay; i++) {
      days.push(null);
    }
    // Add days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }
    return days;
  };

  const isToday = (day: number | null) => {
    if (!day) return false;
    const today = new Date();
    return (
      day === today.getDate() &&
      currentMonth.getMonth() === today.getMonth() &&
      currentMonth.getFullYear() === today.getFullYear()
    );
  };

  const isSelected = (day: number | null) => {
    if (!day) return false;
    return (
      day === selectedDate.getDate() &&
      currentMonth.getMonth() === selectedDate.getMonth() &&
      currentMonth.getFullYear() === selectedDate.getFullYear()
    );
  };

  const isEventDay = (day: number | null) => {
    return day !== null && eventDates.has(day);
  };

  const handleDayPress = (day: number | null) => {
    if (day) {
      const newDate = new Date(currentMonth);
      newDate.setDate(day);
      setSelectedDate(newDate);
    }
  };

  const handleStartNavigation = () => {
    if (registeredEvents.length > 0) {
      router.push({
        pathname: "/navigation/[eventId]",
        params: { eventId: registeredEvents[0].id },
      } as any);
    }
  };

  const handleSessionPress = (item: AgendaItemWithEvent) => {
    // Navigate to event details or session details
    if (item.event_id) {
      router.push({
        pathname: "/event/[id]",
        params: { id: item.event_id },
      });
    }
  };

  const changeMonth = (direction: number) => {
    const newMonth = new Date(currentMonth);
    newMonth.setMonth(newMonth.getMonth() + direction);
    setCurrentMonth(newMonth);
  };

  if (loading && !registeredEvents.length) {
    return <LoadingSpinner fullScreen message="Loading your agenda..." />;
  }

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
          <Text style={styles.headerTitle}>My Agenda</Text>
          <TouchableOpacity style={styles.filterButton}>
            <Icon name="filter-outline" size={22} color={Colors.text.primary} />
          </TouchableOpacity>
        </View>

        {/* Calendar Card */}
        <Card variant="elevated" style={styles.calendarCard}>
          {/* Month Navigation */}
          <View style={styles.monthNav}>
            <TouchableOpacity
              onPress={() => changeMonth(-1)}
              style={styles.monthNavButton}
            >
              <Icon
                name="chevron-back"
                size={24}
                color={Colors.text.secondary}
              />
            </TouchableOpacity>
            <Text style={styles.monthText}>
              {MONTHS[currentMonth.getMonth()]} {currentMonth.getFullYear()}
            </Text>
            <TouchableOpacity
              onPress={() => changeMonth(1)}
              style={styles.monthNavButton}
            >
              <Icon
                name="chevron-forward"
                size={24}
                color={Colors.text.secondary}
              />
            </TouchableOpacity>
          </View>

          {/* Day Headers */}
          <View style={styles.dayHeaders}>
            {DAYS.map((day) => (
              <Text key={day} style={styles.dayHeaderText}>
                {day}
              </Text>
            ))}
          </View>

          {/* Calendar Grid */}
          <View style={styles.calendarGrid}>
            {getCalendarDays().map((day, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.dayCell,
                  isToday(day) && styles.todayCell,
                  isSelected(day) && styles.selectedDayCell,
                ]}
                onPress={() => handleDayPress(day)}
                disabled={!day}
              >
                {day && (
                  <>
                    <Text
                      style={[
                        styles.dayText,
                        isToday(day) && styles.todayText,
                        isSelected(day) && styles.selectedDayText,
                      ]}
                    >
                      {day}
                    </Text>
                    {isEventDay(day) && <View style={styles.eventDot} />}
                  </>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </Card>

        {/* Today's Agenda Section */}
        <View style={styles.agendaSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              {isToday(selectedDate.getDate())
                ? "Today's Schedule"
                : `${MONTHS[selectedDate.getMonth()]} ${selectedDate.getDate()}`}
            </Text>
            <Text style={styles.sessionCount}>
              {filteredAgendaItems.length} session
              {filteredAgendaItems.length !== 1 ? "s" : ""}
            </Text>
          </View>

          {loadingAgenda ? (
            <LoadingSpinner message="Loading sessions..." />
          ) : filteredAgendaItems.length === 0 ? (
            <EmptyState
              icon="calendar-outline"
              title="No Sessions"
              description={
                registeredEvents.length === 0
                  ? "Register for an event to see your agenda"
                  : "No sessions scheduled for this date"
              }
            />
          ) : (
            filteredAgendaItems.map((item, index) => (
              <AgendaItemCard
                key={item.id}
                item={item}
                isActive={index === 0}
                onPress={() => handleSessionPress(item)}
              />
            ))
          )}
        </View>

        {/* Mini Map & Navigation */}
        {registeredEvents.length > 0 && filteredAgendaItems.length > 0 && (
          <Card variant="elevated" style={styles.navigationCard}>
            <View style={styles.miniMapHeader}>
              <Text style={styles.miniMapTitle}>Your Journey</Text>
              <Text style={styles.miniMapSubtitle}>
                {filteredAgendaItems.length} stops today
              </Text>
            </View>

            {/* Mini Map Placeholder */}
            <View style={styles.miniMapContainer}>
              <LinearGradient
                colors={[
                  Colors.background.secondary,
                  Colors.background.tertiary,
                ]}
                style={styles.miniMapGradient}
              >
                <View style={styles.miniMapContent}>
                  <Icon
                    name="map-outline"
                    size={40}
                    color={Colors.text.tertiary}
                  />
                  <Text style={styles.miniMapPlaceholder}>
                    Interactive venue map
                  </Text>
                </View>

                {/* Journey Path Visualization */}
                <View style={styles.journeyPath}>
                  {filteredAgendaItems.slice(0, 4).map((item, index) => (
                    <View key={item.id} style={styles.journeyStop}>
                      <View
                        style={[
                          styles.journeyDot,
                          index === 0 && styles.journeyDotCurrent,
                        ]}
                      />
                      {index < Math.min(filteredAgendaItems.length - 1, 3) && (
                        <View style={styles.journeyLine} />
                      )}
                    </View>
                  ))}
                </View>
              </LinearGradient>
            </View>

            {/* Start Navigation Button */}
            <TouchableOpacity
              style={styles.navigationButton}
              onPress={handleStartNavigation}
            >
              <Icon name="navigate" size={20} color={Colors.text.inverse} />
              <Text style={styles.navigationButtonText}>Start Navigation</Text>
            </TouchableOpacity>
          </Card>
        )}

        <View style={styles.bottomSpacing} />
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
  },

  // Header
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
  filterButton: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.background.secondary,
    alignItems: "center",
    justifyContent: "center",
  },

  // Calendar
  calendarCard: {
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  monthNav: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  monthNavButton: {
    padding: Spacing.xs,
  },
  monthText: {
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.semibold,
    color: Colors.text.primary,
  },
  dayHeaders: {
    flexDirection: "row",
    marginBottom: Spacing.sm,
  },
  dayHeaderText: {
    flex: 1,
    textAlign: "center",
    fontSize: FontSizes.xs,
    color: Colors.text.tertiary,
    fontWeight: FontWeights.medium,
  },
  calendarGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  dayCell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  todayCell: {
    backgroundColor: Colors.background.tertiary,
    borderRadius: BorderRadius.full,
  },
  selectedDayCell: {
    backgroundColor: Colors.primary.accent,
    borderRadius: BorderRadius.full,
  },
  dayText: {
    fontSize: FontSizes.sm,
    color: Colors.text.secondary,
  },
  todayText: {
    color: Colors.text.primary,
    fontWeight: FontWeights.semibold,
  },
  selectedDayText: {
    color: Colors.text.inverse,
    fontWeight: FontWeights.bold,
  },
  eventDot: {
    position: "absolute",
    bottom: 4,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.primary.accent,
  },

  // Agenda Section
  agendaSection: {
    marginBottom: Spacing.md,
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
  sessionCount: {
    fontSize: FontSizes.sm,
    color: Colors.text.tertiary,
  },

  // Agenda Card
  agendaCard: {
    marginBottom: Spacing.sm,
    padding: Spacing.md,
  },
  agendaCardActive: {
    borderLeftWidth: 3,
    borderLeftColor: Colors.primary.accent,
  },
  agendaCardContent: {
    flexDirection: "row",
  },
  timeColumn: {
    width: 70,
    alignItems: "flex-end",
    paddingRight: Spacing.sm,
  },
  timeText: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.semibold,
    color: Colors.text.primary,
  },
  durationText: {
    fontSize: FontSizes.xs,
    color: Colors.text.tertiary,
    marginTop: 2,
  },
  timelineIndicator: {
    width: 20,
    alignItems: "center",
  },
  timelineDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.background.tertiary,
    borderWidth: 2,
    borderColor: Colors.border.secondary,
  },
  timelineDotActive: {
    backgroundColor: Colors.primary.accent,
    borderColor: Colors.primary.accent,
  },
  timelineLine: {
    flex: 1,
    width: 2,
    backgroundColor: Colors.border.secondary,
    marginVertical: 4,
  },
  contentColumn: {
    flex: 1,
    paddingLeft: Spacing.sm,
  },
  sessionTitle: {
    fontSize: FontSizes.md,
    fontWeight: FontWeights.semibold,
    color: Colors.text.primary,
    marginBottom: 4,
  },
  descriptionText: {
    fontSize: FontSizes.sm,
    color: Colors.text.secondary,
    marginBottom: 8,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  locationText: {
    fontSize: FontSizes.sm,
    color: Colors.text.secondary,
    marginLeft: 4,
  },
  tagsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  tag: {
    backgroundColor: Colors.background.tertiary,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
    marginRight: 4,
    marginBottom: 4,
  },
  tagText: {
    fontSize: FontSizes.xs,
    color: Colors.text.secondary,
  },

  // Navigation Card
  navigationCard: {
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  miniMapHeader: {
    marginBottom: Spacing.md,
  },
  miniMapTitle: {
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.semibold,
    color: Colors.text.primary,
  },
  miniMapSubtitle: {
    fontSize: FontSizes.sm,
    color: Colors.text.tertiary,
    marginTop: 2,
  },
  miniMapContainer: {
    height: 150,
    borderRadius: BorderRadius.md,
    overflow: "hidden",
    marginBottom: Spacing.md,
  },
  miniMapGradient: {
    flex: 1,
    padding: Spacing.md,
  },
  miniMapContent: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  miniMapPlaceholder: {
    fontSize: FontSizes.sm,
    color: Colors.text.tertiary,
    marginTop: Spacing.sm,
  },
  journeyPath: {
    position: "absolute",
    bottom: Spacing.md,
    left: Spacing.md,
    right: Spacing.md,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  journeyStop: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  journeyDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.text.tertiary,
  },
  journeyDotCurrent: {
    backgroundColor: Colors.primary.accent,
  },
  journeyLine: {
    flex: 1,
    height: 2,
    backgroundColor: Colors.text.tertiary,
    marginHorizontal: 4,
  },
  navigationButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.primary.accent,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  navigationButtonText: {
    fontSize: FontSizes.md,
    fontWeight: FontWeights.semibold,
    color: Colors.text.inverse,
    marginLeft: Spacing.sm,
  },

  bottomSpacing: {
    height: 100,
  },
});

export default AgendaScreen;
