// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
// supabase/functions/saveBrew/index.ts

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.5";
import { VALID_BREW_METHODS, BrewMethod } from "../../shared/constants.ts";

serve(async (req) => {
  const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = Deno.env.toObject();
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  try {
    const body = await req.json();

    const {
      bean_id,
      method,
      dose_in_g,
      yield_out_g,
      brew_time_sec,
      water_temp_c,
      grind_setting,
      notes,
      ai_used,
      ai_suggestion,
      rating,
      flavor_notes,

      // flattened bean info
      bean_name,
      bean_origin,
      bean_process,
      bean_notes,

      // rating fields
      acidity,
      bitterness,
      body,
      balance,
      clarity,
      sweetness_detected,
      crema_quality,
      finish_tags,
      flavor_tags,
      user_notes,
      overall_rating,
    } = body;

    const [valid, reason] = isValidBrew(body);
    if (!valid) {
      return new Response(JSON.stringify({ error: reason }), { status: 400 });
    }

    const normalizedMethod = method?.toLowerCase();

    if (!VALID_BREW_METHODS.includes(normalizedMethod)) {
      return new Response(JSON.stringify({ error: `Invalid method: ${method}` }), { status: 400 });
    }

    const { error } = await supabase.from("brews").insert({
      bean_id,
      method: normalizedMethod,
      dose_in_g,
      yield_out_g,
      brew_time_sec,
      water_temp_c,
      grind_setting,
      notes,
      ai_used,
      ai_suggestion,
      rating,
      flavor_notes,

      // new bean metadata
      bean_name,
      bean_origin,
      bean_process,
      bean_notes,

      // new rating fields
      acidity,
      bitterness,
      body,
      balance,
      clarity,
      sweetness_detected,
      crema_quality,
      finish_tags,
      flavor_tags,
      user_notes,
      overall_rating,
    });

    if (error) {
      console.error("Insert error:", error);
      return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }

    return new Response(JSON.stringify({ success: true }), { status: 200 });

  } catch (err) {
    console.error("Unexpected error:", err);
    return new Response(JSON.stringify({ error: "Invalid request body" }), { status: 400 });
  }
});


function isValidBrew(payload: any): [boolean, string?] {
  if (!payload.bean_id || typeof payload.bean_id !== "string") {
    return [false, "Missing or invalid 'bean_id'. It must be a valid UUID string."];
  }

  const method = (payload.method || "").toLowerCase();
  if (!VALID_BREW_METHODS.includes(method)) {
    return [
      false,
      `Invalid 'method': '${payload.method}'. Must be one of: ${VALID_BREW_METHODS.join(", ")}.`,
    ];
  }

  if (
    typeof payload.dose_in_g !== "number" ||
    isNaN(payload.dose_in_g) ||
    payload.dose_in_g <= 0
  ) {
    return [false, "'dose_in_g' must be a number greater than 0."];
  }

  if (
    typeof payload.yield_out_g !== "number" ||
    isNaN(payload.yield_out_g) ||
    payload.yield_out_g <= 0
  ) {
    return [false, "'yield_out_g' must be a number greater than 0."];
  }

  if (
    typeof payload.brew_time_sec !== "number" ||
    !Number.isInteger(payload.brew_time_sec) ||
    payload.brew_time_sec <= 0
  ) {
    return [false, "'brew_time_sec' must be a positive integer."];
  }

  if (
    typeof payload.water_temp_c !== "number" ||
    !Number.isInteger(payload.water_temp_c) ||
    payload.water_temp_c < 80 ||
    payload.water_temp_c > 100
  ) {
    return [
      false,
      `'water_temp_c' must be an integer between 80 and 100. You provided: ${payload.water_temp_c}`,
    ];
  }

  if (
    typeof payload.grind_setting !== "number" ||
    !Number.isInteger(payload.grind_setting) ||
    payload.grind_setting < 0
  ) {
    return [
      false,
      `'grind_setting' must be an integer >= 0. You provided: ${payload.grind_setting}`,
    ];
  }

  return [true];
}


/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/saveBrew' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{"name":"Functions"}'

*/
