"use client";

import { createClient } from "@supabase/supabase-js";

// Browser-side client — safe to use in components. Uses the public
// anon key, which only ever lets a signed-in trader see their own rows
// (enforced by the row-level-security policy in supabase/schema.sql).
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);
