/**
 * Social Store
 * Manages friends, chat, posts, comments, and likes
 */

import { create } from "zustand";
import { supabase } from "../services/supabase";
import {
    ChatConversation,
    Comment,
    FriendWithProfile,
    Message,
    Post,
    User,
} from "../types";

interface SocialState {
  // Friends State
  friends: FriendWithProfile[];
  pendingRequests: FriendWithProfile[];
  sentRequests: FriendWithProfile[];

  // Chat State
  conversations: ChatConversation[];
  messages: Message[];
  currentChatUser: User | null;

  // Posts State
  posts: Post[];
  currentPost: Post | null;
  comments: Comment[];

  // Loading States
  loading: boolean;
  messagesLoading: boolean;
  postsLoading: boolean;
  error: string | null;

  // Friends Actions
  fetchFriends: (userId: string) => Promise<void>;
  sendFriendRequest: (
    requesterId: string,
    addresseeId: string,
  ) => Promise<{ error: string | null }>;
  acceptFriendRequest: (
    friendshipId: string,
  ) => Promise<{ error: string | null }>;
  rejectFriendRequest: (
    friendshipId: string,
  ) => Promise<{ error: string | null }>;
  removeFriend: (friendshipId: string) => Promise<{ error: string | null }>;

  // Chat Actions
  fetchConversations: (userId: string) => Promise<void>;
  fetchMessages: (userId: string, otherUserId: string) => Promise<void>;
  sendMessage: (
    senderId: string,
    receiverId: string,
    content: string,
  ) => Promise<{ error: string | null; message: Message | null }>;
  markMessagesAsRead: (userId: string, senderId: string) => Promise<void>;
  subscribeToMessages: (
    userId: string,
    callback: (message: Message) => void,
  ) => () => void;
  setCurrentChatUser: (user: User | null) => void;

  // Posts Actions
  fetchPosts: (eventId?: string) => Promise<void>;
  createPost: (
    userId: string,
    eventId: string | null,
    content: string,
    imageUrl?: string,
  ) => Promise<{ error: string | null }>;
  deletePost: (postId: string) => Promise<{ error: string | null }>;
  likePost: (
    userId: string,
    postId: string,
  ) => Promise<{ error: string | null }>;
  unlikePost: (
    userId: string,
    postId: string,
  ) => Promise<{ error: string | null }>;
  fetchComments: (postId: string) => Promise<void>;
  addComment: (
    userId: string,
    postId: string,
    content: string,
  ) => Promise<{ error: string | null }>;
  deleteComment: (commentId: string) => Promise<{ error: string | null }>;
  setCurrentPost: (post: Post | null) => void;

  clearError: () => void;
}

export const useSocialStore = create<SocialState>((set, get) => ({
  // Initial State
  friends: [],
  pendingRequests: [],
  sentRequests: [],
  conversations: [],
  messages: [],
  currentChatUser: null,
  posts: [],
  currentPost: null,
  comments: [],
  loading: false,
  messagesLoading: false,
  postsLoading: false,
  error: null,

  // ============================================
  // FRIENDS ACTIONS
  // ============================================

  /**
   * Fetch all friends and friend requests
   */
  fetchFriends: async (userId: string) => {
    try {
      set({ loading: true });

      // Fetch friendships where user is requester or addressee
      const { data, error } = await supabase
        .from("friendships")
        .select(
          `
          *,
          requester:users!friendships_requester_id_fkey(*),
          addressee:users!friendships_addressee_id_fkey(*)
        `,
        )
        .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`);

      if (error) throw error;

      const friendships = (data || []) as any[];

      // Process friendships
      const friends: FriendWithProfile[] = [];
      const pendingRequests: FriendWithProfile[] = [];
      const sentRequests: FriendWithProfile[] = [];

      friendships.forEach((f) => {
        const isRequester = f.requester_id === userId;
        const friendUser = isRequester ? f.addressee : f.requester;

        const friendWithProfile: FriendWithProfile = {
          ...f,
          requester: undefined,
          addressee: undefined,
          friend: friendUser,
        };

        if (f.status === "accepted") {
          friends.push(friendWithProfile);
        } else if (f.status === "pending") {
          if (isRequester) {
            sentRequests.push(friendWithProfile);
          } else {
            pendingRequests.push(friendWithProfile);
          }
        }
      });

      set({ friends, pendingRequests, sentRequests, loading: false });
    } catch (error: any) {
      console.error("Fetch friends error:", error);
      set({ error: error.message, loading: false });
    }
  },

  /**
   * Send a friend request
   */
  sendFriendRequest: async (requesterId: string, addresseeId: string) => {
    try {
      set({ loading: true });

      // Check for existing friendship
      const { data: existing } = await supabase
        .from("friendships")
        .select("id, status")
        .or(
          `and(requester_id.eq.${requesterId},addressee_id.eq.${addresseeId}),and(requester_id.eq.${addresseeId},addressee_id.eq.${requesterId})`,
        )
        .single();

      if (existing) {
        set({ loading: false });
        return { error: "Friend request already exists" };
      }

      const { error } = await supabase.from("friendships").insert({
        requester_id: requesterId,
        addressee_id: addresseeId,
        status: "pending",
      });

      if (error) throw error;

      await get().fetchFriends(requesterId);
      return { error: null };
    } catch (error: any) {
      console.error("Send friend request error:", error);
      set({ error: error.message, loading: false });
      return { error: error.message };
    }
  },

  /**
   * Accept a friend request
   */
  acceptFriendRequest: async (friendshipId: string) => {
    try {
      const { error } = await supabase
        .from("friendships")
        .update({ status: "accepted", updated_at: new Date().toISOString() })
        .eq("id", friendshipId);

      if (error) throw error;

      return { error: null };
    } catch (error: any) {
      console.error("Accept friend request error:", error);
      return { error: error.message };
    }
  },

  /**
   * Reject a friend request
   */
  rejectFriendRequest: async (friendshipId: string) => {
    try {
      const { error } = await supabase
        .from("friendships")
        .update({ status: "rejected", updated_at: new Date().toISOString() })
        .eq("id", friendshipId);

      if (error) throw error;

      return { error: null };
    } catch (error: any) {
      console.error("Reject friend request error:", error);
      return { error: error.message };
    }
  },

  /**
   * Remove a friend
   */
  removeFriend: async (friendshipId: string) => {
    try {
      const { error } = await supabase
        .from("friendships")
        .delete()
        .eq("id", friendshipId);

      if (error) throw error;

      return { error: null };
    } catch (error: any) {
      console.error("Remove friend error:", error);
      return { error: error.message };
    }
  },

  // ============================================
  // CHAT ACTIONS
  // ============================================

  /**
   * Fetch all conversations for a user
   */
  fetchConversations: async (userId: string) => {
    try {
      set({ loading: true });

      // Get all messages involving this user
      const { data: messages, error } = await supabase
        .from("messages")
        .select(
          "*, sender:users!messages_sender_id_fkey(*), receiver:users!messages_receiver_id_fkey(*)",
        )
        .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Group by conversation partner
      const conversationMap = new Map<string, ChatConversation>();

      (messages || []).forEach((msg: any) => {
        const isUserSender = msg.sender_id === userId;
        const partnerId = isUserSender ? msg.receiver_id : msg.sender_id;
        const partner = isUserSender ? msg.receiver : msg.sender;

        if (!conversationMap.has(partnerId)) {
          conversationMap.set(partnerId, {
            user: partner,
            last_message: {
              ...msg,
              sender: undefined,
              receiver: undefined,
            },
            unread_count: 0,
          });
        }

        // Count unread messages
        if (!isUserSender && !msg.read) {
          const conv = conversationMap.get(partnerId)!;
          conv.unread_count += 1;
        }
      });

      const conversations = Array.from(conversationMap.values());
      set({ conversations, loading: false });
    } catch (error: any) {
      console.error("Fetch conversations error:", error);
      set({ error: error.message, loading: false });
    }
  },

  /**
   * Fetch messages between two users
   */
  fetchMessages: async (userId: string, otherUserId: string) => {
    try {
      set({ messagesLoading: true });

      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .or(
          `and(sender_id.eq.${userId},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${userId})`,
        )
        .order("created_at", { ascending: true });

      if (error) throw error;

      set({ messages: (data || []) as Message[], messagesLoading: false });
    } catch (error: any) {
      console.error("Fetch messages error:", error);
      set({ error: error.message, messagesLoading: false });
    }
  },

  /**
   * Send a message
   */
  sendMessage: async (
    senderId: string,
    receiverId: string,
    content: string,
  ) => {
    try {
      const { data, error } = await supabase
        .from("messages")
        .insert({
          sender_id: senderId,
          receiver_id: receiverId,
          content,
          read: false,
        })
        .select()
        .single();

      if (error) throw error;

      // Add to local messages
      if (data) {
        set((state) => ({
          messages: [...state.messages, data as Message],
        }));
      }

      return { error: null, message: data as Message };
    } catch (error: any) {
      console.error("Send message error:", error);
      return { error: error.message, message: null };
    }
  },

  /**
   * Mark messages as read
   */
  markMessagesAsRead: async (userId: string, senderId: string) => {
    try {
      await supabase
        .from("messages")
        .update({ read: true })
        .eq("receiver_id", userId)
        .eq("sender_id", senderId)
        .eq("read", false);
    } catch (error: any) {
      console.error("Mark messages read error:", error);
    }
  },

  /**
   * Subscribe to realtime messages
   */
  subscribeToMessages: (
    userId: string,
    callback: (message: Message) => void,
  ) => {
    const channel = supabase
      .channel("messages-channel")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `receiver_id=eq.${userId}`,
        },
        (payload) => {
          const newMessage = payload.new as Message;
          callback(newMessage);

          // Update messages state
          set((state) => ({
            messages: [...state.messages, newMessage],
          }));
        },
      )
      .subscribe();

    // Return unsubscribe function
    return () => {
      supabase.removeChannel(channel);
    };
  },

  /**
   * Set current chat user
   */
  setCurrentChatUser: (user: User | null) => set({ currentChatUser: user }),

  // ============================================
  // POSTS ACTIONS
  // ============================================

  /**
   * Fetch posts for an event or all posts
   */
  fetchPosts: async (eventId?: string) => {
    try {
      set({ postsLoading: true });

      let query = supabase
        .from("posts")
        .select("*, user:users(*)")
        .order("created_at", { ascending: false });

      if (eventId) {
        query = query.eq("event_id", eventId);
      }

      const { data, error } = await query;

      if (error) throw error;

      set({ posts: (data || []) as Post[], postsLoading: false });
    } catch (error: any) {
      console.error("Fetch posts error:", error);
      set({ error: error.message, postsLoading: false });
    }
  },

  /**
   * Create a new post
   */
  createPost: async (
    userId: string,
    eventId: string | null,
    content: string,
    imageUrl?: string,
  ) => {
    try {
      set({ postsLoading: true });

      const { error } = await supabase.from("posts").insert({
        user_id: userId,
        event_id: eventId || null, // Pass null if empty/undefined
        content,
        image_url: imageUrl,
        likes_count: 0,
        comments_count: 0,
      });

      if (error) throw error;

      await get().fetchPosts(eventId || undefined);
      return { error: null };
    } catch (error: any) {
      console.error("Create post error:", error);
      set({ error: error.message, postsLoading: false });
      return { error: error.message };
    }
  },

  /**
   * Delete a post
   */
  deletePost: async (postId: string) => {
    try {
      const { error } = await supabase.from("posts").delete().eq("id", postId);

      if (error) throw error;

      set((state) => ({
        posts: state.posts.filter((p) => p.id !== postId),
      }));

      return { error: null };
    } catch (error: any) {
      console.error("Delete post error:", error);
      return { error: error.message };
    }
  },

  /**
   * Like a post
   */
  likePost: async (userId: string, postId: string) => {
    try {
      // Insert like
      const { error: likeError } = await supabase.from("likes").insert({
        user_id: userId,
        post_id: postId,
      });

      if (likeError) throw likeError;

      // Update post likes count
      const post = get().posts.find((p) => p.id === postId);
      if (post) {
        await supabase
          .from("posts")
          .update({ likes_count: post.likes_count + 1 })
          .eq("id", postId);

        // Update local state
        set((state) => ({
          posts: state.posts.map((p) =>
            p.id === postId
              ? { ...p, likes_count: p.likes_count + 1, liked_by_me: true }
              : p,
          ),
        }));
      }

      return { error: null };
    } catch (error: any) {
      console.error("Like post error:", error);
      return { error: error.message };
    }
  },

  /**
   * Unlike a post
   */
  unlikePost: async (userId: string, postId: string) => {
    try {
      // Remove like
      const { error: unlikeError } = await supabase
        .from("likes")
        .delete()
        .eq("user_id", userId)
        .eq("post_id", postId);

      if (unlikeError) throw unlikeError;

      // Update post likes count
      const post = get().posts.find((p) => p.id === postId);
      if (post && post.likes_count > 0) {
        await supabase
          .from("posts")
          .update({ likes_count: post.likes_count - 1 })
          .eq("id", postId);

        // Update local state
        set((state) => ({
          posts: state.posts.map((p) =>
            p.id === postId
              ? {
                  ...p,
                  likes_count: Math.max(0, p.likes_count - 1),
                  liked_by_me: false,
                }
              : p,
          ),
        }));
      }

      return { error: null };
    } catch (error: any) {
      console.error("Unlike post error:", error);
      return { error: error.message };
    }
  },

  /**
   * Fetch comments for a post
   */
  fetchComments: async (postId: string) => {
    try {
      const { data, error } = await supabase
        .from("comments")
        .select("*, user:users(*)")
        .eq("post_id", postId)
        .order("created_at", { ascending: true });

      if (error) throw error;

      set({ comments: (data || []) as Comment[] });
    } catch (error: any) {
      console.error("Fetch comments error:", error);
    }
  },

  /**
   * Add a comment to a post
   */
  addComment: async (userId: string, postId: string, content: string) => {
    try {
      const { error: commentError } = await supabase.from("comments").insert({
        user_id: userId,
        post_id: postId,
        content,
      });

      if (commentError) throw commentError;

      // Update post comments count
      const post = get().posts.find((p) => p.id === postId);
      if (post) {
        await supabase
          .from("posts")
          .update({ comments_count: post.comments_count + 1 })
          .eq("id", postId);

        // Update local state
        set((state) => ({
          posts: state.posts.map((p) =>
            p.id === postId
              ? { ...p, comments_count: p.comments_count + 1 }
              : p,
          ),
        }));
      }

      // Refresh comments
      await get().fetchComments(postId);

      return { error: null };
    } catch (error: any) {
      console.error("Add comment error:", error);
      return { error: error.message };
    }
  },

  /**
   * Delete a comment
   */
  deleteComment: async (commentId: string) => {
    try {
      const comment = get().comments.find((c) => c.id === commentId);

      const { error } = await supabase
        .from("comments")
        .delete()
        .eq("id", commentId);

      if (error) throw error;

      // Update post comments count
      if (comment) {
        const post = get().posts.find((p) => p.id === comment.post_id);
        if (post && post.comments_count > 0) {
          await supabase
            .from("posts")
            .update({ comments_count: post.comments_count - 1 })
            .eq("id", comment.post_id);

          set((state) => ({
            posts: state.posts.map((p) =>
              p.id === comment.post_id
                ? { ...p, comments_count: Math.max(0, p.comments_count - 1) }
                : p,
            ),
            comments: state.comments.filter((c) => c.id !== commentId),
          }));
        }
      }

      return { error: null };
    } catch (error: any) {
      console.error("Delete comment error:", error);
      return { error: error.message };
    }
  },

  /**
   * Set current post for detail view
   */
  setCurrentPost: (post: Post | null) => set({ currentPost: post }),

  /**
   * Clear error state
   */
  clearError: () => set({ error: null }),
}));
