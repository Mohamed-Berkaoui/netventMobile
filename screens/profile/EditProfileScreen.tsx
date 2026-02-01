/**
 * Edit Profile Screen
 * Update user profile information
 */

import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useState } from "react";
import {
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Avatar, Button, Input, Tag } from "../../components/ui";
import {
    BorderRadius,
    Colors,
    FontSizes,
    FontWeights,
    Spacing,
} from "../../constants/theme";
import { pickImage, updateUserAvatar } from "../../services";
import { useAuthStore } from "../../stores/authStore";

// Available interest options
const INTEREST_OPTIONS = [
  "Technology",
  "Business",
  "Design",
  "Marketing",
  "Healthcare",
  "Education",
  "Finance",
  "Entertainment",
  "Sports",
  "Networking",
  "Startups",
  "AI/ML",
  "Sustainability",
  "Innovation",
];

export const EditProfileScreen: React.FC = () => {
  const { user, updateUserProfile, loading } = useAuthStore();

  const [name, setName] = useState(user?.name || "");
  const [position, setPosition] = useState(user?.position || "");
  const [company, setCompany] = useState(user?.company || "");
  const [interests, setInterests] = useState<string[]>(user?.interests || []);
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [saving, setSaving] = useState(false);

  /**
   * Handle avatar selection
   */
  const handleAvatarPress = async () => {
    const uri = await pickImage();
    if (uri) {
      setAvatarUri(uri);
    }
  };

  /**
   * Toggle interest selection
   */
  const toggleInterest = (interest: string) => {
    setInterests((prev) =>
      prev.includes(interest)
        ? prev.filter((i) => i !== interest)
        : [...prev, interest],
    );
  };

  /**
   * Save profile changes
   */
  const handleSave = async () => {
    if (!user) return;

    if (!name.trim()) {
      Alert.alert("Error", "Name is required");
      return;
    }

    setSaving(true);

    try {
      // Upload avatar if changed
      let avatarUrl = user.avatar_url;
      if (avatarUri) {
        setUploadingAvatar(true);
        const result = await updateUserAvatar(user.id, avatarUri);
        setUploadingAvatar(false);

        if (result.error) {
          Alert.alert(
            "Warning",
            "Failed to upload avatar. Other changes will still be saved.",
          );
        } else if (result.url) {
          avatarUrl = result.url;
        }
      }

      // Update profile
      const result = await updateUserProfile({
        name: name.trim(),
        position: position.trim() || undefined,
        company: company.trim() || undefined,
        interests,
        avatar_url: avatarUrl,
      });

      if (result.error) {
        Alert.alert("Error", result.error);
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert("Success", "Profile updated successfully", [
          { text: "OK", onPress: () => router.back() },
        ]);
      }
    } catch (error: any) {
      Alert.alert("Error", error.message);
    } finally {
      setSaving(false);
    }
  };

  const displayAvatar = avatarUri || user?.avatar_url;

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
        <Text style={styles.title}>Edit Profile</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Avatar */}
        <View style={styles.avatarSection}>
          <TouchableOpacity onPress={handleAvatarPress}>
            <Avatar
              source={displayAvatar}
              name={name}
              size="xlarge"
              showBorder
            />
            <View style={styles.avatarBadge}>
              <Ionicons name="camera" size={18} color={Colors.text.primary} />
            </View>
          </TouchableOpacity>
          <Text style={styles.avatarHint}>Tap to change photo</Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <Input
            label="Full Name"
            placeholder="Enter your name"
            value={name}
            onChangeText={setName}
            leftIcon="person-outline"
            required
          />

          <Input
            label="Position / Title"
            placeholder="e.g., Software Engineer"
            value={position}
            onChangeText={setPosition}
            leftIcon="briefcase-outline"
          />

          <Input
            label="Company"
            placeholder="e.g., Acme Corp"
            value={company}
            onChangeText={setCompany}
            leftIcon="business-outline"
          />
        </View>

        {/* Interests */}
        <View style={styles.interestsSection}>
          <Text style={styles.interestsLabel}>Interests</Text>
          <Text style={styles.interestsHint}>
            Select topics you're interested in to get better matches
          </Text>
          <View style={styles.interestsTags}>
            {INTEREST_OPTIONS.map((interest) => (
              <Tag
                key={interest}
                label={interest}
                selected={interests.includes(interest)}
                onPress={() => toggleInterest(interest)}
              />
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Bottom Actions */}
      <View style={styles.bottomBar}>
        <Button
          title={saving ? "Saving..." : "Save Changes"}
          onPress={handleSave}
          loading={saving || uploadingAvatar}
          size="large"
          fullWidth
        />
      </View>
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
    borderBottomColor: Colors.border.secondary,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.full,
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.md,
    paddingBottom: Spacing.xxl,
  },
  avatarSection: {
    alignItems: "center",
    marginBottom: Spacing.xl,
  },
  avatarBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.primary.accent,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: Colors.background.primary,
  },
  avatarHint: {
    marginTop: Spacing.sm,
    fontSize: FontSizes.sm,
    color: Colors.text.tertiary,
  },
  form: {
    marginBottom: Spacing.lg,
  },
  interestsSection: {
    marginBottom: Spacing.lg,
  },
  interestsLabel: {
    fontSize: FontSizes.md,
    fontWeight: FontWeights.semibold,
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
  },
  interestsHint: {
    fontSize: FontSizes.sm,
    color: Colors.text.tertiary,
    marginBottom: Spacing.md,
  },
  interestsTags: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  bottomBar: {
    padding: Spacing.md,
    paddingBottom: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.border.secondary,
    backgroundColor: Colors.background.primary,
  },
});

export default EditProfileScreen;
