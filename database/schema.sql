-- ============================================
-- Event Attendee App - Supabase Database Schema
-- ============================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- Users Table
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
-- Events Table
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
    organizer_id UUID REFERENCES users(id),
    venue_map_url TEXT,
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

-- ============================================
-- Event Sessions Table
-- Agenda Items Table (for indoor navigation/schedule)
-- ============================================
CREATE TABLE IF NOT EXISTS agenda_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    location_name TEXT NOT NULL,
    floor INTEGER NOT NULL,
    x_position DOUBLE PRECISION NOT NULL, -- Percentage 0-100
    y_position DOUBLE PRECISION NOT NULL, -- Percentage 0-100
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for agenda items
ALTER TABLE agenda_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view agenda items" ON agenda_items
    FOR SELECT USING (true);

-- ============================================
-- Registrations Table
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

CREATE POLICY "Users can register for events" ON registrations
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own registrations" ON registrations
    FOR UPDATE USING (auth.uid() = user_id);

-- ============================================
-- Check-ins Table
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

CREATE POLICY "Users can create own check-ins" ON check_ins
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own check-ins" ON check_ins
    FOR UPDATE USING (auth.uid() = user_id);

-- ============================================
-- Friendships Table
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

-- ============================================
-- Messages Table
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
-- Posts Table
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
-- Post Likes Table
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
-- Comments Table
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
-- AI Matches Table
-- ============================================
CREATE TABLE IF NOT EXISTS ai_matches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    matched_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    score DOUBLE PRECISION NOT NULL, -- 0-100
    reasons TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, matched_user_id, event_id)
);

-- RLS for AI matches
ALTER TABLE ai_matches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own matches" ON ai_matches
    FOR SELECT USING (auth.uid() = user_id);

-- ============================================
-- Triggers for updating counts and timestamps
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
-- Storage Buckets
-- ============================================
-- Run these in Supabase Dashboard or via API:
-- 
-- INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true);
-- INSERT INTO storage.buckets (id, name, public) VALUES ('posts', 'posts', true);
-- INSERT INTO storage.buckets (id, name, public) VALUES ('events', 'events', true);
--
-- Storage policies:
-- CREATE POLICY "Avatar images are publicly accessible" ON storage.objects 
--   FOR SELECT USING (bucket_id = 'avatars');
-- CREATE POLICY "Anyone can upload an avatar" ON storage.objects 
--   FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.role() = 'authenticated');
-- CREATE POLICY "Post images are publicly accessible" ON storage.objects 
--   FOR SELECT USING (bucket_id = 'posts');
-- CREATE POLICY "Authenticated users can upload post images" ON storage.objects 
--   FOR INSERT WITH CHECK (bucket_id = 'posts' AND auth.role() = 'authenticated');

-- ============================================
-- Sample Data (Optional)
-- ============================================

-- Sample events for testing
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
    ),
    (
        'AI Summit',
        'Explore the future of artificial intelligence with industry leaders.',
        'Seattle Convention Center',
        '705 Pike St, Seattle, WA 98101',
        NOW() + INTERVAL '21 days',
        NOW() + INTERVAL '22 days',
        ARRAY['ai', 'machine-learning', 'technology'],
        47.6062,
        -122.3321,
        200
    );

-- Enable realtime for messages
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
ALTER PUBLICATION supabase_realtime ADD TABLE posts;
ALTER PUBLICATION supabase_realtime ADD TABLE comments;
ALTER PUBLICATION supabase_realtime ADD TABLE friendships;
