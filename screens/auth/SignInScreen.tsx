/**
 * SignIn Screen - Netvent
 * Login with email/password and social auth options
 */

import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
import {
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button, Input } from "../../components/ui";
import {
    BorderRadius,
    Colors,
    FontSizes,
    FontWeights,
    Spacing,
} from "../../constants/theme";
import { useAuthStore } from "../../stores/authStore";

type AuthMode = "login" | "signup";

export const SignInScreen: React.FC = () => {
  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{ email?: string; password?: string }>(
    {},
  );

  const { signIn, loading, error, clearError } = useAuthStore();

  /**
   * Validate form inputs
   */
  const validateForm = (): boolean => {
    const newErrors: { email?: string; password?: string } = {};

    if (!email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = "Please enter a valid email";
    }

    if (!password) {
      newErrors.password = "Password is required";
    } else if (password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Handle sign in
   */
  const handleSignIn = async () => {
    clearError();

    if (!validateForm()) return;

    const result = await signIn(email.trim().toLowerCase(), password);

    if (!result.error) {
      router.replace("/(tabs)");
    }
  };

  /**
   * Navigate to sign up
   */
  const navigateToSignUp = () => {
    router.push("/(auth)/sign-up");
  };

  /**
   * Switch auth mode
   */
  const switchMode = (newMode: AuthMode) => {
    if (newMode === "signup") {
      navigateToSignUp();
    }
    setMode(newMode);
  };

  /**
   * Handle forgot password
   */
  const handleForgotPassword = () => {
    // TODO: Implement forgot password flow
    console.log("Forgot password pressed");
  };

  /**
   * Handle social auth
   */
  const handleSocialAuth = (provider: string) => {
    // TODO: Implement social auth
    console.log(`${provider} auth pressed`);
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header Title */}
          <View style={styles.header}>
            <Text style={styles.title}>Login to Netvent</Text>
          </View>

          {/* Auth Mode Toggle */}
          <View style={styles.modeToggle}>
            <TouchableOpacity
              style={[
                styles.modeButton,
                mode === "login" && styles.modeButtonActive,
              ]}
              onPress={() => switchMode("login")}
            >
              <Text
                style={[
                  styles.modeText,
                  mode === "login" && styles.modeTextActive,
                ]}
              >
                Login
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.modeButton,
                mode === "signup" && styles.modeButtonActive,
              ]}
              onPress={() => switchMode("signup")}
            >
              <Text
                style={[
                  styles.modeText,
                  mode === "signup" && styles.modeTextActive,
                ]}
              >
                Sign Up
              </Text>
            </TouchableOpacity>
          </View>

          {/* Error Banner */}
          {error && (
            <View style={styles.errorBanner}>
              <Ionicons
                name="alert-circle"
                size={20}
                color={Colors.status.error}
              />
              <Text style={styles.errorText}>
                {error === "Invalid API key"
                  ? "Unable to connect to server. Please check your internet connection."
                  : error.includes("Email not confirmed")
                    ? "Please confirm your email before signing in."
                    : error}
              </Text>
            </View>
          )}

          {/* Credentials Section */}
          <View style={styles.form}>
            <Input
              label="Email Address"
              placeholder="Enter your email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              leftIcon="mail-outline"
              error={errors.email}
            />

            <Input
              label="Password"
              placeholder="Enter your password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              leftIcon="lock-closed-outline"
              error={errors.password}
            />

            {/* Forgot Password Link */}
            <TouchableOpacity
              style={styles.forgotPassword}
              onPress={handleForgotPassword}
            >
              <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
            </TouchableOpacity>

            {/* Primary Action Button */}
            <Button
              title="Login Securely"
              onPress={handleSignIn}
              loading={loading}
              size="large"
              fullWidth
              style={styles.primaryButton}
            />
          </View>

          {/* Social Auth Divider */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>Or continue with</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Social Auth Buttons */}
          <View style={styles.socialButtons}>
            <TouchableOpacity
              style={styles.socialButton}
              onPress={() => handleSocialAuth("google")}
            >
              <Ionicons
                name="logo-google"
                size={20}
                color={Colors.text.primary}
              />
              <Text style={styles.socialButtonText}>Sign in</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.socialButton}
              onPress={() => handleSocialAuth("apple")}
            >
              <Ionicons
                name="logo-apple"
                size={20}
                color={Colors.text.primary}
              />
              <Text style={styles.socialButtonText}>Sign in</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.socialButton}
              onPress={() => handleSocialAuth("linkedin")}
            >
              <Ionicons
                name="logo-linkedin"
                size={20}
                color={Colors.text.primary}
              />
              <Text style={styles.socialButtonText}>Sign in</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.socialButton}
              onPress={() => handleSocialAuth("phone")}
            >
              <Ionicons
                name="call-outline"
                size={20}
                color={Colors.text.primary}
              />
              <Text style={styles.socialButtonText}>Phone</Text>
            </TouchableOpacity>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Don't have an account? </Text>
            <TouchableOpacity onPress={navigateToSignUp}>
              <Text style={styles.signUpLink}>Sign Up</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.primary,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: Spacing.lg,
  },
  header: {
    alignItems: "center",
    marginTop: Spacing.xl,
    marginBottom: Spacing.lg,
  },
  title: {
    fontSize: FontSizes.xxl,
    fontWeight: FontWeights.bold,
    color: Colors.text.primary,
  },
  modeToggle: {
    flexDirection: "row",
    backgroundColor: Colors.background.secondary,
    borderRadius: BorderRadius.full,
    padding: 4,
    marginBottom: Spacing.xl,
  },
  modeButton: {
    flex: 1,
    paddingVertical: Spacing.sm,
    alignItems: "center",
    borderRadius: BorderRadius.full,
  },
  modeButtonActive: {
    backgroundColor: Colors.primary.accent,
  },
  modeText: {
    fontSize: FontSizes.md,
    fontWeight: FontWeights.medium,
    color: Colors.text.secondary,
  },
  modeTextActive: {
    color: Colors.text.inverse,
  },
  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(239, 68, 68, 0.1)",
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  errorText: {
    flex: 1,
    fontSize: FontSizes.sm,
    color: Colors.status.error,
  },
  form: {
    marginBottom: Spacing.lg,
  },
  forgotPassword: {
    alignSelf: "flex-end",
    marginBottom: Spacing.md,
    marginTop: -Spacing.xs,
  },
  forgotPasswordText: {
    fontSize: FontSizes.sm,
    color: Colors.status.info,
  },
  primaryButton: {
    marginTop: Spacing.sm,
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: Spacing.lg,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.border.primary,
  },
  dividerText: {
    paddingHorizontal: Spacing.md,
    fontSize: FontSizes.sm,
    color: Colors.text.tertiary,
  },
  socialButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  socialButton: {
    flex: 1,
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border.primary,
    backgroundColor: Colors.background.card,
    gap: 4,
  },
  socialButtonText: {
    fontSize: FontSizes.xs,
    color: Colors.text.secondary,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: "auto",
    paddingBottom: Spacing.lg,
  },
  footerText: {
    fontSize: FontSizes.md,
    color: Colors.text.secondary,
  },
  signUpLink: {
    fontSize: FontSizes.md,
    fontWeight: FontWeights.semibold,
    color: Colors.primary.accent,
  },
});

export default SignInScreen;
