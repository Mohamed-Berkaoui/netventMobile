/**
 * Social Hub Screen
 * Main social screen with friends, chat, and feed tabs
 */

import { Icon } from "@/components/TabIcon";
import { router } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
    FlatList,
    RefreshControl,
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
    Spacing,
} from "../../constants/theme";
import { useAuthStore } from "../../stores/authStore";
import { useSocialStore } from "../../stores/socialStore";
import { ChatConversation, FriendWithProfile, Post } from "../../types";

type SocialTab = "friends" | "chat" | "feed";

export const SocialScreen: React.FC = () => {
  const [activeTab, setActiveTab] = useState<SocialTab>("chat");
  const [refreshing, setRefreshing] = useState(false);

  const { user } = useAuthStore();
  const {
    friends,
    pendingRequests,
    conversations,
    posts,
    fetchFriends,
    fetchConversations,
    fetchPosts,
    acceptFriendRequest,
    rejectFriendRequest,
    loading,
  } = useSocialStore();

  /**
   * Load data on mount
   */
  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    if (!user) return;

    await Promise.all([
      fetchFriends(user.id),
      fetchConversations(user.id),
      fetchPosts(),
    ]);
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [user]);

  /**
   * Handle friend request accept
   */
  const handleAcceptRequest = async (friendshipId: string) => {
    await acceptFriendRequest(friendshipId);
    if (user) {
      fetchFriends(user.id);
    }
  };

  /**
   * Handle friend request reject
   */
  const handleRejectRequest = async (friendshipId: string) => {
    await rejectFriendRequest(friendshipId);
    if (user) {
      fetchFriends(user.id);
    }
  };

  /**
   * Navigate to chat
   */
  const handleChatPress = (conversation: ChatConversation) => {
    router.push({
      pathname: "/chat/[id]",
      params: { id: conversation.user.id },
    });
  };

  /**
   * Navigate to post details
   */
  const handlePostPress = (post: Post) => {
    router.push({
      pathname: "/post/[id]",
      params: { id: post.id },
    });
  };

  /**
   * Render friend item
   */
  const renderFriendItem = ({ item }: { item: FriendWithProfile }) => (
    <Card style={styles.friendCard}>
      <View style={styles.friendContent}>
        <Avatar
          source={item.friend?.avatar_url}
          name={item.friend?.name}
          size="medium"
        />
        <View style={styles.friendInfo}>
          <Text style={styles.friendName}>{item.friend?.name}</Text>
          {item.friend?.company && (
            <Text style={styles.friendCompany}>{item.friend.company}</Text>
          )}
        </View>
        <TouchableOpacity
          style={styles.chatButton}
          onPress={() =>
            router.push({
              pathname: "/chat/[id]",
              params: { id: item.friend.id },
            })
          }
        >
          <Icon name="chatbubble" size={20} color={Colors.primary.accent} />
        </TouchableOpacity>
      </View>
    </Card>
  );

  /**
   * Render pending request item
   */
  const renderRequestItem = ({ item }: { item: FriendWithProfile }) => (
    <Card style={styles.requestCard}>
      <View style={styles.requestContent}>
        <Avatar
          source={item.friend?.avatar_url}
          name={item.friend?.name}
          size="medium"
        />
        <View style={styles.requestInfo}>
          <Text style={styles.friendName}>{item.friend?.name}</Text>
          <Text style={styles.requestLabel}>Wants to connect</Text>
        </View>
        <View style={styles.requestActions}>
          <TouchableOpacity
            style={[styles.requestButton, styles.acceptButton]}
            onPress={() => handleAcceptRequest(item.id)}
          >
            <Icon name="checkmark" size={20} color={Colors.text.primary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.requestButton, styles.rejectButton]}
            onPress={() => handleRejectRequest(item.id)}
          >
            <Icon name="close" size={20} color={Colors.text.primary} />
          </TouchableOpacity>
        </View>
      </View>
    </Card>
  );

  /**
   * Render conversation item
   */
  const renderConversationItem = ({ item }: { item: ChatConversation }) => (
    <TouchableOpacity onPress={() => handleChatPress(item)} activeOpacity={0.7}>
      <Card style={styles.conversationCard}>
        <View style={styles.conversationContent}>
          <View style={styles.avatarContainer}>
            <Avatar
              source={item.user?.avatar_url}
              name={item.user?.name}
              size="medium"
            />
            {item.unread_count > 0 && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadCount}>
                  {item.unread_count > 9 ? "9+" : item.unread_count}
                </Text>
              </View>
            )}
          </View>
          <View style={styles.conversationInfo}>
            <Text style={styles.conversationName}>{item.user?.name}</Text>
            {item.last_message && (
              <Text style={styles.lastMessage} numberOfLines={1}>
                {item.last_message.content}
              </Text>
            )}
          </View>
          {item.last_message && (
            <Text style={styles.messageTime}>
              {new Date(item.last_message.created_at).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </Text>
          )}
        </View>
      </Card>
    </TouchableOpacity>
  );

  /**
   * Render post item
   */
  const renderPostItem = ({ item }: { item: Post }) => (
    <TouchableOpacity onPress={() => handlePostPress(item)} activeOpacity={0.7}>
      <Card style={styles.postCard}>
        <View style={styles.postHeader}>
          <Avatar
            source={item.user?.avatar_url}
            name={item.user?.name}
            size="small"
          />
          <View style={styles.postHeaderInfo}>
            <Text style={styles.postAuthor}>{item.user?.name}</Text>
            <Text style={styles.postTime}>
              {new Date(item.created_at).toLocaleDateString()}
            </Text>
          </View>
        </View>
        <Text style={styles.postContent} numberOfLines={3}>
          {item.content}
        </Text>
        <View style={styles.postActions}>
          <View style={styles.postAction}>
            <Icon
              name={item.liked_by_me ? "heart" : "heart-outline"}
              size={20}
              color={
                item.liked_by_me ? Colors.social.like : Colors.text.tertiary
              }
            />
            <Text style={styles.postActionCount}>{item.likes_count}</Text>
          </View>
          <View style={styles.postAction}>
            <Icon name="chatbubble" size={20} color={Colors.text.tertiary} />
            <Text style={styles.postActionCount}>{item.comments_count}</Text>
          </View>
        </View>
      </Card>
    </TouchableOpacity>
  );

  /**
   * Get content for current tab
   */
  const renderTabContent = () => {
    switch (activeTab) {
      case "friends":
        return (
          <FlatList
            data={friends}
            keyExtractor={(item) => item.id}
            renderItem={renderFriendItem}
            ListHeaderComponent={
              pendingRequests.length > 0 ? (
                <View style={styles.requestsSection}>
                  <Text style={styles.sectionTitle}>
                    Friend Requests ({pendingRequests.length})
                  </Text>
                  <FlatList
                    data={pendingRequests}
                    keyExtractor={(item) => item.id}
                    renderItem={renderRequestItem}
                    scrollEnabled={false}
                  />
                </View>
              ) : null
            }
            ListEmptyComponent={
              <EmptyState
                icon="people-outline"
                title="No Friends Yet"
                description="Connect with other attendees at events"
              />
            }
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={Colors.primary.accent}
              />
            }
          />
        );

      case "chat":
        return (
          <FlatList
            data={conversations}
            keyExtractor={(item) => item.user.id}
            renderItem={renderConversationItem}
            ListEmptyComponent={
              <EmptyState
                icon="chatbubbles-outline"
                title="No Conversations"
                description="Start chatting with friends and connections"
              />
            }
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={Colors.primary.accent}
              />
            }
          />
        );

      case "feed":
        return (
          <FlatList
            data={posts}
            keyExtractor={(item) => item.id}
            renderItem={renderPostItem}
            ListEmptyComponent={
              <EmptyState
                icon="newspaper-outline"
                title="No Posts Yet"
                description="Be the first to share at your next event"
              />
            }
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={Colors.primary.accent}
              />
            }
          />
        );
    }
  };

  if (loading && conversations.length === 0) {
    return <LoadingSpinner fullScreen message="Loading..." />;
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Social</Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "chat" && styles.activeTab]}
          onPress={() => setActiveTab("chat")}
        >
          <Icon
            name="chatbubble"
            size={20}
            color={
              activeTab === "chat"
                ? Colors.primary.accent
                : Colors.text.tertiary
            }
          />
          <Text
            style={[
              styles.tabText,
              activeTab === "chat" && styles.activeTabText,
            ]}
          >
            Chat
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === "friends" && styles.activeTab]}
          onPress={() => setActiveTab("friends")}
        >
          <Icon
            name="people"
            size={20}
            color={
              activeTab === "friends"
                ? Colors.primary.accent
                : Colors.text.tertiary
            }
          />
          <Text
            style={[
              styles.tabText,
              activeTab === "friends" && styles.activeTabText,
            ]}
          >
            Friends
          </Text>
          {pendingRequests.length > 0 && (
            <View style={styles.tabBadge}>
              <Text style={styles.tabBadgeText}>{pendingRequests.length}</Text>
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === "feed" && styles.activeTab]}
          onPress={() => setActiveTab("feed")}
        >
          <Icon
            name="bookmark"
            size={20}
            color={
              activeTab === "feed"
                ? Colors.primary.accent
                : Colors.text.tertiary
            }
          />
          <Text
            style={[
              styles.tabText,
              activeTab === "feed" && styles.activeTabText,
            ]}
          >
            Feed
          </Text>
        </TouchableOpacity>
      </View>

      {/* Tab Content */}
      {renderTabContent()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.primary,
  },
  header: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  title: {
    fontSize: FontSizes.xxl,
    fontWeight: FontWeights.bold,
    color: Colors.text.primary,
  },
  tabs: {
    flexDirection: "row",
    paddingHorizontal: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.secondary,
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.md,
    gap: Spacing.xs,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  activeTab: {
    borderBottomColor: Colors.primary.accent,
  },
  tabText: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.medium,
    color: Colors.text.tertiary,
  },
  activeTabText: {
    color: Colors.primary.accent,
  },
  tabBadge: {
    backgroundColor: Colors.status.error,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.xs,
    minWidth: 18,
    height: 18,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: Spacing.xs,
  },
  tabBadgeText: {
    fontSize: FontSizes.xs,
    fontWeight: FontWeights.bold,
    color: Colors.text.primary,
  },
  listContent: {
    padding: Spacing.md,
    paddingBottom: Spacing.xxl,
    flexGrow: 1,
  },
  sectionTitle: {
    fontSize: FontSizes.md,
    fontWeight: FontWeights.semibold,
    color: Colors.text.primary,
    marginBottom: Spacing.sm,
  },
  requestsSection: {
    marginBottom: Spacing.lg,
  },
  friendCard: {
    marginBottom: Spacing.sm,
    padding: Spacing.md,
  },
  friendContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  friendInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  friendName: {
    fontSize: FontSizes.md,
    fontWeight: FontWeights.semibold,
    color: Colors.text.primary,
  },
  friendCompany: {
    fontSize: FontSizes.sm,
    color: Colors.text.secondary,
    marginTop: Spacing.xs,
  },
  chatButton: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.background.elevated,
    alignItems: "center",
    justifyContent: "center",
  },
  requestCard: {
    marginBottom: Spacing.sm,
    padding: Spacing.md,
  },
  requestContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  requestInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  requestLabel: {
    fontSize: FontSizes.sm,
    color: Colors.text.tertiary,
    marginTop: Spacing.xs,
  },
  requestActions: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  requestButton: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  acceptButton: {
    backgroundColor: Colors.status.success,
  },
  rejectButton: {
    backgroundColor: Colors.status.error,
  },
  conversationCard: {
    marginBottom: Spacing.sm,
    padding: Spacing.md,
  },
  conversationContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatarContainer: {
    position: "relative",
  },
  unreadBadge: {
    position: "absolute",
    top: -4,
    right: -4,
    backgroundColor: Colors.status.error,
    borderRadius: BorderRadius.full,
    minWidth: 18,
    height: 18,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: Colors.background.card,
  },
  unreadCount: {
    fontSize: FontSizes.xs,
    fontWeight: FontWeights.bold,
    color: Colors.text.primary,
  },
  conversationInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  conversationName: {
    fontSize: FontSizes.md,
    fontWeight: FontWeights.semibold,
    color: Colors.text.primary,
  },
  lastMessage: {
    fontSize: FontSizes.sm,
    color: Colors.text.secondary,
    marginTop: Spacing.xs,
  },
  messageTime: {
    fontSize: FontSizes.xs,
    color: Colors.text.tertiary,
  },
  postCard: {
    marginBottom: Spacing.md,
    padding: Spacing.md,
  },
  postHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  postHeaderInfo: {
    marginLeft: Spacing.sm,
  },
  postAuthor: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.semibold,
    color: Colors.text.primary,
  },
  postTime: {
    fontSize: FontSizes.xs,
    color: Colors.text.tertiary,
  },
  postContent: {
    fontSize: FontSizes.md,
    color: Colors.text.secondary,
    lineHeight: 22,
    marginBottom: Spacing.md,
  },
  postActions: {
    flexDirection: "row",
    gap: Spacing.lg,
  },
  postAction: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  postActionCount: {
    fontSize: FontSizes.sm,
    color: Colors.text.tertiary,
  },
});

export default SocialScreen;
