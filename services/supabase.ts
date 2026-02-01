/**
 * Supabase Client Configuration
 * Initializes and exports the Supabase client for the Event Attendee App
 */

import { createClient } from "@supabase/supabase-js";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

// ============================================
// SUPABASE CONFIGURATION
// ============================================
const SUPABASE_URL = "https://vwkxqmgsrttogykhmasw.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ3a3hxbWdzcnR0b2d5a2htYXN3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg5ODMzOTcsImV4cCI6MjA4NDU1OTM5N30.dr1W-jPek81rb0ak6rwft8UjK-VS7NnlQYBeNWVdgwk";

/**
 * In-memory storage fallback for web environment
 */
class MemoryStorage {
  private store = new Map<string, string>();

  getItem(key: string): string | null {
    return this.store.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.store.set(key, value);
  }

  removeItem(key: string): void {
    this.store.delete(key);
  }
}

const memoryStorage = new MemoryStorage();

/**
 * Get the appropriate storage adapter for the platform
 */
const getStorageAdapter = () => {
  if (Platform.OS === "web") {
    // On web, try to use localStorage if available, otherwise use memory storage
    if (typeof localStorage !== "undefined") {
      return {
        getItem: (key: string): string | null => localStorage.getItem(key),
        setItem: (key: string, value: string): void => {
          localStorage.setItem(key, value);
        },
        removeItem: (key: string): void => {
          localStorage.removeItem(key);
        },
      };
    } else {
      // Fallback to memory storage if localStorage is not available
      return {
        getItem: (key: string): string | null => memoryStorage.getItem(key),
        setItem: (key: string, value: string): void => {
          memoryStorage.setItem(key, value);
        },
        removeItem: (key: string): void => {
          memoryStorage.removeItem(key);
        },
      };
    }
  }
  // On native, use SecureStore
  return {
    getItem: (key: string): Promise<string | null> =>
      SecureStore.getItemAsync(key),
    setItem: (key: string, value: string): Promise<void> =>
      SecureStore.setItemAsync(key, value),
    removeItem: (key: string): Promise<void> =>
      SecureStore.deleteItemAsync(key),
  };
};

/**
 * Custom storage adapter for Supabase Auth
 * Simple web-compatible storage
 */
const ExpoSecureStoreAdapter = {
  getItem: (key: string): string | null => {
    if (Platform.OS === "web") {
      return typeof window !== "undefined" && window.localStorage
        ? localStorage.getItem(key)
        : null;
    }
    // For native, we'd use SecureStore but make it sync-like for simplicity
    return null;
  },
  setItem: (key: string, value: string): void => {
    if (Platform.OS === "web") {
      if (typeof window !== "undefined" && window.localStorage) {
        localStorage.setItem(key, value);
      }
    }
    // For native platforms, we'd use SecureStore here
  },
  removeItem: (key: string): void => {
    if (Platform.OS === "web") {
      if (typeof window !== "undefined" && window.localStorage) {
        localStorage.removeItem(key);
      }
    }
    // For native platforms, we'd use SecureStore here
  },
};

/**
 * Supabase client instance
 * Using minimal configuration for maximum web compatibility
 */
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: false, // Disable session persistence to avoid storage issues
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
});

// Log initialization for debugging
console.log("Supabase client initialized:", {
  url: SUPABASE_URL,
  keyPreview: SUPABASE_ANON_KEY.substring(0, 20) + "...",
});

/**
 * Storage bucket names
 */
export const STORAGE_BUCKETS = {
  AVATARS: "avatars",
  EVENT_LOGOS: "event-logos",
  EVENT_BANNERS: "event-banners",
  POST_IMAGES: "post-images",
  VENUE_MAPS: "venue-maps",
} as const;

/**
 * Realtime channel names
 */
export const REALTIME_CHANNELS = {
  MESSAGES: "messages",
  POSTS: "posts",
  CHECKINS: "checkins",
} as const;

export { SUPABASE_ANON_KEY, SUPABASE_URL };
