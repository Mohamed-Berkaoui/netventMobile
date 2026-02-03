/**
 * Chat Screen
 * Real-time messaging with another user
 */

import { Icon } from "@/components/TabIcon";
import { router, useLocalSearchParams } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Avatar } from "../../components/ui";
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
import { Message, User } from "../../types";

export const ChatScreen: React.FC = () => {
  const { id: recipientId } = useLocalSearchParams<{ id: string }>();
  const flatListRef = useRef<FlatList>(null);

  const [message, setMessage] = useState("");
  const [recipient, setRecipient] = useState<User | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const { user } = useAuthStore();
  const { sendMessage } = useSocialStore();

  /**
   * Fetch recipient info and messages
   */
  useEffect(() => {
    if (!user || !recipientId) return;

    fetchRecipient();
    fetchMessages();
    subscribeToMessages();

    return () => {
      // Cleanup subscription
      supabase.removeAllChannels();
    };
  }, [user, recipientId]);

  /**
   * Fetch recipient user info
   */
  const fetchRecipient = async () => {
    if (!recipientId) return;

    try {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("id", recipientId)
        .single();

      if (error) throw error;
      setRecipient(data);
    } catch (error) {
      console.error("Error fetching recipient:", error);
    }
  };

  /**
   * Fetch message history
   */
  const fetchMessages = async () => {
    if (!user || !recipientId) return;

    try {
      setLoading(true);

      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .or(
          `and(sender_id.eq.${user.id},receiver_id.eq.${recipientId}),and(sender_id.eq.${recipientId},receiver_id.eq.${user.id})`,
        )
        .order("created_at", { ascending: true });

      if (error) throw error;
      setMessages(data || []);

      // Mark messages as read
      await supabase
        .from("messages")
        .update({ read: true })
        .eq("sender_id", recipientId)
        .eq("receiver_id", user.id)
        .eq("read", false);
    } catch (error) {
      console.error("Error fetching messages:", error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Subscribe to new messages
   */
  const subscribeToMessages = () => {
    if (!user || !recipientId) return;

    const channel = supabase
      .channel("messages")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `receiver_id=eq.${user.id}`,
        },
        (payload) => {
          const newMessage = payload.new as Message;
          if (newMessage.sender_id === recipientId) {
            setMessages((prev) => [...prev, newMessage]);

            // Mark as read
            supabase
              .from("messages")
              .update({ read: true })
              .eq("id", newMessage.id);
          }
        },
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  };

  /**
   * Send a message
   */
  const handleSend = async () => {
    if (!message.trim() || !user || !recipientId || sending) return;

    try {
      setSending(true);
      const trimmedMessage = message.trim();
      setMessage("");

      const { message: newMessage, error } = await sendMessage(
        user.id,
        recipientId,
        trimmedMessage,
      );

      if (newMessage && !error) {
        // Message added to store by sendMessage, but we sync local state
        setMessages((prev) => {
          // Avoid duplicates if realtime already added it
          if (prev.find((m) => m.id === newMessage.id)) return prev;
          return [...prev, newMessage];
        });

        // Scroll to bottom
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);
      }
    } catch (error) {
      console.error("Error sending message:", error);
      setMessage(message); // Restore message on error
    } finally {
      setSending(false);
    }
  };

  /**
   * Render message item
   */
  const renderMessage = useCallback(
    ({ item, index }: { item: Message; index: number }) => {
      const isMyMessage = item.sender_id === user?.id;
      const showAvatar =
        !isMyMessage &&
        (index === 0 || messages[index - 1]?.sender_id !== item.sender_id);

      return (
        <View
          style={[
            styles.messageContainer,
            isMyMessage
              ? styles.myMessageContainer
              : styles.theirMessageContainer,
          ]}
        >
          {!isMyMessage && showAvatar && (
            <Avatar
              source={recipient?.avatar_url}
              name={recipient?.name}
              size="small"
            />
          )}
          {!isMyMessage && !showAvatar && (
            <View style={styles.avatarPlaceholder} />
          )}

          <View
            style={[
              styles.messageBubble,
              isMyMessage ? styles.myMessageBubble : styles.theirMessageBubble,
            ]}
          >
            <Text
              style={[
                styles.messageText,
                isMyMessage ? styles.myMessageText : styles.theirMessageText,
              ]}
            >
              {item.content}
            </Text>
            <Text
              style={[
                styles.messageTime,
                isMyMessage ? styles.myMessageTime : styles.theirMessageTime,
              ]}
            >
              {new Date(item.created_at).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </Text>
          </View>
        </View>
      );
    },
    [user, recipient, messages],
  );

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Icon name="arrow-back" size={24} color={Colors.text.primary} />
        </TouchableOpacity>

        {recipient && (
          <View style={styles.recipientInfo}>
            <Avatar
              source={recipient.avatar_url}
              name={recipient.name}
              size="small"
            />
            <View style={styles.recipientText}>
              <Text style={styles.recipientName}>{recipient.name}</Text>
              {recipient.company && (
                <Text style={styles.recipientCompany}>{recipient.company}</Text>
              )}
            </View>
          </View>
        )}

        <TouchableOpacity
          style={styles.infoButton}
          onPress={() =>
            router.push({
              pathname: "/user/[id]",
              params: { id: recipientId },
            })
          }
        >
          <Icon name="search" size={24} color={Colors.text.primary} />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={0}
      >
        {/* Messages List */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.primary.accent} />
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item) => item.id}
            renderItem={renderMessage}
            contentContainerStyle={styles.messagesContent}
            onContentSizeChange={() =>
              flatListRef.current?.scrollToEnd({ animated: false })
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Icon
                  name="chatbubble"
                  size={48}
                  color={Colors.text.tertiary}
                />
                <Text style={styles.emptyText}>Start the conversation</Text>
              </View>
            }
          />
        )}

        {/* Input Area */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={message}
            onChangeText={setMessage}
            placeholder="Type a message..."
            placeholderTextColor={Colors.text.tertiary}
            multiline
            maxLength={1000}
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              (!message.trim() || sending) && styles.sendButtonDisabled,
            ]}
            onPress={handleSend}
            disabled={!message.trim() || sending}
          >
            {sending ? (
              <ActivityIndicator size="small" color={Colors.text.primary} />
            ) : (
              <Icon name="send" size={20} color={Colors.text.primary} />
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
  recipientInfo: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    marginLeft: Spacing.sm,
  },
  recipientText: {
    marginLeft: Spacing.sm,
  },
  recipientName: {
    fontSize: FontSizes.md,
    fontWeight: FontWeights.semibold,
    color: Colors.text.primary,
  },
  recipientCompany: {
    fontSize: FontSizes.xs,
    color: Colors.text.secondary,
  },
  infoButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  keyboardAvoid: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  messagesContent: {
    padding: Spacing.md,
    flexGrow: 1,
  },
  messageContainer: {
    flexDirection: "row",
    marginBottom: Spacing.sm,
    alignItems: "flex-end",
  },
  myMessageContainer: {
    justifyContent: "flex-end",
  },
  theirMessageContainer: {
    justifyContent: "flex-start",
  },
  avatarPlaceholder: {
    width: 32,
    height: 32,
    marginRight: Spacing.sm,
  },
  messageBubble: {
    maxWidth: "75%",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.lg,
  },
  myMessageBubble: {
    backgroundColor: Colors.primary.accent,
    borderBottomRightRadius: BorderRadius.xs,
    marginLeft: Spacing.xl,
  },
  theirMessageBubble: {
    backgroundColor: Colors.background.elevated,
    borderBottomLeftRadius: BorderRadius.xs,
    marginLeft: Spacing.sm,
  },
  messageText: {
    fontSize: FontSizes.md,
    lineHeight: 20,
  },
  myMessageText: {
    color: Colors.text.primary,
  },
  theirMessageText: {
    color: Colors.text.primary,
  },
  messageTime: {
    fontSize: FontSizes.xs,
    marginTop: Spacing.xs,
  },
  myMessageTime: {
    color: "rgba(255, 255, 255, 0.7)",
    textAlign: "right",
  },
  theirMessageTime: {
    color: Colors.text.tertiary,
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.xxl,
  },
  emptyText: {
    fontSize: FontSizes.md,
    color: Colors.text.tertiary,
    marginTop: Spacing.md,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border.primary,
    backgroundColor: Colors.background.secondary,
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 120,
    backgroundColor: Colors.background.elevated,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    fontSize: FontSizes.md,
    color: Colors.text.primary,
    marginRight: Spacing.sm,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.primary.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
});

export default ChatScreen;
