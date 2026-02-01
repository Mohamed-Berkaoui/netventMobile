/**
 * Authentication Store
 * Manages user authentication state using Zustand
 */

import { Session, User as SupabaseUser } from "@supabase/supabase-js";
import { create } from "zustand";
import { supabase } from "../services/supabase";
import { User } from "../types";

interface AuthState {
  // State
  session: Session | null;
  user: User | null;
  supabaseUser: SupabaseUser | null;
  loading: boolean;
  initialized: boolean;
  error: string | null;

  // Actions
  initialize: () => Promise<void>;
  signUp: (
    email: string,
    password: string,
  ) => Promise<{ error: string | null }>;
  signIn: (
    email: string,
    password: string,
  ) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  fetchUserProfile: (userId: string) => Promise<void>;
  updateUserProfile: (
    updates: Partial<User>,
  ) => Promise<{ error: string | null }>;
  clearError: () => void;
  setLoading: (loading: boolean) => void;
  setUser: (user: User | null) => void;
  setSession: (session: Session | null) => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  // Initial State
  session: null,
  user: null,
  supabaseUser: null,
  loading: true,
  initialized: false,
  error: null,

  /**
   * Initialize authentication state
   * Called on app startup to restore session
   */
  initialize: async () => {
    try {
      set({ loading: true });

      // Get current session from Supabase
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (error) throw error;

      if (session?.user) {
        // Fetch user profile from database
        await get().fetchUserProfile(session.user.id);
        set({
          session,
          supabaseUser: session.user,
          initialized: true,
          loading: false,
        });
      } else {
        set({
          session: null,
          user: null,
          supabaseUser: null,
          initialized: true,
          loading: false,
        });
      }

      // Listen for auth state changes
      supabase.auth.onAuthStateChange(async (event, session) => {
        console.log("Auth state changed:", event);

        if (event === "SIGNED_IN" && session?.user) {
          await get().fetchUserProfile(session.user.id);
          set({ session, supabaseUser: session.user });
        } else if (event === "SIGNED_OUT") {
          set({ session: null, user: null, supabaseUser: null });
        } else if (event === "TOKEN_REFRESHED" && session) {
          set({ session });
        }
      });
    } catch (error: any) {
      console.error("Auth initialization error:", error);
      set({
        error: error.message,
        loading: false,
        initialized: true,
      });
    }
  },

  /**
   * Sign up with email and password
   */
  signUp: async (email: string, password: string) => {
    try {
      set({ loading: true, error: null });

      console.log("Attempting sign up for:", email);
      console.log(
        "Supabase URL:",
        await supabase.auth
          .getSession()
          .then(() => "Connected")
          .catch(() => "Not connected"),
      );

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: undefined, // Disable email confirmation redirect for now
        },
      });

      if (error) {
        console.error("Supabase signUp error:", error);
        throw new Error(
          error.message ||
            "Failed to sign up. Please check your internet connection.",
        );
      }

      if (!data.user) {
        throw new Error("Sign up succeeded but no user data returned");
      }

      console.log("Sign up successful, fetching profile...");

      // Profile is automatically created by database trigger
      // Wait a moment for the trigger to complete
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Fetch the auto-created profile
      await get().fetchUserProfile(data.user.id);

      set({ loading: false });
      return { error: null };
    } catch (error: any) {
      console.error("Sign up error:", error);

      // Provide more helpful error messages
      let errorMessage = error.message || "An unknown error occurred";

      if (errorMessage.includes("fetch")) {
        errorMessage =
          "Cannot connect to server. Please check your internet connection and try again.";
      } else if (errorMessage.includes("User already registered")) {
        errorMessage =
          "This email is already registered. Please sign in instead.";
      }

      set({ error: errorMessage, loading: false });
      return { error: errorMessage };
    }
  },

  /**
   * Sign in with email and password
   */
  signIn: async (email: string, password: string) => {
    try {
      set({ loading: true, error: null });

      console.log("Attempting sign in for:", email);

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error("Sign in error:", error);
        throw error;
      }

      if (data.user) {
        console.log("Sign in successful, fetching profile...");
        await get().fetchUserProfile(data.user.id);
      }

      set({ loading: false });
      return { error: null };
    } catch (error: any) {
      console.error("Sign in error:", error);

      let errorMessage = error.message || "Failed to sign in";

      // Handle specific error types
      if (errorMessage.includes("Invalid login credentials")) {
        errorMessage = "Invalid email or password. Please try again.";
      } else if (
        errorMessage.includes("fetch") ||
        errorMessage.includes("network")
      ) {
        errorMessage =
          "Cannot connect to server. Please check your connection.";
      }

      set({ error: errorMessage, loading: false });
      return { error: errorMessage };
    }
  },

  /**
   * Sign out current user
   */
  signOut: async () => {
    try {
      set({ loading: true });

      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      set({
        session: null,
        user: null,
        supabaseUser: null,
        loading: false,
      });
    } catch (error: any) {
      console.error("Sign out error:", error);
      set({ error: error.message, loading: false });
    }
  },

  /**
   * Fetch user profile from database
   */
  fetchUserProfile: async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("id", userId)
        .single();

      if (error && error.code !== "PGRST116") {
        throw error;
      }

      if (data) {
        set({ user: data as User });
      }
    } catch (error: any) {
      console.error("Fetch profile error:", error);
    }
  },

  /**
   * Update user profile
   */
  updateUserProfile: async (updates: Partial<User>) => {
    try {
      const { user } = get();
      if (!user) throw new Error("No user logged in");

      set({ loading: true });

      const { data, error } = await supabase
        .from("users")
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id)
        .select()
        .single();

      if (error) throw error;

      set({ user: data as User, loading: false });
      return { error: null };
    } catch (error: any) {
      console.error("Update profile error:", error);
      set({ error: error.message, loading: false });
      return { error: error.message };
    }
  },

  /**
   * Clear error state
   */
  clearError: () => set({ error: null }),

  /**
   * Set loading state manually
   */
  setLoading: (loading: boolean) => set({ loading }),

  /**
   * Set user directly (for auth state change listener)
   */
  setUser: (user: User | null) => set({ user }),

  /**
   * Set session directly (for auth state change listener)
   */
  setSession: (session: Session | null) =>
    set({ session, supabaseUser: session?.user ?? null }),
}));
