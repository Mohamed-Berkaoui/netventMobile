# 🚀 NetVent Supabase Setup Guide - Complete Instructions

## Project: NetVent Event Attendee Mobile App (iOS & Android) MVP

**Document Created:** January 21, 2026  
**Purpose:** Step-by-step guide to recreate Supabase project from scratch

---

## 📋 Table of Contents

1. [Create Supabase Project](#1-create-supabase-project)
2. [Authentication Setup](#2-authentication-setup)
3. [Database Schema Setup](#3-database-schema-setup)
4. [Storage Buckets Setup](#4-storage-buckets-setup)
5. [Realtime Configuration](#5-realtime-configuration)
6. [Get API Keys](#6-get-api-keys)
7. [Update App Configuration](#7-update-app-configuration)
8. [Testing Checklist](#8-testing-checklist)

---

## 1. Create Supabase Project

### Step 1.1: Go to Supabase Dashboard

1. Visit [https://supabase.com](https://supabase.com)
2. Sign in or create an account
3. Click **"New Project"**

### Step 1.2: Project Configuration

Fill in the following:

- **Organization:** Select or create your organization
- **Project Name:** `netvent` (or your preferred name)
- **Database Password:** Create a strong password (SAVE THIS!)
- **Region:** Choose the closest region to your users
- **Pricing Plan:** Free tier is fine for MVP

### Step 1.3: Wait for Project Creation

- Takes about 2-3 minutes
- Dashboard will show "Setting up project..."

---

## 2. Authentication Setup

### Step 2.1: Enable Email/Password Authentication

1. Go to **Authentication** → **Providers**
2. Find **Email** provider
3. Ensure it's **Enabled**
4. Configure:
   - ✅ Enable email confirmations: **OFF** (for MVP, easier testing)
   - ✅ Secure email change: ON
   - Minimum password length: **6 characters**

### Step 2.2: Enable Google OAuth (Optional but Recommended)

1. Go to **Authentication** → **Providers** → **Google**
2. Toggle **Enable Sign in with Google**
3. You need Google Cloud Console credentials:

   **In Google Cloud Console:**
   - Create a new project or use existing
   - Go to **APIs & Services** → **Credentials**
   - Create **OAuth 2.0 Client ID**
   - Add authorized redirect URIs:
     ```
     https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback
     ```
   - Copy **Client ID** and **Client Secret**

4. Paste credentials in Supabase Dashboard

### Step 2.3: Enable Apple OAuth (Required for iOS App Store)

1. Go to **Authentication** → **Providers** → **Apple**
2. Toggle **Enable Sign in with Apple**
3. You need Apple Developer credentials:

   **In Apple Developer Portal:**
   - Create a Services ID
   - Enable "Sign in with Apple"
   - Configure redirect URIs
   - Create a private key

4. Fill in Supabase:
   - Services ID
   - Team ID
   - Key ID
   - Private Key

### Step 2.4: Configure URL Settings

1. Go to **Authentication** → **URL Configuration**
2. Set:
   - **Site URL:** `netvent://` (your app scheme)
   - **Redirect URLs:** Add:
     ```
     netvent://auth/callback
     exp://localhost:8081/--/auth/callback
     ```

---

## 3. Database Schema Setup

### Step 3.1: Open SQL Editor

1. Go to **SQL Editor** in the left sidebar
2. Click **"New query"**

### Step 3.2: Run the Complete Schema

Copy and paste the ENTIRE SQL below, then click **"Run"**:

```sql
-- ============================================
-- NetVent Event App - Complete Database Schema
-- Run this entire script in Supabase SQL Editor
-- ============================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- 1. USERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    avatar_url TEXT,
    bio TEXT,
    company TEXT,
    position TEXT,
    interests TEXT[] DEFAULT '{}',
    role TEXT DEFAULT 'attendee' CHECK (role IN ('attendee', 'organizer')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for users
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all profiles" ON users
    FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON users
    FOR INSERT WITH CHECK (auth.uid() = id);

-- ============================================
-- 2. EVENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    logo_url TEXT,
    banner_url TEXT,
    venue_name TEXT NOT NULL,
    venue_address TEXT NOT NULL,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    radius_meters DOUBLE PRECISION DEFAULT 100,
    start_date TIMESTAMPTZ NOT NULL,
    end_date TIMESTAMPTZ NOT NULL,
    interests TEXT[] DEFAULT '{}',
    target_audience TEXT[] DEFAULT '{}',
    organizer_id UUID REFERENCES users(id),
    venue_map_url TEXT,
    venue_3d_map_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for events
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view events" ON events
    FOR SELECT USING (true);

CREATE POLICY "Organizers can create events" ON events
    FOR INSERT WITH CHECK (auth.uid() = organizer_id);

CREATE POLICY "Organizers can update own events" ON events
    FOR UPDATE USING (auth.uid() = organizer_id);

CREATE POLICY "Organizers can delete own events" ON events
    FOR DELETE USING (auth.uid() = organizer_id);

-- ============================================
-- 3. AGENDA ITEMS TABLE (Sessions/Schedule)
-- ============================================
CREATE TABLE IF NOT EXISTS agenda_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    location_name TEXT NOT NULL,
    floor INTEGER NOT NULL,
    x_position DOUBLE PRECISION NOT NULL,
    y_position DOUBLE PRECISION NOT NULL,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for agenda items
ALTER TABLE agenda_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view agenda items" ON agenda_items
    FOR SELECT USING (true);

CREATE POLICY "Organizers can manage agenda items" ON agenda_items
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM events
            WHERE events.id = agenda_items.event_id
            AND events.organizer_id = auth.uid()
        )
    );

-- ============================================
-- 4. REGISTRATIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS registrations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'registered' CHECK (status IN ('registered', 'cancelled')),
    qr_code TEXT,
    registered_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, event_id)
);

-- RLS for registrations
ALTER TABLE registrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own registrations" ON registrations
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Organizers can view event registrations" ON registrations
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM events
            WHERE events.id = registrations.event_id
            AND events.organizer_id = auth.uid()
        )
    );

CREATE POLICY "Users can register for events" ON registrations
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own registrations" ON registrations
    FOR UPDATE USING (auth.uid() = user_id);

-- ============================================
-- 5. CHECK-INS TABLE (Geofencing)
-- ============================================
CREATE TABLE IF NOT EXISTS check_ins (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('check_in', 'check_out')),
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION
);

-- RLS for check-ins
ALTER TABLE check_ins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own check-ins" ON check_ins
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Organizers can view event check-ins" ON check_ins
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM events
            WHERE events.id = check_ins.event_id
            AND events.organizer_id = auth.uid()
        )
    );

CREATE POLICY "Users can create own check-ins" ON check_ins
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ============================================
-- 6. FRIENDSHIPS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS friendships (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    requester_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    addressee_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(requester_id, addressee_id)
);

-- RLS for friendships
ALTER TABLE friendships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own friendships" ON friendships
    FOR SELECT USING (auth.uid() = requester_id OR auth.uid() = addressee_id);

CREATE POLICY "Users can create friendships" ON friendships
    FOR INSERT WITH CHECK (auth.uid() = requester_id);

CREATE POLICY "Users can update friendships where they are addressee" ON friendships
    FOR UPDATE USING (auth.uid() = addressee_id);

CREATE POLICY "Users can delete own friendships" ON friendships
    FOR DELETE USING (auth.uid() = requester_id OR auth.uid() = addressee_id);

-- ============================================
-- 7. MESSAGES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    receiver_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for messages
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own messages" ON messages
    FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can send messages" ON messages
    FOR INSERT WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Receiver can mark messages as read" ON messages
    FOR UPDATE USING (auth.uid() = receiver_id);

-- ============================================
-- 8. POSTS TABLE (Social Feed)
-- ============================================
CREATE TABLE IF NOT EXISTS posts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    event_id UUID REFERENCES events(id) ON DELETE SET NULL,
    content TEXT NOT NULL,
    image_url TEXT,
    likes_count INTEGER DEFAULT 0,
    comments_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for posts
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view posts" ON posts
    FOR SELECT USING (true);

CREATE POLICY "Users can create posts" ON posts
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own posts" ON posts
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own posts" ON posts
    FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- 9. POST LIKES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS post_likes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(post_id, user_id)
);

-- RLS for post likes
ALTER TABLE post_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view likes" ON post_likes
    FOR SELECT USING (true);

CREATE POLICY "Users can like posts" ON post_likes
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unlike posts" ON post_likes
    FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- 10. COMMENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for comments
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view comments" ON comments
    FOR SELECT USING (true);

CREATE POLICY "Users can create comments" ON comments
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own comments" ON comments
    FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- 11. AI MATCHES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS ai_matches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    matched_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    score DOUBLE PRECISION NOT NULL,
    reasons TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, matched_user_id, event_id)
);

-- RLS for AI matches
ALTER TABLE ai_matches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own matches" ON ai_matches
    FOR SELECT USING (auth.uid() = user_id);

-- ============================================
-- 12. MEETING APPOINTMENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS meeting_appointments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    requester_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    invitee_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    title TEXT,
    description TEXT,
    location TEXT,
    scheduled_time TIMESTAMPTZ NOT NULL,
    duration_minutes INTEGER DEFAULT 30,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'cancelled')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for meeting appointments
ALTER TABLE meeting_appointments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own appointments" ON meeting_appointments
    FOR SELECT USING (auth.uid() = requester_id OR auth.uid() = invitee_id);

CREATE POLICY "Users can create appointments" ON meeting_appointments
    FOR INSERT WITH CHECK (auth.uid() = requester_id);

CREATE POLICY "Users can update involved appointments" ON meeting_appointments
    FOR UPDATE USING (auth.uid() = requester_id OR auth.uid() = invitee_id);

-- ============================================
-- 13. BEACON DETECTIONS TABLE (Dwell Time)
-- ============================================
CREATE TABLE IF NOT EXISTS beacon_detections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    beacon_id TEXT NOT NULL,
    rssi INTEGER,
    detected_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_beacon_detections_user_event ON beacon_detections(user_id, event_id);

-- RLS for beacon detections
ALTER TABLE beacon_detections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own detections" ON beacon_detections
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Organizers can view event detections" ON beacon_detections
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM events
            WHERE events.id = beacon_detections.event_id
            AND events.organizer_id = auth.uid()
        )
    );

-- ============================================
-- TRIGGERS FOR AUTO-UPDATES
-- ============================================

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_events_updated_at
    BEFORE UPDATE ON events
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_posts_updated_at
    BEFORE UPDATE ON posts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_meeting_appointments_updated_at
    BEFORE UPDATE ON meeting_appointments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Update post likes count trigger
CREATE OR REPLACE FUNCTION update_post_likes_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE posts SET likes_count = likes_count + 1 WHERE id = NEW.post_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE posts SET likes_count = likes_count - 1 WHERE id = OLD.post_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_likes_count
    AFTER INSERT OR DELETE ON post_likes
    FOR EACH ROW EXECUTE FUNCTION update_post_likes_count();

-- Update post comments count trigger
CREATE OR REPLACE FUNCTION update_post_comments_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE posts SET comments_count = comments_count + 1 WHERE id = NEW.post_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE posts SET comments_count = comments_count - 1 WHERE id = OLD.post_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_comments_count
    AFTER INSERT OR DELETE ON comments
    FOR EACH ROW EXECUTE FUNCTION update_post_comments_count();

-- ============================================
-- AUTO-CREATE USER PROFILE ON SIGNUP
-- ============================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, email, name, role)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
        'attendee'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if exists and create new one
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================
-- ANALYTICS VIEW FOR ORGANIZERS
-- ============================================
CREATE OR REPLACE VIEW organizer_event_analytics AS
SELECT
    e.id as event_id,
    e.title as event_title,
    e.organizer_id,
    e.start_date,
    e.end_date,
    COUNT(DISTINCT r.user_id) as registration_count,
    COUNT(DISTINCT CASE WHEN ci.type = 'check_in' THEN ci.user_id END) as checked_in_count,
    COUNT(DISTINCT CASE WHEN ci.type = 'check_out' THEN ci.user_id END) as checked_out_count
FROM events e
LEFT JOIN registrations r ON r.event_id = e.id AND r.status = 'registered'
LEFT JOIN check_ins ci ON ci.event_id = e.id
GROUP BY e.id, e.title, e.organizer_id, e.start_date, e.end_date;

-- ============================================
-- ENABLE REALTIME
-- ============================================
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
ALTER PUBLICATION supabase_realtime ADD TABLE posts;
ALTER PUBLICATION supabase_realtime ADD TABLE comments;
ALTER PUBLICATION supabase_realtime ADD TABLE friendships;
ALTER PUBLICATION supabase_realtime ADD TABLE meeting_appointments;

-- ============================================
-- SAMPLE TEST DATA (Optional - Remove in Production)
-- ============================================
-- Uncomment below to add test events

/*
INSERT INTO events (title, description, venue_name, venue_address, start_date, end_date, interests, latitude, longitude, radius_meters)
VALUES
    (
        'Tech Conference 2026',
        'Join us for the biggest tech conference of the year featuring keynotes, workshops, and networking.',
        'Moscone Center',
        '747 Howard St, San Francisco, CA 94103',
        NOW() + INTERVAL '7 days',
        NOW() + INTERVAL '9 days',
        ARRAY['technology', 'conference', 'networking'],
        37.7749,
        -122.4194,
        150
    ),
    (
        'Startup Meetup',
        'Monthly startup meetup for founders, investors, and enthusiasts.',
        'WeWork Hudson Yards',
        '450 W 33rd St, New York, NY 10001',
        NOW() + INTERVAL '14 days',
        NOW() + INTERVAL '14 days' + INTERVAL '3 hours',
        ARRAY['startup', 'networking', 'entrepreneurship'],
        40.7128,
        -74.0060,
        100
    );
*/
```

### Step 3.3: Verify Tables Created

1. Go to **Table Editor** in left sidebar
2. You should see these tables:
   - ✅ users
   - ✅ events
   - ✅ agenda_items
   - ✅ registrations
   - ✅ check_ins
   - ✅ friendships
   - ✅ messages
   - ✅ posts
   - ✅ post_likes
   - ✅ comments
   - ✅ ai_matches
   - ✅ meeting_appointments
   - ✅ beacon_detections

---

## 4. Storage Buckets Setup

### Step 4.1: Create Storage Buckets

1. Go to **Storage** in left sidebar
2. Click **"New bucket"** and create these buckets:

| Bucket Name | Public | Description             |
| ----------- | ------ | ----------------------- |
| `avatars`   | ✅ Yes | User profile pictures   |
| `posts`     | ✅ Yes | Post images             |
| `events`    | ✅ Yes | Event logos and banners |
| `venues`    | ✅ Yes | Venue maps and 3D maps  |

### Step 4.2: Set Storage Policies

Go to **SQL Editor** and run:

```sql
-- Storage Policies for avatars bucket
CREATE POLICY "Avatar images are publicly accessible" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');

CREATE POLICY "Authenticated users can upload avatars" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.role() = 'authenticated');

CREATE POLICY "Users can update their own avatars" ON storage.objects
  FOR UPDATE USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own avatars" ON storage.objects
  FOR DELETE USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Storage Policies for posts bucket
CREATE POLICY "Post images are publicly accessible" ON storage.objects
  FOR SELECT USING (bucket_id = 'posts');

CREATE POLICY "Authenticated users can upload post images" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'posts' AND auth.role() = 'authenticated');

CREATE POLICY "Users can delete their own post images" ON storage.objects
  FOR DELETE USING (bucket_id = 'posts' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Storage Policies for events bucket
CREATE POLICY "Event images are publicly accessible" ON storage.objects
  FOR SELECT USING (bucket_id = 'events');

CREATE POLICY "Organizers can upload event images" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'events' AND auth.role() = 'authenticated');

-- Storage Policies for venues bucket
CREATE POLICY "Venue maps are publicly accessible" ON storage.objects
  FOR SELECT USING (bucket_id = 'venues');

CREATE POLICY "Organizers can upload venue maps" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'venues' AND auth.role() = 'authenticated');
```

---

## 5. Realtime Configuration

### Step 5.1: Enable Realtime (Already done in schema)

The schema already enables realtime for:

- `messages` - For live chat
- `posts` - For social feed updates
- `comments` - For live comments
- `friendships` - For friend request notifications
- `meeting_appointments` - For meeting updates

### Step 5.2: Verify Realtime is Enabled

1. Go to **Database** → **Replication**
2. Ensure these tables are in the publication list

---

## 6. Get API Keys

### Step 6.1: Find Your Keys

1. Go to **Project Settings** (gear icon) → **API**
2. You'll find:

```
Project URL: https://YOUR_PROJECT_REF.supabase.co
API Key (anon/public): eyJhbGc...
API Key (service_role): eyJhbGc... (KEEP SECRET!)
```

### Step 6.2: Keys You Need for the App

Copy these two values:

| Key                 | What it's for                  |
| ------------------- | ------------------------------ |
| **Project URL**     | `SUPABASE_URL` in the app      |
| **anon public key** | `SUPABASE_ANON_KEY` in the app |

⚠️ **NEVER use the service_role key in the mobile app!**

---

## 7. Update App Configuration

### Step 7.1: Update supabase.ts

Open `services/supabase.ts` and update these lines:

```typescript
// Replace with your new Supabase credentials
const SUPABASE_URL = "https://YOUR_PROJECT_REF.supabase.co";
const SUPABASE_ANON_KEY = "YOUR_ANON_KEY_HERE";
```

### Step 7.2: Create Environment File (Recommended)

Create `.env` file in root:

```env
EXPO_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=YOUR_ANON_KEY_HERE
```

Then update `services/supabase.ts`:

```typescript
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;
```

---

## 8. Testing Checklist

### Step 8.1: Test Authentication

1. Run the app
2. Try signing up with a new email
3. Check **Authentication** → **Users** in Supabase dashboard
4. Verify user appears in both `auth.users` AND `public.users`

### Step 8.2: Test Database Operations

Run these queries in SQL Editor to verify:

```sql
-- Check all tables exist
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

-- Check RLS is enabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public';

-- Check triggers exist
SELECT trigger_name, event_object_table
FROM information_schema.triggers
WHERE trigger_schema = 'public';
```

### Step 8.3: Test Storage

1. Go to **Storage** in dashboard
2. Try uploading a test image to each bucket
3. Verify the image URL is accessible

---

## 📊 Feature Mapping Summary

| App Feature          | Database Tables                    | Status |
| -------------------- | ---------------------------------- | ------ |
| Sign up/Sign in      | `auth.users`, `users`              | ✅     |
| Create Profile       | `users`                            | ✅     |
| Discover Events      | `events`                           | ✅     |
| Event Registration   | `registrations`                    | ✅     |
| Auto Check-in/out    | `check_ins`                        | ✅     |
| Digital Badge        | `users`, `events`, `registrations` | ✅     |
| AI Matchmaking       | `ai_matches`                       | ✅     |
| Social Feed          | `posts`, `post_likes`, `comments`  | ✅     |
| Direct Messaging     | `messages`                         | ✅     |
| Friends              | `friendships`                      | ✅     |
| Meeting Appointments | `meeting_appointments`             | ✅     |
| Indoor Navigation    | `agenda_items`                     | ✅     |
| Beacon/Dwell Time    | `beacon_detections`                | ✅     |
| Organizer Analytics  | `organizer_event_analytics` (view) | ✅     |

---

## 🎨 Brand Colors Reference

For reference in any dashboard customization:

- Primary Dark: `#260848`
- Primary Main: `#2A0D4B`
- Primary Light: `#220444`
- Accent: `#4654A1`
- White: `#FFFFFF`

---

## ❓ Troubleshooting

### "User not found" after signup

- Check if `handle_new_user()` trigger exists
- Run the trigger creation SQL again

### "Permission denied" errors

- Verify RLS policies are created
- Check user is authenticated

### Storage upload fails

- Verify bucket exists and is public
- Check storage policies exist

### Realtime not working

- Verify table is in replication publication
- Check browser console for websocket errors

---

## 📝 Next Steps After Setup

1. **Test all authentication flows**
2. **Create a test event in the dashboard**
3. **Test event registration from the app**
4. **Verify check-in/check-out works**
5. **Test messaging between users**

---

**Document Version:** 1.0  
**Last Updated:** January 21, 2026  
**Project:** NetVent Event Attendee Mobile App
