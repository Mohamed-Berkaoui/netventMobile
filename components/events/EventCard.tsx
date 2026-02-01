/**
 * EventCard Component
 * Card displaying event summary for lists
 */

import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import React from "react";
import {
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    ViewStyle,
} from "react-native";
import {
    BorderRadius,
    Colors,
    FontSizes,
    FontWeights,
    Shadows,
    Spacing,
} from "../../constants/theme";
import { Event } from "../../types";
import { Tag } from "../ui";

interface EventCardProps {
  event: Event;
  onPress: () => void;
  isRegistered?: boolean;
  isCheckedIn?: boolean;
  style?: ViewStyle;
}

/**
 * Format date for display
 */
const formatEventDate = (startDate: string, endDate: string): string => {
  const start = new Date(startDate);
  const end = new Date(endDate);

  const options: Intl.DateTimeFormatOptions = {
    month: "short",
    day: "numeric",
  };

  const startStr = start.toLocaleDateString("en-US", options);
  const endStr = end.toLocaleDateString("en-US", options);

  if (startStr === endStr) {
    return startStr;
  }

  return `${startStr} - ${endStr}`;
};

/**
 * Format time for display
 */
const formatEventTime = (date: string): string => {
  return new Date(date).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
};

export const EventCard: React.FC<EventCardProps> = ({
  event,
  onPress,
  isRegistered = false,
  isCheckedIn = false,
  style,
}) => {
  return (
    <TouchableOpacity
      style={[styles.container, style]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {/* Event Banner/Logo */}
      <View style={styles.imageContainer}>
        {event.banner_url || event.logo_url ? (
          <Image
            source={{ uri: event.banner_url || event.logo_url }}
            style={styles.image}
            contentFit="cover"
          />
        ) : (
          <View style={styles.imagePlaceholder}>
            <Ionicons name="calendar" size={32} color={Colors.text.tertiary} />
          </View>
        )}

        {/* Status Badges */}
        <View style={styles.badges}>
          {isCheckedIn && (
            <View style={[styles.badge, styles.checkedInBadge]}>
              <Ionicons
                name="checkmark-circle"
                size={14}
                color={Colors.text.primary}
              />
              <Text style={styles.badgeText}>Checked In</Text>
            </View>
          )}
          {isRegistered && !isCheckedIn && (
            <View style={[styles.badge, styles.registeredBadge]}>
              <Ionicons name="ticket" size={14} color={Colors.text.primary} />
              <Text style={styles.badgeText}>Registered</Text>
            </View>
          )}
        </View>
      </View>

      {/* Event Details */}
      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={2}>
          {event.title}
        </Text>

        <View style={styles.infoRow}>
          <Ionicons
            name="calendar-outline"
            size={14}
            color={Colors.text.tertiary}
          />
          <Text style={styles.infoText}>
            {formatEventDate(event.start_date, event.end_date)}
          </Text>
          <Text style={styles.infoSeparator}>•</Text>
          <Text style={styles.infoText}>
            {formatEventTime(event.start_date)}
          </Text>
        </View>

        <View style={styles.infoRow}>
          <Ionicons
            name="location-outline"
            size={14}
            color={Colors.text.tertiary}
          />
          <Text style={styles.infoText} numberOfLines={1}>
            {event.venue_name}
          </Text>
        </View>

        {/* Interest Tags */}
        {event.interests && event.interests.length > 0 && (
          <View style={styles.tags}>
            {event.interests.slice(0, 3).map((interest, index) => (
              <Tag
                key={index}
                label={interest}
                size="small"
                variant="default"
              />
            ))}
            {event.interests.length > 3 && (
              <Text style={styles.moreTags}>+{event.interests.length - 3}</Text>
            )}
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.background.card,
    borderRadius: BorderRadius.lg,
    overflow: "hidden",
    ...Shadows.sm,
  },
  imageContainer: {
    height: 140,
    position: "relative",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  imagePlaceholder: {
    width: "100%",
    height: "100%",
    backgroundColor: Colors.background.secondary,
    alignItems: "center",
    justifyContent: "center",
  },
  badges: {
    position: "absolute",
    top: Spacing.sm,
    right: Spacing.sm,
    gap: Spacing.xs,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.xs - 2,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.full,
    gap: Spacing.xs,
  },
  checkedInBadge: {
    backgroundColor: Colors.status.success,
  },
  registeredBadge: {
    backgroundColor: Colors.primary.accent,
  },
  badgeText: {
    fontSize: FontSizes.xs,
    fontWeight: FontWeights.semibold,
    color: Colors.text.primary,
  },
  content: {
    padding: Spacing.md,
  },
  title: {
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.semibold,
    color: Colors.text.primary,
    marginBottom: Spacing.sm,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    marginBottom: Spacing.xs,
  },
  infoText: {
    fontSize: FontSizes.sm,
    color: Colors.text.secondary,
    flex: 1,
  },
  infoSeparator: {
    fontSize: FontSizes.sm,
    color: Colors.text.tertiary,
    flex: 0,
  },
  tags: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.xs,
    marginTop: Spacing.sm,
  },
  moreTags: {
    fontSize: FontSizes.xs,
    color: Colors.text.tertiary,
    alignSelf: "center",
    marginLeft: Spacing.xs,
  },
});

export default EventCard;
