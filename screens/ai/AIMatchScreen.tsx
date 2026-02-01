/**
 * AI Matchmaking Screen
 * Display AI-generated matches based on interests and profile
 */

import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
    Alert,
    FlatList,
    RefreshControl,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withDelay,
    withSequence,
    withTiming,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import {
    Avatar,
    Button,
    Card,
    EmptyState,
    LoadingSpinner,
    Tag,
} from "../../components/ui";
import {
    BorderRadius,
    Colors,
    FontSizes,
    FontWeights,
    Spacing,
} from "../../constants/theme";
import { useAIMatchStore } from "../../stores/aiMatchStore";
import { useAuthStore } from "../../stores/authStore";
import { useSocialStore } from "../../stores/socialStore";
import { AIMatch } from "../../types";

export const AIMatchScreen: React.FC = () => {
  const { eventId } = useLocalSearchParams<{ eventId?: string }>();

  const [refreshing, setRefreshing] = useState(false);
  const [sendingRequest, setSendingRequest] = useState<string | null>(null);

  const { user } = useAuthStore();
  const { matches, loading, fetchMatches } = useAIMatchStore();
  const { sendFriendRequest } = useSocialStore();

  /**
   * Load matches on mount
   */
  useEffect(() => {
    if (user) {
      fetchMatches(user.id, eventId);
    }
  }, [user, eventId]);

  const onRefresh = useCallback(async () => {
    if (!user) return;
    setRefreshing(true);
    await fetchMatches(user.id, eventId);
    setRefreshing(false);
  }, [user, eventId]);

  /**
   * Send friend request
   */
  const handleConnect = async (match: AIMatch) => {
    if (!user) return;

    try {
      setSendingRequest(match.matched_user_id);
      await sendFriendRequest(user.id, match.matched_user_id);
      Alert.alert(
        "Request Sent",
        `Connection request sent to ${match.matched_user?.name}`,
      );
    } catch (error) {
      console.error("Error sending friend request:", error);
      Alert.alert("Error", "Failed to send connection request");
    } finally {
      setSendingRequest(null);
    }
  };

  /**
   * Navigate to chat
   */
  const handleMessage = (match: AIMatch) => {
    router.push({
      pathname: "/chat/[id]",
      params: { id: match.matched_user_id },
    });
  };

  /**
   * Match Card Component with animations
   */
  const MatchCard: React.FC<{ item: AIMatch; index: number }> = ({
    item,
    index,
  }) => {
    const scale = useSharedValue(0);
    const opacity = useSharedValue(0);

    useEffect(() => {
      opacity.value = withDelay(index * 100, withTiming(1, { duration: 300 }));
      scale.value = withDelay(
        index * 100,
        withSequence(
          withTiming(1.05, { duration: 200 }),
          withTiming(1, { duration: 100 }),
        ),
      );
    }, []);

    const animatedStyle = useAnimatedStyle(() => ({
      opacity: opacity.value,
      transform: [{ scale: scale.value }],
    }));

    const isTopMatch = (item.score || 0) >= 80;
    const matchPercentage = Math.round(item.score || 0);

    /**
     * Get score color based on match percentage
     */
    const getScoreColor = () => {
      if (matchPercentage >= 80) return Colors.status.success;
      if (matchPercentage >= 60) return Colors.primary.accent;
      return Colors.text.secondary;
    };

    return (
      <Animated.View style={animatedStyle}>
        <Card
          style={[
            styles.matchCard,
            isTopMatch ? styles.topMatchCard : undefined,
          ]}
        >
          {isTopMatch && (
            <View style={styles.topMatchBadge}>
              <Ionicons name="star" size={14} color={Colors.text.primary} />
              <Text style={styles.topMatchText}>Top Match</Text>
            </View>
          )}

          <View style={styles.matchHeader}>
            <TouchableOpacity
              onPress={() =>
                router.push({
                  pathname: "/user/[id]",
                  params: { id: item.matched_user_id },
                })
              }
            >
              <Avatar
                source={item.matched_user?.avatar_url}
                name={item.matched_user?.name}
                size="large"
              />
            </TouchableOpacity>

            <View style={styles.matchInfo}>
              <Text style={styles.matchName}>{item.matched_user?.name}</Text>
              {item.matched_user?.position && (
                <Text style={styles.matchPosition}>
                  {item.matched_user.position}
                </Text>
              )}
              {item.matched_user?.company && (
                <Text style={styles.matchCompany}>
                  {item.matched_user.company}
                </Text>
              )}
            </View>

            <View style={styles.scoreContainer}>
              <View
                style={[styles.scoreCircle, { borderColor: getScoreColor() }]}
              >
                <Text style={[styles.scoreText, { color: getScoreColor() }]}>
                  {matchPercentage}%
                </Text>
              </View>
              <Text style={styles.scoreLabel}>Match</Text>
            </View>
          </View>

          {/* Match Reasons */}
          {item.reasons && item.reasons.length > 0 && (
            <View style={styles.reasonsContainer}>
              <Text style={styles.reasonsTitle}>Why you match:</Text>
              <View style={styles.reasonsList}>
                {item.reasons.slice(0, 3).map((reason: string, idx: number) => (
                  <View key={idx} style={styles.reasonItem}>
                    <Ionicons
                      name="checkmark-circle"
                      size={16}
                      color={Colors.status.success}
                    />
                    <Text style={styles.reasonText}>{reason}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Shared Interests */}
          {item.matched_user?.interests &&
            item.matched_user.interests.length > 0 && (
              <View style={styles.interestsContainer}>
                <Text style={styles.interestsTitle}>Shared interests:</Text>
                <View style={styles.interestTags}>
                  {item.matched_user.interests
                    .slice(0, 4)
                    .map((interest, idx) => (
                      <Tag key={idx} label={interest} size="small" />
                    ))}
                </View>
              </View>
            )}

          {/* Actions */}
          <View style={styles.matchActions}>
            <Button
              title="Connect"
              onPress={() => handleConnect(item)}
              variant="primary"
              size="small"
              loading={sendingRequest === item.matched_user_id}
              icon={
                <Ionicons
                  name="person-add"
                  size={16}
                  color={Colors.text.primary}
                />
              }
              style={styles.actionButton}
            />
            <Button
              title="Message"
              onPress={() => handleMessage(item)}
              variant="secondary"
              size="small"
              icon={
                <Ionicons
                  name="chatbubble"
                  size={16}
                  color={Colors.text.primary}
                />
              }
              style={styles.actionButton}
            />
          </View>
        </Card>
      </Animated.View>
    );
  };

  /**
   * Render match item
   */
  const renderMatchItem = ({
    item,
    index,
  }: {
    item: AIMatch;
    index: number;
  }) => <MatchCard item={item} index={index} />;

  /**
   * Render header with summary
   */
  const renderHeader = () => {
    const topMatches = matches.filter((m) => (m.score || 0) >= 80).length;

    return (
      <View style={styles.headerContent}>
        <View style={styles.aiHeader}>
          <View style={styles.aiIconContainer}>
            <Ionicons name="sparkles" size={32} color={Colors.primary.accent} />
          </View>
          <View style={styles.aiHeaderText}>
            <Text style={styles.aiTitle}>AI-Powered Matches</Text>
            <Text style={styles.aiSubtitle}>
              Based on your interests and profile
            </Text>
          </View>
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{matches.length}</Text>
            <Text style={styles.statLabel}>Matches</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: Colors.status.success }]}>
              {topMatches}
            </Text>
            <Text style={styles.statLabel}>Top Matches</Text>
          </View>
        </View>
      </View>
    );
  };

  if (loading && matches.length === 0) {
    return <LoadingSpinner fullScreen message="Finding your matches..." />;
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color={Colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.title}>Networking</Text>
        <TouchableOpacity style={styles.refreshButton} onPress={onRefresh}>
          <Ionicons name="refresh" size={24} color={Colors.text.primary} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={matches}
        keyExtractor={(item) => item.id}
        renderItem={renderMatchItem}
        ListHeaderComponent={renderHeader}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.primary.accent}
          />
        }
        ListEmptyComponent={
          <EmptyState
            icon="people-outline"
            title="No Matches Yet"
            description="We're still analyzing attendees to find your best matches. Check back soon!"
            actionLabel="Refresh"
            onAction={onRefresh}
          />
        }
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
    justifyContent: "space-between",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.primary,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.semibold,
    color: Colors.text.primary,
  },
  refreshButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  listContent: {
    padding: Spacing.md,
    paddingBottom: Spacing.xxl,
    flexGrow: 1,
  },
  headerContent: {
    marginBottom: Spacing.lg,
  },
  aiHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  aiIconContainer: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.background.elevated,
    alignItems: "center",
    justifyContent: "center",
  },
  aiHeaderText: {
    marginLeft: Spacing.md,
    flex: 1,
  },
  aiTitle: {
    fontSize: FontSizes.xl,
    fontWeight: FontWeights.bold,
    color: Colors.text.primary,
  },
  aiSubtitle: {
    fontSize: FontSizes.sm,
    color: Colors.text.secondary,
    marginTop: Spacing.xs,
  },
  statsContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.background.card,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statValue: {
    fontSize: FontSizes.xxl,
    fontWeight: FontWeights.bold,
    color: Colors.text.primary,
  },
  statLabel: {
    fontSize: FontSizes.sm,
    color: Colors.text.tertiary,
    marginTop: Spacing.xs,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: Colors.border.secondary,
    marginHorizontal: Spacing.md,
  },
  matchCard: {
    marginBottom: Spacing.md,
    padding: Spacing.md,
    position: "relative",
    overflow: "hidden",
  },
  topMatchCard: {
    borderWidth: 2,
    borderColor: Colors.status.success,
  },
  topMatchBadge: {
    position: "absolute",
    top: 0,
    right: 0,
    backgroundColor: Colors.status.success,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderBottomLeftRadius: BorderRadius.md,
    gap: Spacing.xs,
  },
  topMatchText: {
    fontSize: FontSizes.xs,
    fontWeight: FontWeights.bold,
    color: Colors.text.primary,
  },
  matchHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  matchInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  matchName: {
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.semibold,
    color: Colors.text.primary,
  },
  matchPosition: {
    fontSize: FontSizes.sm,
    color: Colors.text.secondary,
    marginTop: Spacing.xs,
  },
  matchCompany: {
    fontSize: FontSizes.sm,
    color: Colors.text.tertiary,
    marginTop: Spacing.xs,
  },
  scoreContainer: {
    alignItems: "center",
  },
  scoreCircle: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.full,
    borderWidth: 3,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.background.primary,
  },
  scoreText: {
    fontSize: FontSizes.md,
    fontWeight: FontWeights.bold,
  },
  scoreLabel: {
    fontSize: FontSizes.xs,
    color: Colors.text.tertiary,
    marginTop: Spacing.xs,
  },
  reasonsContainer: {
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border.secondary,
  },
  reasonsTitle: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.semibold,
    color: Colors.text.secondary,
    marginBottom: Spacing.sm,
  },
  reasonsList: {
    gap: Spacing.xs,
  },
  reasonItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  reasonText: {
    fontSize: FontSizes.sm,
    color: Colors.text.primary,
    flex: 1,
  },
  interestsContainer: {
    marginTop: Spacing.md,
  },
  interestsTitle: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.semibold,
    color: Colors.text.secondary,
    marginBottom: Spacing.sm,
  },
  interestTags: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.xs,
  },
  matchActions: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  actionButton: {
    flex: 1,
  },
});

export default AIMatchScreen;
