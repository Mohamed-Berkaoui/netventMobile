/**
 * Tab Layout
 * Bottom tab navigation with 6 tabs as per design spec:
 * Home, Discover, Connections, Notifications, Messages, Settings
 */

import { BlurView } from "expo-blur";
import { Tabs } from "expo-router";
import React from "react";
import { Platform, StyleSheet, View, Text } from "react-native";

import { HapticTab } from "@/components/haptic-tab";
import { CenterTab } from "@/components/center-tab";
import { Colors, Spacing } from "@/constants/theme";
import { useEventsStore } from "@/stores/eventsStore";

/**
 * Custom tab bar background with blur effect
 */
function TabBarBackground() {
  return (
    <BlurView intensity={80} tint="light" style={StyleSheet.absoluteFill} />
  );
}

export default function TabLayout() {
  const { activeCheckIn } = useEventsStore();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors.primary.accent,
        tabBarInactiveTintColor: Colors.text.tertiary,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarStyle: {
          position: "absolute",
          backgroundColor: "rgba(255, 255, 255, 0.95)",
          borderTopColor: Colors.border.primary,
          borderTopWidth: 1,
          height: Platform.OS === "ios" ? 85 : 70,
          paddingBottom: Platform.OS === "ios" ? 30 : 10,
          paddingTop: Spacing.sm,
        },
        tabBarBackground: TabBarBackground,
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: "500",
        },
      }}
    >
      {/* Tab 1: Home (Connections) */}
      <Tabs.Screen
        name="social"
        options={{
          title: "Home",
          tabBarIcon: ({ color, focused }) => (
            <Text style={{ fontSize: 24, opacity: focused ? 1 : 0.6 }}>🏠</Text>
          ),
        }}
      />

      {/* Tab 2: My Agenda */}
      <Tabs.Screen
        name="index"
        options={{
          title: "My Agenda",
          tabBarIcon: ({ color, focused }) => (
            <Text style={{ fontSize: 24, opacity: focused ? 1 : 0.6 }}>📅</Text>
          ),
        }}
      />

      {/* Tab 3: Discover (Events Discovery) - highlighted center tab */}
      <Tabs.Screen
        name="events"
        options={{
          title: "Discover",
          tabBarButton: (props) => <CenterTab {...props} />,
          tabBarIcon: ({ color, focused }) => (
            <Text style={{ fontSize: 28 }}>🧭</Text>
          ),
          tabBarLabel: ({ focused, color }) => (
            <Text style={{ color: Colors.text.inverse, fontSize: 10, fontWeight: '500' }}>Discover</Text>
          ),
        }}
      />

      {/* Tab 4: Notifications */}
      <Tabs.Screen
        name="badge"
        options={{
          title: "Notifications",
          tabBarIcon: ({ color, focused }) => (
            <View style={styles.notificationIconContainer}>
              <Text style={{ fontSize: 24, opacity: focused ? 1 : 0.6 }}>🔔</Text>
              {/* Notification badge dot */}
              <View style={styles.notificationDot} />
            </View>
          ),
        }}
      />

      {/* Tab 6: Settings */}
      <Tabs.Screen
        name="profile"
        options={{
          title: "Settings",
          tabBarIcon: ({ color, focused }) => (
            <Text style={{ fontSize: 24, opacity: focused ? 1 : 0.6 }}>⚙️</Text>
          ),
        }}
      />

      {/* Explore - Hidden from tab bar (removed feature) */}
      <Tabs.Screen
        name="explore"
        options={{
          href: null, // Hide from tab bar
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  notificationIconContainer: {
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
  },
  notificationDot: {
    position: "absolute",
    top: -2,
    right: -4,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#EF4444",
    borderWidth: 1.5,
    borderColor: Colors.background.primary,
  },
});
