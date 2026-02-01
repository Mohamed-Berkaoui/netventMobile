/**
 * Supabase Edge Function: Calculate AI Matches
 * 
 * Matches event attendees based on shared interests.
 * Users with at least 1 common interest are suggested as friends.
 * 
 * POST https://your-project.supabase.co/functions/v1/calculate-matches
 * Body: { eventId: "event-uuid" }
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

interface User {
  id: string;
  name: string;
  email: string;
  interests: string[];
}

interface MatchResult {
  score: number;
  sharedInterests: string[];
}

/**
 * Calculate match based on shared interests
 * Score = (shared interests / total unique interests) * 100
 */
function calculateMatchScore(userA: User, userB: User): MatchResult {
  // If either user has no interests, no match
  if (!userA.interests?.length || !userB.interests?.length) {
    return { score: 0, sharedInterests: [] };
  }

  // Find common interests (case-insensitive)
  const interestsA = userA.interests.map(i => i.toLowerCase().trim());
  const interestsB = userB.interests.map(i => i.toLowerCase().trim());
  
  const sharedInterests = userA.interests.filter(interest => 
    interestsB.includes(interest.toLowerCase().trim())
  );

  // No shared interests = no match
  if (sharedInterests.length === 0) {
    return { score: 0, sharedInterests: [] };
  }

  // Calculate score: percentage of overlap
  // Using Jaccard similarity: intersection / union
  const uniqueInterests = new Set([...interestsA, ...interestsB]);
  const score = Math.round((sharedInterests.length / uniqueInterests.size) * 100);

  return { score, sharedInterests };
}

/**
 * Main function to calculate matches for an event
 */
async function calculateMatches(
  eventId: string,
  supabase: ReturnType<typeof createClient>
) {
  console.log(`Starting interest-based matching for event: ${eventId}`);

  try {
    // 1. Get all attendees registered for the event
    const { data: registrations, error: regError } = await supabase
      .from("registrations")
      .select(
        `
        user_id,
        users:users(id, name, email, interests)
      `
      )
      .eq("event_id", eventId)
      .eq("status", "registered");

    if (regError) throw regError;
    if (!registrations || registrations.length === 0) {
      console.log("No registered attendees found for event");
      return {
        success: true,
        matchesCreated: 0,
        message: "No attendees to match",
      };
    }

    const attendees = registrations
      .map((reg: any) => reg.users)
      .filter(Boolean) as User[];

    console.log(`Found ${attendees.length} attendees`);

    // 2. Calculate matches between all pairs based on shared interests
    const matchesToInsert: any[] = [];

    for (let i = 0; i < attendees.length; i++) {
      for (let j = i + 1; j < attendees.length; j++) {
        const userA = attendees[i];
        const userB = attendees[j];

        const match = calculateMatchScore(userA, userB);

        // Only create matches if they share at least 1 interest
        if (match.sharedInterests.length > 0) {
          const reason = `${match.sharedInterests.length} shared interest${match.sharedInterests.length !== 1 ? "s" : ""}: ${match.sharedInterests.join(", ")}`;
          
          // Add match for both users (A→B and B→A)
          matchesToInsert.push({
            user_id: userA.id,
            matched_user_id: userB.id,
            event_id: eventId,
            score: match.score,
            reasons: [reason],
          });
          
          matchesToInsert.push({
            user_id: userB.id,
            matched_user_id: userA.id,
            event_id: eventId,
            score: match.score,
            reasons: [reason],
          });
        }
      }
    }

    console.log(`Found ${matchesToInsert.length / 2} unique matches`);

    // 3. Delete existing matches for this event
    const { error: deleteError } = await supabase
      .from("ai_matches")
      .delete()
      .eq("event_id", eventId);

    if (deleteError) throw deleteError;

    // 4. Insert new matches
    if (matchesToInsert.length > 0) {
      const { error: insertError } = await supabase
        .from("ai_matches")
        .upsert(matchesToInsert, {
          onConflict: "user_id,matched_user_id,event_id",
        });

      if (insertError) throw insertError;

      console.log(`Successfully created ${matchesToInsert.length} match records`);
    }

    return {
      success: true,
      matchesCreated: matchesToInsert.length / 2, // Unique pairs
      attendeesProcessed: attendees.length,
      message: `Found ${matchesToInsert.length / 2} friend suggestions based on shared interests`,
    };
  } catch (error) {
    console.error("Error calculating matches:", error);
    throw error;
  }
}

/**
 * HTTP Handler
 */
Deno.serve(async (req) => {
  // Enable CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "authorization, content-type",
      },
    });
  }

  try {
    // Verify request is POST
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Get event ID from request body
    const body = await req.json();
    const { eventId } = body;

    if (!eventId) {
      return new Response(
        JSON.stringify({ error: "eventId is required" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Initialize Supabase client with service role
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") || "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || ""
    );

    // Calculate matches
    const result = await calculateMatches(eventId, supabase);

    return new Response(JSON.stringify(result), {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      status: 200,
    });
  } catch (error) {
    console.error("Function error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
        status: 500,
      }
    );
  }
});
