// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
// deno-lint-ignore-file
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.5";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

serve(async (req) => {
  const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = Deno.env.toObject();
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  try {
    const body = await req.json();
    const { id, active, increment_times_used } = body;

    if (!id) {
      return new Response(JSON.stringify({ error: "Missing bean ID" }), { status: 400 });
    }

    const updates: any = {};

    // Handle incrementing times_used
    if (
      typeof increment_times_used === "number" &&
      Number.isInteger(increment_times_used)
    ) {
      const { data, error } = await supabase
        .from("beans")
        .select("times_used")
        .eq("id", id)
        .single();

      if (error) {
        console.error("Fetch error:", error);
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
      }

      const currentTimesUsed = data.times_used || 0;
      const newTimesUsed = Math.max(currentTimesUsed + increment_times_used, 0); // safeguard

      updates.times_used = newTimesUsed;
    }

    if (typeof active === "boolean") {
      updates.active = active;
    }

    const { error: updateError } = await supabase
      .from("beans")
      .update(updates)
      .eq("id", id);

    if (updateError) {
      console.error("Update error:", updateError);
      return new Response(JSON.stringify({ error: updateError.message }), { status: 500 });
    }

    return new Response(JSON.stringify({ success: true }), { status: 200 });

  } catch (err) {
    console.error("Unexpected error:", err);
    return new Response(JSON.stringify({ error: "Invalid request body" }), { status: 400 });
  }
});

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/updateBean' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{"name":"Functions"}'

*/
