# 🎯 Organizer Dashboard Development Prompt

## Project Context

You are building an **Organizer Dashboard** web application for the **NetVent** event management platform. This dashboard is the companion web app to an existing React Native/Expo mobile app for event attendees.

**The mobile app is already built** and uses **Supabase** as the backend. Your task is to create a web-based dashboard for event organizers to manage events and view analytics.

---

## 🎨 Brand Colors

Use these exact brand colors throughout the dashboard:

| Color Name    | Hex Code  | Usage                           |
| ------------- | --------- | ------------------------------- |
| Primary Dark  | `#260848` | Main backgrounds, headers       |
| Primary Main  | `#2A0D4B` | Secondary backgrounds           |
| Primary Light | `#220444` | Hover states, cards             |
| Accent        | `#4654A1` | Buttons, links, highlights      |
| White         | `#FFFFFF` | Text, icons on dark backgrounds |

**Design Style:** Modern, dark theme, professional, clean UI similar to Supabase/Vercel dashboards.

---

## 🔐 Supabase Configuration (Already Set Up)

The Supabase project is already configured with:

```
Project URL: https://vwkxqmgsrttogykhmasw.supabase.co
Anon Key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ3a3hxbWdzcnR0b2d5a2htYXN3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg5ODMzOTcsImV4cCI6MjA4NDU1OTM5N30.dr1W-jPek81rb0ak6rwft8UjK-VS7NnlQYBeNWVdgwk
```

---

## 📊 Existing Database Schema

The following tables already exist in Supabase:

### Users Table

```sql
users (
    id UUID PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    avatar_url TEXT,
    bio TEXT,
    company TEXT,
    position TEXT,
    interests TEXT[] DEFAULT '{}',
    role TEXT DEFAULT 'attendee', -- 'attendee' | 'organizer'
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
)
```

### Events Table

```sql
events (
    id UUID PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    logo_url TEXT,
    banner_url TEXT,
    venue_name TEXT NOT NULL,
    venue_address TEXT NOT NULL,
    latitude DOUBLE PRECISION NOT NULL,      -- For geofencing
    longitude DOUBLE PRECISION NOT NULL,     -- For geofencing
    radius_meters DOUBLE PRECISION DEFAULT 100,  -- Geofence radius
    start_date TIMESTAMPTZ NOT NULL,
    end_date TIMESTAMPTZ NOT NULL,
    interests TEXT[] DEFAULT '{}',           -- Event categories
    target_audience TEXT[] DEFAULT '{}',     -- For AI matching
    organizer_id UUID REFERENCES users(id),
    venue_map_url TEXT,                      -- 2D venue map
    venue_3d_map_url TEXT,                   -- 3D venue map
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
)
```

### Agenda Items Table (Sessions/Schedule)

```sql
agenda_items (
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
)
```

### Registrations Table

```sql
registrations (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    event_id UUID REFERENCES events(id),
    status TEXT DEFAULT 'registered', -- 'registered' | 'cancelled'
    qr_code TEXT,
    registered_at TIMESTAMPTZ,
    UNIQUE(user_id, event_id)
)
```

### Check-ins Table (Geofencing)

```sql
check_ins (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    event_id UUID REFERENCES events(id),
    type TEXT NOT NULL,              -- 'check_in' | 'check_out'
    timestamp TIMESTAMPTZ,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION
)
```

### Beacon Detections Table (Dwell Time via Bluetooth)

```sql
beacon_detections (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    event_id UUID REFERENCES events(id),
    beacon_id TEXT NOT NULL,         -- Physical beacon identifier
    rssi INTEGER,                    -- Signal strength
    detected_at TIMESTAMPTZ
)
```

### AI Matches Table

```sql
ai_matches (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    matched_user_id UUID REFERENCES users(id),
    event_id UUID REFERENCES events(id),
    score DOUBLE PRECISION NOT NULL,  -- 0-100 match score
    reasons TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ
)
```

### Meeting Appointments Table

```sql
meeting_appointments (
    id UUID PRIMARY KEY,
    requester_id UUID REFERENCES users(id),
    invitee_id UUID REFERENCES users(id),
    event_id UUID REFERENCES events(id),
    title TEXT,
    description TEXT,
    location TEXT,
    scheduled_time TIMESTAMPTZ,
    duration_minutes INTEGER DEFAULT 30,
    status TEXT DEFAULT 'pending',   -- 'pending' | 'accepted' | 'declined' | 'cancelled'
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
)
```

### Analytics View (Already Created)

```sql
organizer_event_analytics (
    event_id UUID,
    event_title TEXT,
    organizer_id UUID,
    start_date TIMESTAMPTZ,
    end_date TIMESTAMPTZ,
    registration_count INTEGER,
    checked_in_count INTEGER,
    checked_out_count INTEGER
)
```

### Storage Buckets (Already Created)

- `avatars` - User profile pictures
- `posts` - Post images
- `events` - Event logos and banners
- `venues` - Venue maps and 3D maps

---

## 🎯 Dashboard Features to Implement

### 1. Authentication

- Sign up / Sign in for organizers (email/password)
- User role must be 'organizer' to access dashboard
- Ability to switch between attendee and organizer roles

### 2. Dashboard Home

- Overview of all organizer's events
- Quick stats: Total events, total registrations, total attendees
- Upcoming events list
- Recent activity feed

### 3. Event Management

#### 3.1 Create/Edit Event Form

- **Basic Info:**
  - Event title
  - Description (rich text editor)
  - Start date & time
  - End date & time
- **Branding:**
  - Logo upload (stored in `events` bucket)
  - Banner image upload
- **Location & Geofencing:**
  - Venue name
  - Venue address
  - Interactive map to place pin (latitude/longitude)
  - Geofence radius slider (50m - 500m)
- **Venue Maps:**
  - Upload 2D venue map image
  - Upload 3D venue map (optional)
  - Define floor levels
- **Categories & Targeting:**
  - Event interests/categories (multi-select tags)
  - Target audience tags (for AI matching)
- **Agenda/Schedule Builder:**
  - Add sessions/talks
  - Set time, location, floor
  - Place on venue map (x, y coordinates)

#### 3.2 Event List View

- Table/card view of all events
- Filter by: status (upcoming/past/draft), date range
- Search by title
- Quick actions: Edit, Duplicate, Delete, View Analytics

### 4. Attendee Analytics

#### 4.1 Registration Analytics

- Total registrations over time (line chart)
- Registration rate (daily/weekly)
- Registration source breakdown
- Attendee list with:
  - Name, email, company, position
  - Registration date
  - Check-in status
  - Export to CSV/Excel

#### 4.2 Dwell Time Analytics

- Average dwell time per event
- Dwell time distribution (histogram)
- Peak attendance times (heatmap by hour)
- Individual attendee dwell times
- Calculate from check_ins table:
  ```
  Dwell Time = check_out.timestamp - check_in.timestamp
  ```

#### 4.3 Beacon/Zone Analytics (if beacons deployed)

- Zone popularity heatmap
- Average time per zone
- Traffic flow between zones
- Beacon signal strength analytics

#### 4.4 Live Event Dashboard

- Real-time check-in counter
- Live attendee count (who's currently inside)
- Recent check-ins feed
- Live map showing attendee density (if beacon data available)

### 5. AI Matchmaking Management

- View match statistics
- Configure matching weights
- View top matches generated
- Export match data

### 6. Reports & Export

- Generate PDF reports
- Export data to CSV/Excel
- Scheduled email reports (future)

---

## 🛠 Tech Stack Recommendation

### Frontend

- **Framework:** react
- **UI Library:** css
- **Charts:** Recharts or Chart.js
- **Maps:** Mapbox GL or Leaflet
- **State Management:** Zustand or React Query
- **Forms:** React Hook Form + Zod validation
- **Date/Time:** date-fns or dayjs

### Backend

- **Database:** Supabase (PostgreSQL) - already configured
- **Auth:** Supabase Auth
- **Storage:** Supabase Storage
- **Realtime:** Supabase Realtime for live updates

### File Structure

```
organizer-dashboard/
├── app/
│   ├── (auth)/
│   │   ├── sign-in/
│   │   └── sign-up/
│   ├── (dashboard)/
│   │   ├── layout.tsx
│   │   ├── page.tsx                 # Dashboard home
│   │   ├── events/
│   │   │   ├── page.tsx             # Events list
│   │   │   ├── new/page.tsx         # Create event
│   │   │   └── [id]/
│   │   │       ├── page.tsx         # Event details
│   │   │       ├── edit/page.tsx    # Edit event
│   │   │       └── analytics/page.tsx
│   │   ├── attendees/
│   │   │   └── page.tsx
│   │   ├── analytics/
│   │   │   └── page.tsx
│   │   └── settings/
│   │       └── page.tsx
│   ├── api/
│   └── globals.css
├── components/
│   ├── ui/                          # shadcn components
│   ├── charts/
│   ├── forms/
│   ├── maps/
│   └── layout/
├── lib/
│   ├── supabase.ts
│   ├── utils.ts
│   └── validators.ts
├── hooks/
├── stores/
└── types/
```

---

## 📱 Mobile App Features Reference

The mobile attendee app includes these features that the dashboard should complement:

1. **Auto Check-in/Check-out** - Via geofencing when attendee enters/exits venue
2. **Digital Badge** - Animated screen with attendee info, event logo, date
3. **AI Matchmaking** - Matches users based on interests and behavior
4. **Indoor Navigation** - Map-based navigation within venue
5. **Social Feed** - Posts, comments, likes
6. **Direct Messaging** - Chat between attendees
7. **Meeting Scheduling** - Book meetings with other attendees
8. **Bluetooth Beacon Detection** - For dwell time tracking in zones

---

## 🔒 RLS Policies (Already Configured)

Organizers can:

- Create events where they are the organizer
- Update/delete their own events
- View registrations for their events
- View check-ins for their events
- View beacon detections for their events
- Manage agenda items for their events

---

## 📋 Implementation Priority

### Phase 1: Core (MVP)

1. Authentication (organizer sign in)
2. Dashboard home with event overview
3. Create event form (basic fields)
4. Event list view
5. Basic registration analytics

### Phase 2: Enhanced

1. Complete event form (maps, agenda builder)
2. Dwell time analytics
3. Live event dashboard
4. Attendee list with export

### Phase 3: Advanced

1. Beacon/zone analytics
2. AI matchmaking management
3. PDF reports
4. 3D venue map support

---

## 🚀 Getting Started

1. Create a new Next.js project:

   ```bash
   npx create-next-app@latest organizer-dashboard --typescript --tailwind --eslint --app
   ```

2. Install dependencies:

   ```bash
   npm install @supabase/supabase-js @supabase/ssr
   npm install zustand react-hook-form zod @hookform/resolvers
   npm install recharts date-fns
   npm install lucide-react
   npx shadcn-ui@latest init
   ```

3. Configure Supabase client with the provided credentials

4. Start building from the authentication flow

---

## 📝 Additional Notes

- The dashboard should be fully responsive but optimized for desktop use
- Use dark mode by default (matching brand colors)
- Include loading states and error handling
- Implement optimistic updates where appropriate
- Use Supabase Realtime for live data in analytics
- Consider caching strategies for expensive queries (dwell time calculations)

---

**End of Prompt**

_Use this prompt to instruct an AI to build the Organizer Dashboard. The AI should have all the context needed to create a functional dashboard that integrates with the existing Supabase backend and complements the mobile attendee app._
