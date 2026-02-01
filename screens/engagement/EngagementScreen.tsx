/**
 * Engagement Screen (Screen 2: Interactive Engagement - The Audience Tool)
 * Keeps users active during presentations
 *
 * Features:
 * - Live Polls with real-time percentages
 * - Q&A Board with upvoting and replies
 * - Feedback Surveys with progress tracking
 *
 * Note: This feature requires backend tables (polls, questions, surveys)
 * that are not yet implemented. Shows empty states/coming soon.
 */

import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
    Dimensions,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Card, EmptyState, LoadingSpinner } from "../../components/ui";
import {
    BorderRadius,
    Colors,
    FontSizes,
    FontWeights,
    Spacing,
} from "../../constants/theme";
import { useAuthStore } from "../../stores/authStore";
import { useEventsStore } from "../../stores/eventsStore";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

type TabType = "polls" | "qa" | "surveys";

// Types for engagement features (to be implemented in backend)
interface Poll {
  id: string;
  event_id: string;
  question: string;
  options: PollOption[];
  total_votes: number;
  ends_at: string;
  created_at: string;
}

interface PollOption {
  id: string;
  text: string;
  votes: number;
  selected?: boolean;
}

interface Question {
  id: string;
  event_id: string;
  user_id: string;
  content: string;
  likes_count: number;
  replies_count: number;
  created_at: string;
  user?: {
    name: string;
    avatar_url?: string;
  };
  is_liked?: boolean;
}

interface Survey {
  id: string;
  event_id: string;
  title: string;
  description: string;
  questions_count: number;
  progress: number;
  estimated_time: string;
}

export const EngagementScreen: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>("polls");
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [newQuestion, setNewQuestion] = useState("");

  // Data states - currently empty as backend not implemented
  const [polls, setPolls] = useState<Poll[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [surveys, setSurveys] = useState<Survey[]>([]);

  const { user } = useAuthStore();
  const { registeredEvents } = useEventsStore();

  // Simulate fetching data from backend
  const fetchEngagementData = useCallback(async () => {
    if (!user || registeredEvents.length === 0) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const eventIds = registeredEvents.map((e) => e.id);

      // These tables don't exist yet - in production, uncomment when backend is ready
      /*
      // Fetch polls
      const { data: pollsData } = await supabase
        .from("polls")
        .select("*")
        .in("event_id", eventIds)
        .order("created_at", { ascending: false });
      
      if (pollsData) setPolls(pollsData);

      // Fetch questions
      const { data: questionsData } = await supabase
        .from("questions")
        .select("*, user:users(name, avatar_url)")
        .in("event_id", eventIds)
        .order("likes_count", { ascending: false });
      
      if (questionsData) setQuestions(questionsData);

      // Fetch surveys
      const { data: surveysData } = await supabase
        .from("surveys")
        .select("*")
        .in("event_id", eventIds);
      
      if (surveysData) setSurveys(surveysData);
      */

      // For now, data remains empty
      setPolls([]);
      setQuestions([]);
      setSurveys([]);
    } catch (error) {
      console.error("Error fetching engagement data:", error);
    } finally {
      setLoading(false);
    }
  }, [user, registeredEvents]);

  useEffect(() => {
    fetchEngagementData();
  }, [fetchEngagementData]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchEngagementData();
    setRefreshing(false);
  }, [fetchEngagementData]);

  const handleVote = async (pollId: string, optionId: string) => {
    // To be implemented when backend is ready
    console.log("Vote:", pollId, optionId);
  };

  const handleLikeQuestion = async (questionId: string) => {
    // To be implemented when backend is ready
    console.log("Like question:", questionId);
  };

  const handleSubmitQuestion = async () => {
    if (!newQuestion.trim() || !user || registeredEvents.length === 0) return;

    // To be implemented when backend is ready
    /*
    const { error } = await supabase.from("questions").insert({
      event_id: registeredEvents[0].id,
      user_id: user.id,
      content: newQuestion.trim(),
    });

    if (!error) {
      setNewQuestion("");
      fetchEngagementData();
    }
    */

    setNewQuestion("");
  };

  const renderTabBar = () => (
    <View style={styles.tabBar}>
      <TouchableOpacity
        style={[styles.tab, activeTab === "polls" && styles.tabActive]}
        onPress={() => setActiveTab("polls")}
      >
        <Ionicons
          name="bar-chart"
          size={20}
          color={
            activeTab === "polls" ? Colors.primary.accent : Colors.text.tertiary
          }
        />
        <Text
          style={[
            styles.tabText,
            activeTab === "polls" && styles.tabTextActive,
          ]}
        >
          Polls
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.tab, activeTab === "qa" && styles.tabActive]}
        onPress={() => setActiveTab("qa")}
      >
        <Ionicons
          name="chatbubbles"
          size={20}
          color={
            activeTab === "qa" ? Colors.primary.accent : Colors.text.tertiary
          }
        />
        <Text
          style={[styles.tabText, activeTab === "qa" && styles.tabTextActive]}
        >
          Q&A
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.tab, activeTab === "surveys" && styles.tabActive]}
        onPress={() => setActiveTab("surveys")}
      >
        <Ionicons
          name="clipboard"
          size={20}
          color={
            activeTab === "surveys"
              ? Colors.primary.accent
              : Colors.text.tertiary
          }
        />
        <Text
          style={[
            styles.tabText,
            activeTab === "surveys" && styles.tabTextActive,
          ]}
        >
          Surveys
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderPollsContent = () => {
    if (polls.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <EmptyState
            icon="bar-chart-outline"
            title="No Active Polls"
            description="Live polls from speakers will appear here during sessions. Stay tuned!"
          />
          <View style={styles.comingSoonBadge}>
            <Ionicons
              name="time-outline"
              size={16}
              color={Colors.primary.accent}
            />
            <Text style={styles.comingSoonText}>Coming Soon</Text>
          </View>
        </View>
      );
    }

    return polls.map((poll) => (
      <Card key={poll.id} variant="elevated" style={styles.pollCard}>
        <View style={styles.pollHeader}>
          <View style={styles.pollLiveBadge}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>Live</Text>
          </View>
          <Text style={styles.pollEnds}>
            Ends in {new Date(poll.ends_at).toLocaleTimeString()}
          </Text>
        </View>

        <Text style={styles.pollQuestion}>{poll.question}</Text>

        <View style={styles.pollOptions}>
          {poll.options.map((option) => {
            const percentage =
              poll.total_votes > 0
                ? Math.round((option.votes / poll.total_votes) * 100)
                : 0;

            return (
              <TouchableOpacity
                key={option.id}
                style={[
                  styles.pollOption,
                  option.selected && styles.pollOptionSelected,
                ]}
                onPress={() => handleVote(poll.id, option.id)}
              >
                <View
                  style={[styles.pollOptionFill, { width: `${percentage}%` }]}
                />
                <Text style={styles.pollOptionText}>{option.text}</Text>
                <Text style={styles.pollOptionPercent}>{percentage}%</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={styles.totalVotes}>{poll.total_votes} total votes</Text>
      </Card>
    ));
  };

  const renderQAContent = () => {
    return (
      <>
        {/* Question Input */}
        <Card variant="default" style={styles.questionInputCard}>
          <TextInput
            style={styles.questionInput}
            placeholder="Ask a question..."
            placeholderTextColor={Colors.text.tertiary}
            value={newQuestion}
            onChangeText={setNewQuestion}
            multiline
            maxLength={280}
          />
          <TouchableOpacity
            style={[
              styles.submitButton,
              !newQuestion.trim() && styles.submitButtonDisabled,
            ]}
            onPress={handleSubmitQuestion}
            disabled={!newQuestion.trim()}
          >
            <Ionicons
              name="send"
              size={20}
              color={
                newQuestion.trim() ? Colors.text.inverse : Colors.text.tertiary
              }
            />
          </TouchableOpacity>
        </Card>

        {questions.length === 0 ? (
          <View style={styles.emptyContainer}>
            <EmptyState
              icon="chatbubbles-outline"
              title="No Questions Yet"
              description="Be the first to ask a question! Questions from attendees will be displayed here."
            />
            <View style={styles.comingSoonBadge}>
              <Ionicons
                name="time-outline"
                size={16}
                color={Colors.primary.accent}
              />
              <Text style={styles.comingSoonText}>Coming Soon</Text>
            </View>
          </View>
        ) : (
          questions.map((question) => (
            <Card
              key={question.id}
              variant="default"
              style={styles.questionCard}
            >
              <View style={styles.questionHeader}>
                <View style={styles.questionAuthor}>
                  <View style={styles.authorAvatar}>
                    <Text style={styles.authorInitial}>
                      {question.user?.name?.charAt(0) || "?"}
                    </Text>
                  </View>
                  <View>
                    <Text style={styles.authorName}>
                      {question.user?.name || "Anonymous"}
                    </Text>
                    <Text style={styles.questionTime}>
                      {new Date(question.created_at).toLocaleTimeString()}
                    </Text>
                  </View>
                </View>
              </View>

              <Text style={styles.questionText}>{question.content}</Text>

              <View style={styles.questionActions}>
                <TouchableOpacity
                  style={[
                    styles.questionAction,
                    question.is_liked && styles.questionActionActive,
                  ]}
                  onPress={() => handleLikeQuestion(question.id)}
                >
                  <Ionicons
                    name={question.is_liked ? "heart" : "heart-outline"}
                    size={18}
                    color={
                      question.is_liked
                        ? Colors.social.like
                        : Colors.text.tertiary
                    }
                  />
                  <Text
                    style={[
                      styles.questionActionText,
                      question.is_liked && styles.questionActionTextActive,
                    ]}
                  >
                    {question.likes_count}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.questionAction}>
                  <Ionicons
                    name="chatbubble-outline"
                    size={18}
                    color={Colors.text.tertiary}
                  />
                  <Text style={styles.questionActionText}>
                    {question.replies_count}
                  </Text>
                </TouchableOpacity>
              </View>
            </Card>
          ))
        )}
      </>
    );
  };

  const renderSurveysContent = () => {
    if (surveys.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <EmptyState
            icon="clipboard-outline"
            title="No Surveys Available"
            description="Event feedback surveys will appear here. Help organizers improve future events!"
          />
          <View style={styles.comingSoonBadge}>
            <Ionicons
              name="time-outline"
              size={16}
              color={Colors.primary.accent}
            />
            <Text style={styles.comingSoonText}>Coming Soon</Text>
          </View>
        </View>
      );
    }

    return surveys.map((survey) => (
      <Card key={survey.id} variant="default" style={styles.surveyCard}>
        <View style={styles.surveyHeader}>
          <View style={styles.surveyIcon}>
            <Ionicons
              name="clipboard"
              size={24}
              color={Colors.primary.accent}
            />
          </View>
          <View style={styles.surveyInfo}>
            <Text style={styles.surveyTitle}>{survey.title}</Text>
            <Text style={styles.surveyDescription}>{survey.description}</Text>
          </View>
        </View>

        <View style={styles.surveyMeta}>
          <Text style={styles.surveyMetaText}>
            {survey.questions_count} questions • {survey.estimated_time}
          </Text>
        </View>

        {survey.progress > 0 && (
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View
                style={[styles.progressFill, { width: `${survey.progress}%` }]}
              />
            </View>
            <Text style={styles.progressText}>{survey.progress}% complete</Text>
          </View>
        )}

        <TouchableOpacity style={styles.surveyButton}>
          <Text style={styles.surveyButtonText}>
            {survey.progress > 0 ? "Continue Survey" : "Start Survey"}
          </Text>
          <Ionicons
            name="chevron-forward"
            size={20}
            color={Colors.text.inverse}
          />
        </TouchableOpacity>
      </Card>
    ));
  };

  const renderContent = () => {
    if (loading) {
      return <LoadingSpinner message="Loading engagement features..." />;
    }

    switch (activeTab) {
      case "polls":
        return renderPollsContent();
      case "qa":
        return renderQAContent();
      case "surveys":
        return renderSurveysContent();
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Engage</Text>
        <TouchableOpacity style={styles.helpButton}>
          <Ionicons
            name="help-circle-outline"
            size={24}
            color={Colors.text.primary}
          />
        </TouchableOpacity>
      </View>

      {/* Tab Bar */}
      {renderTabBar()}

      {/* Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={Colors.primary.accent}
          />
        }
      >
        {registeredEvents.length === 0 ? (
          <EmptyState
            icon="calendar-outline"
            title="No Events"
            description="Register for an event to participate in live engagement features"
            actionLabel="Browse Events"
            onAction={() => router.push("/(tabs)/events")}
          />
        ) : (
          renderContent()
        )}

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
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.secondary,
  },
  headerTitle: {
    fontSize: FontSizes.xl,
    fontWeight: FontWeights.bold,
    color: Colors.text.primary,
  },
  helpButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },

  // Tab Bar
  tabBar: {
    flexDirection: "row",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.secondary,
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  tabActive: {
    backgroundColor: Colors.background.secondary,
  },
  tabText: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.medium,
    color: Colors.text.tertiary,
    marginLeft: 6,
  },
  tabTextActive: {
    color: Colors.primary.accent,
  },

  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.md,
  },

  // Empty State
  emptyContainer: {
    alignItems: "center",
  },
  comingSoonBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.background.secondary,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    marginTop: Spacing.md,
  },
  comingSoonText: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.semibold,
    color: Colors.primary.accent,
    marginLeft: 6,
  },

  // Poll Card
  pollCard: {
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  pollHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  pollLiveBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.status.error,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.text.inverse,
    marginRight: 6,
  },
  liveText: {
    fontSize: FontSizes.xs,
    fontWeight: FontWeights.semibold,
    color: Colors.text.inverse,
  },
  pollEnds: {
    fontSize: FontSizes.xs,
    color: Colors.text.tertiary,
  },
  pollQuestion: {
    fontSize: FontSizes.md,
    fontWeight: FontWeights.semibold,
    color: Colors.text.primary,
    marginBottom: Spacing.md,
  },
  pollOptions: {
    marginBottom: Spacing.sm,
  },
  pollOption: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.sm,
    backgroundColor: Colors.background.secondary,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
    overflow: "hidden",
    position: "relative",
  },
  pollOptionSelected: {
    borderWidth: 2,
    borderColor: Colors.primary.accent,
  },
  pollOptionFill: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: Colors.primary.accent,
    opacity: 0.2,
    borderRadius: BorderRadius.md,
  },
  pollOptionText: {
    flex: 1,
    fontSize: FontSizes.sm,
    color: Colors.text.primary,
    zIndex: 1,
  },
  pollOptionPercent: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.semibold,
    color: Colors.text.secondary,
    zIndex: 1,
  },
  totalVotes: {
    fontSize: FontSizes.xs,
    color: Colors.text.tertiary,
    textAlign: "center",
  },

  // Question Input
  questionInputCard: {
    flexDirection: "row",
    alignItems: "flex-end",
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  questionInput: {
    flex: 1,
    fontSize: FontSizes.md,
    color: Colors.text.primary,
    maxHeight: 100,
  },
  submitButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary.accent,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: Spacing.sm,
  },
  submitButtonDisabled: {
    backgroundColor: Colors.background.secondary,
  },

  // Question Card
  questionCard: {
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  questionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  questionAuthor: {
    flexDirection: "row",
    alignItems: "center",
  },
  authorAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primary.accent,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.sm,
  },
  authorInitial: {
    fontSize: FontSizes.md,
    fontWeight: FontWeights.bold,
    color: Colors.text.inverse,
  },
  authorName: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.medium,
    color: Colors.text.primary,
  },
  questionTime: {
    fontSize: FontSizes.xs,
    color: Colors.text.tertiary,
  },
  questionText: {
    fontSize: FontSizes.md,
    color: Colors.text.primary,
    lineHeight: 22,
    marginBottom: Spacing.sm,
  },
  questionActions: {
    flexDirection: "row",
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border.secondary,
  },
  questionAction: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: Spacing.lg,
  },
  questionActionActive: {},
  questionActionText: {
    fontSize: FontSizes.sm,
    color: Colors.text.tertiary,
    marginLeft: 6,
  },
  questionActionTextActive: {
    color: Colors.social.like,
  },

  // Survey Card
  surveyCard: {
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  surveyHeader: {
    flexDirection: "row",
    marginBottom: Spacing.md,
  },
  surveyIcon: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.background.secondary,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
  },
  surveyInfo: {
    flex: 1,
  },
  surveyTitle: {
    fontSize: FontSizes.md,
    fontWeight: FontWeights.semibold,
    color: Colors.text.primary,
  },
  surveyDescription: {
    fontSize: FontSizes.sm,
    color: Colors.text.secondary,
    marginTop: 2,
  },
  surveyMeta: {
    marginBottom: Spacing.md,
  },
  surveyMetaText: {
    fontSize: FontSizes.xs,
    color: Colors.text.tertiary,
  },
  progressContainer: {
    marginBottom: Spacing.md,
  },
  progressBar: {
    height: 4,
    backgroundColor: Colors.background.secondary,
    borderRadius: 2,
    marginBottom: 4,
  },
  progressFill: {
    height: "100%",
    backgroundColor: Colors.primary.accent,
    borderRadius: 2,
  },
  progressText: {
    fontSize: FontSizes.xs,
    color: Colors.text.tertiary,
  },
  surveyButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.primary.accent,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  surveyButtonText: {
    fontSize: FontSizes.md,
    fontWeight: FontWeights.semibold,
    color: Colors.text.inverse,
    marginRight: 6,
  },

  bottomSpacing: {
    height: 100,
  },
});

export default EngagementScreen;
