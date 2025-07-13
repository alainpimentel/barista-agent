// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
// supabase/functions/listActiveBeans/index.ts

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Create Supabase client using environment variables
  const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = Deno.env.toObject()

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

Deno.serve(async (_req) => {
  try {
    const { data, error } = await supabase
      .from("beans")
      .select("*")
      .eq("active", true)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Supabase query error:", error);
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    console.log("nmessi Fetched beans:", data);

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Function error:", err);
    return new Response(
      JSON.stringify({ error: "Unexpected error", details: err.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/listActiveBeans' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{"name":"Functions"}'

    PROD:
      supabase functions deploy listActiveBeans
      supabase functions serve

    DEV: (first supabase start) - http://127.0.0.1:54323/project/default
      1. Add table schemas from the real supa db
      2. Insert some data
      INSERT INTO public.beans (id, name, roaster, roast_date, process, origin, notes, active, times_used, created_at)
VALUES
  (gen_random_uuid(), 'Ethiopia Natural', 'La Cabra', '2025-06-15', 'natural', 'Ethiopia', 'Fruity and floral', true, 2, now()),
  (gen_random_uuid(), 'Colombia Washed', 'Cafe Granja', '2025-06-20', 'washed', 'Colombia', 'Clean, sweet acidity', true, 1, now()),
  (gen_random_uuid(), 'Kenya AA', 'Heart Roasters', '2025-07-01', 'washed', 'Kenya', 'Berry notes with big body', true, 0, now()),
  (gen_random_uuid(), 'Honduras Parainema', 'Don Foncho', '2025-05-25', 'honey', 'Honduras', 'Juicy, tropical finish', true, 3, now()),
  (gen_random_uuid(), 'Guatemala Huehuetenango', 'Onyx', '2025-06-05', 'washed', 'Guatemala', 'Chocolatey and nutty', false, 4, now());
      3. supabase functions serve listActiveBeans --env-file .env.local --no-verify-jwt

*/
