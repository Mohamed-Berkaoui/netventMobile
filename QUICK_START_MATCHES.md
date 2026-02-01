# ⚡ Quick Start - AI Matches Edge Function

## TL;DR (30 Seconds)

```bash
# 1. Deploy
npm run functions:deploy

# 2. Get an event ID from your database (or use the sample event)
# Event ID: 4248d8b3-abae-4ff5-a61c-e0fd5e63fbf4

# 3. Calculate matches
npm run trigger-matches 4248d8b3-abae-4ff5-a61c-e0fd5e63fbf4

# 4. Check app - Connections → AI-Powered Matches
```

---

## What You Get

🎯 **AI-powered connection suggestions** between attendees  
📊 **Compatibility scores** (0-100)  
💡 **Reasons for matches** (shared interests, same company, etc.)  

---

## How Scoring Works

```
Shared Interest? → +15 per interest (max 60)
Same Company?    → +20
Complementary    → +25
roles?
━━━━━━━━━━━━━━━━━━━━━━━
Total (min 40 to show)
```

**Example**: Developer + Designer at same company + shared interests = 75% match

---

## One-Line Commands

| Task | Command |
|------|---------|
| Deploy | `npm run functions:deploy` |
| Test | `npm run trigger-matches <event-id>` |
| Check logs | `supabase functions logs calculate-matches --tail` |
| List functions | `supabase functions list` |

---

## Get Event ID

```sql
-- From Supabase Dashboard → SQL Editor
SELECT id, title FROM events LIMIT 5;
```

Or use sample event:
```
4248d8b3-abae-4ff5-a61c-e0fd5e63fbf4
```

---

## Verify It Works

### In App
1. Open **Connections** tab
2. See **"AI-Powered Matches"** at top
3. Should show suggested connections with scores

### In Database
```sql
SELECT score, reasons FROM ai_matches ORDER BY score DESC LIMIT 5;
```

---

## Troubleshoot

**Function not found?**
```bash
supabase functions deploy calculate-matches
```

**No matches?**
- Make sure users have `interests`, `company`, `position` filled
- Need at least 2 registered users
- Scores must be ≥ 40

**Want to customize?**
- Edit: `supabase/functions/calculate-matches/index.ts`
- Then: `npm run functions:deploy`

---

## Full Documentation

See [AI_MATCHES_GUIDE.md](./AI_MATCHES_GUIDE.md) for:
- Detailed setup
- Customization guide
- Automation options
- Troubleshooting
- Performance notes

---

**Run now:**
```bash
npm run functions:deploy && npm run trigger-matches 4248d8b3-abae-4ff5-a61c-e0fd5e63fbf4
```
