// supabase/functions/saveBrew/index.ts
// Edge Function – inserts a brew row, coercing floats to ints and omitting null / undefined fields

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.5";
import { VALID_BREW_METHODS } from "../../shared/constants.ts";

type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

// Remove keys whose values are null or undefined
function omitNullish(obj: Record<string, unknown>): Record<string, Json> {
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== undefined && v !== null)
  );
}

// Helper: round numeric value if finite, else undefined
const toInt = (v: unknown): number | undefined =>
  Number.isFinite(v as number) ? Math.round(v as number) : undefined;

serve(async (req) => {
  const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = Deno.env.toObject();
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  try {
    const body = await req.json();

    const [valid, reason] = isValidBrew(body);
    if (!valid)
      return new Response(JSON.stringify({ error: reason }), { status: 400 });

    const normalizedMethod = (body.method as string).toLowerCase();

    const brewPayload = omitNullish({
      // Required (coerce to int where appropriate)
      bean_id: body.bean_id,
      method: normalizedMethod,
      dose_in_g: body.dose_in_g,
      yield_out_g: body.yield_out_g,
      brew_time_sec: toInt(body.brew_time_sec),
      water_temp_c: toInt(body.water_temp_c),
      grind_setting: toInt(body.grind_setting),

      // Optional core
      notes: body.notes,
      ai_used: body.ai_used,
      ai_suggestion: body.ai_suggestion,
      rating: body.rating,
      flavor_notes: body.flavor_notes,

      // Bean metadata
      bean_name: body.bean_name,
      bean_origin: body.bean_origin,
      bean_process: body.bean_process,
      bean_notes: body.bean_notes,

      // Rating breakdown – coerce floats to ints if finite
      acidity:            toInt(body.acidity),
      bitterness:         toInt(body.bitterness),
      body:               toInt(body.body),
      balance:            toInt(body.balance),
      clarity:            toInt(body.clarity),
      sweetness_detected: toInt(body.sweetness_detected),
      crema_quality:      toInt(body.crema_quality),
      overall_rating:     toInt(body.overall_rating),

      // Arrays / strings
      finish_tags: Array.isArray(body.finish_tags) ? body.finish_tags : undefined,
      flavor_tags: Array.isArray(body.flavor_tags) ? body.flavor_tags : undefined,
      user_notes:  typeof body.user_notes === "string" ? body.user_notes : undefined,
    });

    const { data, error } = await supabase
      .from("brews")
      .insert(brewPayload)
      .select("*")
      .single();

    if (error) {
      console.error("Insert error:", error);
      return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }

    return new Response(JSON.stringify({ brew: data }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Unexpected error:", err);
    return new Response(JSON.stringify({ error: "Invalid request body" }), {
      status: 400,
    });
  }
});

function isValidBrew(payload: any): [boolean, string?] {
  if (!payload?.bean_id || typeof payload.bean_id !== "string") {
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

  // Brew time, temp, grind can be float, we'll coerce later
  return [true];
}
