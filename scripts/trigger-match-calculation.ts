/**
 * Script to trigger AI match calculation for an event
 * 
 * Usage:
 * npx ts-node scripts/trigger-match-calculation.ts <eventId>
 */

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function triggerMatchCalculation(eventId: string) {
  console.log(`Triggering match calculation for event: ${eventId}`);

  try {
    // Call the Edge Function
    const { data, error } = await supabase.functions.invoke(
      "calculate-matches",
      {
        body: { eventId },
      }
    );

    if (error) {
      console.error("Error:", error);
      process.exit(1);
    }

    console.log("Match calculation result:", data);
    console.log(`✅ Successfully calculated matches!`);
  } catch (err) {
    console.error("Failed to trigger match calculation:", err);
    process.exit(1);
  }
}

const eventId = process.argv[2];
if (!eventId) {
  console.error("Please provide an event ID: npm run trigger-matches <eventId>");
  process.exit(1);
}

triggerMatchCalculation(eventId);
