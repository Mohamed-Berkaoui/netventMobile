/**
 * Events Store
 * Manages events, registrations, and check-ins state
 */

import { create } from "zustand";
import { supabase } from "../services/supabase";
import {
    CheckIn,
    CheckInType,
    Event,
    EventFilter,
    Registration,
} from "../types";

interface RegistrationWithEvent extends Registration {
  event?: Event;
}

interface EventsState {
  // State
  events: Event[];
  upcomingEvents: Event[];
  pastEvents: Event[];
  registeredEvents: Event[];
  currentEvent: Event | null;
  registrations: RegistrationWithEvent[];
  checkIns: CheckIn[];
  activeCheckIn: { event: Event; checkIn: CheckIn } | null;
  loading: boolean;
  error: string | null;

  // Actions
  fetchEvents: (filter?: EventFilter) => Promise<void>;
  fetchEventById: (eventId: string) => Promise<Event | null>;
  fetchRegisteredEvents: (userId: string) => Promise<void>;
  registerForEvent: (
    userId: string,
    eventId: string,
  ) => Promise<{ error: string | null }>;
  unregisterFromEvent: (
    userId: string,
    eventId: string,
  ) => Promise<{ error: string | null }>;
  checkIn: (
    userId: string,
    eventId: string,
    type: CheckInType,
    coords?: { latitude: number; longitude: number },
  ) => Promise<{ error: string | null }>;
  fetchCheckIns: (userId: string, eventId?: string) => Promise<void>;
  isRegistered: (userId: string, eventId: string) => boolean;
  getLatestCheckIn: (userId: string, eventId: string) => CheckIn | null;
  setCurrentEvent: (event: Event | null) => void;
  setActiveCheckIn: (data: { event: Event; checkIn: CheckIn } | null) => void;
  clearError: () => void;
}

export const useEventsStore = create<EventsState>((set, get) => ({
  // Initial State
  events: [],
  upcomingEvents: [],
  pastEvents: [],
  registeredEvents: [],
  currentEvent: null,
  registrations: [],
  checkIns: [],
  activeCheckIn: null,
  loading: false,
  error: null,

  /**
   * Fetch all events with optional filtering
   */
  fetchEvents: async (filter?: EventFilter) => {
    try {
      set({ loading: true, error: null });

      let query = supabase
        .from("events")
        .select("*")
        .order("start_date", { ascending: true });

      // Apply filters
      if (filter?.date_from) {
        query = query.gte("start_date", filter.date_from);
      }
      if (filter?.date_to) {
        query = query.lte("end_date", filter.date_to);
      }
      if (filter?.interests && filter.interests.length > 0) {
        query = query.overlaps("interests", filter.interests);
      }
      if (filter?.search) {
        query = query.or(
          `title.ilike.%${filter.search}%,description.ilike.%${filter.search}%`,
        );
      }

      const { data, error } = await query;

      if (error) throw error;

      const now = new Date().toISOString();
      const events = (data || []) as Event[];

      // Split into upcoming and past events
      const upcomingEvents = events.filter((e) => e.end_date >= now);
      const pastEvents = events.filter((e) => e.end_date < now);

      set({
        events,
        upcomingEvents,
        pastEvents,
        loading: false,
      });
    } catch (error: any) {
      console.error("Fetch events error:", error);
      set({ error: error.message, loading: false });
    }
  },

  /**
   * Fetch single event by ID
   */
  fetchEventById: async (eventId: string) => {
    try {
      set({ loading: true });

      const { data, error } = await supabase
        .from("events")
        .select("*")
        .eq("id", eventId)
        .single();

      if (error) throw error;

      set({ currentEvent: data as Event, loading: false });
      return data as Event;
    } catch (error: any) {
      console.error("Fetch event error:", error);
      set({ error: error.message, loading: false });
      return null;
    }
  },

  /**
   * Fetch events user is registered for
   */
  fetchRegisteredEvents: async (userId: string) => {
    try {
      set({ loading: true });

      // Fetch registrations with event details
      const { data: registrations, error: regError } = await supabase
        .from("registrations")
        .select("*, events(*)")
        .eq("user_id", userId)
        .eq("status", "registered");

      if (regError) throw regError;

      const regs = (registrations || []) as any[];
      const registeredEvents = regs
        .map((r) => r.events)
        .filter(Boolean) as Event[];

      set({
        registrations: regs.map((r) => ({ ...r, events: undefined })),
        registeredEvents,
        loading: false,
      });
    } catch (error: any) {
      console.error("Fetch registered events error:", error);
      set({ error: error.message, loading: false });
    }
  },

  /**
   * Register user for an event
   */
  registerForEvent: async (userId: string, eventId: string) => {
    try {
      set({ loading: true });

      // Check for existing registration
      const { data: existing } = await supabase
        .from("registrations")
        .select("id, status")
        .eq("user_id", userId)
        .eq("event_id", eventId)
        .maybeSingle();

      if (existing) {
        if (existing.status === "registered") {
          set({ loading: false });
          return { error: "Already registered for this event" };
        }

        // Reactivate cancelled registration
        const { error } = await supabase
          .from("registrations")
          .update({ status: "registered" })
          .eq("id", existing.id);

        if (error) throw error;
      } else {
        // Create new registration
        const { error } = await supabase.from("registrations").insert({
          user_id: userId,
          event_id: eventId,
          status: "registered",
        });

        if (error) throw error;
      }

      // Refresh registered events
      await get().fetchRegisteredEvents(userId);

      set({ loading: false });
      return { error: null };
    } catch (error: any) {
      console.error("Register error:", error);
      set({ error: error.message, loading: false });
      return { error: error.message };
    }
  },

  /**
   * Unregister user from an event
   */
  unregisterFromEvent: async (userId: string, eventId: string) => {
    try {
      set({ loading: true });

      const { error } = await supabase
        .from("registrations")
        .update({ status: "cancelled" })
        .eq("user_id", userId)
        .eq("event_id", eventId);

      if (error) throw error;

      // Refresh registered events
      await get().fetchRegisteredEvents(userId);

      set({ loading: false });
      return { error: null };
    } catch (error: any) {
      console.error("Unregister error:", error);
      set({ error: error.message, loading: false });
      return { error: error.message };
    }
  },

  /**
   * Record check-in or check-out
   */
  checkIn: async (
    userId: string,
    eventId: string,
    type: CheckInType,
    coords?: { latitude: number; longitude: number },
  ) => {
    try {
      const { error } = await supabase.from("check_ins").insert({
        user_id: userId,
        event_id: eventId,
        type,
        latitude: coords?.latitude,
        longitude: coords?.longitude,
      });

      if (error) throw error;

      // Refresh check-ins
      await get().fetchCheckIns(userId, eventId);

      return { error: null };
    } catch (error: any) {
      console.error("Check-in error:", error);
      return { error: error.message };
    }
  },

  /**
   * Fetch check-in history
   */
  fetchCheckIns: async (userId: string, eventId?: string) => {
    try {
      let query = supabase
        .from("check_ins")
        .select("*")
        .eq("user_id", userId)
        .order("timestamp", { ascending: false });

      if (eventId) {
        query = query.eq("event_id", eventId);
      }

      const { data, error } = await query;

      if (error) throw error;

      set({ checkIns: (data || []) as CheckIn[] });
    } catch (error: any) {
      console.error("Fetch check-ins error:", error);
    }
  },

  /**
   * Check if user is registered for an event
   */
  isRegistered: (userId: string, eventId: string) => {
    const { registrations } = get();
    return registrations.some(
      (r) =>
        r.user_id === userId &&
        r.event_id === eventId &&
        r.status === "registered",
    );
  },

  /**
   * Get latest check-in for user at event
   */
  getLatestCheckIn: (userId: string, eventId: string) => {
    const { checkIns } = get();
    return (
      checkIns.find((c) => c.user_id === userId && c.event_id === eventId) ||
      null
    );
  },

  /**
   * Set current event for detail view
   */
  setCurrentEvent: (event: Event | null) => set({ currentEvent: event }),

  /**
   * Set active check-in (when user is currently at an event)
   */
  setActiveCheckIn: (data: { event: Event; checkIn: CheckIn } | null) =>
    set({ activeCheckIn: data }),

  /**
   * Clear error state
   */
  clearError: () => set({ error: null }),
}));
