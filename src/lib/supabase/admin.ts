import { createClient } from "@supabase/supabase-js";

/** Server-side Supabase client using the publishable/anon key.
 *  Security is enforced at the API-route level via next-auth session checks. */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error("Supabase nicht konfiguriert – NEXT_PUBLIC_SUPABASE_URL fehlt");
  return createClient(url, key, { auth: { persistSession: false } });
}
