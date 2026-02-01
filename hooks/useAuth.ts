/**
 * useAuth Hook
 * Custom hook for authentication with convenience methods
 */

import { useCallback, useEffect } from "react";
import { useAuthStore } from "../stores/authStore";

export const useAuth = () => {
  const {
    session,
    user,
    supabaseUser,
    loading,
    initialized,
    error,
    initialize,
    signUp,
    signIn,
    signOut,
    updateUserProfile,
    clearError,
  } = useAuthStore();

  // Initialize auth on mount
  useEffect(() => {
    if (!initialized) {
      initialize();
    }
  }, [initialized, initialize]);

  /**
   * Check if user is authenticated
   */
  const isAuthenticated = !!session && !!user;

  /**
   * Check if user has completed their profile
   */
  const hasCompletedProfile = useCallback(() => {
    if (!user) return false;
    return !!(user.name && user.name.trim());
  }, [user]);

  /**
   * Check if user is an organizer
   */
  const isOrganizer = user?.role === "organizer";

  /**
   * Check if user is an attendee
   */
  const isAttendee = user?.role === "attendee";

  return {
    // State
    session,
    user,
    supabaseUser,
    loading,
    initialized,
    error,
    isAuthenticated,
    isOrganizer,
    isAttendee,

    // Actions
    signUp,
    signIn,
    signOut,
    updateUserProfile,
    hasCompletedProfile,
    clearError,
  };
};

export default useAuth;
