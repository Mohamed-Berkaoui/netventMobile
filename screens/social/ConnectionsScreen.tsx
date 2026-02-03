/**
 * Connections Screen (Screen 5: Connections - Networking Feed)
 * Network with other attendees
 *
 * Features:
 * - Tab navigation: Feed, Friends, Messages
 * - Suggested connections carousel (AI Matches)
 * - Networking feed with posts
 * - Friends list with chat buttons
 * - Messages/Conversations list
 * - Like, Comment, Share actions
 * - Schedule Meeting CTA
 * - AI Match scores
 */

import { Icon } from "@/components/TabIcon";
import { router } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
    ActivityIndicator,
    Dimensions,
    FlatList,
    Image,
    RefreshControl,
    StyleSheet,
    Text,
    TextInput,
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
import { supabase } from "../../services/supabase";
import { useAIMatchStore } from "../../stores/aiMatchStore";
import { useAuthStore } from "../../stores/authStore";
import { useSocialStore } from "../../stores/socialStore";
import {
    AIMatch,
    ChatConversation,
    FriendWithProfile,
    Post,
    User,
} from "../../types";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const SUGGESTION_CARD_WIDTH = SCREEN_WIDTH * 0.7;

type ConnectionsTab = "feed" | "friends" | "messages";

interface SuggestionCardProps {
  match: AIMatch;
  onConnect: () => void;
  onSchedule: () => void;
}

const SuggestionCard: React.FC<SuggestionCardProps> = ({
  match,
  onConnect,
  onSchedule,
}) => {
  const matchedUser = match.matched_user;
  if (!matchedUser) return null;

  return (
    <Card variant="elevated" style={styles.suggestionCard}>
      <View style={styles.matchBadge}>
        <Icon name="flash" size={12} color={Colors.status.warning} />
        <Text style={styles.matchScore}>{match.score}% Match</Text>
      </View>

      <View style={styles.suggestionAvatar}>
        <Avatar
          source={matchedUser.avatar_url}
          name={matchedUser.name || "User"}
          size="large"
        />
      </View>

      <Text style={styles.suggestionName}>{matchedUser.name}</Text>
      <Text style={styles.suggestionTitle}>
        {matchedUser.title || "Attendee"}
      </Text>
      <Text style={styles.suggestionCompany}>{matchedUser.company || ""}</Text>

      {matchedUser.interests && matchedUser.interests.length > 0 && (
        <View style={styles.suggestionInterests}>
          {matchedUser.interests.slice(0, 3).map((interest, index) => (
            <View key={index} style={styles.interestTag}>
              <Text style={styles.interestText}>{interest}</Text>
            </View>
          ))}
        </View>
      )}

      {match.common_interests && match.common_interests.length > 0 && (
        <View style={styles.mutualRow}>
          <Icon name="sparkles" size={14} color={Colors.text.tertiary} />
          <Text style={styles.mutualText}>
            {match.common_interests.length} common interest
            {match.common_interests.length !== 1 ? "s" : ""}
          </Text>
        </View>
      )}

      <View style={styles.suggestionActions}>
        <TouchableOpacity style={styles.connectButton} onPress={onConnect}>
          <Icon name="person-add" size={16} color={Colors.text.inverse} />
          <Text style={styles.connectButtonText}>Connect</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.scheduleButton} onPress={onSchedule}>
          <Icon name="calendar" size={16} color={Colors.primary.accent} />
        </TouchableOpacity>
      </View>
    </Card>
  );
};

interface PostWithAuthor extends Post {
  author?: User;
}

interface PostCardProps {
  post: PostWithAuthor;
  isLiked: boolean;
  onLike: () => void;
  onComment: () => void;
  onShare: () => void;
  onScheduleMeeting: () => void;
}

/**
 * Friend Card Component
 */
interface FriendCardProps {
  friend: FriendWithProfile;
  onChat: () => void;
  onProfile: () => void;
}

const FriendCard: React.FC<FriendCardProps> = ({
  friend,
  onChat,
  onProfile,
}) => {
  const friendUser = friend.friend;
  if (!friendUser) return null;

  return (
    <Card variant="default" style={styles.friendCard}>
      <TouchableOpacity style={styles.friendContent} onPress={onProfile}>
        <Avatar
          source={friendUser.avatar_url}
          name={friendUser.name || "User"}
          size="medium"
        />
        <View style={styles.friendInfo}>
          <Text style={styles.friendName}>{friendUser.name}</Text>
          {friendUser.title && (
            <Text style={styles.friendTitle}>
              {friendUser.title}
              {friendUser.company ? ` at ${friendUser.company}` : ""}
            </Text>
          )}
          {friendUser.interests && friendUser.interests.length > 0 && (
            <View style={styles.friendInterests}>
              {friendUser.interests.slice(0, 2).map((interest, idx) => (
                <View key={idx} style={styles.miniTag}>
                  <Text style={styles.miniTagText}>{interest}</Text>
                </View>
              ))}
              {friendUser.interests.length > 2 && (
                <Text style={styles.moreInterests}>
                  +{friendUser.interests.length - 2}
                </Text>
              )}
            </View>
          )}
        </View>
      </TouchableOpacity>
      <TouchableOpacity style={styles.chatIconButton} onPress={onChat}>
        <Icon name="chatbubble" size={22} color={Colors.primary.accent} />
      </TouchableOpacity>
    </Card>
  );
};

/**
 * Conversation Card Component
 */
interface ConversationCardProps {
  conversation: ChatConversation;
  onPress: () => void;
}

const ConversationCard: React.FC<ConversationCardProps> = ({
  conversation,
  onPress,
}) => {
  const otherUser = conversation.user;
  if (!otherUser) return null;

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) return "Just now";
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
      <Card variant="default" style={styles.conversationCard}>
        <View style={styles.conversationContent}>
          <View style={styles.avatarWrapper}>
            <Avatar
              source={otherUser.avatar_url}
              name={otherUser.name || "User"}
              size="medium"
            />
            {conversation.unread_count > 0 && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadCount}>
                  {conversation.unread_count > 9
                    ? "9+"
                    : conversation.unread_count}
                </Text>
              </View>
            )}
          </View>
          <View style={styles.conversationInfo}>
            <View style={styles.conversationHeader}>
              <Text style={styles.conversationName}>{otherUser.name}</Text>
              {conversation.last_message && (
                <Text style={styles.messageTime}>
                  {formatTime(conversation.last_message.created_at)}
                </Text>
              )}
            </View>
            {conversation.last_message ? (
              <Text
                style={[
                  styles.lastMessage,
                  conversation.unread_count > 0 && styles.unreadMessage,
                ]}
                numberOfLines={1}
              >
                {conversation.last_message.content}
              </Text>
            ) : (
              <Text style={styles.noMessages}>No messages yet</Text>
            )}
          </View>
        </View>
      </Card>
    </TouchableOpacity>
  );
};

/**
 * Pending Friend Request Card
 */
interface RequestCardProps {
  request: FriendWithProfile;
  onAccept: () => void;
  onReject: () => void;
}

const RequestCard: React.FC<RequestCardProps> = ({
  request,
  onAccept,
  onReject,
}) => {
  const requester = request.friend;
  if (!requester) return null;

  return (
    <Card variant="default" style={styles.requestCard}>
      <View style={styles.requestContent}>
        <Avatar
          source={requester.avatar_url}
          name={requester.name || "User"}
          size="medium"
        />
        <View style={styles.requestInfo}>
          <Text style={styles.friendName}>{requester.name}</Text>
          <Text style={styles.requestLabel}>Wants to connect</Text>
        </View>
        <View style={styles.requestActions}>
          <TouchableOpacity
            style={[styles.requestButton, styles.acceptButton]}
            onPress={onAccept}
          >
            <Icon name="checkmark" size={18} color={Colors.text.inverse} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.requestButton, styles.rejectButton]}
            onPress={onReject}
          >
            <Icon name="close" size={18} color={Colors.text.primary} />
          </TouchableOpacity>
        </View>
      </View>
    </Card>
  );
};

const formatTimeAgo = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
};

const extractHashtags = (content: string): string[] => {
  const matches = content.match(/#\w+/g);
  return matches ? matches.map((tag) => tag.substring(1)) : [];
};

const PostCard: React.FC<PostCardProps> = ({
  post,
  isLiked,
  onLike,
  onComment,
  onShare,
  onScheduleMeeting,
}) => {
  const author = post.author;
  const hashtags = extractHashtags(post.content);

  return (
    <Card variant="default" style={styles.postCard}>
      {/* Post Header */}
      <View style={styles.postHeader}>
        <TouchableOpacity
          style={styles.postAuthor}
          onPress={() => router.push(`/user/${post.user_id}`)}
        >
          <Avatar
            source={author?.avatar_url}
            name={author?.name || "User"}
            size="medium"
          />
          <View style={styles.postAuthorInfo}>
            <Text style={styles.postAuthorName}>
              {author?.name || "Anonymous"}
            </Text>
            <Text style={styles.postAuthorTitle}>
              {author?.title
                ? `${author.title}${author.company ? ` at ${author.company}` : ""}`
                : "Attendee"}
            </Text>
            <Text style={styles.postTime}>
              {formatTimeAgo(post.created_at)}
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.postMoreButton}>
          <Icon name="close" size={20} color={Colors.text.tertiary} />
        </TouchableOpacity>
      </View>

      {/* Post Content */}
      <Text style={styles.postContent}>{post.content}</Text>

      {/* Hashtags */}
      {hashtags.length > 0 && (
        <View style={styles.hashtagsRow}>
          {hashtags.map((tag, index) => (
            <TouchableOpacity key={index}>
              <Text style={styles.hashtag}>#{tag}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Post Image */}
      {post.image_url && (
        <View style={styles.postImageContainer}>
          <Image
            source={{ uri: post.image_url }}
            style={styles.postImage}
            resizeMode="cover"
          />
        </View>
      )}

      {/* Engagement Stats */}
      <View style={styles.engagementStats}>
        <Text style={styles.engagementText}>
          {post.likes_count || 0} likes • {post.comments_count || 0} comments
        </Text>
      </View>

      {/* Action Buttons */}
      <View style={styles.postActions}>
        <TouchableOpacity
          style={[styles.actionButton, isLiked && styles.actionButtonActive]}
          onPress={onLike}
        >
          <Icon
            name={isLiked ? "heart" : "heart-outline"}
            size={20}
            color={isLiked ? Colors.social.like : Colors.text.tertiary}
          />
          <Text style={[styles.actionText, isLiked && styles.actionTextActive]}>
            Like
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton} onPress={onComment}>
          <Icon name="chatbubble" size={20} color={Colors.text.tertiary} />
          <Text style={styles.actionText}>Comment</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton} onPress={onShare}>
          <Icon name="share-outline" size={20} color={Colors.text.tertiary} />
          <Text style={styles.actionText}>Share</Text>
        </TouchableOpacity>
      </View>

      {/* Schedule Meeting CTA */}
      {author && (
        <TouchableOpacity
          style={styles.scheduleMeetingCTA}
          onPress={onScheduleMeeting}
        >
          <Icon
            name="calendar-outline"
            size={16}
            color={Colors.primary.accent}
          />
          <Text style={styles.scheduleMeetingText}>
            Schedule a meeting with {author.name?.split(" ")[0] || "them"}
          </Text>
        </TouchableOpacity>
      )}
    </Card>
  );
};

export const ConnectionsScreen: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ConnectionsTab>("feed");
  const [refreshing, setRefreshing] = useState(false);
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());

  // Search state
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [sentRequests, setSentRequests] = useState<Set<string>>(new Set());

  const { user } = useAuthStore();
  const {
    topMatches,
    loading: matchesLoading,
    fetchMatches,
  } = useAIMatchStore();
  const {
    posts,
    friends,
    pendingRequests,
    conversations,
    loading: postsLoading,
    fetchPosts,
    fetchFriends,
    fetchConversations,
    likePost,
    sendFriendRequest,
    acceptFriendRequest,
    rejectFriendRequest,
  } = useSocialStore();

  useEffect(() => {
    if (user) {
      fetchMatches(user.id);
      fetchPosts();
      fetchFriends(user.id);
      fetchConversations(user.id);
    }
  }, [user]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    if (user) {
      await Promise.all([
        fetchMatches(user.id),
        fetchPosts(),
        fetchFriends(user.id),
        fetchConversations(user.id),
      ]);
    }
    setRefreshing(false);
  }, [user]);

  const handleLike = async (postId: string) => {
    if (!user) return;

    // Optimistic update
    const isCurrentlyLiked = likedPosts.has(postId);
    setLikedPosts((prev) => {
      const newSet = new Set(prev);
      if (isCurrentlyLiked) {
        newSet.delete(postId);
      } else {
        newSet.add(postId);
      }
      return newSet;
    });

    // Actually like the post
    await likePost(postId, user.id);
  };

  const handleConnect = async (matchedUserId: string) => {
    if (!user) return;
    await sendFriendRequest(user.id, matchedUserId);
  };

  const handleScheduleMeeting = (userId: string) => {
    router.push("/ai-matches");
  };

  const handleAcceptRequest = async (friendshipId: string) => {
    await acceptFriendRequest(friendshipId);
    if (user) fetchFriends(user.id);
  };

  const handleRejectRequest = async (friendshipId: string) => {
    await rejectFriendRequest(friendshipId);
    if (user) fetchFriends(user.id);
  };

  const handleChatPress = (userId: string) => {
    router.push({ pathname: "/chat/[id]", params: { id: userId } });
  };

  const handleProfilePress = (userId: string) => {
    router.push({ pathname: "/user/[id]", params: { id: userId } });
  };

  // Search for users
  const handleSearch = async (query: string) => {
    setSearchQuery(query);

    if (query.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    setSearchLoading(true);
    try {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .neq("id", user?.id || "") // Exclude current user
        .or(
          `name.ilike.%${query}%,email.ilike.%${query}%,company.ilike.%${query}%`,
        )
        .limit(20);

      if (error) throw error;

      // Filter out users who are already friends
      const friendIds = new Set(friends.map((f) => f.friend?.id));
      const filteredResults = (data || []).filter((u) => !friendIds.has(u.id));

      setSearchResults(filteredResults);
    } catch (error) {
      console.error("Search error:", error);
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleSendRequest = async (targetUserId: string) => {
    if (!user) return;

    const { error } = await sendFriendRequest(user.id, targetUserId);
    if (!error) {
      setSentRequests((prev) => new Set(prev).add(targetUserId));
    }
  };

  const closeSearch = () => {
    setShowSearch(false);
    setSearchQuery("");
    setSearchResults([]);
  };

  // Calculate total unread messages for tab badge
  const totalUnread = conversations.reduce(
    (sum, c) => sum + (c.unread_count || 0),
    0,
  );

  const renderSuggestion = ({ item }: { item: AIMatch }) => (
    <SuggestionCard
      match={item}
      onConnect={() =>
        item.matched_user_id && handleConnect(item.matched_user_id)
      }
      onSchedule={() =>
        item.matched_user_id && handleScheduleMeeting(item.matched_user_id)
      }
    />
  );

  const renderPost = ({ item }: { item: PostWithAuthor }) => (
    <PostCard
      post={item}
      isLiked={likedPosts.has(item.id)}
      onLike={() => handleLike(item.id)}
      onComment={() => router.push(`/post/${item.id}`)}
      onShare={() => {}}
      onScheduleMeeting={() => handleScheduleMeeting(item.user_id)}
    />
  );

  const ListHeader = () => (
    <>
      {/* Create Post Card */}
      <Card variant="default" style={styles.createPostCard}>
        <View style={styles.createPostRow}>
          <Avatar
            source={user?.avatar_url}
            name={user?.name || "You"}
            size="medium"
          />
          <TouchableOpacity
            style={styles.createPostInput}
            onPress={() => router.push("/create-post")}
          >
            <Text style={styles.createPostPlaceholder}>
              Share your thoughts...
            </Text>
          </TouchableOpacity>
        </View>
        <View style={styles.createPostActions}>
          <TouchableOpacity style={styles.createPostAction}>
            <Icon name="image" size={20} color={Colors.status.success} />
            <Text style={styles.createPostActionText}>Photo</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.createPostAction}>
            <Icon name="videocam" size={20} color={Colors.status.error} />
            <Text style={styles.createPostActionText}>Video</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.createPostAction}>
            <Icon name="bookmark" size={20} color={Colors.primary.accent} />
            <Text style={styles.createPostActionText}>Article</Text>
          </TouchableOpacity>
        </View>
      </Card>

      {/* Suggested Connections Section */}
      <View style={styles.suggestionsSection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Suggested for You</Text>
          <TouchableOpacity onPress={() => router.push("/ai-matches")}>
            <Text style={styles.seeAllText}>See All</Text>
          </TouchableOpacity>
        </View>

        {matchesLoading ? (
          <View style={styles.suggestionsLoading}>
            <LoadingSpinner message="Finding matches..." />
          </View>
        ) : topMatches.length === 0 ? (
          <View style={styles.suggestionsEmpty}>
            <Text style={styles.emptyText}>
              No suggestions yet. Complete your profile to get AI-powered
              matches!
            </Text>
          </View>
        ) : (
          <FlatList
            data={topMatches}
            renderItem={renderSuggestion}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.suggestionsScroll}
            snapToInterval={SUGGESTION_CARD_WIDTH + Spacing.md}
            decelerationRate="fast"
          />
        )}
      </View>

      {/* Feed Section Header */}
      <View style={styles.feedHeader}>
        <Text style={styles.sectionTitle}>Networking Feed</Text>
        <TouchableOpacity style={styles.filterButton}>
          <Icon name="settings" size={20} color={Colors.text.secondary} />
        </TouchableOpacity>
      </View>
    </>
  );

  const ListEmpty = () => (
    <EmptyState
      icon="newspaper-outline"
      title="No Posts Yet"
      description="Be the first to share something with the community!"
      actionLabel="Create Post"
      onAction={() => router.push("/create-post")}
    />
  );

  const FriendsEmpty = () => (
    <EmptyState
      icon="people-outline"
      title="No Friends Yet"
      description="Connect with other attendees to grow your network!"
      actionLabel="Find Connections"
      onAction={() => router.push("/ai-matches")}
    />
  );

  const MessagesEmpty = () => (
    <EmptyState
      icon="chatbubbles-outline"
      title="No Messages Yet"
      description="Start a conversation with your connections!"
      actionLabel="Find Friends"
      onAction={() => setActiveTab("friends")}
    />
  );

  const renderFriend = ({ item }: { item: FriendWithProfile }) => (
    <FriendCard
      friend={item}
      onChat={() => item.friend?.id && handleChatPress(item.friend.id)}
      onProfile={() => item.friend?.id && handleProfilePress(item.friend.id)}
    />
  );

  const renderConversation = ({ item }: { item: ChatConversation }) => (
    <ConversationCard
      conversation={item}
      onPress={() => item.user?.id && handleChatPress(item.user.id)}
    />
  );

  const renderRequest = ({ item }: { item: FriendWithProfile }) => (
    <RequestCard
      request={item}
      onAccept={() => handleAcceptRequest(item.id)}
      onReject={() => handleRejectRequest(item.id)}
    />
  );

  /**
   * Tab Bar Component
   */
  const TabBar = () => (
    <View style={styles.tabBar}>
      <TouchableOpacity
        style={[styles.tab, activeTab === "feed" && styles.activeTab]}
        onPress={() => setActiveTab("feed")}
      >
        <Icon
          name={activeTab === "feed" ? "bookmark" : "bookmark-outline"}
          size={20}
          color={
            activeTab === "feed" ? Colors.primary.accent : Colors.text.tertiary
          }
        />
        <Text
          style={[styles.tabText, activeTab === "feed" && styles.activeTabText]}
        >
          Feed
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.tab, activeTab === "friends" && styles.activeTab]}
        onPress={() => setActiveTab("friends")}
      >
        <View style={styles.tabIconContainer}>
          <Icon
            name={activeTab === "friends" ? "people" : "person-outline"}
            size={20}
            color={
              activeTab === "friends"
                ? Colors.primary.accent
                : Colors.text.tertiary
            }
          />
          {pendingRequests.length > 0 && (
            <View style={styles.tabBadge}>
              <Text style={styles.tabBadgeText}>
                {pendingRequests.length > 9 ? "9+" : pendingRequests.length}
              </Text>
            </View>
          )}
        </View>
        <Text
          style={[
            styles.tabText,
            activeTab === "friends" && styles.activeTabText,
          ]}
        >
          Friends ({friends.length})
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.tab, activeTab === "messages" && styles.activeTab]}
        onPress={() => setActiveTab("messages")}
      >
        <View style={styles.tabIconContainer}>
          <Icon
            name="chatbubble"
            size={20}
            color={
              activeTab === "messages"
                ? Colors.primary.accent
                : Colors.text.tertiary
            }
          />
          {totalUnread > 0 && (
            <View style={styles.tabBadge}>
              <Text style={styles.tabBadgeText}>
                {totalUnread > 9 ? "9+" : totalUnread}
              </Text>
            </View>
          )}
        </View>
        <Text
          style={[
            styles.tabText,
            activeTab === "messages" && styles.activeTabText,
          ]}
        >
          Messages
        </Text>
      </TouchableOpacity>
    </View>
  );

  /**
   * Friends Tab Header with Pending Requests
   */
  const FriendsHeader = () => (
    <>
      {pendingRequests.length > 0 && (
        <View style={styles.requestsSection}>
          <Text style={styles.requestsSectionTitle}>
            Friend Requests ({pendingRequests.length})
          </Text>
          <FlatList
            data={pendingRequests}
            renderItem={renderRequest}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
          />
        </View>
      )}
      {friends.length > 0 && (
        <Text style={styles.friendsSectionTitle}>
          Your Friends ({friends.length})
        </Text>
      )}
    </>
  );

  /**
   * Render content based on active tab
   */
  const renderTabContent = () => {
    switch (activeTab) {
      case "friends":
        return (
          <FlatList
            data={friends}
            renderItem={renderFriend}
            keyExtractor={(item) => item.id}
            ListHeaderComponent={FriendsHeader}
            ListEmptyComponent={
              pendingRequests.length === 0 ? FriendsEmpty : null
            }
            contentContainerStyle={styles.friendsListContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                tintColor={Colors.primary.accent}
                colors={[Colors.primary.accent]}
              />
            }
          />
        );

      case "messages":
        return (
          <FlatList
            data={conversations}
            renderItem={renderConversation}
            keyExtractor={(item) =>
              item.user?.id || item.last_message?.id || Math.random().toString()
            }
            ListEmptyComponent={MessagesEmpty}
            contentContainerStyle={styles.messagesListContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                tintColor={Colors.primary.accent}
                colors={[Colors.primary.accent]}
              />
            }
          />
        );

      default: // "feed"
        return (
          <FlatList
            data={posts}
            renderItem={renderPost}
            keyExtractor={(item) => item.id}
            ListHeaderComponent={ListHeader}
            ListEmptyComponent={!postsLoading ? ListEmpty : null}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                tintColor={Colors.primary.accent}
                colors={[Colors.primary.accent]}
              />
            }
          />
        );
    }
  };

  const isLoading = matchesLoading && postsLoading && posts.length === 0;

  if (isLoading) {
    return <LoadingSpinner fullScreen message="Loading connections..." />;
  }

  // Search Result Card
  const renderSearchResult = ({ item }: { item: User }) => {
    const isFriend = friends.some((f) => f.friend?.id === item.id);
    const requestSent = sentRequests.has(item.id);
    const isPending = pendingRequests.some((r) => r.friend?.id === item.id);

    return (
      <Card variant="default" style={styles.searchResultCard}>
        <TouchableOpacity
          style={styles.searchResultContent}
          onPress={() => handleProfilePress(item.id)}
        >
          <Avatar
            source={item.avatar_url}
            name={item.name || "User"}
            size="medium"
          />
          <View style={styles.searchResultInfo}>
            <Text style={styles.searchResultName}>{item.name}</Text>
            {item.title && (
              <Text style={styles.searchResultTitle}>
                {item.title}
                {item.company ? ` at ${item.company}` : ""}
              </Text>
            )}
            {item.interests && item.interests.length > 0 && (
              <View style={styles.searchResultInterests}>
                {item.interests.slice(0, 3).map((interest, idx) => (
                  <View key={idx} style={styles.miniTag}>
                    <Text style={styles.miniTagText}>{interest}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        </TouchableOpacity>

        {isFriend ? (
          <TouchableOpacity
            style={styles.messageButton}
            onPress={() => handleChatPress(item.id)}
          >
            <Icon name="chatbubble" size={18} color={Colors.primary.accent} />
          </TouchableOpacity>
        ) : isPending ? (
          <View style={styles.pendingButton}>
            <Text style={styles.pendingText}>Pending</Text>
          </View>
        ) : requestSent ? (
          <View style={styles.sentButton}>
            <Icon name="checkmark" size={18} color={Colors.status.success} />
            <Text style={styles.sentText}>Sent</Text>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.addFriendButton}
            onPress={() => handleSendRequest(item.id)}
          >
            <Icon name="person-add" size={18} color={Colors.text.inverse} />
          </TouchableOpacity>
        )}
      </Card>
    );
  };

  // Search View
  if (showSearch) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        {/* Search Header */}
        <View style={styles.searchHeader}>
          <TouchableOpacity style={styles.backButton} onPress={closeSearch}>
            <Icon name="arrow-back" size={24} color={Colors.text.primary} />
          </TouchableOpacity>
          <View style={styles.searchInputContainer}>
            <Icon name="search" size={20} color={Colors.text.tertiary} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search by name, email, or company..."
              placeholderTextColor={Colors.text.tertiary}
              value={searchQuery}
              onChangeText={handleSearch}
              autoFocus
              autoCapitalize="none"
              autoCorrect={false}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => handleSearch("")}>
                <Icon
                  name="close-circle"
                  size={20}
                  color={Colors.text.tertiary}
                />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Search Results */}
        {searchLoading ? (
          <View style={styles.searchLoading}>
            <ActivityIndicator size="large" color={Colors.primary.accent} />
            <Text style={styles.searchLoadingText}>Searching...</Text>
          </View>
        ) : searchQuery.length < 2 ? (
          <View style={styles.searchPrompt}>
            <Icon name="people" size={48} color={Colors.text.tertiary} />
            <Text style={styles.searchPromptTitle}>Find People</Text>
            <Text style={styles.searchPromptText}>
              Search for attendees by name, email, or company to connect with
              them
            </Text>
          </View>
        ) : searchResults.length === 0 ? (
          <View style={styles.searchEmpty}>
            <Icon name="search" size={48} color={Colors.text.tertiary} />
            <Text style={styles.searchEmptyTitle}>No Results</Text>
            <Text style={styles.searchEmptyText}>
              No users found matching "{searchQuery}"
            </Text>
          </View>
        ) : (
          <FlatList
            data={searchResults}
            renderItem={renderSearchResult}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.searchResultsList}
            showsVerticalScrollIndicator={false}
            ListHeaderComponent={
              <Text style={styles.searchResultsCount}>
                {searchResults.length} result
                {searchResults.length !== 1 ? "s" : ""} found
              </Text>
            }
          />
        )}
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Connections</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => router.push("/ai-matches")}
          >
            <Icon name="sparkles" size={24} color={Colors.primary.accent} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => setShowSearch(true)}
          >
            <Icon name="search" size={24} color={Colors.text.primary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Tab Bar */}
      <TabBar />

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
  headerTitle: {
    fontSize: FontSizes.xl,
    fontWeight: FontWeights.bold,
    color: Colors.text.primary,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: Spacing.xs,
  },

  // Tab Bar
  tabBar: {
    flexDirection: "row",
    backgroundColor: Colors.background.primary,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.secondary,
    paddingHorizontal: Spacing.sm,
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.md,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  activeTab: {
    borderBottomColor: Colors.primary.accent,
  },
  tabIconContainer: {
    position: "relative",
  },
  tabText: {
    fontSize: FontSizes.sm,
    color: Colors.text.tertiary,
    marginLeft: 6,
    fontWeight: FontWeights.medium,
  },
  activeTabText: {
    color: Colors.primary.accent,
    fontWeight: FontWeights.semibold,
  },
  tabBadge: {
    position: "absolute",
    top: -6,
    right: -8,
    backgroundColor: Colors.status.error,
    borderRadius: 10,
    minWidth: 16,
    height: 16,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  tabBadgeText: {
    fontSize: 10,
    fontWeight: FontWeights.bold,
    color: Colors.text.inverse,
  },

  listContent: {
    paddingBottom: 100,
  },
  friendsListContent: {
    paddingHorizontal: Spacing.md,
    paddingBottom: 100,
  },
  messagesListContent: {
    paddingHorizontal: Spacing.md,
    paddingBottom: 100,
  },

  // Friend Card
  friendCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    marginTop: Spacing.sm,
  },
  friendContent: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  friendInfo: {
    flex: 1,
    marginLeft: Spacing.sm,
  },
  friendName: {
    fontSize: FontSizes.md,
    fontWeight: FontWeights.semibold,
    color: Colors.text.primary,
  },
  friendTitle: {
    fontSize: FontSizes.sm,
    color: Colors.text.secondary,
    marginTop: 2,
  },
  friendInterests: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: Spacing.xs,
  },
  miniTag: {
    backgroundColor: Colors.background.tertiary,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
    marginRight: 4,
  },
  miniTagText: {
    fontSize: FontSizes.xs,
    color: Colors.text.secondary,
  },
  moreInterests: {
    fontSize: FontSizes.xs,
    color: Colors.text.tertiary,
  },
  chatIconButton: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.background.secondary,
    alignItems: "center",
    justifyContent: "center",
  },

  // Conversation Card
  conversationCard: {
    padding: Spacing.md,
    marginTop: Spacing.sm,
  },
  conversationContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatarWrapper: {
    position: "relative",
  },
  unreadBadge: {
    position: "absolute",
    top: -4,
    right: -4,
    backgroundColor: Colors.status.error,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: Colors.background.primary,
  },
  unreadCount: {
    fontSize: 10,
    fontWeight: FontWeights.bold,
    color: Colors.text.inverse,
  },
  conversationInfo: {
    flex: 1,
    marginLeft: Spacing.sm,
  },
  conversationHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  conversationName: {
    fontSize: FontSizes.md,
    fontWeight: FontWeights.semibold,
    color: Colors.text.primary,
  },
  messageTime: {
    fontSize: FontSizes.xs,
    color: Colors.text.tertiary,
  },
  lastMessage: {
    fontSize: FontSizes.sm,
    color: Colors.text.secondary,
    marginTop: 4,
  },
  unreadMessage: {
    color: Colors.text.primary,
    fontWeight: FontWeights.medium,
  },
  noMessages: {
    fontSize: FontSizes.sm,
    color: Colors.text.tertiary,
    fontStyle: "italic",
    marginTop: 4,
  },

  // Requests Section
  requestsSection: {
    marginBottom: Spacing.md,
  },
  requestsSectionTitle: {
    fontSize: FontSizes.md,
    fontWeight: FontWeights.semibold,
    color: Colors.text.primary,
    marginTop: Spacing.md,
    marginBottom: Spacing.xs,
  },
  friendsSectionTitle: {
    fontSize: FontSizes.md,
    fontWeight: FontWeights.semibold,
    color: Colors.text.primary,
    marginTop: Spacing.md,
  },
  requestCard: {
    padding: Spacing.md,
    marginTop: Spacing.sm,
  },
  requestContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  requestInfo: {
    flex: 1,
    marginLeft: Spacing.sm,
  },
  requestLabel: {
    fontSize: FontSizes.sm,
    color: Colors.text.tertiary,
    marginTop: 2,
  },
  requestActions: {
    flexDirection: "row",
    gap: Spacing.xs,
  },
  requestButton: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  acceptButton: {
    backgroundColor: Colors.status.success,
  },
  rejectButton: {
    backgroundColor: Colors.background.tertiary,
  },

  // Create Post Card
  createPostCard: {
    margin: Spacing.md,
    padding: Spacing.md,
  },
  createPostRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  createPostInput: {
    flex: 1,
    height: 40,
    backgroundColor: Colors.background.secondary,
    borderRadius: BorderRadius.full,
    marginLeft: Spacing.sm,
    paddingHorizontal: Spacing.md,
    justifyContent: "center",
  },
  createPostPlaceholder: {
    fontSize: FontSizes.md,
    color: Colors.text.tertiary,
  },
  createPostActions: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border.secondary,
  },
  createPostAction: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.xs,
  },
  createPostActionText: {
    fontSize: FontSizes.sm,
    color: Colors.text.secondary,
    marginLeft: 6,
  },

  // Suggestions Section
  suggestionsSection: {
    marginBottom: Spacing.md,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
  },
  sectionTitle: {
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.semibold,
    color: Colors.text.primary,
  },
  seeAllText: {
    fontSize: FontSizes.sm,
    color: Colors.primary.accent,
    fontWeight: FontWeights.medium,
  },
  suggestionsScroll: {
    paddingHorizontal: Spacing.md,
  },
  suggestionsLoading: {
    height: 200,
    alignItems: "center",
    justifyContent: "center",
  },
  suggestionsEmpty: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.lg,
  },
  emptyText: {
    fontSize: FontSizes.sm,
    color: Colors.text.tertiary,
    textAlign: "center",
  },

  // Suggestion Card
  suggestionCard: {
    width: SUGGESTION_CARD_WIDTH,
    padding: Spacing.md,
    marginRight: Spacing.md,
    alignItems: "center",
  },
  matchBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.background.secondary,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    alignSelf: "flex-start",
    marginBottom: Spacing.sm,
  },
  matchScore: {
    fontSize: FontSizes.xs,
    fontWeight: FontWeights.semibold,
    color: Colors.status.warning,
    marginLeft: 4,
  },
  suggestionAvatar: {
    marginBottom: Spacing.sm,
  },
  suggestionName: {
    fontSize: FontSizes.md,
    fontWeight: FontWeights.semibold,
    color: Colors.text.primary,
    textAlign: "center",
  },
  suggestionTitle: {
    fontSize: FontSizes.sm,
    color: Colors.text.secondary,
    textAlign: "center",
    marginTop: 2,
  },
  suggestionCompany: {
    fontSize: FontSizes.sm,
    color: Colors.text.tertiary,
    textAlign: "center",
    marginTop: 2,
  },
  suggestionInterests: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    marginTop: Spacing.sm,
  },
  interestTag: {
    backgroundColor: Colors.background.tertiary,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
    marginRight: 4,
    marginBottom: 4,
  },
  interestText: {
    fontSize: FontSizes.xs,
    color: Colors.text.secondary,
  },
  mutualRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: Spacing.sm,
  },
  mutualText: {
    fontSize: FontSizes.xs,
    color: Colors.text.tertiary,
    marginLeft: 4,
  },
  suggestionActions: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: Spacing.md,
  },
  connectButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.primary.accent,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    marginRight: Spacing.sm,
  },
  connectButtonText: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.semibold,
    color: Colors.text.inverse,
    marginLeft: 6,
  },
  scheduleButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.background.secondary,
    borderRadius: BorderRadius.md,
  },

  // Feed Header
  feedHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
  },
  filterButton: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.background.secondary,
    borderRadius: BorderRadius.md,
  },

  // Post Card
  postCard: {
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.md,
    padding: Spacing.md,
  },
  postHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: Spacing.sm,
  },
  postAuthor: {
    flexDirection: "row",
    flex: 1,
  },
  postAuthorInfo: {
    marginLeft: Spacing.sm,
    flex: 1,
  },
  postAuthorName: {
    fontSize: FontSizes.md,
    fontWeight: FontWeights.semibold,
    color: Colors.text.primary,
  },
  postAuthorTitle: {
    fontSize: FontSizes.sm,
    color: Colors.text.secondary,
    marginTop: 2,
  },
  postTime: {
    fontSize: FontSizes.xs,
    color: Colors.text.tertiary,
    marginTop: 2,
  },
  postMoreButton: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  postContent: {
    fontSize: FontSizes.md,
    color: Colors.text.primary,
    lineHeight: 22,
    marginBottom: Spacing.sm,
  },
  hashtagsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: Spacing.sm,
  },
  hashtag: {
    fontSize: FontSizes.sm,
    color: Colors.primary.accent,
    marginRight: Spacing.sm,
  },
  postImageContainer: {
    borderRadius: BorderRadius.md,
    overflow: "hidden",
    marginBottom: Spacing.sm,
  },
  postImage: {
    width: "100%",
    height: 200,
  },
  engagementStats: {
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.secondary,
  },
  engagementText: {
    fontSize: FontSizes.sm,
    color: Colors.text.tertiary,
  },
  postActions: {
    flexDirection: "row",
    paddingTop: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.secondary,
    paddingBottom: Spacing.sm,
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.xs,
  },
  actionButtonActive: {
    // Active state
  },
  actionText: {
    fontSize: FontSizes.sm,
    color: Colors.text.tertiary,
    marginLeft: 6,
  },
  actionTextActive: {
    color: Colors.social.like,
  },
  scheduleMeetingCTA: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingTop: Spacing.sm,
    marginTop: Spacing.xs,
  },
  scheduleMeetingText: {
    fontSize: FontSizes.sm,
    color: Colors.primary.accent,
    marginLeft: 6,
  },

  // Search Styles
  searchHeader: {
    flexDirection: "row",
    alignItems: "center",
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
    marginRight: Spacing.xs,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.background.secondary,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.md,
    height: 44,
  },
  searchInput: {
    flex: 1,
    fontSize: FontSizes.md,
    color: Colors.text.primary,
    marginLeft: Spacing.sm,
    marginRight: Spacing.sm,
  },
  searchLoading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  searchLoadingText: {
    fontSize: FontSizes.md,
    color: Colors.text.secondary,
    marginTop: Spacing.md,
  },
  searchPrompt: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing.xl,
  },
  searchPromptTitle: {
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.semibold,
    color: Colors.text.primary,
    marginTop: Spacing.md,
  },
  searchPromptText: {
    fontSize: FontSizes.md,
    color: Colors.text.secondary,
    textAlign: "center",
    marginTop: Spacing.sm,
  },
  searchEmpty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing.xl,
  },
  searchEmptyTitle: {
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.semibold,
    color: Colors.text.primary,
    marginTop: Spacing.md,
  },
  searchEmptyText: {
    fontSize: FontSizes.md,
    color: Colors.text.secondary,
    textAlign: "center",
    marginTop: Spacing.sm,
  },
  searchResultsList: {
    paddingHorizontal: Spacing.md,
    paddingBottom: 100,
  },
  searchResultsCount: {
    fontSize: FontSizes.sm,
    color: Colors.text.tertiary,
    marginVertical: Spacing.md,
  },
  searchResultCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  searchResultContent: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  searchResultInfo: {
    flex: 1,
    marginLeft: Spacing.sm,
  },
  searchResultName: {
    fontSize: FontSizes.md,
    fontWeight: FontWeights.semibold,
    color: Colors.text.primary,
  },
  searchResultTitle: {
    fontSize: FontSizes.sm,
    color: Colors.text.secondary,
    marginTop: 2,
  },
  searchResultInterests: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: Spacing.xs,
  },
  addFriendButton: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.primary.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  messageButton: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.background.secondary,
    alignItems: "center",
    justifyContent: "center",
  },
  pendingButton: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.background.tertiary,
  },
  pendingText: {
    fontSize: FontSizes.sm,
    color: Colors.text.tertiary,
  },
  sentButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.background.secondary,
  },
  sentText: {
    fontSize: FontSizes.sm,
    color: Colors.status.success,
    marginLeft: 4,
  },
});

export default ConnectionsScreen;
