/**
 * Post Details Screen
 * View a post with comments
 */

import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Image,
    KeyboardAvoidingView,
    Platform,
    RefreshControl,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Avatar, LoadingSpinner } from "../../components/ui";
import {
    BorderRadius,
    Colors,
    FontSizes,
    FontWeights,
    Spacing,
} from "../../constants/theme";
import { supabase } from "../../services/supabase";
import { useAuthStore } from "../../stores/authStore";
import { useSocialStore } from "../../stores/socialStore";
import { Comment, Post } from "../../types";

export const PostDetailsScreen: React.FC = () => {
  const { id: postId } = useLocalSearchParams<{ id: string }>();

  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const { user } = useAuthStore();
  const {
    likePost,
    unlikePost,
    addComment,
    fetchComments: fetchStoreComments,
    comments: storeComments,
  } = useSocialStore();

  /**
   * Fetch post and comments
   */
  useEffect(() => {
    fetchPostDetails();
  }, [postId]);

  const fetchPostDetails = async () => {
    if (!postId) return;

    try {
      // Fetch post
      const { data: postData, error: postError } = await supabase
        .from("posts")
        .select(
          `
          *,
          user:users(*)
        `,
        )
        .eq("id", postId)
        .single();

      if (postError) throw postError;

      // Check if liked by user
      if (user) {
        const { data: likeData } = await supabase
          .from("post_likes")
          .select("id")
          .eq("post_id", postId)
          .eq("user_id", user.id)
          .single();

        postData.liked_by_me = !!likeData;
      }

      setPost(postData);

      // Fetch comments
      const { data: commentsData, error: commentsError } = await supabase
        .from("comments")
        .select(
          `
          *,
          user:users(*)
        `,
        )
        .eq("post_id", postId)
        .order("created_at", { ascending: true });

      if (commentsError) throw commentsError;
      setComments(commentsData || []);
    } catch (error) {
      console.error("Error fetching post details:", error);
      Alert.alert("Error", "Failed to load post");
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchPostDetails();
    setRefreshing(false);
  }, [postId]);

  /**
   * Handle like/unlike
   */
  const handleLikeToggle = async () => {
    if (!post || !user) return;

    try {
      if (post.liked_by_me) {
        await unlikePost(post.id, user.id);
        setPost({
          ...post,
          liked_by_me: false,
          likes_count: post.likes_count - 1,
        });
      } else {
        await likePost(post.id, user.id);
        setPost({
          ...post,
          liked_by_me: true,
          likes_count: post.likes_count + 1,
        });
      }
    } catch (error) {
      console.error("Error toggling like:", error);
    }
  };

  /**
   * Submit comment
   */
  const handleSubmitComment = async () => {
    if (!newComment.trim() || !user || !postId || submitting) return;

    try {
      setSubmitting(true);
      const trimmedComment = newComment.trim();
      setNewComment("");

      const { error } = await addComment(user.id, postId, trimmedComment);

      if (!error) {
        // Refresh comments from store
        await fetchStoreComments(postId);

        // Update local comments state from store
        setComments(useSocialStore.getState().comments);

        // Update post comments count
        if (post) {
          setPost({
            ...post,
            comments_count: post.comments_count + 1,
          });
        }
      } else {
        Alert.alert("Error", "Failed to add comment");
        setNewComment(trimmedComment);
      }
    } catch (error) {
      console.error("Error adding comment:", error);
      setNewComment(newComment);
      Alert.alert("Error", "Failed to add comment");
    } finally {
      setSubmitting(false);
    }
  };

  /**
   * Format relative time
   */
  const formatRelativeTime = (date: string) => {
    const now = new Date();
    const then = new Date(date);
    const diffMs = now.getTime() - then.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return then.toLocaleDateString();
  };

  /**
   * Render comment item
   */
  const renderComment = ({ item }: { item: Comment }) => (
    <View style={styles.commentItem}>
      <Avatar
        source={item.user?.avatar_url}
        name={item.user?.name}
        size="small"
      />
      <View style={styles.commentContent}>
        <View style={styles.commentBubble}>
          <Text style={styles.commentAuthor}>{item.user?.name}</Text>
          <Text style={styles.commentText}>{item.content}</Text>
        </View>
        <Text style={styles.commentTime}>
          {formatRelativeTime(item.created_at)}
        </Text>
      </View>
    </View>
  );

  /**
   * Render post header
   */
  const renderPostHeader = () => {
    if (!post) return null;

    return (
      <View style={styles.postContainer}>
        {/* Author Info */}
        <View style={styles.postHeader}>
          <Avatar
            source={post.user?.avatar_url}
            name={post.user?.name}
            size="medium"
          />
          <View style={styles.postHeaderInfo}>
            <Text style={styles.postAuthor}>{post.user?.name}</Text>
            <Text style={styles.postTime}>
              {formatRelativeTime(post.created_at)}
            </Text>
          </View>
        </View>

        {/* Content */}
        <Text style={styles.postContent}>{post.content}</Text>

        {/* Image */}
        {post.image_url && (
          <Image
            source={{ uri: post.image_url }}
            style={styles.postImage}
            resizeMode="cover"
          />
        )}

        {/* Actions */}
        <View style={styles.postActions}>
          <TouchableOpacity
            style={styles.postAction}
            onPress={handleLikeToggle}
          >
            <Ionicons
              name={post.liked_by_me ? "heart" : "heart-outline"}
              size={24}
              color={
                post.liked_by_me ? Colors.social.like : Colors.text.tertiary
              }
            />
            <Text style={styles.postActionCount}>{post.likes_count}</Text>
          </TouchableOpacity>

          <View style={styles.postAction}>
            <Ionicons
              name="chatbubble-outline"
              size={24}
              color={Colors.text.tertiary}
            />
            <Text style={styles.postActionCount}>{post.comments_count}</Text>
          </View>
        </View>

        {/* Comments Divider */}
        <View style={styles.commentsDivider}>
          <Text style={styles.commentsTitle}>Comments</Text>
        </View>
      </View>
    );
  };

  if (loading) {
    return <LoadingSpinner fullScreen message="Loading post..." />;
  }

  if (!post) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color={Colors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.title}>Post</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.errorContainer}>
          <Ionicons
            name="alert-circle-outline"
            size={48}
            color={Colors.text.tertiary}
          />
          <Text style={styles.errorText}>Post not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color={Colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.title}>Post</Text>
        <View style={styles.placeholder} />
      </View>

      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        {/* Post and Comments */}
        <FlatList
          data={comments}
          keyExtractor={(item) => item.id}
          renderItem={renderComment}
          ListHeaderComponent={renderPostHeader}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={Colors.primary.accent}
            />
          }
          ListEmptyComponent={
            <View style={styles.noCommentsContainer}>
              <Text style={styles.noCommentsText}>No comments yet</Text>
              <Text style={styles.noCommentsHint}>
                Be the first to comment!
              </Text>
            </View>
          }
        />

        {/* Comment Input */}
        <View style={styles.inputContainer}>
          <Avatar source={user?.avatar_url} name={user?.name} size="small" />
          <TextInput
            style={styles.input}
            value={newComment}
            onChangeText={setNewComment}
            placeholder="Write a comment..."
            placeholderTextColor={Colors.text.tertiary}
            multiline
            maxLength={500}
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              (!newComment.trim() || submitting) && styles.sendButtonDisabled,
            ]}
            onPress={handleSubmitComment}
            disabled={!newComment.trim() || submitting}
          >
            {submitting ? (
              <ActivityIndicator size="small" color={Colors.text.primary} />
            ) : (
              <Ionicons name="send" size={18} color={Colors.text.primary} />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
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
  placeholder: {
    width: 40,
  },
  keyboardAvoid: {
    flex: 1,
  },
  listContent: {
    flexGrow: 1,
  },
  postContainer: {
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.secondary,
  },
  postHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  postHeaderInfo: {
    marginLeft: Spacing.sm,
  },
  postAuthor: {
    fontSize: FontSizes.md,
    fontWeight: FontWeights.semibold,
    color: Colors.text.primary,
  },
  postTime: {
    fontSize: FontSizes.sm,
    color: Colors.text.tertiary,
    marginTop: Spacing.xs,
  },
  postContent: {
    fontSize: FontSizes.md,
    color: Colors.text.primary,
    lineHeight: 24,
    marginBottom: Spacing.md,
  },
  postImage: {
    width: "100%",
    height: 200,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
  },
  postActions: {
    flexDirection: "row",
    gap: Spacing.xl,
    paddingVertical: Spacing.sm,
  },
  postAction: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  postActionCount: {
    fontSize: FontSizes.md,
    color: Colors.text.secondary,
  },
  commentsDivider: {
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border.secondary,
    marginTop: Spacing.md,
  },
  commentsTitle: {
    fontSize: FontSizes.md,
    fontWeight: FontWeights.semibold,
    color: Colors.text.primary,
  },
  commentItem: {
    flexDirection: "row",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  commentContent: {
    flex: 1,
    marginLeft: Spacing.sm,
  },
  commentBubble: {
    backgroundColor: Colors.background.elevated,
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
  },
  commentAuthor: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.semibold,
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
  },
  commentText: {
    fontSize: FontSizes.md,
    color: Colors.text.secondary,
    lineHeight: 20,
  },
  commentTime: {
    fontSize: FontSizes.xs,
    color: Colors.text.tertiary,
    marginTop: Spacing.xs,
    marginLeft: Spacing.sm,
  },
  noCommentsContainer: {
    alignItems: "center",
    paddingVertical: Spacing.xl,
  },
  noCommentsText: {
    fontSize: FontSizes.md,
    color: Colors.text.tertiary,
  },
  noCommentsHint: {
    fontSize: FontSizes.sm,
    color: Colors.text.tertiary,
    marginTop: Spacing.xs,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border.primary,
    backgroundColor: Colors.background.secondary,
    gap: Spacing.sm,
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    backgroundColor: Colors.background.elevated,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    fontSize: FontSizes.md,
    color: Colors.text.primary,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.primary.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  errorContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  errorText: {
    fontSize: FontSizes.md,
    color: Colors.text.tertiary,
    marginTop: Spacing.md,
  },
});

export default PostDetailsScreen;
