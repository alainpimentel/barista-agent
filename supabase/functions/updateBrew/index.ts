// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
// supabase/functions/updateBrew/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.5";
import { VALID_BREW_METHODS, BrewMethod } from "../../shared/constants.ts";

serve(async (req) => {
  const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = Deno.env.toObject();
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  try {
    const body = await req.json();
    const { id, ...updates } = body;

    if (!id) {
      return new Response(JSON.stringify({ error: "Missing brew ID" }), { status: 400 });
    }

    const updateFields: Record<string, any> = {};

    for (const key of Object.keys(updates)) {
      if (key === "method") {
        const method = String(updates.method).toLowerCase();
        if (!VALID_BREW_METHODS.includes(method as BrewMethod)) {
          return new Response(JSON.stringify({ error: `Invalid brew method: ${method}` }), {
            status: 400,
          });
        }
        updateFields.method = method;
      } else {
        updateFields[key] = updates[key];
      }
    }

    const { error } = await supabase
      .from("brews")
      .update(updateFields)
      .eq("id", id);

    if (error) {
      console.error("Update error:", error);
      return new Response(JSON.stringify({ error: error.message }), { status: 500 });
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

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/updateBrew' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{"name":"Functions"}'

*/
