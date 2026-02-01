/**
 * AI Matchmaking Store
 * Manages AI-generated match suggestions
 */

import { create } from "zustand";
import { supabase } from "../services/supabase";
import { AIMatch } from "../types";

interface AIMatchState {
  // State
  matches: AIMatch[];
  topMatches: AIMatch[];
  loading: boolean;
  error: string | null;

  // Actions
  fetchMatches: (userId: string, eventId?: string) => Promise<void>;
  getMatchDetails: (matchId: string) => AIMatch | null;
  clearError: () => void;
}

export const useAIMatchStore = create<AIMatchState>((set, get) => ({
  // Initial State
  matches: [],
  topMatches: [],
  loading: false,
  error: null,

  /**
   * Fetch AI matches for a user at an event
   * Matches are pre-computed and stored in ai_matches table
   */
  fetchMatches: async (userId: string, eventId?: string) => {
    try {
      set({ loading: true, error: null });

      let query = supabase
        .from("ai_matches")
        .select(
          `
          *,
          matched_user:users!ai_matches_matched_user_id_fkey(*)
        `,
        )
        .eq("user_id", userId)
        .order("score", { ascending: false });

      if (eventId) {
        query = query.eq("event_id", eventId);
      }

      const { data, error } = await query;

      if (error) throw error;

      const matches = (data || []) as AIMatch[];

      // Top matches are those with score >= 80
      const topMatches = matches.filter((m) => m.score >= 80);

      set({ matches, topMatches, loading: false });
    } catch (error: any) {
      console.error("Fetch AI matches error:", error);
      set({ error: error.message, loading: false });
    }
  },

  /**
   * Get match details by ID
   */
  getMatchDetails: (matchId: string) => {
    const { matches } = get();
    return matches.find((m) => m.id === matchId) || null;
  },

  /**
   * Clear error state
   */
  clearError: () => set({ error: null }),
}));
