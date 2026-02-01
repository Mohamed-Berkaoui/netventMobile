/**
 * User Service
 * Handles user profile operations
 */

import { User, UserProfile } from "../types";
import { uploadAvatar } from "./storageService";
import { supabase } from "./supabase";

/**
 * Get user profile by ID
 */
export const getUserById = async (userId: string): Promise<User | null> => {
  try {
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", userId)
      .single();

    if (error) throw error;

    return data as User;
  } catch (error: any) {
    console.error("Get user error:", error);
    return null;
  }
};

/**
 * Get multiple users by IDs
 */
export const getUsersByIds = async (userIds: string[]): Promise<User[]> => {
  try {
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .in("id", userIds);

    if (error) throw error;

    return (data || []) as User[];
  } catch (error: any) {
    console.error("Get users error:", error);
    return [];
  }
};

/**
 * Update user profile
 */
export const updateUserProfile = async (
  userId: string,
  profile: Partial<UserProfile>,
): Promise<{ data: User | null; error: string | null }> => {
  try {
    const { data, error } = await supabase
      .from("users")
      .update({
        ...profile,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId)
      .select()
      .single();

    if (error) throw error;

    return { data: data as User, error: null };
  } catch (error: any) {
    console.error("Update profile error:", error);
    return { data: null, error: error.message };
  }
};

/**
 * Update user avatar
 */
export const updateUserAvatar = async (
  userId: string,
  imageUri: string,
): Promise<{ url: string | null; error: string | null }> => {
  try {
    // Upload to storage
    const { url, error: uploadError } = await uploadAvatar(userId, imageUri);

    if (uploadError || !url) {
      throw new Error(uploadError || "Failed to upload avatar");
    }

    // Update user profile with new URL
    const { error: updateError } = await supabase
      .from("users")
      .update({
        avatar_url: url,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId);

    if (updateError) throw updateError;

    return { url, error: null };
  } catch (error: any) {
    console.error("Update avatar error:", error);
    return { url: null, error: error.message };
  }
};

/**
 * Search users by name or email
 */
export const searchUsers = async (
  query: string,
  excludeUserId?: string,
): Promise<User[]> => {
  try {
    let request = supabase
      .from("users")
      .select("*")
      .or(`name.ilike.%${query}%,email.ilike.%${query}%`)
      .limit(20);

    if (excludeUserId) {
      request = request.neq("id", excludeUserId);
    }

    const { data, error } = await request;

    if (error) throw error;

    return (data || []) as User[];
  } catch (error: any) {
    console.error("Search users error:", error);
    return [];
  }
};

/**
 * Get users by interests
 */
export const getUsersByInterests = async (
  interests: string[],
  excludeUserId?: string,
): Promise<User[]> => {
  try {
    let request = supabase
      .from("users")
      .select("*")
      .overlaps("interests", interests)
      .limit(50);

    if (excludeUserId) {
      request = request.neq("id", excludeUserId);
    }

    const { data, error } = await request;

    if (error) throw error;

    return (data || []) as User[];
  } catch (error: any) {
    console.error("Get users by interests error:", error);
    return [];
  }
};

/**
 * Get attendees for an event
 */
export const getEventAttendees = async (eventId: string): Promise<User[]> => {
  try {
    const { data, error } = await supabase
      .from("registrations")
      .select("users(*)")
      .eq("event_id", eventId)
      .eq("status", "registered");

    if (error) throw error;

    // Extract users from joined data
    const users = (data || [])
      .map((r: any) => r.users)
      .filter(Boolean) as User[];

    return users;
  } catch (error: any) {
    console.error("Get event attendees error:", error);
    return [];
  }
};

export const UserService = {
  getUserById,
  getUsersByIds,
  updateUserProfile,
  updateUserAvatar,
  searchUsers,
  getUsersByInterests,
  getEventAttendees,
};

export default UserService;
