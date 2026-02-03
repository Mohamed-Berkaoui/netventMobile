/**
 * Settings Screen (Screen 6: Settings - Control Center)
 * App preferences and user settings
 *
 * Features:
 * - Notification toggles (In-App, Push, Reminders)
 * - Account & Privacy settings
 * - Profile Visibility toggle
 * - Theme selector (Light/Dark/System)
 * - Text Size options
 */

import { Icon } from "@/components/TabIcon";
import { router } from "expo-router";
import React, { useState } from "react";
import {
    Alert,
    Platform,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Avatar, Card } from "../../components/ui";
import {
    BorderRadius,
    Colors,
    FontSizes,
    FontWeights,
    Spacing,
} from "../../constants/theme";
import { useAuthStore } from "../../stores/authStore";

type ThemeOption = "light" | "dark" | "system";
type TextSizeOption = "default" | "large" | "system";

interface SettingRowProps {
  icon: string;
  iconColor?: string;
  title: string;
  subtitle?: string;
  onPress?: () => void;
  rightElement?: React.ReactNode;
  showChevron?: boolean;
}

const SettingRow: React.FC<SettingRowProps> = ({
  icon,
  iconColor = Colors.text.primary,
  title,
  subtitle,
  onPress,
  rightElement,
  showChevron = true,
}) => {
  const content = (
    <View style={styles.settingRow}>
      <View style={[styles.settingIcon, { backgroundColor: iconColor + "20" }]}>
        <Icon name={icon as any} size={20} color={iconColor} />
      </View>
      <View style={styles.settingContent}>
        <Text style={styles.settingTitle}>{title}</Text>
        {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
      </View>
      {rightElement}
      {showChevron && !rightElement && (
        <Icon name="chevron-forward" size={20} color={Colors.text.tertiary} />
      )}
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
        {content}
      </TouchableOpacity>
    );
  }

  return content;
};

export const SettingsScreen: React.FC = () => {
  const { user, signOut } = useAuthStore();

  // Notification settings
  const [inAppNotifications, setInAppNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [reminders, setReminders] = useState(true);
  const [profileVisible, setProfileVisible] = useState(true);

  // Appearance settings
  const [theme, setTheme] = useState<ThemeOption>("system");
  const [textSize, setTextSize] = useState<TextSizeOption>("default");

  const handleSignOut = async () => {
    // On web, use window.confirm; on mobile, use Alert.alert
    if (Platform.OS === "web") {
      const confirmed = window.confirm("Are you sure you want to sign out?");
      if (confirmed) {
        await signOut();
        router.replace("/(auth)/sign-in");
      }
    } else {
      Alert.alert("Sign Out", "Are you sure you want to sign out?", [
        { text: "Cancel", style: "cancel" },
        {
          text: "Sign Out",
          style: "destructive",
          onPress: async () => {
            await signOut();
            router.replace("/(auth)/sign-in");
          },
        },
      ]);
    }
  };

  const handleDeleteAccount = () => {
    if (Platform.OS === "web") {
      const confirmed = window.confirm(
        "Delete Account?\n\nThis action cannot be undone. All your data will be permanently deleted.",
      );
      if (confirmed) {
        // Handle account deletion
      }
    } else {
      Alert.alert(
        "Delete Account",
        "This action cannot be undone. All your data will be permanently deleted.",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Delete",
            style: "destructive",
            onPress: () => {
              // Handle account deletion
            },
          },
        ],
      );
    }
  };

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
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Card */}
        <Card variant="elevated" style={styles.profileCard}>
          <TouchableOpacity
            style={styles.profileContent}
            onPress={() => router.push("/edit-profile")}
          >
            <Avatar
              source={user?.avatar_url}
              name={user?.name || "User"}
              size="large"
            />
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{user?.name || "User"}</Text>
              <Text style={styles.profileEmail}>{user?.email}</Text>
              <View style={styles.editProfileBadge}>
                <Text style={styles.editProfileText}>Edit Profile</Text>
                <Icon
                  name="chevron-forward"
                  size={14}
                  color={Colors.primary.accent}
                />
              </View>
            </View>
          </TouchableOpacity>
        </Card>

        {/* Notifications Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notifications</Text>
          <Card variant="default" style={styles.sectionCard}>
            <SettingRow
              icon="notifications"
              iconColor={Colors.primary.accent}
              title="In-App Notifications"
              subtitle="Receive notifications while using the app"
              showChevron={false}
              rightElement={
                <Switch
                  value={inAppNotifications}
                  onValueChange={setInAppNotifications}
                  trackColor={{
                    false: Colors.border.primary,
                    true: Colors.primary.accent,
                  }}
                  thumbColor={Colors.text.inverse}
                />
              }
            />
            <View style={styles.separator} />
            <SettingRow
              icon="phone-portrait"
              iconColor={Colors.status.info}
              title="Push Notifications"
              subtitle="Receive notifications when app is closed"
              showChevron={false}
              rightElement={
                <Switch
                  value={pushNotifications}
                  onValueChange={setPushNotifications}
                  trackColor={{
                    false: Colors.border.primary,
                    true: Colors.primary.accent,
                  }}
                  thumbColor={Colors.text.inverse}
                />
              }
            />
            <View style={styles.separator} />
            <SettingRow
              icon="alarm"
              iconColor={Colors.status.warning}
              title="Session Reminders"
              subtitle="Get reminded before sessions start"
              showChevron={false}
              rightElement={
                <Switch
                  value={reminders}
                  onValueChange={setReminders}
                  trackColor={{
                    false: Colors.border.primary,
                    true: Colors.primary.accent,
                  }}
                  thumbColor={Colors.text.inverse}
                />
              }
            />
          </Card>
        </View>

        {/* Account & Privacy Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account & Privacy</Text>
          <Card variant="default" style={styles.sectionCard}>
            <SettingRow
              icon="eye"
              iconColor={Colors.status.success}
              title="Profile Visibility"
              subtitle={
                profileVisible
                  ? "Visible to other attendees"
                  : "Hidden from others"
              }
              showChevron={false}
              rightElement={
                <Switch
                  value={profileVisible}
                  onValueChange={setProfileVisible}
                  trackColor={{
                    false: Colors.border.primary,
                    true: Colors.primary.accent,
                  }}
                  thumbColor={Colors.text.inverse}
                />
              }
            />
            <View style={styles.separator} />
            <SettingRow
              icon="lock-closed"
              iconColor={Colors.text.secondary}
              title="Privacy Settings"
              onPress={() => {}}
            />
            <View style={styles.separator} />
            <SettingRow
              icon="document-text"
              iconColor={Colors.text.secondary}
              title="Terms of Service"
              onPress={() => {}}
            />
            <View style={styles.separator} />
            <SettingRow
              icon="shield-checkmark"
              iconColor={Colors.text.secondary}
              title="Privacy Policy"
              onPress={() => {}}
            />
          </Card>
        </View>

        {/* Appearance Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Appearance</Text>
          <Card variant="default" style={styles.sectionCard}>
            <Text style={styles.subsectionTitle}>Theme</Text>
            <View style={styles.optionsRow}>
              <TouchableOpacity
                style={[
                  styles.optionButton,
                  theme === "light" && styles.optionButtonActive,
                ]}
                onPress={() => setTheme("light")}
              >
                <Icon
                  name="home"
                  size={20}
                  color={
                    theme === "light"
                      ? Colors.text.primary
                      : Colors.text.tertiary
                  }
                />
                <Text
                  style={[
                    styles.optionText,
                    theme === "light" && styles.optionTextActive,
                  ]}
                >
                  Light
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.optionButton,
                  theme === "dark" && styles.optionButtonActive,
                ]}
                onPress={() => setTheme("dark")}
              >
                <Icon
                  name="close-circle"
                  size={20}
                  color={
                    theme === "dark"
                      ? Colors.text.primary
                      : Colors.text.tertiary
                  }
                />
                <Text
                  style={[
                    styles.optionText,
                    theme === "dark" && styles.optionTextActive,
                  ]}
                >
                  Dark
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.optionButton,
                  theme === "system" && styles.optionButtonActive,
                ]}
                onPress={() => setTheme("system")}
              >
                <Icon
                  name="settings"
                  size={20}
                  color={
                    theme === "system"
                      ? Colors.text.primary
                      : Colors.text.tertiary
                  }
                />
                <Text
                  style={[
                    styles.optionText,
                    theme === "system" && styles.optionTextActive,
                  ]}
                >
                  System
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.subsectionSeparator} />

            <Text style={styles.subsectionTitle}>Text Size</Text>
            <View style={styles.optionsRow}>
              <TouchableOpacity
                style={[
                  styles.optionButton,
                  textSize === "default" && styles.optionButtonActive,
                ]}
                onPress={() => setTextSize("default")}
              >
                <Text style={[styles.textSizePreview, { fontSize: 14 }]}>
                  Aa
                </Text>
                <Text
                  style={[
                    styles.optionText,
                    textSize === "default" && styles.optionTextActive,
                  ]}
                >
                  Default
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.optionButton,
                  textSize === "large" && styles.optionButtonActive,
                ]}
                onPress={() => setTextSize("large")}
              >
                <Text style={[styles.textSizePreview, { fontSize: 18 }]}>
                  Aa
                </Text>
                <Text
                  style={[
                    styles.optionText,
                    textSize === "large" && styles.optionTextActive,
                  ]}
                >
                  Large
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.optionButton,
                  textSize === "system" && styles.optionButtonActive,
                ]}
                onPress={() => setTextSize("system")}
              >
                <Icon
                  name="settings"
                  size={20}
                  color={
                    textSize === "system"
                      ? Colors.text.primary
                      : Colors.text.tertiary
                  }
                />
                <Text
                  style={[
                    styles.optionText,
                    textSize === "system" && styles.optionTextActive,
                  ]}
                >
                  System
                </Text>
              </TouchableOpacity>
            </View>
          </Card>
        </View>

        {/* Support Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Support</Text>
          <Card variant="default" style={styles.sectionCard}>
            <SettingRow
              icon="help-circle"
              iconColor={Colors.primary.accent}
              title="Help Center"
              onPress={() => {}}
            />
            <View style={styles.separator} />
            <SettingRow
              icon="chatbubbles"
              iconColor={Colors.status.success}
              title="Contact Support"
              onPress={() => {}}
            />
            <View style={styles.separator} />
            <SettingRow
              icon="star"
              iconColor={Colors.status.warning}
              title="Rate the App"
              onPress={() => {}}
            />
          </Card>
        </View>

        {/* Account Actions */}
        <View style={styles.section}>
          <Card variant="default" style={styles.sectionCard}>
            <TouchableOpacity
              style={styles.signOutButton}
              onPress={handleSignOut}
            >
              <Icon name="arrow-back" size={20} color={Colors.status.error} />
              <Text style={styles.signOutText}>Sign Out</Text>
            </TouchableOpacity>
          </Card>
        </View>

        {/* Danger Zone */}
        <View style={styles.section}>
          <TouchableOpacity onPress={handleDeleteAccount}>
            <Text style={styles.deleteAccountText}>Delete Account</Text>
          </TouchableOpacity>
        </View>

        {/* App Version */}
        <View style={styles.versionContainer}>
          <Text style={styles.versionText}>Version 1.0.0 (Build 1)</Text>
        </View>

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

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.bold,
    color: Colors.text.primary,
  },
  headerRight: {
    width: 40,
  },

  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.md,
  },

  // Profile Card
  profileCard: {
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  profileContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  profileInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  profileName: {
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.semibold,
    color: Colors.text.primary,
  },
  profileEmail: {
    fontSize: FontSizes.sm,
    color: Colors.text.tertiary,
    marginTop: 2,
  },
  editProfileBadge: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: Spacing.xs,
  },
  editProfileText: {
    fontSize: FontSizes.sm,
    color: Colors.primary.accent,
    fontWeight: FontWeights.medium,
  },

  // Sections
  section: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.semibold,
    color: Colors.text.tertiary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: Spacing.sm,
    paddingHorizontal: Spacing.xs,
  },
  sectionCard: {
    padding: 0,
    overflow: "hidden",
  },

  // Setting Row
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
  },
  settingIcon: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.sm,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: FontSizes.md,
    fontWeight: FontWeights.medium,
    color: Colors.text.primary,
  },
  settingSubtitle: {
    fontSize: FontSizes.sm,
    color: Colors.text.tertiary,
    marginTop: 2,
  },
  separator: {
    height: 1,
    backgroundColor: Colors.border.secondary,
    marginLeft: Spacing.md + 36 + Spacing.md,
  },

  // Appearance Options
  subsectionTitle: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.medium,
    color: Colors.text.secondary,
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    marginBottom: Spacing.sm,
  },
  subsectionSeparator: {
    height: 1,
    backgroundColor: Colors.border.secondary,
    marginVertical: Spacing.sm,
  },
  optionsRow: {
    flexDirection: "row",
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.md,
  },
  optionButton: {
    flex: 1,
    alignItems: "center",
    paddingVertical: Spacing.md,
    marginHorizontal: 4,
    backgroundColor: Colors.background.secondary,
    borderRadius: BorderRadius.md,
    borderWidth: 2,
    borderColor: "transparent",
  },
  optionButtonActive: {
    backgroundColor: Colors.primary.accent + "20",
    borderColor: Colors.primary.accent,
  },
  optionText: {
    fontSize: FontSizes.sm,
    color: Colors.text.tertiary,
    marginTop: 4,
  },
  optionTextActive: {
    color: Colors.primary.accent,
    fontWeight: FontWeights.medium,
  },
  textSizePreview: {
    fontWeight: FontWeights.semibold,
    color: Colors.text.primary,
  },

  // Sign Out
  signOutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.md,
  },
  signOutText: {
    fontSize: FontSizes.md,
    fontWeight: FontWeights.semibold,
    color: Colors.status.error,
    marginLeft: Spacing.sm,
  },

  // Delete Account
  deleteAccountText: {
    fontSize: FontSizes.sm,
    color: Colors.text.tertiary,
    textAlign: "center",
    textDecorationLine: "underline",
  },

  // Version
  versionContainer: {
    alignItems: "center",
    paddingVertical: Spacing.lg,
  },
  versionText: {
    fontSize: FontSizes.sm,
    color: Colors.text.tertiary,
  },

  bottomSpacing: {
    height: 50,
  },
});

export default SettingsScreen;
