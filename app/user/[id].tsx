/**
 * User Profile Route
 */

import { Avatar, Button, Card, LoadingSpinner, Tag } from "@/components/ui";
import {
    Colors,
    FontSizes,
    FontWeights,
    Spacing
} from "@/constants/theme";
import { supabase } from "@/services/supabase";
import { useAuthStore } from "@/stores/authStore";
import { useSocialStore } from "@/stores/socialStore";
import { User } from "@/types";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function UserProfileScreen() {
  const { id: userId } = useLocalSearchParams<{ id: string }>();

  const [userProfile, setUserProfile] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFriend, setIsFriend] = useState(false);
  const [requestPending, setRequestPending] = useState(false);
  const [sendingRequest, setSendingRequest] = useState(false);

  const { user } = useAuthStore();
  const { sendFriendRequest, friends } = useSocialStore();

  /**
   * Fetch user profile
   */
  useEffect(() => {
    fetchUserProfile();
    checkFriendshipStatus();
  }, [userId]);

  const fetchUserProfile = async () => {
    if (!userId) return;

    try {
      setLoading(true);

      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("id", userId)
        .single();

      if (error) throw error;
      setUserProfile(data);
    } catch (error) {
      console.error("Error fetching user profile:", error);
      Alert.alert("Error", "Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  const checkFriendshipStatus = async () => {
    if (!user || !userId) return;

    try {
      // Check if already friends
      const { data: friendship } = await supabase
        .from("friendships")
        .select("*")
        .or(
          `and(user_id.eq.${user.id},friend_id.eq.${userId}),and(user_id.eq.${userId},friend_id.eq.${user.id})`,
        )
        .single();

      if (friendship) {
        if (friendship.status === "accepted") {
          setIsFriend(true);
        } else if (friendship.status === "pending") {
          setRequestPending(true);
        }
      }
    } catch (error) {
      // No friendship exists
    }
  };

  /**
   * Send friend request
   */
  const handleConnect = async () => {
    if (!user || !userId) return;

    try {
      setSendingRequest(true);
      await sendFriendRequest(user.id, userId);
      setRequestPending(true);
      Alert.alert(
        "Request Sent",
        `Connection request sent to ${userProfile?.name}`,
      );
    } catch (error) {
      console.error("Error sending friend request:", error);
      Alert.alert("Error", "Failed to send connection request");
    } finally {
      setSendingRequest(false);
    }
  };

  /**
   * Start chat with user
   */
  const handleMessage = () => {
    router.push({
      pathname: "/chat/[id]",
      params: { id: userId },
    });
  };

  if (loading) {
    return <LoadingSpinner fullScreen message="Loading profile..." />;
  }

  if (!userProfile) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color={Colors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.title}>Profile</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.errorContainer}>
          <Ionicons
            name="alert-circle-outline"
            size={48}
            color={Colors.text.tertiary}
          />
          <Text style={styles.errorText}>User not found</Text>
        </View>
      </SafeAreaView>
    );
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
        <Text style={styles.title}>Profile</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <Avatar
            source={userProfile.avatar_url}
            name={userProfile.name}
            size="xlarge"
          />
          <Text style={styles.name}>{userProfile.name}</Text>
          {userProfile.position && (
            <Text style={styles.position}>{userProfile.position}</Text>
          )}
          {userProfile.company && (
            <Text style={styles.company}>{userProfile.company}</Text>
          )}
        </View>

        {/* Actions */}
        {user?.id !== userId && (
          <View style={styles.actions}>
            {isFriend ? (
              <Button
                title="Message"
                onPress={handleMessage}
                icon={
                  <Ionicons
                    name="chatbubble"
                    size={18}
                    color={Colors.text.primary}
                  />
                }
                style={styles.actionButton}
              />
            ) : requestPending ? (
              <Button
                title="Request Pending"
                onPress={() => {}}
                variant="secondary"
                disabled
                style={styles.actionButton}
              />
            ) : (
              <>
                <Button
                  title="Connect"
                  onPress={handleConnect}
                  loading={sendingRequest}
                  icon={
                    <Ionicons
                      name="person-add"
                      size={18}
                      color={Colors.text.primary}
                    />
                  }
                  style={styles.actionButton}
                />
                <Button
                  title="Message"
                  onPress={handleMessage}
                  variant="secondary"
                  icon={
                    <Ionicons
                      name="chatbubble"
                      size={18}
                      color={Colors.text.primary}
                    />
                  }
                  style={styles.actionButton}
                />
              </>
            )}
          </View>
        )}

        {/* Bio */}
        {userProfile.bio && (
          <Card style={styles.section}>
            <Text style={styles.sectionTitle}>About</Text>
            <Text style={styles.bio}>{userProfile.bio}</Text>
          </Card>
        )}

        {/* Interests */}
        {userProfile.interests && userProfile.interests.length > 0 && (
          <Card style={styles.section}>
            <Text style={styles.sectionTitle}>Interests</Text>
            <View style={styles.interestTags}>
              {userProfile.interests.map((interest, index) => (
                <Tag key={index} label={interest} size="small" />
              ))}
            </View>
          </Card>
        )}

        {/* Contact Info */}
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Contact</Text>
          <View style={styles.contactItem}>
            <Ionicons
              name="mail-outline"
              size={20}
              color={Colors.text.tertiary}
            />
            <Text style={styles.contactText}>{userProfile.email}</Text>
          </View>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

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
  scrollContent: {
    padding: Spacing.md,
    paddingBottom: Spacing.xxl,
  },
  profileHeader: {
    alignItems: "center",
    paddingVertical: Spacing.lg,
  },
  name: {
    fontSize: FontSizes.xl,
    fontWeight: FontWeights.bold,
    color: Colors.text.primary,
    marginTop: Spacing.md,
  },
  position: {
    fontSize: FontSizes.md,
    color: Colors.text.secondary,
    marginTop: Spacing.xs,
  },
  company: {
    fontSize: FontSizes.sm,
    color: Colors.text.tertiary,
    marginTop: Spacing.xs,
  },
  actions: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  actionButton: {
    flex: 1,
  },
  section: {
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: FontSizes.md,
    fontWeight: FontWeights.semibold,
    color: Colors.text.primary,
    marginBottom: Spacing.sm,
  },
  bio: {
    fontSize: FontSizes.md,
    color: Colors.text.secondary,
    lineHeight: 22,
  },
  interestTags: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.xs,
  },
  contactItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  contactText: {
    fontSize: FontSizes.md,
    color: Colors.text.secondary,
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
