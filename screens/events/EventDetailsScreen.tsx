/**
 * Event Details Screen
 * Full event information with tabs for Overview, Speakers, Agenda, Venue Map
 * Fetches real agenda data from Supabase
 */

import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    Alert,
    Dimensions,
    ScrollView,
    Share,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button, Card, LoadingSpinner } from "../../components/ui";
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
import { AgendaItem } from "../../types";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

type TabType = "overview" | "speakers" | "agenda" | "venue";

interface Speaker {
  id: string;
  name: string;
  role: string;
  image: string;
  topic: string;
  time: string;
}

interface AgendaDisplayItem {
  id: string;
  time: string;
  title: string;
  duration: string;
  location: string;
  type: 'keynote' | 'workshop' | 'panel' | 'break' | 'session';
  speaker?: string;
}

/**
 * Format time for display
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
 * Calculate duration between two times
 */
const getDuration = (startTime: string, endTime: string): string => {
  const start = new Date(startTime);
  const end = new Date(endTime);
  const diffMs = end.getTime() - start.getTime();
  const diffMins = Math.round(diffMs / 60000);

  if (diffMins >= 60) {
    const hours = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours} hour${hours > 1 ? 's' : ''}`;
  }
  return `${diffMins} min`;
};

/**
 * Determine session type from title
 */
const getSessionType = (title: string): AgendaDisplayItem['type'] => {
  const lowerTitle = title.toLowerCase();
  if (lowerTitle.includes('keynote') || lowerTitle.includes('opening') || lowerTitle.includes('closing')) return 'keynote';
  if (lowerTitle.includes('workshop') || lowerTitle.includes('hands-on')) return 'workshop';
  if (lowerTitle.includes('panel') || lowerTitle.includes('discussion')) return 'panel';
  if (lowerTitle.includes('break') || lowerTitle.includes('lunch') || lowerTitle.includes('networking') || lowerTitle.includes('coffee') || lowerTitle.includes('registration')) return 'break';
  return 'session';
};

// Venue map areas (can be fetched from database later)
const VENUE_AREAS = [
  { id: "1", name: "Main Hall", floor: "Ground", capacity: "5000" },
  { id: "2", name: "Exhibition Hall", floor: "Ground", capacity: "3000" },
  { id: "3", name: "Auditorium A", floor: "1st", capacity: "800" },
  { id: "4", name: "Auditorium B", floor: "1st", capacity: "500" },
  { id: "5", name: "Workshop Rooms", floor: "2nd", capacity: "100 each" },
  { id: "6", name: "VIP Lounge", floor: "3rd", capacity: "200" },
];

export const EventDetailsScreen: React.FC = () => {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState<TabType>("overview");
  const [registering, setRegistering] = useState(false);
  const [agendaItems, setAgendaItems] = useState<AgendaDisplayItem[]>([]);
  const [loadingAgenda, setLoadingAgenda] = useState(false);

  const { user } = useAuthStore();
  const {
    currentEvent,
    fetchEventById,
    registerForEvent,
    unregisterFromEvent,
    isRegistered,
    loading,
  } = useEventsStore();

  /**
   * Fetch agenda items for this event
   */
  const fetchAgendaItems = async (eventId: string) => {
    try {
      setLoadingAgenda(true);
      const { data, error } = await supabase
        .from('agenda_items')
        .select('*')
        .eq('event_id', eventId)
        .order('start_time', { ascending: true });

      if (error) throw error;

      const displayItems: AgendaDisplayItem[] = (data || []).map((item: AgendaItem) => ({
        id: item.id,
        time: formatTime(item.start_time),
        title: item.title,
        duration: getDuration(item.start_time, item.end_time),
        location: `${item.location_name} • Floor ${item.floor}`,
        type: getSessionType(item.title),
      }));

      setAgendaItems(displayItems);
    } catch (error) {
      console.error('Error fetching agenda items:', error);
    } finally {
      setLoadingAgenda(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchEventById(id);
      fetchAgendaItems(id);
    }
  }, [id]);

  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const handleRegistrationToggle = async () => {
    if (!user || !currentEvent) return;

    setRegistering(true);
    const registered = isRegistered(user.id, currentEvent.id);

    if (registered) {
      Alert.alert(
        "Unregister",
        "Are you sure you want to unregister from this event?",
        [
          {
            text: "Cancel",
            style: "cancel",
            onPress: () => setRegistering(false),
          },
          {
            text: "Unregister",
            style: "destructive",
            onPress: async () => {
              await unregisterFromEvent(user.id, currentEvent.id);
              setRegistering(false);
              Haptics.notificationAsync(
                Haptics.NotificationFeedbackType.Warning,
              );
            },
          },
        ],
      );
    } else {
      const result = await registerForEvent(user.id, currentEvent.id);
      setRegistering(false);
      if (!result.error) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert("Success", "You have been registered!");
      }
    }
  };

  const handleShare = async () => {
    if (!currentEvent) return;
    try {
      await Share.share({
        message: `Check out ${currentEvent.title} on Netvent!`,
        title: currentEvent.title,
      });
    } catch (error) {
      console.error("Error sharing:", error);
    }
  };

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

  if (loading || !currentEvent) {
    return <LoadingSpinner fullScreen message="Loading event details..." />;
  }

  const registered = user ? isRegistered(user.id, currentEvent.id) : false;

  const renderOverviewTab = () => (
    <View style={styles.tabContent}>
      {/* Stats Row */}
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{agendaItems.length}</Text>
          <Text style={styles.statLabel}>Sessions</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{currentEvent.interests?.length || 0}</Text>
          <Text style={styles.statLabel}>Topics</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>
            {new Date(currentEvent.end_date).getDate() - new Date(currentEvent.start_date).getDate() + 1}
          </Text>
          <Text style={styles.statLabel}>Days</Text>
        </View>
      </View>

      {/* About */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>About This Event</Text>
        <Text style={styles.description}>
          {currentEvent.description ||
            "Join thousands of professionals at this premier event featuring keynote speakers, workshops, networking opportunities, and more. Discover the latest trends, connect with industry leaders, and gain insights that will transform your business."}
        </Text>
      </View>

      {/* Highlights */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Event Highlights</Text>
        <View style={styles.highlightsList}>
          {[
            { icon: "mic", text: "World-class speakers and thought leaders" },
            { icon: "people", text: "Networking with 5000+ professionals" },
            { icon: "construct", text: "Hands-on workshops and demos" },
            { icon: "gift", text: "Exclusive attendee swag and resources" },
          ].map((item, index) => (
            <View key={index} style={styles.highlightItem}>
              <View style={styles.highlightIcon}>
                <Ionicons
                  name={item.icon as any}
                  size={20}
                  color={Colors.primary.accent}
                />
              </View>
              <Text style={styles.highlightText}>{item.text}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Location */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Location</Text>
        <Card style={styles.locationCard}>
          <View style={styles.locationMap}>
            <Ionicons name="map" size={48} color={Colors.text.tertiary} />
          </View>
          <View style={styles.locationInfo}>
            <Text style={styles.locationName}>
              {currentEvent.venue_name || "Conference Center"}
            </Text>
            <Text style={styles.locationAddress}>
              {currentEvent.venue_address || "123 Main Street, City"}
            </Text>
            <TouchableOpacity style={styles.directionsButton}>
              <Ionicons
                name="navigate"
                size={16}
                color={Colors.primary.accent}
              />
              <Text style={styles.directionsText}>Get Directions</Text>
            </TouchableOpacity>
          </View>
        </Card>
      </View>
    </View>
  );

  const renderSpeakersTab = () => (
    <View style={styles.tabContent}>
      {/* Note: Speakers data would come from a speakers table in production */}
      <Card variant="outlined" style={styles.emptyStateCard}>
        <Ionicons name="people-outline" size={48} color={Colors.text.tertiary} />
        <Text style={styles.emptyStateTitle}>Speakers Coming Soon</Text>
        <Text style={styles.emptyStateText}>
          Speaker information will be announced closer to the event date.
        </Text>
      </Card>
    </View>
  );

  const renderAgendaTab = () => (
    <View style={styles.tabContent}>
      {loadingAgenda ? (
        <LoadingSpinner message="Loading agenda..." />
      ) : agendaItems.length === 0 ? (
        <Card variant="outlined" style={styles.emptyStateCard}>
          <Ionicons name="calendar-outline" size={48} color={Colors.text.tertiary} />
          <Text style={styles.emptyStateTitle}>No Agenda Available</Text>
          <Text style={styles.emptyStateText}>The event organizer hasn't added any sessions yet.</Text>
        </Card>
      ) : (
        <View style={styles.agendaList}>
          {agendaItems.map((item, index) => (
            <View key={item.id} style={styles.agendaItem}>
              <View style={styles.agendaTimeline}>
                <View
                  style={[
                    styles.agendaDot,
                    { backgroundColor: getEventTypeColor(item.type) },
                  ]}
                />
                {index < agendaItems.length - 1 && <View style={styles.agendaLine} />}
              </View>
              <View style={styles.agendaContent}>
                <View style={styles.agendaHeader}>
                  <Text style={styles.agendaTime}>{item.time}</Text>
                  <View
                    style={[
                      styles.agendaTypeBadge,
                      { backgroundColor: getEventTypeColor(item.type) + "20" },
                    ]}
                  >
                    <Text
                      style={[
                        styles.agendaTypeText,
                        { color: getEventTypeColor(item.type) },
                      ]}
                    >
                      {item.type.toUpperCase()}
                    </Text>
                  </View>
                </View>
                <Text style={styles.agendaTitle}>{item.title}</Text>
                <View style={styles.agendaDetails}>
                  <View style={styles.agendaDetail}>
                    <Ionicons
                      name="location-outline"
                      size={14}
                      color={Colors.text.secondary}
                    />
                    <Text style={styles.agendaDetailText}>{item.location}</Text>
                  </View>
                  <View style={styles.agendaDetail}>
                    <Ionicons
                      name="time-outline"
                      size={14}
                      color={Colors.text.secondary}
                    />
                    <Text style={styles.agendaDetailText}>{item.duration}</Text>
                  </View>
                </View>
                {item.speaker && (
                  <View style={styles.agendaSpeaker}>
                    <Ionicons
                      name="person-outline"
                      size={14}
                      color={Colors.primary.accent}
                    />
                    <Text style={styles.agendaSpeakerText}>{item.speaker}</Text>
                  </View>
                )}
              </View>
            </View>
          ))}
        </View>
      )}
    </View>
  );

  const renderVenueTab = () => (
    <View style={styles.tabContent}>
      {/* Venue Map Placeholder */}
      <Card style={styles.venueMapCard}>
        <View style={styles.venueMapPlaceholder}>
          <Ionicons name="map" size={64} color={Colors.text.tertiary} />
          <Text style={styles.venueMapText}>Interactive Venue Map</Text>
          <Text style={styles.venueMapSubtext}>Tap to explore</Text>
        </View>
      </Card>

      {/* Floor Legend */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Venue Areas</Text>
        <View style={styles.venueAreasList}>
          {VENUE_AREAS.map((area) => (
            <TouchableOpacity key={area.id} style={styles.venueAreaItem}>
              <View style={styles.venueAreaIcon}>
                <Ionicons
                  name="location"
                  size={20}
                  color={Colors.primary.accent}
                />
              </View>
              <View style={styles.venueAreaInfo}>
                <Text style={styles.venueAreaName}>{area.name}</Text>
                <Text style={styles.venueAreaDetails}>
                  {area.floor} Floor • Capacity: {area.capacity}
                </Text>
              </View>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={Colors.text.tertiary}
              />
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Quick Links */}
      <View style={styles.venueQuickLinks}>
        {[
          { icon: "restaurant", label: "Food Courts", count: 3 },
          { icon: "man", label: "Restrooms", count: 12 },
          { icon: "medical", label: "First Aid", count: 2 },
          { icon: "exit", label: "Exits", count: 8 },
        ].map((link, index) => (
          <TouchableOpacity key={index} style={styles.venueQuickLink}>
            <View style={styles.venueQuickLinkIcon}>
              <Ionicons
                name={link.icon as any}
                size={24}
                color={Colors.text.primary}
              />
            </View>
            <Text style={styles.venueQuickLinkLabel}>{link.label}</Text>
            <Text style={styles.venueQuickLinkCount}>{link.count}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Banner Image */}
        <View style={styles.bannerContainer}>
          {currentEvent.banner_url || currentEvent.logo_url ? (
            <Image
              source={{ uri: currentEvent.banner_url || currentEvent.logo_url }}
              style={styles.bannerImage}
              contentFit="cover"
            />
          ) : (
            <View style={styles.bannerPlaceholder}>
              <Ionicons name="image" size={64} color={Colors.text.tertiary} />
            </View>
          )}

          {/* Overlay Controls */}
          <View style={styles.bannerOverlay}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <Ionicons
                name="arrow-back"
                size={24}
                color={Colors.text.inverse}
              />
            </TouchableOpacity>
            <View style={styles.bannerActions}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={handleShare}
              >
                <Ionicons
                  name="share-outline"
                  size={24}
                  color={Colors.text.inverse}
                />
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButton}>
                <Ionicons
                  name="bookmark-outline"
                  size={24}
                  color={Colors.text.inverse}
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Event Badge */}
          {registered && (
            <View style={styles.registeredBadge}>
              <Ionicons
                name="checkmark-circle"
                size={16}
                color={Colors.text.inverse}
              />
              <Text style={styles.registeredText}>Registered</Text>
            </View>
          )}
        </View>

        {/* Event Info Header */}
        <View style={styles.eventHeader}>
          <Text style={styles.eventTitle}>{currentEvent.title}</Text>
          <View style={styles.eventMeta}>
            <View style={styles.metaItem}>
              <Ionicons
                name="calendar-outline"
                size={16}
                color={Colors.primary.accent}
              />
              <Text style={styles.metaText}>
                {formatDate(currentEvent.start_date)}
              </Text>
            </View>
            <View style={styles.metaItem}>
              <Ionicons
                name="location-outline"
                size={16}
                color={Colors.primary.accent}
              />
              <Text style={styles.metaText}>
                {currentEvent.venue_name || "TBA"}
              </Text>
            </View>
          </View>
        </View>

        {/* Tabs */}
        <View style={styles.tabsContainer}>
          {(["overview", "speakers", "agenda", "venue"] as TabType[]).map(
            (tab) => (
              <TouchableOpacity
                key={tab}
                style={[styles.tab, activeTab === tab && styles.tabActive]}
                onPress={() => setActiveTab(tab)}
              >
                <Text
                  style={[
                    styles.tabText,
                    activeTab === tab && styles.tabTextActive,
                  ]}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </Text>
              </TouchableOpacity>
            ),
          )}
        </View>

        {/* Tab Content */}
        {activeTab === "overview" && renderOverviewTab()}
        {activeTab === "speakers" && renderSpeakersTab()}
        {activeTab === "agenda" && renderAgendaTab()}
        {activeTab === "venue" && renderVenueTab()}
      </ScrollView>

      {/* Bottom Action Bar */}
      <View style={styles.bottomBar}>
        <View style={styles.bottomBarContent}>
          <View style={styles.priceInfo}>
            <Text style={styles.priceLabel}>Free Event</Text>
            <Text style={styles.priceValue}>Register now</Text>
          </View>
          <Button
            title={registered ? "Registered ✓" : "RSVP Now"}
            onPress={handleRegistrationToggle}
            variant={registered ? "outline" : "primary"}
            loading={registering}
            style={styles.rsvpButton}
          />
        </View>
      </View>
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
  bannerContainer: {
    height: 220,
    position: "relative",
  },
  bannerImage: {
    width: "100%",
    height: "100%",
  },
  bannerPlaceholder: {
    width: "100%",
    height: "100%",
    backgroundColor: Colors.background.secondary,
    alignItems: "center",
    justifyContent: "center",
  },
  bannerOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    padding: Spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.full,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    alignItems: "center",
    justifyContent: "center",
  },
  bannerActions: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.full,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    alignItems: "center",
    justifyContent: "center",
  },
  registeredBadge: {
    position: "absolute",
    bottom: Spacing.md,
    right: Spacing.md,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.status.success,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.full,
    gap: Spacing.xs,
  },
  registeredText: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.semibold,
    color: Colors.text.inverse,
  },
  eventHeader: {
    padding: Spacing.md,
  },
  eventTitle: {
    fontSize: FontSizes.xxl,
    fontWeight: FontWeights.bold,
    color: Colors.text.primary,
    marginBottom: Spacing.sm,
  },
  eventMeta: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.md,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  metaText: {
    fontSize: FontSizes.sm,
    color: Colors.text.secondary,
  },
  tabsContainer: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.secondary,
    paddingHorizontal: Spacing.md,
  },
  tab: {
    flex: 1,
    paddingVertical: Spacing.md,
    alignItems: "center",
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  tabActive: {
    borderBottomColor: Colors.primary.accent,
  },
  tabText: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.medium,
    color: Colors.text.tertiary,
  },
  tabTextActive: {
    color: Colors.primary.accent,
  },
  tabContent: {
    padding: Spacing.md,
    paddingBottom: 100,
  },
  statsRow: {
    flexDirection: "row",
    backgroundColor: Colors.background.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
    ...Shadows.sm,
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statNumber: {
    fontSize: FontSizes.xxl,
    fontWeight: FontWeights.bold,
    color: Colors.primary.accent,
  },
  statLabel: {
    fontSize: FontSizes.sm,
    color: Colors.text.secondary,
  },
  statDivider: {
    width: 1,
    backgroundColor: Colors.border.secondary,
  },
  section: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.semibold,
    color: Colors.text.primary,
    marginBottom: Spacing.md,
  },
  description: {
    fontSize: FontSizes.md,
    color: Colors.text.secondary,
    lineHeight: 24,
  },
  highlightsList: {
    gap: Spacing.sm,
  },
  highlightItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  highlightIcon: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.primary.accent + "20",
    alignItems: "center",
    justifyContent: "center",
  },
  highlightText: {
    flex: 1,
    fontSize: FontSizes.md,
    color: Colors.text.primary,
  },
  locationCard: {
    flexDirection: "row",
    padding: Spacing.md,
  },
  locationMap: {
    width: 100,
    height: 100,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.background.secondary,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
  },
  locationInfo: {
    flex: 1,
    justifyContent: "center",
  },
  locationName: {
    fontSize: FontSizes.md,
    fontWeight: FontWeights.semibold,
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
  },
  locationAddress: {
    fontSize: FontSizes.sm,
    color: Colors.text.secondary,
    marginBottom: Spacing.sm,
  },
  directionsButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  directionsText: {
    fontSize: FontSizes.sm,
    color: Colors.primary.accent,
    fontWeight: FontWeights.medium,
  },
  speakersGrid: {
    gap: Spacing.md,
  },
  speakerCard: {
    flexDirection: "row",
    padding: Spacing.md,
  },
  speakerImage: {
    width: 80,
    height: 80,
    borderRadius: BorderRadius.md,
  },
  speakerInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  speakerName: {
    fontSize: FontSizes.md,
    fontWeight: FontWeights.semibold,
    color: Colors.text.primary,
  },
  speakerRole: {
    fontSize: FontSizes.sm,
    color: Colors.text.secondary,
    marginBottom: Spacing.sm,
  },
  speakerDivider: {
    height: 1,
    backgroundColor: Colors.border.secondary,
    marginVertical: Spacing.sm,
  },
  speakerTopic: {
    fontSize: FontSizes.sm,
    color: Colors.text.primary,
    fontWeight: FontWeights.medium,
    marginBottom: Spacing.xs,
  },
  speakerTime: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  speakerTimeText: {
    fontSize: FontSizes.sm,
    color: Colors.text.secondary,
  },
  agendaList: {
    gap: 0,
  },
  agendaItem: {
    flexDirection: "row",
  },
  agendaTimeline: {
    alignItems: "center",
    width: 30,
  },
  agendaDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    zIndex: 1,
  },
  agendaLine: {
    flex: 1,
    width: 2,
    backgroundColor: Colors.border.secondary,
    marginTop: -2,
  },
  agendaContent: {
    flex: 1,
    backgroundColor: Colors.background.card,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginLeft: Spacing.sm,
    marginBottom: Spacing.md,
    ...Shadows.sm,
  },
  agendaHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.xs,
  },
  agendaTime: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.semibold,
    color: Colors.text.secondary,
  },
  agendaTypeBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  agendaTypeText: {
    fontSize: FontSizes.xs,
    fontWeight: FontWeights.semibold,
  },
  agendaTitle: {
    fontSize: FontSizes.md,
    fontWeight: FontWeights.semibold,
    color: Colors.text.primary,
    marginBottom: Spacing.sm,
  },
  agendaDetails: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  agendaDetail: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  agendaDetailText: {
    fontSize: FontSizes.sm,
    color: Colors.text.secondary,
  },
  agendaSpeaker: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    marginTop: Spacing.sm,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border.secondary,
  },
  agendaSpeakerText: {
    fontSize: FontSizes.sm,
    color: Colors.primary.accent,
    fontWeight: FontWeights.medium,
  },
  venueMapCard: {
    marginBottom: Spacing.lg,
    overflow: "hidden",
  },
  venueMapPlaceholder: {
    height: 200,
    backgroundColor: Colors.background.secondary,
    alignItems: "center",
    justifyContent: "center",
  },
  venueMapText: {
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.semibold,
    color: Colors.text.secondary,
    marginTop: Spacing.sm,
  },
  venueMapSubtext: {
    fontSize: FontSizes.sm,
    color: Colors.text.tertiary,
  },
  venueAreasList: {
    gap: Spacing.sm,
  },
  venueAreaItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.background.card,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    ...Shadows.sm,
  },
  venueAreaIcon: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.primary.accent + "20",
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
  },
  venueAreaInfo: {
    flex: 1,
  },
  venueAreaName: {
    fontSize: FontSizes.md,
    fontWeight: FontWeights.semibold,
    color: Colors.text.primary,
  },
  venueAreaDetails: {
    fontSize: FontSizes.sm,
    color: Colors.text.secondary,
  },
  venueQuickLinks: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.md,
    marginTop: Spacing.lg,
  },
  venueQuickLink: {
    width: "47%",
    backgroundColor: Colors.background.card,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    ...Shadows.sm,
  },
  venueQuickLinkIcon: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.background.secondary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.sm,
  },
  venueQuickLinkLabel: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.medium,
    color: Colors.text.primary,
  },
  venueQuickLinkCount: {
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.bold,
    color: Colors.primary.accent,
    marginTop: Spacing.xs,
  },
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.background.primary,
    borderTopWidth: 1,
    borderTopColor: Colors.border.secondary,
    padding: Spacing.md,
    paddingBottom: Spacing.lg,
  },
  bottomBarContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  priceInfo: {
    flex: 1,
  },
  priceLabel: {
    fontSize: FontSizes.sm,
    color: Colors.text.secondary,
  },
  priceValue: {
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.bold,
    color: Colors.text.primary,
  },
  rsvpButton: {
    minWidth: 140,
  },
  emptyStateCard: {
    padding: Spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyStateTitle: {
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.semibold,
    color: Colors.text.secondary,
    marginTop: Spacing.md,
    textAlign: 'center',
  },
  emptyStateText: {
    fontSize: FontSizes.sm,
    color: Colors.text.tertiary,
    marginTop: Spacing.xs,
    textAlign: 'center',
    maxWidth: 250,
  },
});

export default EventDetailsScreen;
