/**
 * Test Connection Screen
 * Debug page to verify Supabase connection
 */

import { Colors, FontSizes, FontWeights, Spacing } from "@/constants/theme";
import { supabase } from "@/services/supabase";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function TestConnectionScreen() {
  const [status, setStatus] = useState<"testing" | "success" | "error">(
    "testing",
  );
  const [message, setMessage] = useState("Testing connection...");
  const [details, setDetails] = useState<any>(null);

  useEffect(() => {
    testConnection();
  }, []);

  const testConnection = async () => {
    try {
      setStatus("testing");
      setMessage("Testing Supabase connection...");

      // Test 1: Check if client is initialized
      if (!supabase) {
        throw new Error("Supabase client not initialized");
      }

      // Test 2: Try to get session
      const { data: sessionData, error: sessionError } =
        await supabase.auth.getSession();

      if (sessionError) {
        throw new Error(`Session error: ${sessionError.message}`);
      }

      // Test 3: Try a simple query
      const { data, error } = await supabase
        .from("users")
        .select("count")
        .limit(1);

      if (error) {
        throw new Error(`Database query error: ${error.message}`);
      }

      setStatus("success");
      setMessage("✅ Connection successful!");
      setDetails({
        hasSession: !!sessionData.session,
        canQueryDB: true,
      });
    } catch (error: any) {
      setStatus("error");
      setMessage(`❌ Connection failed: ${error.message}`);
      setDetails({
        error: error.toString(),
        stack: error.stack,
      });
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Connection Test</Text>

        <View
          style={[
            styles.statusBox,
            status === "success" && styles.successBox,
            status === "error" && styles.errorBox,
          ]}
        >
          <Text style={styles.message}>{message}</Text>
        </View>

        {details && (
          <View style={styles.detailsBox}>
            <Text style={styles.detailsText}>
              {JSON.stringify(details, null, 2)}
            </Text>
          </View>
        )}

        <TouchableOpacity style={styles.retryButton} onPress={testConnection}>
          <Text style={styles.buttonText}>Retry Test</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.buttonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.primary,
  },
  content: {
    flex: 1,
    padding: Spacing.xl,
    gap: Spacing.lg,
  },
  title: {
    fontSize: FontSizes.xxl,
    fontWeight: FontWeights.bold,
    color: Colors.text.primary,
    textAlign: "center",
    marginBottom: Spacing.lg,
  },
  statusBox: {
    padding: Spacing.lg,
    borderRadius: 8,
    backgroundColor: Colors.background.card,
    borderWidth: 2,
    borderColor: Colors.border.primary,
  },
  successBox: {
    borderColor: Colors.status.success,
    backgroundColor: "#4CAF5020",
  },
  errorBox: {
    borderColor: Colors.status.error,
    backgroundColor: "#FF595920",
  },
  message: {
    fontSize: FontSizes.lg,
    color: Colors.text.primary,
    textAlign: "center",
  },
  detailsBox: {
    padding: Spacing.md,
    backgroundColor: Colors.background.card,
    borderRadius: 8,
    maxHeight: 300,
  },
  detailsText: {
    fontSize: FontSizes.sm,
    color: Colors.text.secondary,
    fontFamily: "monospace",
  },
  retryButton: {
    padding: Spacing.md,
    backgroundColor: Colors.primary.accent,
    borderRadius: 8,
    alignItems: "center",
  },
  backButton: {
    padding: Spacing.md,
    backgroundColor: Colors.background.card,
    borderRadius: 8,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.border.primary,
  },
  buttonText: {
    fontSize: FontSizes.md,
    fontWeight: FontWeights.semibold,
    color: Colors.text.primary,
  },
});
