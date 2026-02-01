# Supabase Requirements Document

## Event Attendee Mobile App (iOS & Android) - MVP

**Last Updated:** January 20, 2026  
**Project:** NetVent Event Attendee App

---

## Table of Contents

1. [Overview](#overview)
2. [Authentication Setup](#authentication-setup)
3. [Database Schema Summary](#database-schema-summary)
4. [Feature Implementation Status](#feature-implementation-status)
5. [Supabase Configuration Checklist](#supabase-configuration-checklist)
6. [Storage Buckets](#storage-buckets)
7. [Realtime Subscriptions](#realtime-subscriptions)
8. [Row Level Security (RLS) Policies](#row-level-security-rls-policies)
9. [Edge Functions (Future)](#edge-functions-future)
10. [Missing Features & Recommendations](#missing-features--recommendations)

---

## Overview

This document outlines all Supabase requirements for the NetVent Event Attendee mobile application. The app enables attendees to discover events, auto-register, receive digital badges, auto check-in/check-out using geofencing, network with AI matchmaking, and navigate indoor venues.

### Supabase Project Details

- **URL:** `https://ylelzeihqkynbppmysam.supabase.co`
- **Authentication:** Email/Password, Google OAuth, Apple OAuth (enabled)
- **Database:** PostgreSQL with RLS enabled
- **Storage:** Enabled for avatars, posts, and event assets

---

## Authentication Setup

### ✅ Enabled Authentication Providers

| Provider       | Status     | Notes                              |
| -------------- | ---------- | ---------------------------------- |
| Email/Password | ✅ Enabled | Standard signup/signin implemented |
| Google OAuth   | ✅ Enabled | Configured in Supabase Dashboard   |
| Apple OAuth    | ✅ Enabled | Required for iOS App Store         |

### Authentication Configuration Required

```
Supabase Dashboard → Authentication → Providers
```

1. **Email Provider:**
   - ✅ Enable Email confirmations (optional for MVP)
   - ✅ Secure password requirements (min 6 chars)

2. **Google OAuth:**
   - Add OAuth credentials from Google Cloud Console
   - Configure redirect URLs
   - Add iOS/Android client IDs

3. **Apple OAuth:**
   - Configure Apple Developer account
   - Add Services ID and Key
   - Configure redirect URLs

### App Implementation Status

- ✅ `SignInScreen.tsx` - Email/password sign in
- ✅ `SignUpScreen.tsx` - Email/password sign up
- ✅ `authStore.ts` - Zustand store for auth state
- ⚠️ Social OAuth buttons need to be added to UI (Google/Apple)

---

## Database Schema Summary

### Tables Created (via schema.sql & migration.sql)

| Table           | Description                            | Status     |
| --------------- | -------------------------------------- | ---------- |
| `users`         | User profiles (extends auth.users)     | ✅ Created |
| `events`        | Event information with geofencing data | ✅ Created |
| `agenda_items`  | Event sessions for indoor navigation   | ✅ Created |
| `registrations` | User event registrations               | ✅ Created |
| `check_ins`     | Auto check-in/check-out records        | ✅ Created |
| `friendships`   | Friend connections                     | ✅ Created |
| `messages`      | Direct messaging                       | ✅ Created |
| `posts`         | Social feed posts                      | ✅ Created |
| `post_likes`    | Post like records                      | ✅ Created |
| `comments`      | Post comments                          | ✅ Created |
| `ai_matches`    | AI-generated user matches              | ✅ Created |

### Detailed Table Schemas

#### 1. Users Table

```sql
CREATE TABLE users (
    id UUID PRIMARY KEY REFERENCES auth.users(id),
    email TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    avatar_url TEXT,
    bio TEXT,
    company TEXT,                    -- For badge display
    position TEXT,                   -- For badge display
    interests TEXT[] DEFAULT '{}',   -- For AI matching
    role TEXT DEFAULT 'attendee',    -- 'attendee' | 'organizer'
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
);
```

**App Implementation:** ✅ ProfileScreen, EditProfileScreen, userService.ts

#### 2. Events Table

```sql
CREATE TABLE events (
    id UUID PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    logo_url TEXT,                   -- For badge display
    banner_url TEXT,
    venue_name TEXT NOT NULL,
    venue_address TEXT NOT NULL,
    latitude DOUBLE PRECISION,       -- Geofencing center
    longitude DOUBLE PRECISION,      -- Geofencing center
    radius_meters DOUBLE PRECISION,  -- Geofencing radius
    start_date TIMESTAMPTZ,
    end_date TIMESTAMPTZ,
    interests TEXT[] DEFAULT '{}',   -- Target audience/categories
    organizer_id UUID REFERENCES users(id),
    venue_map_url TEXT,              -- 3D venue map
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
);
```

**App Implementation:** ✅ EventsListScreen, EventDetailsScreen, eventsStore.ts

#### 3. Agenda Items Table

```sql
CREATE TABLE agenda_items (
    id UUID PRIMARY KEY,
    event_id UUID REFERENCES events(id),
    title TEXT NOT NULL,
    description TEXT,
    location_name TEXT NOT NULL,     -- Room/booth name
    floor INTEGER NOT NULL,          -- Floor number
    x_position DOUBLE PRECISION,     -- Map position (0-100%)
    y_position DOUBLE PRECISION,     -- Map position (0-100%)
    start_time TIMESTAMPTZ,
    end_time TIMESTAMPTZ,
    created_at TIMESTAMPTZ
);
```

**App Implementation:** ✅ IndoorNavigationScreen.tsx

#### 4. Registrations Table

```sql
CREATE TABLE registrations (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    event_id UUID REFERENCES events(id),
    status TEXT DEFAULT 'registered', -- 'registered' | 'cancelled'
    qr_code TEXT,                     -- Generated QR data
    registered_at TIMESTAMPTZ,
    UNIQUE(user_id, event_id)
);
```

**App Implementation:** ✅ eventsStore.ts, EventDetailsScreen.tsx

#### 5. Check-ins Table

```sql
CREATE TABLE check_ins (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    event_id UUID REFERENCES events(id),
    type TEXT NOT NULL,              -- 'check_in' | 'check_out'
    timestamp TIMESTAMPTZ,
    latitude DOUBLE PRECISION,       -- Location at check-in
    longitude DOUBLE PRECISION
);
```

**App Implementation:** ✅ useGeofencing.ts, eventsStore.ts

#### 6. Friendships Table

```sql
CREATE TABLE friendships (
    id UUID PRIMARY KEY,
    requester_id UUID REFERENCES users(id),
    addressee_id UUID REFERENCES users(id),
    status TEXT DEFAULT 'pending',   -- 'pending' | 'accepted' | 'rejected'
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    UNIQUE(requester_id, addressee_id)
);
```

**App Implementation:** ✅ socialStore.ts, SocialScreen.tsx

#### 7. Messages Table

```sql
CREATE TABLE messages (
    id UUID PRIMARY KEY,
    sender_id UUID REFERENCES users(id),
    receiver_id UUID REFERENCES users(id),
    content TEXT NOT NULL,
    read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ
);
```

**App Implementation:** ✅ ChatScreen.tsx, socialStore.ts (with realtime)

#### 8. Posts Table

```sql
CREATE TABLE posts (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    event_id UUID REFERENCES events(id),
    content TEXT NOT NULL,
    image_url TEXT,
    likes_count INTEGER DEFAULT 0,
    comments_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
);
```

**App Implementation:** ✅ CreatePostScreen.tsx, SocialScreen.tsx, socialStore.ts

#### 9. Post Likes Table

```sql
CREATE TABLE post_likes (
    id UUID PRIMARY KEY,
    post_id UUID REFERENCES posts(id),
    user_id UUID REFERENCES users(id),
    created_at TIMESTAMPTZ,
    UNIQUE(post_id, user_id)
);
```

**App Implementation:** ✅ socialStore.ts (likePost/unlikePost)

#### 10. Comments Table

```sql
CREATE TABLE comments (
    id UUID PRIMARY KEY,
    post_id UUID REFERENCES posts(id),
    user_id UUID REFERENCES users(id),
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ
);
```

**App Implementation:** ✅ PostDetailsScreen.tsx, socialStore.ts

#### 11. AI Matches Table

```sql
CREATE TABLE ai_matches (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    matched_user_id UUID REFERENCES users(id),
    event_id UUID REFERENCES events(id),
    score DOUBLE PRECISION NOT NULL,  -- 0-100 match score
    reasons TEXT[] DEFAULT '{}',      -- Match reason descriptions
    created_at TIMESTAMPTZ,
    UNIQUE(user_id, matched_user_id, event_id)
);
```

**App Implementation:** ✅ AIMatchScreen.tsx, aiMatchStore.ts

---

## Feature Implementation Status

### Attendee MVP Features

| Feature                                          | Database                       | App UI                    | Store/Service        | Status         |
| ------------------------------------------------ | ------------------------------ | ------------------------- | -------------------- | -------------- |
| **Sign up/Sign in**                              | ✅ auth.users                  | ✅ SignIn/SignUpScreen    | ✅ authStore         | ✅ Complete    |
| **Enable Location**                              | N/A                            | ✅ PermissionsScreen      | ✅ permissionsStore  | ✅ Complete    |
| **Enable Bluetooth**                             | N/A                            | ✅ PermissionsScreen      | ✅ useBluetooth hook | ✅ Complete    |
| **Create Profile**                               | ✅ users table                 | ✅ EditProfileScreen      | ✅ authStore         | ✅ Complete    |
| **Add Interests**                                | ✅ users.interests             | ✅ EditProfileScreen      | ✅ authStore         | ✅ Complete    |
| **Discover Events by Location**                  | ✅ events (lat/lng)            | ✅ EventsListScreen       | ✅ eventsStore       | ✅ Complete    |
| **Discover Events by Date**                      | ✅ events (start/end)          | ✅ EventsListScreen       | ✅ eventsStore       | ✅ Complete    |
| **Discover Events by Interest**                  | ✅ events.interests            | ✅ EventsListScreen       | ✅ eventsStore       | ✅ Complete    |
| **Friends Attending**                            | ✅ friendships + registrations | ⚠️ Partial                | ⚠️ Needs work        | 🔄 In Progress |
| **View Past Events**                             | ✅ events                      | ✅ EventsListScreen       | ✅ eventsStore       | ✅ Complete    |
| **View Upcoming Events**                         | ✅ events                      | ✅ EventsListScreen       | ✅ eventsStore       | ✅ Complete    |
| **Auto Registration**                            | ✅ registrations               | ✅ EventDetailsScreen     | ✅ eventsStore       | ✅ Complete    |
| **Electronic Badge Creation**                    | ✅ registrations + users       | ✅ BadgeScreen            | ✅ -                 | ✅ Complete    |
| **Badge Display (name, pic, position, company)** | ✅ users table                 | ✅ BadgeScreen            | ✅ -                 | ✅ Complete    |
| **Auto Check-in (Geofencing)**                   | ✅ check_ins                   | ✅ -                      | ✅ useGeofencing     | ✅ Complete    |
| **Auto Check-out (Geofencing)**                  | ✅ check_ins                   | ✅ -                      | ✅ useGeofencing     | ✅ Complete    |
| **Badge Animation/Pulse/Vibration**              | N/A                            | ✅ BadgeScreen            | ✅ expo-haptics      | ✅ Complete    |
| **AI Matchmaking**                               | ✅ ai_matches                  | ✅ AIMatchScreen          | ✅ aiMatchStore      | ✅ Complete    |
| **Writing Posts on Feed**                        | ✅ posts                       | ✅ CreatePostScreen       | ✅ socialStore       | ✅ Complete    |
| **Commenting on Feed**                           | ✅ comments                    | ✅ PostDetailsScreen      | ✅ socialStore       | ✅ Complete    |
| **Direct Messaging**                             | ✅ messages                    | ✅ ChatScreen             | ✅ socialStore       | ✅ Complete    |
| **Meeting Appointment Creation**                 | ⚠️ Missing table               | ❌ Not implemented        | ❌ Missing           | ❌ TODO        |
| **Indoor Venue Navigation**                      | ✅ agenda_items                | ✅ IndoorNavigationScreen | ✅ -                 | ✅ Complete    |
| **Multi-destination Timed Maps**                 | ✅ agenda_items                | ✅ IndoorNavigationScreen | ⚠️ Partial           | 🔄 In Progress |
| **Remove Quick Actions**                         | N/A                            | ⚠️ Needs review           | N/A                  | 🔄 In Progress |

### Bluetooth/Beacon Features

| Feature             | Status           | Notes                                               |
| ------------------- | ---------------- | --------------------------------------------------- |
| BLE Scanning        | ✅ Hook created  | `useBluetooth.ts` - needs native module             |
| Device Detection    | ⚠️ Placeholder   | Requires `react-native-ble-plx` or `expo-bluetooth` |
| Dwell Time Tracking | ⚠️ Needs backend | Requires Edge Function for processing               |

---

## Supabase Configuration Checklist

### Dashboard Configuration Required

#### 1. Authentication Settings

```
Dashboard → Authentication → Settings
```

- [ ] Configure Site URL for deep linking
- [ ] Add redirect URLs for OAuth
- [ ] Configure email templates (optional)

#### 2. Run Database Migrations

```
Dashboard → SQL Editor → Run:
```

1. Execute `database/schema.sql` (if fresh install)
2. Execute `database/migration.sql` (for updates)

#### 3. Enable Realtime

```
Dashboard → Database → Replication
```

Enable realtime for these tables:

- [x] `messages`
- [x] `posts`
- [x] `comments`
- [x] `friendships`

Already configured in schema:

```sql
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
ALTER PUBLICATION supabase_realtime ADD TABLE posts;
ALTER PUBLICATION supabase_realtime ADD TABLE comments;
ALTER PUBLICATION supabase_realtime ADD TABLE friendships;
```

---

## Storage Buckets

### Required Buckets

| Bucket Name | Public | Purpose                 |
| ----------- | ------ | ----------------------- |
| `avatars`   | Yes    | User profile pictures   |
| `posts`     | Yes    | Post images             |
| `events`    | Yes    | Event logos and banners |

### Setup Commands (Run in SQL Editor)

```sql
-- Create buckets
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('posts', 'posts', true)
ON CONFLICT DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('events', 'events', true)
ON CONFLICT DO NOTHING;

-- Storage policies
CREATE POLICY "Avatar images are publicly accessible" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');

CREATE POLICY "Authenticated users can upload avatars" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.role() = 'authenticated');

CREATE POLICY "Users can update their avatars" ON storage.objects
  FOR UPDATE USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Post images are publicly accessible" ON storage.objects
  FOR SELECT USING (bucket_id = 'posts');

CREATE POLICY "Authenticated users can upload post images" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'posts' AND auth.role() = 'authenticated');

CREATE POLICY "Event images are publicly accessible" ON storage.objects
  FOR SELECT USING (bucket_id = 'events');

CREATE POLICY "Organizers can upload event images" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'events' AND auth.role() = 'authenticated');
```

**App Implementation:** ✅ `storageService.ts` handles all uploads

---

## Row Level Security (RLS) Policies

All tables have RLS enabled with appropriate policies. Summary:

| Table         | SELECT   | INSERT    | UPDATE    | DELETE |
| ------------- | -------- | --------- | --------- | ------ |
| users         | All      | Own       | Own       | -      |
| events        | All      | Organizer | Organizer | -      |
| agenda_items  | All      | -         | -         | -      |
| registrations | Own      | Own       | Own       | -      |
| check_ins     | Own      | Own       | Own       | -      |
| friendships   | Involved | Requester | Addressee | -      |
| messages      | Involved | Sender    | Receiver  | -      |
| posts         | All      | Own       | Own       | Own    |
| post_likes    | All      | Own       | -         | Own    |
| comments      | All      | Own       | -         | Own    |
| ai_matches    | Own      | -         | -         | -      |

---

## Realtime Subscriptions

### Currently Implemented

| Table         | Events | App Usage                              |
| ------------- | ------ | -------------------------------------- |
| `messages`    | INSERT | ChatScreen - new message notifications |
| `posts`       | INSERT | SocialScreen - feed updates            |
| `comments`    | INSERT | PostDetailsScreen - new comments       |
| `friendships` | INSERT | SocialScreen - friend requests         |

### Implementation in App

```typescript
// Example from ChatScreen.tsx
supabase
  .channel("messages")
  .on(
    "postgres_changes",
    {
      event: "INSERT",
      schema: "public",
      table: "messages",
      filter: `receiver_id=eq.${userId}`,
    },
    (payload) => {
      // Handle new message
    },
  )
  .subscribe();
```

---

## Edge Functions (Future)

### Recommended Edge Functions

#### 1. AI Match Generation

```
Function: generate-ai-matches
Trigger: On user registration for event
Purpose: Calculate match scores based on interests/behavior
```

#### 2. Check-in Analytics

```
Function: calculate-dwell-time
Trigger: On check-out
Purpose: Calculate and store dwell time for organizer analytics
```

#### 3. Push Notifications

```
Function: send-push-notification
Trigger: On new message/match/check-in
Purpose: Send push notifications via Expo
```

#### 4. Beacon Data Processing

```
Function: process-beacon-data
Trigger: On beacon detection
Purpose: Process BLE beacon data for indoor positioning
```

---

## Missing Features & Recommendations

### 1. ❌ Meeting Appointments Table (MISSING)

**Required Schema:**

```sql
CREATE TABLE IF NOT EXISTS meeting_appointments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    requester_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    invitee_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    title TEXT,
    description TEXT,
    location TEXT,                   -- Meeting point
    scheduled_time TIMESTAMPTZ NOT NULL,
    duration_minutes INTEGER DEFAULT 30,
    status TEXT DEFAULT 'pending',   -- 'pending' | 'accepted' | 'declined' | 'cancelled'
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE meeting_appointments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own appointments" ON meeting_appointments
    FOR SELECT USING (auth.uid() = requester_id OR auth.uid() = invitee_id);

CREATE POLICY "Users can create appointments" ON meeting_appointments
    FOR INSERT WITH CHECK (auth.uid() = requester_id);

CREATE POLICY "Users can update involved appointments" ON meeting_appointments
    FOR UPDATE USING (auth.uid() = requester_id OR auth.uid() = invitee_id);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE meeting_appointments;
```

### 2. ⚠️ Beacon/Device Tracking Table (RECOMMENDED)

**For Dwell Time with Physical Beacons:**

```sql
CREATE TABLE IF NOT EXISTS beacon_detections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    beacon_id TEXT NOT NULL,         -- Physical beacon identifier
    rssi INTEGER,                    -- Signal strength
    detected_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_beacon_detections_user_event
    ON beacon_detections(user_id, event_id);

-- RLS Policies
ALTER TABLE beacon_detections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own detections" ON beacon_detections
    FOR INSERT WITH CHECK (auth.uid() = user_id);
```

### 3. ⚠️ Organizer Analytics View (RECOMMENDED)

**For Organizer Dashboard Data:**

```sql
CREATE OR REPLACE VIEW organizer_event_analytics AS
SELECT
    e.id as event_id,
    e.title as event_title,
    e.organizer_id,
    COUNT(DISTINCT r.user_id) as registration_count,
    COUNT(DISTINCT CASE WHEN ci.type = 'check_in' THEN ci.user_id END) as checked_in_count,
    AVG(
        EXTRACT(EPOCH FROM (
            SELECT MIN(co.timestamp) FROM check_ins co
            WHERE co.user_id = ci.user_id
            AND co.event_id = ci.event_id
            AND co.type = 'check_out'
            AND co.timestamp > ci.timestamp
        ) - ci.timestamp) / 60
    ) as avg_dwell_time_minutes
FROM events e
LEFT JOIN registrations r ON r.event_id = e.id AND r.status = 'registered'
LEFT JOIN check_ins ci ON ci.event_id = e.id AND ci.type = 'check_in'
GROUP BY e.id, e.title, e.organizer_id;
```

### 4. ⚠️ Friends Attending Events (ENHANCEMENT)

**Add to EventsListScreen:**

```typescript
// Query to get friends attending an event
const getFriendsAttendingEvent = async (userId: string, eventId: string) => {
  const { data } = await supabase
    .from("registrations")
    .select(
      `
      user_id,
      users!inner(id, name, avatar_url)
    `,
    )
    .eq("event_id", eventId)
    .eq("status", "registered")
    .in(
      "user_id",
      supabase
        .from("friendships")
        .select("addressee_id")
        .eq("requester_id", userId)
        .eq("status", "accepted"),
    );
  return data;
};
```

### 5. ⚠️ Google/Apple OAuth UI Buttons (TODO)

**Add to SignInScreen.tsx:**

```typescript
// Social auth buttons needed
<Button
  title="Continue with Google"
  onPress={() => supabase.auth.signInWithOAuth({ provider: 'google' })}
/>
<Button
  title="Continue with Apple"
  onPress={() => supabase.auth.signInWithOAuth({ provider: 'apple' })}
/>
```

---

## Summary

### ✅ Fully Implemented (Database + App)

- User authentication (Email/Password)
- User profiles with interests, company, position
- Event discovery with filtering
- Event registration
- Digital badge with animations
- Auto check-in/check-out (geofencing)
- Social feed (posts, comments, likes)
- Direct messaging with realtime
- Friend connections
- AI matchmaking display
- Indoor navigation with map markers
- Permissions management (location, Bluetooth)

### 🔄 Partially Implemented

- Google/Apple OAuth (backend ready, UI buttons needed)
- Friends attending events (needs UI integration)
- Multi-destination timed maps (basic implementation)

### ❌ Missing Implementation

- Meeting appointment creation (table + UI needed)
- Beacon dwell time tracking (table + processing needed)
- Organizer analytics dashboard (view + API needed)
- Push notifications (Edge Function needed)

---

## Quick Start Commands

### 1. Run Full Schema (Fresh Install)

```sql
-- In Supabase SQL Editor
-- Copy and run entire database/schema.sql
```

### 2. Run Migrations (Updates)

```sql
-- In Supabase SQL Editor
-- Copy and run entire database/migration.sql
```

### 3. Add Missing Meeting Appointments Table

```sql
-- Copy the meeting_appointments schema from Section 1 above
```

### 4. Verify Setup

```sql
-- Check all tables exist
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

-- Check RLS is enabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public';
```

---

_Document generated for NetVent Event Attendee App MVP_
