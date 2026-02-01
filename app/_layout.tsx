/**
 * Root Layout
 * Main app entry point with navigation setup
 */

import { DefaultTheme, ThemeProvider } from "@react-navigation/native";
import {
    Stack,
    router,
    useRootNavigationState,
    useSegments,
} from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import "react-native-reanimated";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { Colors } from "@/constants/theme";
import { supabase } from "@/services/supabase";
import { useAuthStore } from "@/stores/authStore";

/**
 * Custom light theme matching our brand colors
 */
const CustomLightTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: Colors.primary.accent,
    background: Colors.background.primary,
    card: Colors.background.card,
    text: Colors.text.primary,
    border: Colors.border.primary,
    notification: Colors.status.error,
  },
};

export const unstable_settings = {
  initialRouteName: "(auth)",
};

/**
 * Auth state listener and navigation guard
 */
function useProtectedRoute(isAuthenticated: boolean, isLoading: boolean) {
  const segments = useSegments();
  const navigationState = useRootNavigationState();

  useEffect(() => {
    // Wait for navigation to be ready
    if (!navigationState?.key) return;

    // Still loading auth state
    if (isLoading) return;

    const inAuthGroup = segments[0] === "(auth)";
    const inTabsGroup = segments[0] === "(tabs)";

    if (!isAuthenticated && !inAuthGroup) {
      // Redirect to sign in
      router.replace("/(auth)/sign-in");
    } else if (isAuthenticated && inAuthGroup) {
      // Redirect to home
      router.replace("/(tabs)");
    }
  }, [isAuthenticated, segments, isLoading, navigationState?.key]);
}

export default function RootLayout() {
  const [isLoading, setIsLoading] = useState(true);
  const { user, setUser, setSession, initialize } = useAuthStore();

  /**
   * Initialize auth state
   */
  useEffect(() => {
    const initAuth = async () => {
      try {
        await initialize();
      } catch (error) {
        console.error("Error initializing auth:", error);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();

    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth state changed:", event);

      if (session?.user) {
        setSession(session);

        // Fetch user profile
        const { data: profile } = await supabase
          .from("users")
          .select("*")
          .eq("id", session.user.id)
          .single();

        if (profile) {
          setUser(profile);
        }
      } else {
        setSession(null);
        setUser(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Apply navigation guard
  useProtectedRoute(!!user, isLoading);

  // Show loading screen while checking auth
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary.accent} />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <ThemeProvider value={CustomLightTheme}>
        <Stack screenOptions={{ headerShown: false }}>
          {/* Auth Flow */}
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />

          {/* Main App with Tabs */}
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />

          {/* Stack Screens */}
          <Stack.Screen
            name="event/[id]"
            options={{
              headerShown: false,
              presentation: "card",
            }}
          />
          <Stack.Screen
            name="badge/[eventId]"
            options={{
              headerShown: false,
              presentation: "fullScreenModal",
            }}
          />
          <Stack.Screen
            name="chat/[id]"
            options={{
              headerShown: false,
              presentation: "card",
            }}
          />
          <Stack.Screen
            name="post/[id]"
            options={{
              headerShown: false,
              presentation: "card",
            }}
          />
          <Stack.Screen
            name="user/[id]"
            options={{
              headerShown: false,
              presentation: "card",
            }}
          />
          <Stack.Screen
            name="ai-matches"
            options={{
              headerShown: false,
              presentation: "card",
            }}
          />
          <Stack.Screen
            name="navigation/[eventId]"
            options={{
              headerShown: false,
              presentation: "card",
            }}
          />
          <Stack.Screen
            name="permissions"
            options={{
              headerShown: false,
              presentation: "modal",
            }}
          />
          <Stack.Screen
            name="edit-profile"
            options={{
              headerShown: false,
              presentation: "modal",
            }}
          />
          <Stack.Screen
            name="create-post"
            options={{
              headerShown: false,
              presentation: "modal",
            }}
          />

          {/* Debug/Test Routes */}
          <Stack.Screen
            name="test-connection"
            options={{
              headerShown: false,
              presentation: "modal",
            }}
          />

          {/* Legacy Modal */}
          <Stack.Screen
            name="modal"
            options={{ presentation: "modal", title: "Modal" }}
          />
        </Stack>
        <StatusBar style="dark" />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.background.primary,
  },
});
