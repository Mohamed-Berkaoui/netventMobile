/**
 * Indoor Navigation Screen (Screen 3: Venue Navigation - Indoor GPS)
 * Visual guidance to navigate the venue
 *
 * Features:
 * - 3D floor plan view (simulated)
 * - Directions card with next steps
 * - Floor/Category navigation tabs
 * - Distance and time estimation
 * - Dynamic POIs from agenda items
 */

import { router, useLocalSearchParams } from "expo-router";
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
import Animated, {
    Easing,
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withSequence,
    withTiming,
} from "react-native-reanimated";
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
import { usePermissionsStore } from "../../stores/permissionsStore";
import { AgendaItem, Event } from "../../types";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const MAP_HEIGHT = SCREEN_HEIGHT * 0.45;

// Floor data - can be made dynamic from event data
interface Floor {
  id: string;
  name: string;
  label: string;
}

// Category filters
interface Category {
  id: string;
  name: string;
  icon: string;
}

const CATEGORIES: Category[] = [
  { id: "all", name: "All", icon: "apps" },
  { id: "sessions", name: "Sessions", icon: "calendar" },
  { id: "food", name: "Food", icon: "restaurant" },
  { id: "restroom", name: "Restroom", icon: "water" },
  { id: "exit", name: "Exits", icon: "exit" },
];

// Points of Interest
interface POI {
  id: string;
  name: string;
  type:
    | "session"
    | "booth"
    | "entrance"
    | "restroom"
    | "food"
    | "exit"
    | "info"
    | "you";
  x: number;
  y: number;
  floor: string;
  description?: string;
  room?: string;
  agendaItem?: AgendaItem;
}

// Default static POIs for venue amenities
const DEFAULT_POIS: POI[] = [
  { id: "user", name: "You are here", type: "you", x: 50, y: 70, floor: "1" },
  {
    id: "entrance",
    name: "Main Entrance",
    type: "entrance",
    x: 50,
    y: 95,
    floor: "1",
  },
  {
    id: "exit",
    name: "Emergency Exit",
    type: "exit",
    x: 90,
    y: 50,
    floor: "1",
  },
  {
    id: "restroom1",
    name: "Restrooms",
    type: "restroom",
    x: 20,
    y: 60,
    floor: "1",
  },
  {
    id: "restroom2",
    name: "Restrooms",
    type: "restroom",
    x: 80,
    y: 30,
    floor: "2",
  },
  { id: "food1", name: "Cafeteria", type: "food", x: 80, y: 60, floor: "1" },
  {
    id: "info",
    name: "Information Desk",
    type: "info",
    x: 50,
    y: 85,
    floor: "1",
  },
];

export const IndoorNavigationScreen: React.FC = () => {
  const { eventId } = useLocalSearchParams<{ eventId?: string }>();
  const { user } = useAuthStore();
  const { registeredEvents, fetchRegisteredEvents } = useEventsStore();
  const { locationEnabled } = usePermissionsStore();

  const [selectedFloor, setSelectedFloor] = useState("1");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedPOI, setSelectedPOI] = useState<POI | null>(null);
  const [showDirections, setShowDirections] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  // Dynamic data from backend
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [agendaItems, setAgendaItems] = useState<AgendaItem[]>([]);
  const [floors, setFloors] = useState<Floor[]>([
    { id: "1", name: "Floor 1", label: "Ground" },
    { id: "2", name: "Floor 2", label: "Upper" },
  ]);
  const [pois, setPois] = useState<POI[]>(DEFAULT_POIS);

  // Animation for user location pulse
  const pulseScale = useSharedValue(1);
  const pulseOpacity = useSharedValue(0.6);

  useEffect(() => {
    pulseScale.value = withRepeat(
      withSequence(
        withTiming(1.5, { duration: 1000, easing: Easing.out(Easing.ease) }),
        withTiming(1, { duration: 1000, easing: Easing.in(Easing.ease) }),
      ),
      -1,
      false,
    );

    pulseOpacity.value = withRepeat(
      withSequence(
        withTiming(0, { duration: 1000 }),
        withTiming(0.6, { duration: 1000 }),
      ),
      -1,
      false,
    );
  }, []);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
    opacity: pulseOpacity.value,
  }));

  // Fetch agenda items and generate POIs
  const fetchNavigationData = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      // Determine which event to use
      let targetEvent: Event | null = null;

      if (eventId && registeredEvents.length > 0) {
        targetEvent = registeredEvents.find((e) => e.id === eventId) || null;
      } else if (registeredEvents.length > 0) {
        targetEvent = registeredEvents[0];
      }

      if (!targetEvent) {
        setPois(DEFAULT_POIS);
        setLoading(false);
        return;
      }

      setSelectedEvent(targetEvent);

      // Fetch agenda items for this event
      const { data, error } = await supabase
        .from("agenda_items")
        .select("*")
        .eq("event_id", targetEvent.id)
        .order("start_time", { ascending: true });

      if (error) throw error;

      const items = (data || []) as AgendaItem[];
      setAgendaItems(items);

      // Generate unique floors from agenda items
      const uniqueFloors = new Set<number>();
      items.forEach((item) => {
        if (item.floor) uniqueFloors.add(item.floor);
      });

      if (uniqueFloors.size > 0) {
        const floorArray = Array.from(uniqueFloors)
          .sort()
          .map((f) => ({
            id: f.toString(),
            name: `Floor ${f}`,
            label: f === 1 ? "Ground" : f === 2 ? "Upper" : `Level ${f}`,
          }));
        setFloors(floorArray);
      }

      // Generate POIs from agenda items
      const agendaPOIs: POI[] = items.map((item, index) => {
        // Generate pseudo-random positions based on item id hash
        const hash = item.id
          .split("")
          .reduce((acc, char) => acc + char.charCodeAt(0), 0);
        const x = 15 + (hash % 70); // 15-85% range
        const y = 15 + ((hash * 7) % 60); // 15-75% range

        return {
          id: item.id,
          name: item.title,
          type: "session" as const,
          x,
          y,
          floor: (item.floor || 1).toString(),
          description: item.description || undefined,
          room: item.location_name || `Room ${index + 1}`,
          agendaItem: item,
        };
      });

      // Combine default POIs with agenda POIs
      setPois([...DEFAULT_POIS, ...agendaPOIs]);
    } catch (error) {
      console.error("Error fetching navigation data:", error);
      setPois(DEFAULT_POIS);
    } finally {
      setLoading(false);
    }
  }, [user, eventId, registeredEvents]);

  useEffect(() => {
    if (user) {
      fetchRegisteredEvents(user.id);
    }
  }, [user]);

  useEffect(() => {
    fetchNavigationData();
  }, [fetchNavigationData]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    if (user) {
      await fetchRegisteredEvents(user.id);
    }
    await fetchNavigationData();
    setRefreshing(false);
  }, [user, fetchNavigationData]);

  // Filter POIs based on selected floor and category
  const filteredPOIs = pois.filter((poi) => {
    if (poi.floor !== selectedFloor) return false;
    if (selectedCategory === "all") return true;
    if (selectedCategory === "sessions")
      return poi.type === "session" || poi.type === "booth";
    if (selectedCategory === "food") return poi.type === "food";
    if (selectedCategory === "restroom") return poi.type === "restroom";
    if (selectedCategory === "exit")
      return poi.type === "exit" || poi.type === "entrance";
    return true;
  });

  const getPOIIcon = (type: POI["type"]) => {
    switch (type) {
      case "session":
        return "calendar";
      case "booth":
        return "storefront";
      case "entrance":
        return "enter";
      case "restroom":
        return "water";
      case "food":
        return "restaurant";
      case "exit":
        return "exit";
      case "info":
        return "information-circle";
      case "you":
        return "navigate";
      default:
        return "location";
    }
  };

  const getPOIColor = (type: POI["type"]) => {
    switch (type) {
      case "session":
        return Colors.primary.accent;
      case "booth":
        return Colors.status.info;
      case "entrance":
        return Colors.status.success;
      case "restroom":
        return "#3B82F6";
      case "food":
        return Colors.status.warning;
      case "exit":
        return Colors.status.error;
      case "info":
        return "#9CA3AF";
      case "you":
        return Colors.primary.accent;
      default:
        return Colors.text.tertiary;
    }
  };

  const handlePOIPress = (poi: POI) => {
    if (poi.type === "you") return;
    setSelectedPOI(poi);
  };

  const handleStartNavigation = () => {
    if (selectedPOI) {
      setShowDirections(true);
    }
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  if (loading) {
    return <LoadingSpinner fullScreen message="Loading venue map..." />;
  }

  if (!selectedEvent && registeredEvents.length === 0) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Icon name="arrow-back" size={24} color={Colors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Venue Navigation</Text>
          <View style={styles.backButton} />
        </View>
        <EmptyState
          icon="map-outline"
          title="No Event Selected"
          description="Register for an event to access venue navigation"
          actionLabel="Browse Events"
          onAction={() => router.push("/(tabs)/events")}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Icon name="arrow-back" size={24} color={Colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Venue Navigation</Text>
        <TouchableOpacity style={styles.backButton}>
          <Icon name="search" size={24} color={Colors.text.primary} />
        </TouchableOpacity>
      </View>

      {/* Event Name */}
      {selectedEvent && (
        <View style={styles.eventBanner}>
          <Icon name="location" size={16} color={Colors.primary.accent} />
          <Text style={styles.eventName} numberOfLines={1}>
            {selectedEvent.title}
          </Text>
        </View>
      )}

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={Colors.primary.accent}
          />
        }
      >
        {/* Map Container */}
        <View style={styles.mapContainer}>
          {/* Floor Selector */}
          <View style={styles.floorSelector}>
            {floors.map((floor) => (
              <TouchableOpacity
                key={floor.id}
                style={[
                  styles.floorButton,
                  selectedFloor === floor.id && styles.floorButtonActive,
                ]}
                onPress={() => setSelectedFloor(floor.id)}
              >
                <Text
                  style={[
                    styles.floorButtonText,
                    selectedFloor === floor.id && styles.floorButtonTextActive,
                  ]}
                >
                  {floor.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Map View */}
          <View style={styles.mapView}>
            {/* Grid lines for visual reference */}
            {[...Array(5)].map((_, i) => (
              <View
                key={`h-${i}`}
                style={[
                  styles.gridLine,
                  styles.gridLineHorizontal,
                  { top: `${20 * (i + 1)}%` },
                ]}
              />
            ))}
            {[...Array(5)].map((_, i) => (
              <View
                key={`v-${i}`}
                style={[
                  styles.gridLine,
                  styles.gridLineVertical,
                  { left: `${20 * (i + 1)}%` },
                ]}
              />
            ))}

            {/* Room outlines */}
            <View
              style={[
                styles.roomOutline,
                { left: "10%", top: "10%", width: "35%", height: "40%" },
              ]}
            />
            <View
              style={[
                styles.roomOutline,
                { left: "55%", top: "10%", width: "35%", height: "40%" },
              ]}
            />
            <View
              style={[
                styles.roomOutline,
                { left: "10%", top: "55%", width: "80%", height: "20%" },
              ]}
            />

            {/* POI Markers */}
            {filteredPOIs.map((poi) => (
              <TouchableOpacity
                key={poi.id}
                style={[
                  styles.poiMarker,
                  {
                    left: `${poi.x}%`,
                    top: `${poi.y}%`,
                  },
                  selectedPOI?.id === poi.id && styles.poiMarkerSelected,
                ]}
                onPress={() => handlePOIPress(poi)}
              >
                {poi.type === "you" && (
                  <Animated.View style={[styles.poiPulse, pulseStyle]} />
                )}
                <View
                  style={[
                    styles.poiIcon,
                    { backgroundColor: getPOIColor(poi.type) },
                  ]}
                >
                  <Icon
                    name={getPOIIcon(poi.type)}
                    size={poi.type === "you" ? 16 : 12}
                    color={Colors.text.inverse}
                  />
                </View>
              </TouchableOpacity>
            ))}

            {/* No POIs message */}
            {filteredPOIs.length === 0 && (
              <View style={styles.noPoisMessage}>
                <Text style={styles.noPoisText}>
                  No locations on this floor
                </Text>
              </View>
            )}
          </View>

          {/* Zoom controls */}
          <View style={styles.zoomControls}>
            <TouchableOpacity style={styles.zoomButton}>
              <Icon name="add" size={20} color={Colors.text.primary} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.zoomButton}>
              <Icon name="remove" size={20} color={Colors.text.primary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Category Filters */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoriesScroll}
          contentContainerStyle={styles.categoriesContent}
        >
          {CATEGORIES.map((category) => (
            <TouchableOpacity
              key={category.id}
              style={[
                styles.categoryButton,
                selectedCategory === category.id && styles.categoryButtonActive,
              ]}
              onPress={() => setSelectedCategory(category.id)}
            >
              <Icon
                name={category.icon}
                size={16}
                color={
                  selectedCategory === category.id
                    ? Colors.text.inverse
                    : Colors.text.tertiary
                }
              />
              <Text
                style={[
                  styles.categoryText,
                  selectedCategory === category.id && styles.categoryTextActive,
                ]}
              >
                {category.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Selected POI Details */}
        {selectedPOI && (
          <Card variant="elevated" style={styles.poiDetailsCard}>
            <View style={styles.poiDetailsHeader}>
              <View
                style={[
                  styles.poiDetailsIcon,
                  { backgroundColor: getPOIColor(selectedPOI.type) },
                ]}
              >
                <Icon
                  name={getPOIIcon(selectedPOI.type)}
                  size={24}
                  color={Colors.text.inverse}
                />
              </View>
              <View style={styles.poiDetailsInfo}>
                <Text style={styles.poiDetailsName}>{selectedPOI.name}</Text>
                {selectedPOI.room && (
                  <Text style={styles.poiDetailsRoom}>{selectedPOI.room}</Text>
                )}
                {selectedPOI.description && (
                  <Text style={styles.poiDetailsDesc}>
                    {selectedPOI.description}
                  </Text>
                )}
                {selectedPOI.agendaItem && (
                  <Text style={styles.poiDetailsTime}>
                    {formatTime(selectedPOI.agendaItem.start_time)} -{" "}
                    {formatTime(selectedPOI.agendaItem.end_time)}
                  </Text>
                )}
              </View>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setSelectedPOI(null)}
              >
                <Icon name="close" size={20} color={Colors.text.tertiary} />
              </TouchableOpacity>
            </View>

            <View style={styles.poiDetailsStats}>
              <View style={styles.poiDetailsStat}>
                <Icon name="walk" size={16} color={Colors.text.tertiary} />
                <Text style={styles.poiDetailsStatText}>~2 min walk</Text>
              </View>
              <View style={styles.poiDetailsStat}>
                <Icon name="navigate" size={16} color={Colors.text.tertiary} />
                <Text style={styles.poiDetailsStatText}>
                  Floor {selectedPOI.floor}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.navigateButton}
              onPress={handleStartNavigation}
            >
              <Icon name="navigate" size={20} color={Colors.text.inverse} />
              <Text style={styles.navigateButtonText}>Start Navigation</Text>
            </TouchableOpacity>
          </Card>
        )}

        {/* Directions Card */}
        {showDirections && selectedPOI && (
          <Card variant="elevated" style={styles.directionsCard}>
            <View style={styles.directionsHeader}>
              <Text style={styles.directionsTitle}>Directions</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowDirections(false)}
              >
                <Icon name="close" size={20} color={Colors.text.tertiary} />
              </TouchableOpacity>
            </View>

            <View style={styles.directionStep}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>1</Text>
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepText}>
                  Head towards the main hallway
                </Text>
                <Text style={styles.stepDistance}>50m • 1 min</Text>
              </View>
            </View>

            <View style={styles.directionStep}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>2</Text>
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepText}>
                  Turn right at the information desk
                </Text>
                <Text style={styles.stepDistance}>30m • 30 sec</Text>
              </View>
            </View>

            <View style={styles.directionStep}>
              <View style={[styles.stepNumber, styles.stepNumberFinal]}>
                <Icon name="flag" size={14} color={Colors.text.inverse} />
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepText}>
                  Arrive at {selectedPOI.name}
                </Text>
                <Text style={styles.stepDistance}>
                  {selectedPOI.room || `Floor ${selectedPOI.floor}`}
                </Text>
              </View>
            </View>
          </Card>
        )}

        {/* Nearby Sessions */}
        {agendaItems.length > 0 && (
          <View style={styles.nearbySection}>
            <Text style={styles.nearbySectionTitle}>Upcoming Sessions</Text>
            {agendaItems.slice(0, 3).map((item) => (
              <Card key={item.id} variant="default" style={styles.nearbyCard}>
                <TouchableOpacity
                  style={styles.nearbyCardContent}
                  onPress={() => {
                    const poi = pois.find((p) => p.id === item.id);
                    if (poi) {
                      setSelectedFloor(poi.floor);
                      setSelectedPOI(poi);
                    }
                  }}
                >
                  <View style={styles.nearbyInfo}>
                    <Text style={styles.nearbyName}>{item.title}</Text>
                    <Text style={styles.nearbyLocation}>
                      {item.location_name} • Floor {item.floor}
                    </Text>
                    <Text style={styles.nearbyTime}>
                      {formatTime(item.start_time)} -{" "}
                      {formatTime(item.end_time)}
                    </Text>
                  </View>
                  <Icon
                    name="chevron-forward"
                    size={20}
                    color={Colors.text.tertiary}
                  />
                </TouchableOpacity>
              </Card>
            ))}
          </View>
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

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.secondary,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.semibold,
    color: Colors.text.primary,
  },

  // Event Banner
  eventBanner: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.background.secondary,
  },
  eventName: {
    flex: 1,
    fontSize: FontSizes.sm,
    color: Colors.text.secondary,
    marginLeft: 6,
  },

  scrollView: {
    flex: 1,
  },

  // Map Container
  mapContainer: {
    height: MAP_HEIGHT,
    position: "relative",
  },

  // Floor Selector
  floorSelector: {
    position: "absolute",
    top: Spacing.md,
    left: Spacing.md,
    zIndex: 10,
    backgroundColor: Colors.background.secondary,
    borderRadius: BorderRadius.md,
    padding: 4,
    flexDirection: "column",
  },
  floorButton: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
    borderRadius: BorderRadius.sm,
    marginBottom: 2,
  },
  floorButtonActive: {
    backgroundColor: Colors.primary.accent,
  },
  floorButtonText: {
    fontSize: FontSizes.xs,
    fontWeight: FontWeights.medium,
    color: Colors.text.tertiary,
  },
  floorButtonTextActive: {
    color: Colors.text.inverse,
  },

  // Map View
  mapView: {
    flex: 1,
    backgroundColor: Colors.background.secondary,
    margin: Spacing.md,
    borderRadius: BorderRadius.lg,
    position: "relative",
    overflow: "hidden",
  },

  // Grid
  gridLine: {
    position: "absolute",
    backgroundColor: Colors.border.secondary,
  },
  gridLineHorizontal: {
    left: 0,
    right: 0,
    height: 1,
  },
  gridLineVertical: {
    top: 0,
    bottom: 0,
    width: 1,
  },

  // Room outlines
  roomOutline: {
    position: "absolute",
    borderWidth: 1,
    borderColor: Colors.border.primary,
    borderRadius: BorderRadius.sm,
    backgroundColor: "rgba(255,255,255,0.02)",
  },

  // POI Marker
  poiMarker: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
    transform: [{ translateX: -16 }, { translateY: -16 }],
  },
  poiMarkerSelected: {
    zIndex: 100,
  },
  poiPulse: {
    position: "absolute",
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary.accent,
  },
  poiIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },

  // No POIs
  noPoisMessage: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  noPoisText: {
    fontSize: FontSizes.sm,
    color: Colors.text.tertiary,
  },

  // Zoom Controls
  zoomControls: {
    position: "absolute",
    bottom: Spacing.md,
    right: Spacing.md,
    zIndex: 10,
  },
  zoomButton: {
    width: 36,
    height: 36,
    backgroundColor: Colors.background.tertiary,
    borderRadius: BorderRadius.sm,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },

  // Categories
  categoriesScroll: {
    maxHeight: 50,
  },
  categoriesContent: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  categoryButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.background.secondary,
    borderRadius: BorderRadius.full,
    marginRight: Spacing.sm,
  },
  categoryButtonActive: {
    backgroundColor: Colors.primary.accent,
  },
  categoryText: {
    fontSize: FontSizes.sm,
    color: Colors.text.tertiary,
    marginLeft: 6,
  },
  categoryTextActive: {
    color: Colors.text.inverse,
    fontWeight: FontWeights.medium,
  },

  // POI Details Card
  poiDetailsCard: {
    margin: Spacing.md,
    padding: Spacing.md,
  },
  poiDetailsHeader: {
    flexDirection: "row",
    marginBottom: Spacing.md,
  },
  poiDetailsIcon: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
  },
  poiDetailsInfo: {
    flex: 1,
  },
  poiDetailsName: {
    fontSize: FontSizes.md,
    fontWeight: FontWeights.semibold,
    color: Colors.text.primary,
  },
  poiDetailsRoom: {
    fontSize: FontSizes.sm,
    color: Colors.text.secondary,
    marginTop: 2,
  },
  poiDetailsDesc: {
    fontSize: FontSizes.sm,
    color: Colors.text.tertiary,
    marginTop: 2,
  },
  poiDetailsTime: {
    fontSize: FontSizes.xs,
    color: Colors.primary.accent,
    marginTop: 4,
  },
  closeButton: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  poiDetailsStats: {
    flexDirection: "row",
    marginBottom: Spacing.md,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border.secondary,
  },
  poiDetailsStat: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: Spacing.lg,
  },
  poiDetailsStatText: {
    fontSize: FontSizes.sm,
    color: Colors.text.tertiary,
    marginLeft: 6,
  },
  navigateButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.primary.accent,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  navigateButtonText: {
    fontSize: FontSizes.md,
    fontWeight: FontWeights.semibold,
    color: Colors.text.inverse,
    marginLeft: Spacing.sm,
  },

  // Directions Card
  directionsCard: {
    margin: Spacing.md,
    marginTop: 0,
    padding: Spacing.md,
  },
  directionsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  directionsTitle: {
    fontSize: FontSizes.md,
    fontWeight: FontWeights.semibold,
    color: Colors.text.primary,
  },
  directionStep: {
    flexDirection: "row",
    marginBottom: Spacing.md,
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.primary.accent,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.sm,
  },
  stepNumberFinal: {
    backgroundColor: Colors.status.success,
  },
  stepNumberText: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.bold,
    color: Colors.text.inverse,
  },
  stepContent: {
    flex: 1,
  },
  stepText: {
    fontSize: FontSizes.sm,
    color: Colors.text.primary,
  },
  stepDistance: {
    fontSize: FontSizes.xs,
    color: Colors.text.tertiary,
    marginTop: 2,
  },

  // Nearby Section
  nearbySection: {
    padding: Spacing.md,
  },
  nearbySectionTitle: {
    fontSize: FontSizes.md,
    fontWeight: FontWeights.semibold,
    color: Colors.text.primary,
    marginBottom: Spacing.sm,
  },
  nearbyCard: {
    marginBottom: Spacing.sm,
  },
  nearbyCardContent: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
  },
  nearbyInfo: {
    flex: 1,
  },
  nearbyName: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.medium,
    color: Colors.text.primary,
  },
  nearbyLocation: {
    fontSize: FontSizes.xs,
    color: Colors.text.secondary,
    marginTop: 2,
  },
  nearbyTime: {
    fontSize: FontSizes.xs,
    color: Colors.primary.accent,
    marginTop: 2,
  },

  bottomSpacing: {
    height: 100,
  },
});

export default IndoorNavigationScreen;
