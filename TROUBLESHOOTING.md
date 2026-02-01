# Troubleshooting Guide

## Authentication Error: "AuthRetryableFetchError: Failed to fetch"

This error indicates that the app cannot connect to your Supabase instance. Here are the steps to resolve it:

### 1. Check Supabase Project Status

**Problem:** Your Supabase project may be paused (common with free tier after inactivity)

**Solution:**

1. Go to https://supabase.com/dashboard
2. Select your project: `ylelzeihqkynbppmysam`
3. Check if it shows "Paused" status
4. If paused, click **"Restore"** to reactivate it
5. Wait 2-3 minutes for the project to fully start

### 2. Verify Internet Connection

**Problem:** Network connectivity issues

**Solution:**

1. Check your internet connection
2. Try accessing https://ylelzeihqkynbppmysam.supabase.co in your browser
3. If you get a response (even if it's an error page), the server is reachable
4. Check if you're behind a corporate firewall or VPN that might block Supabase

### 3. Test the Connection

**Solution:**

1. Navigate to the Test Connection screen in your app: `/test-connection`
2. This will show you detailed connection diagnostics
3. Look for specific error messages that can help identify the issue

### 4. Check Supabase Configuration

**Problem:** Incorrect API keys or URL

**Solution:**

1. Go to your Supabase dashboard
2. Navigate to Settings → API
3. Verify these values match what's in [`services/supabase.ts`](services/supabase.ts):
   - **Project URL:** `https://ylelzeihqkynbppmysam.supabase.co`
   - **Anon/Public Key:** Should start with `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

### 5. Enable Email Authentication

**Problem:** Email authentication not enabled in Supabase

**Solution:**

1. Go to Supabase Dashboard → Authentication → Providers
2. Ensure **Email** provider is enabled
3. Configure email settings:
   - Enable "Confirm email" if you want email verification
   - Or disable it for testing purposes
4. Save changes

### 6. Check CORS Settings (Web Platform)

**Problem:** CORS blocking requests from web platform

**Solution:**

1. Go to Supabase Dashboard → Settings → API
2. Under "API Settings", check CORS configuration
3. For development, you can allow all origins with `*`
4. For production, add your specific domain

### 7. Clear Storage and Retry

**Problem:** Corrupted auth token in storage

**Solution:**

For Web:

```javascript
// Open browser console and run:
localStorage.clear();
// Then refresh the page
```

For Native App:

```bash
# Clear app data on device
# iOS: Delete app and reinstall
# Android: Settings → Apps → Your App → Clear Data
```

### 8. Check Network Logs

**Solution:**

1. Open browser DevTools (F12)
2. Go to Network tab
3. Try to sign up again
4. Look for failed requests to `supabase.co`
5. Click on the failed request to see:
   - Status code
   - Response body
   - Request headers

Common status codes and their meaning:

- **0 or failed:** Cannot reach server (network/CORS issue)
- **400:** Bad request (check request format)
- **401:** Unauthorized (check API key)
- **403:** Forbidden (check permissions)
- **500:** Server error (Supabase issue)

### 9. Verify Database Setup

**Problem:** Database tables not created or triggers not set up

**Solution:**

1. Go to Supabase Dashboard → SQL Editor
2. Run the migration files in order:
   ```sql
   -- Run database/schema.sql first
   -- Then run database/migration.sql
   -- Then run database/migration_v2_meetings.sql
   -- Finally run database/migration_v3_auto_user_profile.sql (IMPORTANT!)
   ```
3. Verify tables exist:
   ```sql
   SELECT table_name FROM information_schema.tables
   WHERE table_schema = 'public';
   ```
4. Verify the trigger exists:
   ```sql
   SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created';
   ```

### 9b. Fix RLS Policy Error

**Problem:** Error "new row violates row-level security policy for table 'users'"

**Solution:**
This happens when the database trigger isn't set up. The trigger automatically creates user profiles when someone signs up.

**Quick Fix - Run this SQL:**

```sql
-- Create the auto-profile creation function and trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, email, name, interests, role)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
        '{}',
        'attendee'
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

Or run the complete migration file: [`database/migration_v3_auto_user_profile.sql`](database/migration_v3_auto_user_profile.sql)

### 10. Check Row Level Security (RLS)

**Problem:** RLS policies blocking operations

**Solution:**

1. Go to Supabase Dashboard → Authentication → Policies
2. Verify the `users` table has these policies:
   - ✅ Allow users to insert their own profile
   - ✅ Allow users to read their own profile
   - ✅ Allow users to update their own profile
3. Check if policies are enabled (they should be)

### 11. Temporary Workaround for Development

If you need to test immediately while troubleshooting, you can temporarily disable RLS:

⚠️ **WARNING:** Only do this for development/testing. Re-enable before production!

```sql
-- Temporarily disable RLS on users table
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
```

To re-enable later:

```sql
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
```

## Quick Checklist

- [ ] Supabase project is active (not paused)
- [ ] Internet connection is working
- [ ] Can access Supabase URL in browser
- [ ] API keys are correct in `services/supabase.ts`
- [ ] Email authentication is enabled in Supabase
- [ ] Database tables are created
- [ ] **Auto-profile trigger is set up** (migration_v3) ⚠️ IMPORTANT
- [ ] RLS policies are configured
- [ ] Storage cleared and app restarted

## Still Having Issues?

### Check Supabase Status

Visit https://status.supabase.com to see if there are any ongoing incidents.

### Enable Debug Mode

Add this to your `services/supabase.ts` for more detailed logs:

```typescript
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    // ... existing config
    debug: true, // Enable debug logging
  },
});
```

### Contact Support

If none of these solutions work:

1. Check Supabase Discord: https://discord.supabase.com
2. Post on Supabase GitHub Discussions: https://github.com/supabase/supabase/discussions
3. Include:
   - Error message
   - Network tab screenshot
   - Console logs
   - Platform (web/iOS/Android)

## Common Fixes Summary

| Error                     | Most Likely Fix                                             |
| ------------------------- | ----------------------------------------------------------- |
| Failed to fetch           | 1. Unpause Supabase project<br>2. Check internet connection |
| User already registered   | Sign in instead of sign up                                  |
| Invalid email or password | Check credentials                                           |
| Email not confirmed       | Check email or disable confirmation                         |
| 401 Unauthorized          | Check API keys                                              |
| 403 Forbidden             | Check RLS policies                                          |

## Development Best Practices

1. **Always test connection first** using the `/test-connection` screen
2. **Monitor console logs** for detailed error messages
3. **Use environment variables** for API keys (not hardcoded)
4. **Enable email confirmation** only after basic auth is working
5. **Test on real device** - web platform may have different issues than native
