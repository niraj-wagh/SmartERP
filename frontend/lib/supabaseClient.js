// Frontend Supabase client — used ONLY for authentication (login/signup/logout/session)
// All data operations go through the Express backend API
import { createClient } from "@supabase/supabase-js";

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://your-project.supabase.co",
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "public-anon-key",
  { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } }
);
