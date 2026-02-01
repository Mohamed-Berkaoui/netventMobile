# 📊 AI Matching System - Visual Guide

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                          Your Event                             │
│                    (100 Registered Attendees)                   │
└──────────────────┬──────────────────────────────────────────────┘
                   │
                   ├─ John (Developer)
                   │  └─ Interests: AI, startup, design
                   │  └─ Company: TechCorp
                   │
                   ├─ Sarah (Designer)
                   │  └─ Interests: design, product, startup
                   │  └─ Company: TechCorp
                   │
                   ├─ Mike (Investor)
                   │  └─ Interests: startup, AI, tech
                   │  └─ Company: VentureFund
                   │
                   └─ ... 96 more attendees
                   
                            ▼
                   
         ┌──────────────────────────────┐
         │    Edge Function Triggers    │
         │  (Calculate Matches)         │
         │                              │
         │  1. Fetch 100 users          │
         │  2. Compare each pair        │
         │  3. Calculate scores         │
         │  4. Save top matches         │
         └──────────────┬───────────────┘
                        │
                        ▼
         ┌──────────────────────────────┐
         │    Matching Algorithm        │
         │                              │
         │  John ↔ Sarah:               │
         │  • Shared: design (15)       │
         │  • Company: same (20)        │
         │  • Roles: dev+designer (25)  │
         │  ─────────────────────────   │
         │  = 60% Match ✅              │
         │                              │
         │  Mike ↔ John:                │
         │  • Shared: AI, startup (30)  │
         │  • Company: different (0)    │
         │  • Roles: investor+dev (25)  │
         │  ─────────────────────────   │
         │  = 55% Match ✅              │
         └──────────────┬───────────────┘
                        │
                        ▼
         ┌──────────────────────────────┐
         │   Supabase ai_matches Table  │
         │                              │
         │  John → Sarah (60%)          │
         │  John → Mike (55%)           │
         │  Sarah → John (65%)          │
         │  Mike → John (60%)           │
         │  Sarah → Mike (40%)          │
         │  (and 95+ more...)           │
         └──────────────┬───────────────┘
                        │
                        ▼
         ┌──────────────────────────────┐
         │     Mobile App Displays      │
         │    (Connections Tab)         │
         │                              │
         │  🤖 AI-Powered Matches       │
         │                              │
         │  ┌────────────────────────┐  │
         │  │ Sarah                  │  │
         │  │ ⭐ 65% Match           │  │
         │  │ • shared interests     │  │
         │  │ • same company         │  │
         │  │ • complementary roles  │  │
         │  └────────────────────────┘  │
         │                              │
         │  ┌────────────────────────┐  │
         │  │ Mike                   │  │
         │  │ ⭐ 60% Match           │  │
         │  │ • founder meets dev    │  │
         │  │ • mutual interests     │  │
         │  └────────────────────────┘  │
         └──────────────────────────────┘
```

---

## Score Distribution

### Sample Output (50 Attendees = ~1,225 comparisons)

```
Score Range    Count    Percentage
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
80-100         12       1%
60-79          85       7%    ✅ Created
40-59          240      20%   ✅ Created
0-39           888      72%   ❌ Filtered out
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Total Matches: 337 (27% of all pairs)
```

---

## Score Calculation Examples

### Example 1: Perfect Match

```
User A: Sarah (Designer)              User B: John (Developer)
├─ Interests: design, product, UI    ├─ Interests: product, design, code
├─ Company: TechCorp                 ├─ Company: TechCorp  
└─ Position: Design Lead             └─ Position: Senior Dev

Analysis:
  Shared interests: design, product = 2 × 15 = 30 ✓
  Same company: TechCorp            = 20 ✓
  Complementary: Designer + Dev     = 25 ✓
  ────────────────────────────────────────
  SCORE = 75% ⭐ Top Match!
  REASONS:
  • 2 shared interests: design, product
  • Both work at TechCorp
  • Complementary roles: Designer + Developer
```

### Example 2: Good Match

```
User A: Alice (Marketer)             User B: Bob (Founder)
├─ Interests: marketing, growth      ├─ Interests: growth, tech, startup
├─ Company: StartupX                 ├─ Company: StartupX
└─ Position: Growth Manager          └─ Position: Founder

Analysis:
  Shared interests: growth           = 1 × 15 = 15 ✓
  Same company: StartupX             = 20 ✓
  Complementary: Marketer + Founder  = 25 ✓
  ────────────────────────────────────────
  SCORE = 60% ⭐ Good Match
  REASONS:
  • 1 shared interest: growth
  • Both work at StartupX
  • Complementary roles: Marketer + Founder
```

### Example 3: Weak Match

```
User A: Charlie (QA)                 User B: Diana (HR)
├─ Interests: testing, automation    ├─ Interests: hiring, culture
├─ Company: BigCorp                  ├─ Company: BigCorp
└─ Position: QA Lead                 └─ Position: HR Manager

Analysis:
  Shared interests: (none)           = 0 ✓
  Same company: BigCorp              = 20 ✓
  Complementary: QA + HR             = 0 ✗
  ────────────────────────────────────────
  SCORE = 20% ❌ Below threshold
  (Not created - only 20 < 40)
```

---

## User Experience Flow

### Step 1: User Opens App

```
┌─────────────────────────────┐
│   Connections Tab           │
│                             │
│  📱 Loading AI Matches...   │
└─────────────────────────────┘
```

### Step 2: AI Matches Load

```
┌─────────────────────────────┐
│   🤖 AI-Powered Matches     │
│                             │
│   Found 12 matches for you! │
│                             │
│   ┌─────────────────────┐   │
│   │ 📍 Sarah            │   │
│   │ ⭐ 75% Match        │   │
│   │                     │   │
│   │ Software Designer   │   │
│   │ @ TechCorp          │   │
│   │                     │   │
│   │ Why you matched:    │   │
│   │ ✓ Same interests    │   │
│   │ ✓ Same company      │   │
│   │ ✓ Complementary     │   │
│   │   roles             │   │
│   │                     │   │
│   │ [Message] [Add]     │   │
│   └─────────────────────┘   │
│                             │
│   ┌─────────────────────┐   │
│   │ 📍 Mike             │   │
│   │ ⭐ 60% Match        │   │
│   │  ...                │   │
│   └─────────────────────┘   │
└─────────────────────────────┘
```

### Step 3: User Takes Action

```
User clicks "Message" 
    ▼
Starts conversation with matched user
    ▼
Builds meaningful connection
```

---

## Data Flow Diagram

```
┌─────────────────────┐
│   User Registers    │
│   for Event         │
│   (User Profile)    │
└──────────┬──────────┘
           │ Creates: registrations record
           │ Has: interests, company, position
           │
           ▼
┌─────────────────────┐
│  Admin Triggers     │
│  Match Calculation  │
│  (Manual or Auto)   │
└──────────┬──────────┘
           │ Calls: calculate-matches function
           │ Params: { eventId }
           │
           ▼
┌─────────────────────────────────────┐
│  Edge Function Processing           │
│  1. Query registrations             │
│  2. Get user profiles               │
│  3. Compare all pairs               │
│  4. Calculate compatibility         │
│  5. Filter score >= 40              │
│  6. Save to ai_matches              │
└──────────┬──────────────────────────┘
           │ Duration: 100-200ms
           │ Results: up to 500+ matches
           │
           ▼
┌─────────────────────┐
│  App Displays       │
│  AI Matches         │
│  (Connections Tab)  │
│                     │
│  Sorted by score:   │
│  • 80-100: Top      │
│  • 60-79: Good      │
│  • 40-59: Okay      │
└─────────────────────┘
```

---

## Customization Options

### Adjust Score Thresholds

```
Current Default: Show matches >= 40

Options:
├─ More matches: Lower to 30
│  (Shows 40% more, less accurate)
│
└─ Better quality: Raise to 50
   (Shows 30% fewer, higher quality)
```

### Add New Factors

```
Current Factors:
├─ Shared interests (+15 each)
├─ Same company (+20)
└─ Complementary roles (+25)

Possible Additions:
├─ Geographic proximity (+15)
├─ Similar experience level (+20)
├─ Same industry (+25)
├─ Availability timing (+10)
└─ Event role (speaker/attendee) (+10)
```

---

## Performance Metrics

```
Attendees  Processing Time  Matches Created
────────────────────────────────────────────
10         ~50ms            0-12
20         ~80ms            5-40
50         ~150ms           20-150
100        ~250ms           50-400
500        ~1.5s            500-2000
```

---

## What Makes a Good Match

### Tier 1: 🏆 Best Matches (80+%)

```
Developer + Designer
├─ Shared interests: 2+
├─ Same company
└─ Complementary roles
═════════════════════════════════════
Result: Likely to collaborate/network
```

### Tier 2: ⭐ Good Matches (60-79%)

```
Founder + Marketer
├─ Shared interests: 1
├─ Same industry
└─ Complementary roles
═════════════════════════════════════
Result: Valuable networking opportunity
```

### Tier 3: 👍 Okay Matches (40-59%)

```
Two Engineers
├─ Shared interests: 1
├─ Same company
└─ Similar but not complementary roles
═════════════════════════════════════
Result: Possible collaboration
```

### Tier 4: ❌ Poor Matches (<40%)

```
HR Manager + Finance Officer
├─ Shared interests: 0
├─ Different company
└─ No complementary advantage
═════════════════════════════════════
Result: Not shown (filtered out)
```

---

## Real World Scenario

### Your Event: Tech Conference 2026

**Total Attendees**: 250

**Calculation Steps**:
1. Function triggered
2. Fetches 250 user profiles
3. Compares: 250 × 249 / 2 = **31,125 pairs**
4. Calculates score for each
5. Filters (>= 40): ~6,000 matches
6. Inserts into database: **5-10 seconds**

**Result in App**:
- Each attendee sees: 20-50 suggestions
- Sorted by compatibility
- Can message/connect with 1-click

---

## Success Indicators

✅ App shows matches in Connections tab  
✅ Scores vary (not all 100%)  
✅ Reasons field explains why  
✅ Can message suggested connections  
✅ New matches appear after event registration  

---

**Ready to see it in action?**
```bash
npm run trigger-matches <event-id>
```

Then check the **Connections** tab in your app! 🚀
