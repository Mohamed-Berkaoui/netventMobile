/**
 * Discover Events Screen
 * Browse events with world map, filters, and RSVP functionality
 * Fetches real data from Supabase
 */

import { Icon } from "@/components/TabIcon";
import { router } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
    Dimensions,
    Image,
    RefreshControl,
    ScrollView,
    Share,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Avatar, EmptyState, Input, LoadingSpinner } from "../../components/ui";
import {
    BorderRadius,
    Colors,
    FontSizes,
    FontWeights,
    Shadows,
    Spacing,
} from "../../constants/theme";
import { useAuthStore } from "../../stores/authStore";
import { useEventsStore } from "../../stores/eventsStore";
import { Event } from "../../types";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

// Discover is focused on upcoming events only; filter tabs removed
// (UI simplified: always show upcoming events)

/**
 * Format date range for display
 */
const formatDateRange = (startDate: string, endDate: string): string => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const options: Intl.DateTimeFormatOptions = {
    month: "short",
    day: "numeric",
  };
  const yearOptions: Intl.DateTimeFormatOptions = { year: "numeric" };

  const startStr = start.toLocaleDateString("en-US", options);
  const endStr = end.toLocaleDateString("en-US", options);
  const year = start.toLocaleDateString("en-US", yearOptions);

  if (start.getMonth() === end.getMonth()) {
    return `${startStr}-${end.getDate()}, ${year}`;
  }
  return `${startStr} - ${endStr}, ${year}`;
};

/**
 * Extract city from venue address
 */
const extractLocation = (address: string): string => {
  const parts = address.split(",");
  if (parts.length >= 2) {
    return (
      parts[parts.length - 2].trim() +
      ", " +
      parts[parts.length - 1].trim().split(" ")[0]
    );
  }
  return address;
};

// World map hotspot markers - dynamically generated from events
const getMapHotspotsFromEvents = (events: Event[]) => {
  const locationMap: {
    [key: string]: { count: number; lat: number; lng: number; city: string };
  } = {};

  events.forEach((event) => {
    const city = event.venue_address?.split(",")[0] || "Unknown";
    const key = `${Math.round(event.latitude || 0)}_${Math.round(event.longitude || 0)}`;

    if (!locationMap[key]) {
      locationMap[key] = {
        count: 0,
        lat: event.latitude || 0,
        lng: event.longitude || 0,
        city: extractLocation(event.venue_address || ""),
      };
    }
    locationMap[key].count++;
  });

  return Object.entries(locationMap).map(([key, value], index) => {
    // Convert lat/lng to approximate CSS positions on world map
    const top = `${50 - (value.lat / 90) * 40}%`;
    const left = `${50 + (value.lng / 180) * 45}%`;

    return {
      id: key,
      name: value.city,
      city: value.city,
      events: value.count,
      position: { top, left },
      color: "#FF6B6B",
    };
  });
};

export const EventsListScreen: React.FC = () => {
  // No selectable filters — Discover shows upcoming events only
  const [searchQuery, setSearchQuery] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [showMap, setShowMap] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState<
    "all" | "location" | "connection" | "date"
  >("all");
  const [selectedSort, setSelectedSort] = useState<
    "all" | "location" | "date" | "connection"
  >("all");

  const { user } = useAuthStore();
  const {
    events,
    upcomingEvents,
    pastEvents,
    registeredEvents,
    registrations,
    fetchEvents,
    fetchRegisteredEvents,
    registerForEvent,
    loading,
  } = useEventsStore();

  /**
   * Load events on mount
   */
  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    await fetchEvents({});
    if (user) {
      await fetchRegisteredEvents(user.id);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadEvents();
    setRefreshing(false);
  }, []);

  /**
   * Filter events by selected filter and search
   */
  const getFilteredEvents = (): Event[] => {
    // Discover shows upcoming events only
    let filtered: Event[] = upcomingEvents;

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (e) =>
          e.title.toLowerCase().includes(query) ||
          e.venue_name?.toLowerCase().includes(query) ||
          e.venue_address?.toLowerCase().includes(query) ||
          e.description?.toLowerCase().includes(query) ||
          e.interests?.some((interest) =>
            interest.toLowerCase().includes(query),
          ),
      );
    }

    return filtered;
  };

  /**
   * Check if user is registered for an event
   */
  const isRegistered = (eventId: string): boolean => {
    return registrations.some(
      (r) => r.event_id === eventId && r.status === "registered",
    );
  };

  /**
   * Handle RSVP
   */
  const handleRSVP = async (eventId: string) => {
    if (!user) {
      router.push("/(auth)/sign-in");
      return;
    }
    await registerForEvent(user.id, eventId);
  };

  /**
   * Handle share event
   */
  const handleShare = async (event: Event) => {
    try {
      await Share.share({
        message: `Check out ${event.title} at ${event.venue_name}!\n\n${formatDateRange(event.start_date, event.end_date)}\n\n${event.description}\n\nJoin me at this event!`,
        title: event.title,
      });
    } catch (error) {
      console.error("Error sharing:", error);
    }
  };

  /**
   * Format attendee count
   */
  const formatAttendees = (count: number): string => {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(0)}K`;
    return count.toString();
  };

  /**
   * Navigate to event details
   */
  const handleEventPress = (event: Event) => {
    router.push({
      pathname: "/event/[id]",
      params: { id: event.id },
    });
  };

  const filteredEvents = getFilteredEvents();
  const mapHotspots = getMapHotspotsFromEvents(events);
  const totalNearbyEvents = mapHotspots.reduce((sum, h) => sum + h.events, 0);

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
          <Text style={styles.headerTitle}>Discover Events</Text>
          <View style={styles.headerRight}>
            <TouchableOpacity style={styles.headerButton}>
              <Icon
                name="notifications-outline"
                size={22}
                color={Colors.text.primary}
              />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.push("/edit-profile")}>
              <Avatar
                source={user?.avatar_url}
                name={user?.name || "Ghaya"}
                size="small"
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Input
            placeholder="Search events, venues, or organizers..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            leftIcon="search"
            rightIcon={searchQuery ? "close-circle" : undefined}
            onRightIconPress={() => setSearchQuery("")}
            containerStyle={styles.searchInput}
          />
        </View>

        {/* Filter Buttons */}
        <View style={styles.filterButtonsContainer}>
          <TouchableOpacity
            style={[
              styles.filterButton,
              selectedFilter === "all" && styles.filterButtonActive,
            ]}
            onPress={() => setSelectedFilter("all")}
          >
            <Icon
              name="home"
              size={16}
              color={
                selectedFilter === "all"
                  ? Colors.text.inverse
                  : Colors.text.secondary
              }
            />
            <Text
              style={[
                styles.filterButtonText,
                selectedFilter === "all" && styles.filterButtonTextActive,
              ]}
            >
              All Events
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterButton,
              selectedFilter === "location" && styles.filterButtonActive,
            ]}
            onPress={() => setSelectedFilter("location")}
          >
            <Icon
              name="compass"
              size={16}
              color={
                selectedFilter === "location"
                  ? Colors.text.inverse
                  : Colors.text.secondary
              }
            />
            <Text
              style={[
                styles.filterButtonText,
                selectedFilter === "location" && styles.filterButtonTextActive,
              ]}
            >
              Location
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterButton,
              selectedFilter === "connection" && styles.filterButtonActive,
            ]}
            onPress={() => setSelectedFilter("connection")}
          >
            <Icon
              name="people"
              size={16}
              color={
                selectedFilter === "connection"
                  ? Colors.text.inverse
                  : Colors.text.secondary
              }
            />
            <Text
              style={[
                styles.filterButtonText,
                selectedFilter === "connection" &&
                  styles.filterButtonTextActive,
              ]}
            >
              Connection
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterButton,
              selectedFilter === "date" && styles.filterButtonActive,
            ]}
            onPress={() => setSelectedFilter("date")}
          >
            <Icon
              name="calendar"
              size={16}
              color={
                selectedFilter === "date"
                  ? Colors.text.inverse
                  : Colors.text.secondary
              }
            />
            <Text
              style={[
                styles.filterButtonText,
                selectedFilter === "date" && styles.filterButtonTextActive,
              ]}
            >
              Date
            </Text>
          </TouchableOpacity>
        </View>

        {/* World Map with Hotspots */}
        <View style={styles.mapSection}>
          <View style={styles.mapCard}>
            <Image
              source={{
                uri: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/ec/World_map_blank_without_borders.svg/2000px-World_map_blank_without_borders.svg.png",
              }}
              style={styles.mapImage}
              resizeMode="cover"
            />
            {/* Glowing Hotspots */}
            {mapHotspots.map((hotspot) => (
              <TouchableOpacity
                key={hotspot.id}
                style={[
                  styles.mapHotspot,
                  { top: hotspot.position.top, left: hotspot.position.left },
                ]}
              >
                <View
                  style={[
                    styles.hotspotGlow,
                    { backgroundColor: hotspot.color },
                  ]}
                />
                <View
                  style={[
                    styles.hotspotDot,
                    { backgroundColor: hotspot.color },
                  ]}
                >
                  <Text style={styles.hotspotCount}>{hotspot.events}</Text>
                </View>
              </TouchableOpacity>
            ))}

            {/* Events Nearby Badge */}
            <View style={styles.nearbyBadge}>
              <Icon name="compass" size={14} color="#14B8A6" />
              <Text style={styles.nearbyBadgeText}>
                {totalNearbyEvents} Events Nearby
              </Text>
            </View>

            {/* View All Button */}
            <TouchableOpacity style={styles.viewAllMapButton}>
              <Text style={styles.viewAllMapText}>View All</Text>
              <Icon
                name="chevron-forward"
                size={16}
                color={Colors.primary.accent}
              />
            </TouchableOpacity>
          </View>

          {/* Sort Buttons - Below Map */}
          <View style={styles.mapSortButtonsContainer}>
            <TouchableOpacity
              style={styles.sortButtonWrapper}
              onPress={() => setSelectedSort("all")}
            >
              <View
                style={[
                  styles.mapSortButton,
                  selectedSort === "all" && styles.mapSortButtonActive,
                ]}
              >
                <Icon
                  name="home"
                  size={18}
                  color={
                    selectedSort === "all"
                      ? Colors.text.inverse
                      : Colors.text.secondary
                  }
                />
              </View>
              <Text
                style={[
                  styles.sortButtonLabel,
                  selectedSort === "all" && styles.sortButtonLabelActive,
                ]}
              >
                All Events
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.sortButtonWrapper}
              onPress={() => setSelectedSort("location")}
            >
              <View
                style={[
                  styles.mapSortButton,
                  selectedSort === "location" && styles.mapSortButtonActive,
                ]}
              >
                <Icon
                  name="compass"
                  size={18}
                  color={
                    selectedSort === "location"
                      ? Colors.text.inverse
                      : Colors.text.secondary
                  }
                />
              </View>
              <Text
                style={[
                  styles.sortButtonLabel,
                  selectedSort === "location" && styles.sortButtonLabelActive,
                ]}
              >
                By Location
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.sortButtonWrapper}
              onPress={() => setSelectedSort("date")}
            >
              <View
                style={[
                  styles.mapSortButton,
                  selectedSort === "date" && styles.mapSortButtonActive,
                ]}
              >
                <Icon
                  name="calendar"
                  size={18}
                  color={
                    selectedSort === "date"
                      ? Colors.text.inverse
                      : Colors.text.secondary
                  }
                />
              </View>
              <Text
                style={[
                  styles.sortButtonLabel,
                  selectedSort === "date" && styles.sortButtonLabelActive,
                ]}
              >
                By Date
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.sortButtonWrapper}
              onPress={() => setSelectedSort("connection")}
            >
              <View
                style={[
                  styles.mapSortButton,
                  selectedSort === "connection" && styles.mapSortButtonActive,
                ]}
              >
                <Icon
                  name="people"
                  size={18}
                  color={
                    selectedSort === "connection"
                      ? Colors.text.inverse
                      : Colors.text.secondary
                  }
                />
              </View>
              <Text
                style={[
                  styles.sortButtonLabel,
                  selectedSort === "connection" && styles.sortButtonLabelActive,
                ]}
              >
                By Connection
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Event Cards Feed */}
        <View style={styles.eventsSection}>
          {loading ? (
            <LoadingSpinner message="Loading events..." />
          ) : filteredEvents.length === 0 ? (
            <EmptyState
              icon="calendar-outline"
              title="No Events Found"
              description="Try adjusting your search or filters"
            />
          ) : (
            <View style={styles.eventsList}>
              {filteredEvents.map((event) => (
                <TouchableOpacity
                  key={event.id}
                  style={styles.eventCard}
                  onPress={() => handleEventPress(event)}
                  activeOpacity={0.95}
                >
                  {/* Event Image */}
                  <Image
                    source={{
                      uri:
                        event.banner_url ||
                        event.logo_url ||
                        "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800",
                    }}
                    style={styles.eventImage}
                  />

                  {/* Event Content */}
                  <View style={styles.eventContent}>
                    <Text style={styles.eventTitle}>{event.title}</Text>

                    {/* Date */}
                    <View style={styles.eventRow}>
                      <Icon
                        name="calendar-outline"
                        size={16}
                        color={Colors.text.secondary}
                      />
                      <Text style={styles.eventDate}>
                        {formatDateRange(event.start_date, event.end_date)}
                      </Text>
                    </View>

                    {/* Location */}
                    <View style={styles.eventRow}>
                      <Icon
                        name="compass-outline"
                        size={16}
                        color={Colors.text.secondary}
                      />
                      <Text style={styles.eventLocation}>
                        {extractLocation(
                          event.venue_address || event.venue_name || "TBA",
                        )}
                      </Text>
                    </View>

                    {/* Tags/Interests */}
                    <View style={styles.tagsContainer}>
                      {(event.interests || [])
                        .slice(0, 3)
                        .map((interest, index) => (
                          <View key={index} style={styles.tag}>
                            <Text style={styles.tagText}>{interest}</Text>
                          </View>
                        ))}
                    </View>

                    {/* Actions */}
                    <View style={styles.eventFooter}>
                      <View style={styles.attendeesInfo}>
                        <Icon
                          name="home"
                          size={16}
                          color={Colors.text.secondary}
                        />
                        <Text style={styles.attendeesText} numberOfLines={1}>
                          {event.venue_name?.substring(0, 25) || "Venue TBA"}
                        </Text>
                      </View>

                      <View style={styles.eventActions}>
                        {/* Share Button */}
                        <TouchableOpacity
                          style={styles.shareButton}
                          onPress={() => handleShare(event)}
                        >
                          <Icon
                            name="share-outline"
                            size={20}
                            color={Colors.text.secondary}
                          />
                        </TouchableOpacity>

                        {/* RSVP Button */}
                        <TouchableOpacity
                          style={[
                            styles.rsvpButton,
                            isRegistered(event.id) &&
                              styles.rsvpButtonRegistered,
                          ]}
                          onPress={() => handleRSVP(event.id)}
                        >
                          <Text
                            style={[
                              styles.rsvpButtonText,
                              isRegistered(event.id) &&
                                styles.rsvpButtonTextRegistered,
                            ]}
                          >
                            {isRegistered(event.id)
                              ? "✓ Registered"
                              : "RSVP Now"}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
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
    paddingBottom: 100,
  },

  // Header
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
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
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.background.secondary,
    alignItems: "center",
    justifyContent: "center",
  },

  // Search
  searchContainer: {
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.md,
  },
  searchInput: {
    marginBottom: 0,
  },

  // Filter Buttons
  filterButtonsContainer: {
    flexDirection: "row",
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.lg,
    gap: Spacing.sm,
  },
  filterButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.background.secondary,
    borderWidth: 1,
    borderColor: Colors.border.secondary,
  },
  filterButtonActive: {
    backgroundColor: Colors.primary.accent,
    borderColor: Colors.primary.accent,
  },
  filterButtonText: {
    fontSize: FontSizes.xs,
    color: Colors.text.secondary,
    fontWeight: FontWeights.medium,
  },
  filterButtonTextActive: {
    color: Colors.text.inverse,
    fontWeight: FontWeights.semibold,
  },

  // Filter Chips
  filtersContainer: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.md,
    gap: Spacing.sm,
  },
  filterChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.background.secondary,
    marginRight: Spacing.sm,
  },
  filterChipActive: {
    backgroundColor: Colors.primary.accent,
  },
  filterChipText: {
    fontSize: FontSizes.sm,
    color: Colors.text.secondary,
  },
  filterChipTextActive: {
    color: Colors.text.inverse,
    fontWeight: FontWeights.medium,
  },

  // Map Section
  mapSection: {
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.lg,
  },
  mapCard: {
    height: 200,
    borderRadius: BorderRadius.lg,
    overflow: "hidden",
    backgroundColor: "#1a1a2e",
    position: "relative",
    ...Shadows.md,
  },
  mapImage: {
    width: "100%",
    height: "100%",
    opacity: 0.4,
    tintColor: "#4a4a6a",
  },
  mapHotspot: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
  },
  hotspotGlow: {
    position: "absolute",
    width: 32,
    height: 32,
    borderRadius: 16,
    opacity: 0.4,
  },
  hotspotDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    ...Shadows.sm,
  },
  hotspotCount: {
    fontSize: 10,
    fontWeight: FontWeights.bold,
    color: Colors.text.inverse,
  },
  nearbyBadge: {
    position: "absolute",
    top: Spacing.md,
    left: Spacing.md,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(20, 184, 166, 0.15)",
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: "rgba(20, 184, 166, 0.3)",
  },
  nearbyBadgeText: {
    fontSize: FontSizes.sm,
    color: "#14B8A6",
    fontWeight: FontWeights.semibold,
  },
  viewAllMapButton: {
    position: "absolute",
    bottom: Spacing.md,
    right: Spacing.md,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: Colors.background.card,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    ...Shadows.sm,
  },
  viewAllMapText: {
    fontSize: FontSizes.sm,
    color: Colors.primary.accent,
    fontWeight: FontWeights.medium,
  },

  // Map Sort Buttons
  mapSortButtonsContainer: {
    flexDirection: "row",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.lg,
    gap: Spacing.lg,
    justifyContent: "space-around",
  },
  sortButtonWrapper: {
    alignItems: "center",
    gap: Spacing.sm,
  },
  mapSortButton: {
    width: 50,
    height: 50,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.background.secondary,
    borderWidth: 1,
    borderColor: Colors.border.secondary,
    alignItems: "center",
    justifyContent: "center",
  },
  mapSortButtonActive: {
    backgroundColor: Colors.primary.accent,
    borderColor: Colors.primary.accent,
  },
  sortButtonLabel: {
    fontSize: FontSizes.xs,
    color: Colors.text.secondary,
    fontWeight: FontWeights.medium,
    textAlign: "center",
    maxWidth: 60,
  },
  sortButtonLabelActive: {
    color: Colors.primary.accent,
    fontWeight: FontWeights.semibold,
  },
  eventsSection: {
    paddingHorizontal: Spacing.md,
  },
  eventsList: {
    gap: Spacing.lg,
  },

  // Event Card
  eventCard: {
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.background.card,
    overflow: "hidden",
    ...Shadows.md,
  },
  eventImage: {
    width: "100%",
    height: 180,
  },
  eventContent: {
    padding: Spacing.md,
  },
  eventTitle: {
    fontSize: FontSizes.xl,
    fontWeight: FontWeights.bold,
    color: Colors.text.primary,
    marginBottom: Spacing.sm,
  },
  eventRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: 6,
  },
  eventDate: {
    fontSize: FontSizes.sm,
    color: Colors.text.secondary,
  },
  eventLocation: {
    fontSize: FontSizes.sm,
    color: Colors.text.secondary,
  },

  // Tags
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.xs,
    marginTop: Spacing.sm,
    marginBottom: Spacing.md,
  },
  tag: {
    backgroundColor: "#E0F2FE",
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  tagText: {
    fontSize: FontSizes.xs,
    color: "#0284C7",
    fontWeight: FontWeights.medium,
  },

  // Event Footer
  eventFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border.secondary,
  },
  attendeesInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  attendeesText: {
    fontSize: FontSizes.sm,
    color: Colors.text.secondary,
  },
  eventActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  shareButton: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.background.secondary,
    alignItems: "center",
    justifyContent: "center",
  },
  rsvpButton: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.primary.accent,
    minWidth: 110,
    alignItems: "center",
  },
  rsvpButtonRegistered: {
    backgroundColor: Colors.status.success + "20",
  },
  rsvpButtonText: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.semibold,
    color: Colors.text.inverse,
  },
  rsvpButtonTextRegistered: {
    color: Colors.status.success,
  },
});

export default EventsListScreen;
