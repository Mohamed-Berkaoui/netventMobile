/**
 * Profile Setup Screen (Step 2 of 3)
 * Interests, goals, and role selection
 */

import { router } from "expo-router";
import React, { useState } from "react";
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Icon } from "../../components/TabIcon";
import { Avatar, Button } from "../../components/ui";
import {
    BorderRadius,
    Colors,
    FontSizes,
    FontWeights,
    Spacing,
} from "../../constants/theme";
import { supabase } from "../../services/supabase";
import { useAuthStore } from "../../stores/authStore";

// Interest categories
const INTEREST_OPTIONS = [
  "Technology",
  "Conferences",
  "Workshops",
  "Networking",
  "Startups",
  "AI & ML",
  "FinTech",
  "Healthcare",
  "Education",
  "Sustainability",
  "Arts & Culture",
  "Gaming",
  "Sports",
  "Food & Beverage",
  "Music Festivals",
];

// Goal options
const GOAL_OPTIONS = [
  "Pitch to Investors",
  "Find Co-Founders",
  "Network & Connect",
  "Learn New Skills",
  "Recruit Talent",
  "Discover Opportunities",
  "Build Partnerships",
  "Industry Insights",
];

type UserRole = "attendee" | "organizer";

export const ProfileSetupScreen: React.FC = () => {
  const { user, refreshUser } = useAuthStore();
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [selectedGoal, setSelectedGoal] =
    useState<string>("Pitch to Investors");
  const [role, setRole] = useState<UserRole>("attendee");
  const [showGoalDropdown, setShowGoalDropdown] = useState(false);
  const [loading, setLoading] = useState(false);

  /**
   * Toggle interest selection
   */
  const toggleInterest = (interest: string) => {
    setSelectedInterests((prev) =>
      prev.includes(interest)
        ? prev.filter((i) => i !== interest)
        : [...prev, interest],
    );
  };

  /**
   * Handle profile completion
   */
  const handleCompleteProfile = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from("users")
        .update({
          interests: selectedInterests,
          goals: [selectedGoal],
          role: role,
          profile_completed: true,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      if (error) throw error;

      await refreshUser();
      router.replace("/(tabs)");
    } catch (error) {
      console.error("Error updating profile:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profile Setup</Text>
        <TouchableOpacity onPress={() => router.push("/edit-profile")}>
          <Avatar source={user?.avatar_url} name={user?.name} size="small" />
        </TouchableOpacity>
      </View>

      {/* Progress Indicator */}
      <View style={styles.progressContainer}>
        <Text style={styles.stepText}>Step 2 of 3</Text>
        <View style={styles.progressDots}>
          <View style={[styles.dot, styles.dotCompleted]} />
          <View style={[styles.dot, styles.dotActive]} />
          <View style={styles.dot} />
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Interests Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tell us about your interests</Text>
          <View style={styles.interestGrid}>
            {INTEREST_OPTIONS.map((interest) => (
              <TouchableOpacity
                key={interest}
                style={[
                  styles.interestChip,
                  selectedInterests.includes(interest) &&
                    styles.interestChipSelected,
                ]}
                onPress={() => toggleInterest(interest)}
              >
                <Text
                  style={[
                    styles.interestChipText,
                    selectedInterests.includes(interest) &&
                      styles.interestChipTextSelected,
                  ]}
                >
                  {interest}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Goal Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>What are you looking for?</Text>
          <TouchableOpacity
            style={styles.dropdown}
            onPress={() => setShowGoalDropdown(!showGoalDropdown)}
          >
            <Text style={styles.dropdownText}>{selectedGoal}</Text>
            <Icon
              name={
                showGoalDropdown ? "chevron-up-outline" : "chevron-down-outline"
              }
              size={20}
              color={Colors.text.secondary}
            />
          </TouchableOpacity>

          {showGoalDropdown && (
            <View style={styles.dropdownMenu}>
              {GOAL_OPTIONS.map((goal) => (
                <TouchableOpacity
                  key={goal}
                  style={[
                    styles.dropdownItem,
                    selectedGoal === goal && styles.dropdownItemSelected,
                  ]}
                  onPress={() => {
                    setSelectedGoal(goal);
                    setShowGoalDropdown(false);
                  }}
                >
                  <Text
                    style={[
                      styles.dropdownItemText,
                      selectedGoal === goal && styles.dropdownItemTextSelected,
                    ]}
                  >
                    {goal}
                  </Text>
                  {selectedGoal === goal && (
                    <Icon
                      name="checkmark"
                      size={20}
                      color={Colors.primary.accent}
                    />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Role Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Choose your role</Text>
          <View style={styles.roleToggle}>
            <TouchableOpacity
              style={[
                styles.roleButton,
                role === "attendee" && styles.roleButtonActive,
              ]}
              onPress={() => setRole("attendee")}
            >
              <Text
                style={[
                  styles.roleButtonText,
                  role === "attendee" && styles.roleButtonTextActive,
                ]}
              >
                Attendee
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.roleButton,
                role === "organizer" && styles.roleButtonActive,
              ]}
              onPress={() => setRole("organizer")}
            >
              <Text
                style={[
                  styles.roleButtonText,
                  role === "organizer" && styles.roleButtonTextActive,
                ]}
              >
                Organizer
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Complete Button */}
      <View style={styles.footer}>
        <Button
          title="Complete Profile"
          onPress={handleCompleteProfile}
          loading={loading}
          size="large"
          fullWidth
          disabled={selectedInterests.length === 0}
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
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  headerTitle: {
    fontSize: FontSizes.xl,
    fontWeight: FontWeights.bold,
    color: Colors.text.primary,
  },
  progressContainer: {
    alignItems: "center",
    paddingVertical: Spacing.md,
  },
  stepText: {
    fontSize: FontSizes.sm,
    color: Colors.text.secondary,
    marginBottom: Spacing.sm,
  },
  progressDots: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.border.primary,
  },
  dotCompleted: {
    backgroundColor: Colors.primary.accent,
  },
  dotActive: {
    backgroundColor: Colors.primary.accent,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.semibold,
    color: Colors.text.primary,
    marginBottom: Spacing.md,
  },
  interestGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  interestChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.background.secondary,
    borderWidth: 1,
    borderColor: Colors.border.primary,
  },
  interestChipSelected: {
    backgroundColor: Colors.primary.accent,
    borderColor: Colors.primary.accent,
  },
  interestChipText: {
    fontSize: FontSizes.sm,
    color: Colors.text.secondary,
  },
  interestChipTextSelected: {
    color: Colors.text.inverse,
    fontWeight: FontWeights.medium,
  },
  dropdown: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.background.secondary,
    borderWidth: 1,
    borderColor: Colors.border.primary,
  },
  dropdownText: {
    fontSize: FontSizes.md,
    color: Colors.text.primary,
  },
  dropdownMenu: {
    marginTop: Spacing.sm,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.background.card,
    borderWidth: 1,
    borderColor: Colors.border.primary,
    overflow: "hidden",
  },
  dropdownItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.secondary,
  },
  dropdownItemSelected: {
    backgroundColor: Colors.background.secondary,
  },
  dropdownItemText: {
    fontSize: FontSizes.md,
    color: Colors.text.primary,
  },
  dropdownItemTextSelected: {
    color: Colors.primary.accent,
    fontWeight: FontWeights.medium,
  },
  roleToggle: {
    flexDirection: "row",
    backgroundColor: Colors.background.secondary,
    borderRadius: BorderRadius.full,
    padding: 4,
  },
  roleButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    alignItems: "center",
    borderRadius: BorderRadius.full,
  },
  roleButtonActive: {
    backgroundColor: Colors.primary.accent,
  },
  roleButtonText: {
    fontSize: FontSizes.md,
    fontWeight: FontWeights.medium,
    color: Colors.text.secondary,
  },
  roleButtonTextActive: {
    color: Colors.text.inverse,
  },
  footer: {
    padding: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.border.secondary,
  },
});

export default ProfileSetupScreen;
