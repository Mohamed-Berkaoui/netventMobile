/**
 * Badge Screen (Screen 4: User Profile Badge)
 * Digital badge showing user information with permission status
 *
 * Features:
 * - User profile information (name, title, company)
 * - Location & Bluetooth status indicators (green/red)
 * - Event registration info
 * - Check-in status
 */

import { Icon } from "@/components/TabIcon";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
    Alert,
    Dimensions,
    Platform,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Avatar, Card, EmptyState, LoadingSpinner } from "../../components/ui";
import {
    BorderRadius,
    Colors,
    FontSizes,
    FontWeights,
    Spacing
} from "../../constants/theme";
import { useAuthStore } from "../../stores/authStore";
import { useEventsStore } from "../../stores/eventsStore";
import { usePermissionsStore } from "../../stores/permissionsStore";
import { CheckIn, Event, Registration } from "../../types";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

type CheckInStatus =
  | "not-registered"
  | "pending"
  | "checked-in"
  | "checked-out";

interface RegistrationWithEvent extends Registration {
  event?: Event;
}

export const BadgeScreen: React.FC = () => {
  const { eventId } = useLocalSearchParams<{ eventId?: string }>();
  const { user } = useAuthStore();
  const {
    registeredEvents,
    registrations,
    checkIns,
    loading,
    fetchRegisteredEvents,
    fetchCheckIns,
    checkIn,
  } = useEventsStore();

  // Permission status for location and bluetooth
  const { locationEnabled, bluetoothEnabled, checkPermissions } =
    usePermissionsStore();

  const [refreshing, setRefreshing] = useState(false);
  const [checkingIn, setCheckingIn] = useState(false);

  // Determine which event to show
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [selectedRegistration, setSelectedRegistration] =
    useState<RegistrationWithEvent | null>(null);

  useEffect(() => {
    if (user) {
      fetchRegisteredEvents(user.id);
      fetchCheckIns(user.id);
    }
    // Check permissions on mount
    checkPermissions();
  }, [user]);

  useEffect(() => {
    // Find the selected event and registration
    if (eventId && registeredEvents.length > 0) {
      const event = registeredEvents.find((e) => e.id === eventId);
      if (event) {
        setSelectedEvent(event);
        const reg = registrations.find((r) => r.event_id === eventId);
        setSelectedRegistration(reg || null);
      }
    } else if (registeredEvents.length > 0) {
      // Default to the first registered event
      const event = registeredEvents[0];
      setSelectedEvent(event);
      const reg = registrations.find((r) => r.event_id === event.id);
      setSelectedRegistration(reg || null);
    }
  }, [eventId, registeredEvents, registrations]);

  // Get check-in status for the selected event
  const getCheckInStatus = (): CheckInStatus => {
    if (!selectedEvent) return "not-registered";
    if (!selectedRegistration) return "not-registered";

    const eventCheckIns = checkIns.filter(
      (c) => c.event_id === selectedEvent.id,
    );
    if (eventCheckIns.length === 0) return "pending";

    // Sort by timestamp descending to get the latest
    const sorted = [...eventCheckIns].sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    );
    const latest = sorted[0];

    return latest.type === "check_in" ? "checked-in" : "checked-out";
  };

  const getLatestCheckIn = (): CheckIn | null => {
    if (!selectedEvent) return null;
    const eventCheckIns = checkIns.filter(
      (c) => c.event_id === selectedEvent.id && c.type === "check_in",
    );
    if (eventCheckIns.length === 0) return null;
    return eventCheckIns.sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    )[0];
  };

  const status = getCheckInStatus();
  const latestCheckIn = getLatestCheckIn();

  const handleRefresh = useCallback(async () => {
    if (!user) return;
    setRefreshing(true);
    await Promise.all([fetchRegisteredEvents(user.id), fetchCheckIns(user.id)]);
    setRefreshing(false);
  }, [user]);

  const getStatusColor = () => {
    switch (status) {
      case "not-registered":
        return Colors.text.tertiary;
      case "pending":
        return Colors.status.warning;
      case "checked-in":
        return Colors.status.success;
      case "checked-out":
        return Colors.text.tertiary;
    }
  };

  const getStatusText = () => {
    switch (status) {
      case "not-registered":
        return "Not Registered";
      case "pending":
        return "Pending Check-in";
      case "checked-in":
        return "Checked In";
      case "checked-out":
        return "Checked Out";
    }
  };

  const getStatusIcon = (): any => {
    switch (status) {
      case "not-registered":
        return "close-circle-outline";
      case "pending":
        return "time-outline";
      case "checked-in":
        return "checkmark-circle";
      case "checked-out":
        return "exit-outline";
    }
  };

  const handleCheckIn = async () => {
    if (!user || !selectedEvent) return;

    setCheckingIn(true);
    const result = await checkIn(user.id, selectedEvent.id, "check_in");
    setCheckingIn(false);

    if (result.error) {
      Alert.alert("Check-in Failed", result.error);
    } else {
      Alert.alert(
        "Check-in Successful",
        `Welcome to ${selectedEvent.title}! Enjoy the event.`,
        [{ text: "OK" }],
      );
    }
  };

  const handleCheckOut = async () => {
    if (!user || !selectedEvent) return;

    Alert.alert("Check Out", "Are you sure you want to check out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Check Out",
        onPress: async () => {
          setCheckingIn(true);
          const result = await checkIn(user.id, selectedEvent.id, "check_out");
          setCheckingIn(false);

          if (result.error) {
            Alert.alert("Check-out Failed", result.error);
          }
        },
      },
    ]);
  };

  const handleAddToWallet = () => {
    const walletType = Platform.OS === "ios" ? "Apple Wallet" : "Google Pay";
    Alert.alert(
      `Add to ${walletType}`,
      `Your badge will be added to ${walletType} for quick access.`,
      [
        { text: "Cancel", style: "cancel" },
        { text: "Add", onPress: () => {} },
      ],
    );
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDateRange = (startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const options: Intl.DateTimeFormatOptions = {
      month: "long",
      day: "numeric",
      year: "numeric",
    };

    if (start.toDateString() === end.toDateString()) {
      return start.toLocaleDateString("en-US", options);
    }

    return `${start.toLocaleDateString("en-US", { month: "long", day: "numeric" })} - ${end.toLocaleDateString("en-US", options)}`;
  };

  if (loading && registeredEvents.length === 0) {
    return <LoadingSpinner fullScreen message="Loading badge..." />;
  }

  if (!selectedEvent || !selectedRegistration) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Icon name="arrow-back" size={24} color={Colors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>My Badge</Text>
          <View style={styles.moreButton} />
        </View>
        <EmptyState
          icon="ticket-outline"
          title="No Event Badge"
          description="Register for an event to get your digital badge"
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
        <Text style={styles.headerTitle}>My Badge</Text>
        <TouchableOpacity style={styles.moreButton}>
          <Icon name="close" size={24} color={Colors.text.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={Colors.primary.accent}
          />
        }
      >
        {/* Permission Status Indicators */}
        <View style={styles.permissionStatusBar}>
          <TouchableOpacity
            style={styles.permissionItem}
            onPress={() => router.push("/permissions")}
          >
            <View
              style={[
                styles.permissionDot,
                {
                  backgroundColor: locationEnabled
                    ? Colors.status.success
                    : Colors.status.error,
                },
              ]}
            />
            <Icon
              name="compass"
              size={16}
              color={
                locationEnabled ? Colors.status.success : Colors.status.error
              }
            />
            <Text
              style={[
                styles.permissionText,
                {
                  color: locationEnabled
                    ? Colors.status.success
                    : Colors.status.error,
                },
              ]}
            >
              Location {locationEnabled ? "On" : "Off"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.permissionItem}
            onPress={() => router.push("/permissions")}
          >
            <View
              style={[
                styles.permissionDot,
                {
                  backgroundColor: bluetoothEnabled
                    ? Colors.status.success
                    : Colors.status.error,
                },
              ]}
            />
            <Icon
              name="flash"
              size={16}
              color={
                bluetoothEnabled ? Colors.status.success : Colors.status.error
              }
            />
            <Text
              style={[
                styles.permissionText,
                {
                  color: bluetoothEnabled
                    ? Colors.status.success
                    : Colors.status.error,
                },
              ]}
            >
              Bluetooth {bluetoothEnabled ? "On" : "Off"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Event Selector (if multiple registered events) */}
        {registeredEvents.length > 1 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.eventSelector}
            contentContainerStyle={styles.eventSelectorContent}
          >
            {registeredEvents.map((event) => (
              <TouchableOpacity
                key={event.id}
                style={[
                  styles.eventTab,
                  selectedEvent?.id === event.id && styles.eventTabActive,
                ]}
                onPress={() => {
                  setSelectedEvent(event);
                  const reg = registrations.find(
                    (r) => r.event_id === event.id,
                  );
                  setSelectedRegistration(reg || null);
                }}
              >
                <Text
                  style={[
                    styles.eventTabText,
                    selectedEvent?.id === event.id && styles.eventTabTextActive,
                  ]}
                  numberOfLines={1}
                >
                  {event.title}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {/* Badge Card - User Profile */}
        <LinearGradient
          colors={[Colors.primary.main, Colors.primary.dark]}
          style={styles.badgeCard}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          {/* Event Info */}
          <View style={styles.eventInfo}>
            <Text style={styles.eventName}>{selectedEvent.title}</Text>
            <Text style={styles.eventDate}>
              {formatDateRange(
                selectedEvent.start_date,
                selectedEvent.end_date,
              )}
            </Text>
            <Text style={styles.eventLocation}>
              {selectedEvent.venue_name || selectedEvent.venue_address}
            </Text>
          </View>

          {/* User Profile Section */}
          <View style={styles.userProfileSection}>
            <Avatar
              source={user?.avatar_url}
              name={user?.name}
              size="xlarge"
              showBorder
            />

            <View style={styles.userInfoMain}>
              <Text style={styles.userNameLarge}>
                {user?.name || "Attendee"}
              </Text>
              {user?.position && (
                <Text style={styles.userPosition}>{user.position}</Text>
              )}
              {user?.company && (
                <Text style={styles.userCompany}>{user.company}</Text>
              )}
              {user?.email && (
                <View style={styles.userEmailRow}>
                  <Icon
                    name="mail-outline"
                    size={14}
                    color="rgba(255,255,255,0.7)"
                  />
                  <Text style={styles.userEmail}>{user.email}</Text>
                </View>
              )}
            </View>
          </View>

          {/* Interests/Tags */}
          {user?.interests && user.interests.length > 0 && (
            <View style={styles.interestsSection}>
              <Text style={styles.interestsLabel}>Interests</Text>
              <View style={styles.interestsTags}>
                {user.interests.slice(0, 4).map((interest, index) => (
                  <View key={index} style={styles.interestTag}>
                    <Text style={styles.interestTagText}>{interest}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Ticket Type Badge */}
          <View style={styles.ticketBadge}>
            <Icon name="calendar" size={14} color={Colors.status.warning} />
            <Text style={styles.ticketType}>
              {selectedRegistration.ticket_type || "General Admission"}
            </Text>
          </View>
        </LinearGradient>

        {/* Status Card */}
        <Card variant="elevated" style={styles.statusCard}>
          <View style={styles.statusHeader}>
            <View
              style={[
                styles.statusIndicator,
                { backgroundColor: getStatusColor() },
              ]}
            >
              <Icon name="checkmark" size={20} color={Colors.text.inverse} />
            </View>
            <View style={styles.statusInfo}>
              <Text style={styles.statusLabel}>Status</Text>
              <Text style={[styles.statusText, { color: getStatusColor() }]}>
                {getStatusText()}
              </Text>
              {latestCheckIn && status === "checked-in" && (
                <Text style={styles.checkInTime}>
                  Checked in at {formatTime(latestCheckIn.timestamp)}
                </Text>
              )}
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            {status === "pending" && (
              <TouchableOpacity
                style={styles.checkInButton}
                onPress={handleCheckIn}
                disabled={checkingIn}
              >
                {checkingIn ? (
                  <LoadingSpinner />
                ) : (
                  <>
                    <Icon
                      name="arrow-back"
                      size={20}
                      color={Colors.text.inverse}
                    />
                    <Text style={styles.checkInButtonText}>Check In</Text>
                  </>
                )}
              </TouchableOpacity>
            )}

            {status === "checked-in" && (
              <TouchableOpacity
                style={styles.checkOutButton}
                onPress={handleCheckOut}
                disabled={checkingIn}
              >
                {checkingIn ? (
                  <LoadingSpinner />
                ) : (
                  <>
                    <Icon name="close" size={20} color={Colors.text.inverse} />
                    <Text style={styles.checkOutButtonText}>Check Out</Text>
                  </>
                )}
              </TouchableOpacity>
            )}

            {status === "checked-out" && (
              <View style={styles.checkedOutMessage}>
                <Icon name="checkmark" size={20} color={Colors.text.tertiary} />
                <Text style={styles.checkedOutText}>
                  Thank you for attending!
                </Text>
              </View>
            )}
          </View>
        </Card>

        {/* Wallet Integration */}
        <Card variant="default" style={styles.walletCard}>
          <TouchableOpacity
            style={styles.walletButton}
            onPress={handleAddToWallet}
          >
            <View style={styles.walletIcon}>
              <Icon name="bookmark" size={24} color={Colors.text.primary} />
            </View>
            <View style={styles.walletInfo}>
              <Text style={styles.walletTitle}>
                Add to {Platform.OS === "ios" ? "Apple Wallet" : "Google Pay"}
              </Text>
              <Text style={styles.walletSubtitle}>
                Quick access to your badge
              </Text>
            </View>
            <Icon
              name="chevron-forward"
              size={20}
              color={Colors.text.tertiary}
            />
          </TouchableOpacity>
        </Card>

        {/* Registration Details */}
        <Card variant="default" style={styles.detailsCard}>
          <Text style={styles.detailsTitle}>Registration Details</Text>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Registration ID</Text>
            <Text style={styles.detailValue}>
              {selectedRegistration.id.substring(0, 13).toUpperCase()}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Ticket Type</Text>
            <Text style={styles.detailValue}>
              {selectedRegistration.ticket_type || "General Admission"}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Event</Text>
            <Text style={styles.detailValue}>{selectedEvent.title}</Text>
          </View>

          <View style={[styles.detailRow, styles.detailRowLast]}>
            <Text style={styles.detailLabel}>Location</Text>
            <Text style={styles.detailValue}>
              {selectedEvent.venue_name || selectedEvent.venue_address}
            </Text>
          </View>
        </Card>

        {/* Help Section */}
        <Card variant="default" style={styles.helpCard}>
          <TouchableOpacity style={styles.helpButton}>
            <Icon name="search" size={24} color={Colors.primary.accent} />
            <Text style={styles.helpText}>Need help with check-in?</Text>
            <Icon
              name="chevron-forward"
              size={20}
              color={Colors.text.tertiary}
            />
          </TouchableOpacity>
        </Card>

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

  // Permission Status Bar
  permissionStatusBar: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: Spacing.lg,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    backgroundColor: Colors.background.secondary,
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  permissionItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  permissionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  permissionText: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.medium,
  },

  // User Profile Section
  userProfileSection: {
    alignItems: "center",
    paddingVertical: Spacing.lg,
  },
  userInfoMain: {
    alignItems: "center",
    marginTop: Spacing.md,
  },
  userNameLarge: {
    fontSize: FontSizes.xxl,
    fontWeight: FontWeights.bold,
    color: Colors.text.inverse,
    textAlign: "center",
  },
  userPosition: {
    fontSize: FontSizes.md,
    color: "rgba(255,255,255,0.9)",
    marginTop: Spacing.xs,
  },
  userCompany: {
    fontSize: FontSizes.md,
    color: "rgba(255,255,255,0.8)",
    marginTop: Spacing.xs,
  },
  userEmailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    marginTop: Spacing.sm,
  },
  userEmail: {
    fontSize: FontSizes.sm,
    color: "rgba(255,255,255,0.7)",
  },

  // Interests Section
  interestsSection: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.md,
  },
  interestsLabel: {
    fontSize: FontSizes.xs,
    color: "rgba(255,255,255,0.6)",
    marginBottom: Spacing.xs,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  interestsTags: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.xs,
  },
  interestTag: {
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  interestTagText: {
    fontSize: FontSizes.xs,
    color: Colors.text.inverse,
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
  moreButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },

  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.md,
  },

  // Event Selector
  eventSelector: {
    marginBottom: Spacing.md,
  },
  eventSelectorContent: {
    paddingRight: Spacing.md,
  },
  eventTab: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.background.secondary,
    borderRadius: BorderRadius.full,
    marginRight: Spacing.sm,
  },
  eventTabActive: {
    backgroundColor: Colors.primary.accent,
  },
  eventTabText: {
    fontSize: FontSizes.sm,
    color: Colors.text.secondary,
    maxWidth: 150,
  },
  eventTabTextActive: {
    color: Colors.text.inverse,
    fontWeight: FontWeights.semibold,
  },

  // Badge Card
  badgeCard: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  eventInfo: {
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  eventName: {
    fontSize: FontSizes.xl,
    fontWeight: FontWeights.bold,
    color: Colors.text.inverse,
    textAlign: "center",
  },
  eventDate: {
    fontSize: FontSizes.md,
    color: "rgba(255,255,255,0.8)",
    marginTop: 4,
  },
  eventLocation: {
    fontSize: FontSizes.sm,
    color: "rgba(255,255,255,0.6)",
    marginTop: 2,
  },

  // Ticket Badge
  ticketBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  ticketType: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.semibold,
    color: Colors.text.inverse,
    marginLeft: 6,
  },

  // Status Card
  statusCard: {
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  statusHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  statusIndicator: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  statusInfo: {
    marginLeft: Spacing.md,
    flex: 1,
  },
  statusLabel: {
    fontSize: FontSizes.sm,
    color: Colors.text.tertiary,
  },
  statusText: {
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.semibold,
  },
  checkInTime: {
    fontSize: FontSizes.sm,
    color: Colors.text.secondary,
    marginTop: 2,
  },
  actionButtons: {
    marginTop: Spacing.sm,
  },
  checkInButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.status.success,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  checkInButtonText: {
    fontSize: FontSizes.md,
    fontWeight: FontWeights.semibold,
    color: Colors.text.inverse,
    marginLeft: Spacing.sm,
  },
  checkOutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.status.warning,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  checkOutButtonText: {
    fontSize: FontSizes.md,
    fontWeight: FontWeights.semibold,
    color: Colors.text.inverse,
    marginLeft: Spacing.sm,
  },
  checkedOutMessage: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.md,
  },
  checkedOutText: {
    fontSize: FontSizes.md,
    color: Colors.text.tertiary,
    marginLeft: Spacing.sm,
  },

  // Wallet Card
  walletCard: {
    marginBottom: Spacing.md,
  },
  walletButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
  },
  walletIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.background.secondary,
    alignItems: "center",
    justifyContent: "center",
  },
  walletInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  walletTitle: {
    fontSize: FontSizes.md,
    fontWeight: FontWeights.medium,
    color: Colors.text.primary,
  },
  walletSubtitle: {
    fontSize: FontSizes.sm,
    color: Colors.text.tertiary,
    marginTop: 2,
  },

  // Details Card
  detailsCard: {
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  detailsTitle: {
    fontSize: FontSizes.md,
    fontWeight: FontWeights.semibold,
    color: Colors.text.primary,
    marginBottom: Spacing.md,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.secondary,
  },
  detailRowLast: {
    borderBottomWidth: 0,
  },
  detailLabel: {
    fontSize: FontSizes.sm,
    color: Colors.text.tertiary,
  },
  detailValue: {
    fontSize: FontSizes.sm,
    color: Colors.text.primary,
    fontWeight: FontWeights.medium,
    textAlign: "right",
    flex: 1,
    marginLeft: Spacing.md,
  },

  // Help Card
  helpCard: {
    marginBottom: Spacing.md,
  },
  helpButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
  },
  helpText: {
    flex: 1,
    fontSize: FontSizes.md,
    color: Colors.text.primary,
    marginLeft: Spacing.sm,
  },

  bottomSpacing: {
    height: 100,
  },
});

export default BadgeScreen;
