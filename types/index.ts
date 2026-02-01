/**
 * Type definitions for the Event Attendee App
 * All TypeScript interfaces and types for the application
 */

// ============================================
// USER TYPES
// ============================================

export type UserRole = "attendee" | "organizer";

export interface User {
  id: string;
  email: string;
  name: string;
  avatar_url?: string;
  bio?: string;
  title?: string; // Job title
  position?: string; // Alias for title (for backward compatibility)
  company?: string;
  interests: string[];
  role: UserRole;
  created_at: string;
  updated_at: string;
}

export interface UserProfile {
  name: string;
  avatar_url?: string;
  position?: string;
  company?: string;
  interests: string[];
}

// ============================================
// EVENT TYPES
// ============================================

export interface Event {
  id: string;
  title: string;
  description: string;
  logo_url?: string;
  banner_url?: string;
  venue_name: string;
  venue_address: string;
  location: string; // Short location display (alias for venue_name or custom)
  latitude: number;
  longitude: number;
  radius_meters: number; // Geofencing radius
  start_date: string;
  end_date: string;
  interests: string[]; // Event categories/tags
  organizer_id: string;
  venue_map_url?: string; // Indoor navigation map
  created_at: string;
  updated_at: string;
}

export interface EventFilter {
  location?: {
    latitude: number;
    longitude: number;
    radius_km: number;
  };
  date_from?: string;
  date_to?: string;
  interests?: string[];
  search?: string;
}

// ============================================
// REGISTRATION TYPES
// ============================================

export interface Registration {
  id: string;
  user_id: string;
  event_id: string;
  ticket_type?: string;
  registered_at: string;
  status: "registered" | "cancelled";
}

// ============================================
// CHECK-IN TYPES
// ============================================

export type CheckInType = "check_in" | "check_out";

export interface CheckIn {
  id: string;
  user_id: string;
  event_id: string;
  type: CheckInType;
  timestamp: string;
  latitude?: number;
  longitude?: number;
}

// ============================================
// SOCIAL TYPES
// ============================================

export type FriendshipStatus = "pending" | "accepted" | "rejected";

export interface Friendship {
  id: string;
  requester_id: string;
  addressee_id: string;
  status: FriendshipStatus;
  created_at: string;
  updated_at: string;
}

export interface FriendWithProfile extends Friendship {
  friend: User;
}

export interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  read: boolean;
  created_at: string;
}

export interface ChatConversation {
  user: User;
  last_message?: Message;
  unread_count: number;
}

// ============================================
// POST/FEED TYPES
// ============================================

export interface Post {
  id: string;
  user_id: string;
  event_id: string;
  content: string;
  image_url?: string;
  likes_count: number;
  comments_count: number;
  created_at: string;
  updated_at: string;
  user?: User; // Joined data
  liked_by_me?: boolean;
}

export interface Comment {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  created_at: string;
  user?: User; // Joined data
}

export interface Like {
  id: string;
  post_id: string;
  user_id: string;
  created_at: string;
}

// ============================================
// AI MATCHMAKING TYPES
// ============================================

export interface AIMatch {
  id: string;
  user_id: string;
  matched_user_id: string;
  event_id: string;
  score: number; // 0-100 (database column)
  common_interests?: string[];
  reasons: string[];
  created_at: string;
  matched_user?: User; // Joined data
}

// ============================================
// INDOOR NAVIGATION TYPES
// ============================================

export interface Venue {
  id: string;
  event_id: string;
  name: string;
  map_url: string;
  floors: VenueFloor[];
}

export interface VenueFloor {
  floor_number: number;
  name: string;
  map_url: string;
}

export interface AgendaItem {
  id: string;
  event_id: string;
  title: string;
  description: string;
  location_name: string;
  floor: number;
  x_position: number; // Percentage 0-100
  y_position: number; // Percentage 0-100
  start_time: string;
  end_time: string;
}

// ============================================
// PERMISSION TYPES
// ============================================

export type PermissionStatus = "granted" | "denied" | "undetermined";

export interface Permissions {
  location_foreground: PermissionStatus;
  location_background: PermissionStatus;
  bluetooth: PermissionStatus;
}

// ============================================
// NAVIGATION TYPES
// ============================================

export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
  SignIn: undefined;
  SignUp: undefined;
  EventDetails: { eventId: string };
  Badge: { eventId: string };
  Chat: { userId: string };
  Profile: { userId?: string };
  EditProfile: undefined;
  PostDetails: { postId: string };
  CreatePost: { eventId: string };
  IndoorNavigation: { eventId: string };
  AIMatches: { eventId: string };
  Permissions: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Events: undefined;
  Social: undefined;
  Profile: undefined;
};

// ============================================
// API RESPONSE TYPES
// ============================================

export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  loading: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  per_page: number;
  has_more: boolean;
}

// ============================================
// MEETING APPOINTMENT TYPES
// ============================================

export type MeetingStatus = "pending" | "accepted" | "declined" | "cancelled";

export interface MeetingAppointment {
  id: string;
  requester_id: string;
  invitee_id: string;
  event_id: string;
  title?: string;
  description?: string;
  location?: string;
  scheduled_time: string;
  duration_minutes: number;
  status: MeetingStatus;
  created_at: string;
  updated_at: string;
  requester?: User; // Joined data
  invitee?: User; // Joined data
  event?: Event; // Joined data
}

// ============================================
// BEACON DETECTION TYPES
// ============================================

export interface BeaconDetection {
  id: string;
  user_id: string;
  event_id: string;
  beacon_id: string;
  rssi: number;
  detected_at: string;
}

// ============================================
// ANALYTICS TYPES (for organizers)
// ============================================

export interface EventDwellTime {
  event_id: string;
  user_id: string;
  check_in_time: string;
  check_out_time?: string;
  dwell_time_minutes?: number;
}

export interface EventAnalytics {
  event_id: string;
  event_title: string;
  organizer_id: string;
  start_date: string;
  end_date: string;
  registration_count: number;
  unique_check_ins: number;
  avg_dwell_time_minutes?: number;
}
