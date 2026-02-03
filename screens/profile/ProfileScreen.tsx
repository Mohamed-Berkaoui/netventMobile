/**
 * Profile Screen
 * User profile display and settings
 */

import { Icon } from "@/components/TabIcon";
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
import { Avatar, Button, Card, Tag } from "../../components/ui";
import {
    BorderRadius,
    Colors,
    FontSizes,
    FontWeights,
    Spacing,
} from "../../constants/theme";
import { useAuthStore } from "../../stores/authStore";

export const ProfileScreen: React.FC = () => {
  const [loggingOut, setLoggingOut] = useState(false);

  const { user, signOut } = useAuthStore();

  /**
   * Handle logout
   */
  const handleLogout = () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          setLoggingOut(true);
          await signOut();
          router.replace("/(auth)/sign-in");
        },
      },
    ]);
  };

  /**
   * Navigate to edit profile
   */
  const handleEditProfile = () => {
    router.push("/edit-profile");
  };

  /**
   * Navigate to permissions settings
   */
  const handlePermissions = () => {
    router.push("/permissions");
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Profile</Text>
          <TouchableOpacity
            style={styles.settingsButton}
            onPress={handleEditProfile}
          >
            <Icon name="settings" size={24} color={Colors.text.primary} />
          </TouchableOpacity>
        </View>

        {/* Profile Card */}
        <Card variant="elevated" style={styles.profileCard}>
          <View style={styles.profileHeader}>
            <Avatar
              source={user?.avatar_url}
              name={user?.name}
              size="xlarge"
              showBorder
            />
            <View style={styles.profileInfo}>
              <Text style={styles.userName}>{user?.name || "No Name"}</Text>
              {user?.position && (
                <Text style={styles.userPosition}>{user.position}</Text>
              )}
              {user?.company && (
                <Text style={styles.userCompany}>{user.company}</Text>
              )}
            </View>
          </View>

          {/* Email */}
          <View style={styles.emailContainer}>
            <Icon name="mail-outline" size={18} color={Colors.text.tertiary} />
            <Text style={styles.email}>{user?.email}</Text>
          </View>

          {/* Interests */}
          {user?.interests && user.interests.length > 0 && (
            <View style={styles.interestsSection}>
              <Text style={styles.interestsLabel}>Interests</Text>
              <View style={styles.interestsTags}>
                {user.interests.map((interest, index) => (
                  <Tag
                    key={index}
                    label={interest}
                    variant="primary"
                    size="small"
                  />
                ))}
              </View>
            </View>
          )}

          <Button
            title="Edit Profile"
            onPress={handleEditProfile}
            variant="outline"
            fullWidth
            style={styles.editButton}
          />
        </Card>

        {/* Settings Menu */}
        <View style={styles.menuSection}>
          <Text style={styles.menuTitle}>Settings</Text>

          <Card style={styles.menuCard}>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={handlePermissions}
            >
              <View style={styles.menuItemLeft}>
                <View
                  style={[
                    styles.menuIcon,
                    { backgroundColor: Colors.status.info },
                  ]}
                >
                  <Icon name="compass" size={20} color={Colors.text.primary} />
                </View>
                <Text style={styles.menuItemText}>Permissions</Text>
              </View>
              <Icon
                name="chevron-forward"
                size={20}
                color={Colors.text.tertiary}
              />
            </TouchableOpacity>

            <View style={styles.menuDivider} />

            <TouchableOpacity style={styles.menuItem}>
              <View style={styles.menuItemLeft}>
                <View
                  style={[
                    styles.menuIcon,
                    { backgroundColor: Colors.primary.accent },
                  ]}
                >
                  <Icon
                    name="notifications"
                    size={20}
                    color={Colors.text.primary}
                  />
                </View>
                <Text style={styles.menuItemText}>Notifications</Text>
              </View>
              <Icon
                name="chevron-forward"
                size={20}
                color={Colors.text.tertiary}
              />
            </TouchableOpacity>

            <View style={styles.menuDivider} />

            <TouchableOpacity style={styles.menuItem}>
              <View style={styles.menuItemLeft}>
                <View
                  style={[
                    styles.menuIcon,
                    { backgroundColor: Colors.status.success },
                  ]}
                >
                  <Icon
                    name="lock-closed"
                    size={20}
                    color={Colors.text.primary}
                  />
                </View>
                <Text style={styles.menuItemText}>Privacy</Text>
              </View>
              <Icon
                name="chevron-forward"
                size={20}
                color={Colors.text.tertiary}
              />
            </TouchableOpacity>
          </Card>
        </View>

        {/* Support Menu */}
        <View style={styles.menuSection}>
          <Text style={styles.menuTitle}>Support</Text>

          <Card style={styles.menuCard}>
            <TouchableOpacity style={styles.menuItem}>
              <View style={styles.menuItemLeft}>
                <View
                  style={[
                    styles.menuIcon,
                    { backgroundColor: Colors.text.tertiary },
                  ]}
                >
                  <Icon name="search" size={20} color={Colors.text.primary} />
                </View>
                <Text style={styles.menuItemText}>Help Center</Text>
              </View>
              <Icon
                name="chevron-forward"
                size={20}
                color={Colors.text.tertiary}
              />
            </TouchableOpacity>

            <View style={styles.menuDivider} />

            <TouchableOpacity style={styles.menuItem}>
              <View style={styles.menuItemLeft}>
                <View
                  style={[
                    styles.menuIcon,
                    { backgroundColor: Colors.text.tertiary },
                  ]}
                >
                  <Icon name="bookmark" size={20} color={Colors.text.primary} />
                </View>
                <Text style={styles.menuItemText}>Terms of Service</Text>
              </View>
              <Icon
                name="chevron-forward"
                size={20}
                color={Colors.text.tertiary}
              />
            </TouchableOpacity>
          </Card>
        </View>

        {/* Sign Out */}
        <Button
          title="Sign Out"
          onPress={handleLogout}
          variant="danger"
          loading={loggingOut}
          fullWidth
          style={styles.signOutButton}
        />

        {/* App Version */}
        <Text style={styles.version}>Version 1.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.primary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.md,
    paddingBottom: Spacing.xxl,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  title: {
    fontSize: FontSizes.xxl,
    fontWeight: FontWeights.bold,
    color: Colors.text.primary,
  },
  settingsButton: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.background.secondary,
    alignItems: "center",
    justifyContent: "center",
  },
  profileCard: {
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  profileHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  profileInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  userName: {
    fontSize: FontSizes.xl,
    fontWeight: FontWeights.bold,
    color: Colors.text.primary,
  },
  userPosition: {
    fontSize: FontSizes.md,
    color: Colors.primary.accent,
    marginTop: Spacing.xs,
  },
  userCompany: {
    fontSize: FontSizes.sm,
    color: Colors.text.secondary,
    marginTop: Spacing.xs,
  },
  emailContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  email: {
    fontSize: FontSizes.md,
    color: Colors.text.secondary,
  },
  interestsSection: {
    marginBottom: Spacing.md,
  },
  interestsLabel: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.medium,
    color: Colors.text.tertiary,
    marginBottom: Spacing.sm,
  },
  interestsTags: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.xs,
  },
  editButton: {
    marginTop: Spacing.sm,
  },
  menuSection: {
    marginBottom: Spacing.lg,
  },
  menuTitle: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.medium,
    color: Colors.text.tertiary,
    marginBottom: Spacing.sm,
    marginLeft: Spacing.sm,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  menuCard: {
    padding: 0,
    overflow: "hidden",
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: Spacing.md,
  },
  menuItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  menuIcon: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  menuItemText: {
    fontSize: FontSizes.md,
    color: Colors.text.primary,
  },
  menuDivider: {
    height: 1,
    backgroundColor: Colors.border.secondary,
    marginLeft: Spacing.md + 36 + Spacing.md,
  },
  signOutButton: {
    marginTop: Spacing.sm,
  },
  version: {
    textAlign: "center",
    fontSize: FontSizes.sm,
    color: Colors.text.tertiary,
    marginTop: Spacing.lg,
  },
});

export default ProfileScreen;
