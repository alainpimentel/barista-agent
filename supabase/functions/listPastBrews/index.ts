// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.5";
import { VALID_BREW_METHODS } from "../../shared/constants.ts";

serve(async (req) => {
  const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = Deno.env.toObject();
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  // --- Parse query params ---
  const url = new URL(req.url);
  const limit = Math.min(Number(url.searchParams.get("limit")) || 5, 50);
  const bean_id = url.searchParams.get("bean_id") ?? undefined;
  const method  = url.searchParams.get("method")?.toLowerCase();

  if (method && !VALID_BREW_METHODS.includes(method)) {
    return new Response(
      JSON.stringify({ error: `Invalid method ${method}` }),
      { status: 400 }
    );
  }

  // --- Build query ---
  let query = supabase
    .from("brews")
    .select("*")
    .order("brewed_at", { ascending: false })
    .limit(limit);

  if (bean_id) query = query.eq("bean_id", bean_id);
  if (method)   query = query.eq("method", method);

  const { data, error } = await query;

  if (error) {
    console.error("Query error:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  return new Response(JSON.stringify({ brews: data }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});


/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/listPastBrews' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{"name":"Functions"}'

*/
