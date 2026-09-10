import { createClient } from "@supabase/supabase-js";

// Server-only client — uses the secret service-role key, which bypasses
// row-level security. NEVER import this file from a "use client" component
// or send this key to the browser. Only the API routes (create-order,
// webhook) use this, to write subscription rows on the trader's behalf.
export function supabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
