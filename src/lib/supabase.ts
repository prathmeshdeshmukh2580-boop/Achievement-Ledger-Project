import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Supports both the legacy anon key (eyJ...) and the new publishable key (sb_publishable_...)
export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseAnonKey && 
  supabaseUrl.startsWith("https://") &&
  !supabaseUrl.includes("your-project") &&
  (supabaseAnonKey.startsWith("eyJ") || supabaseAnonKey.startsWith("sb_publishable_") || supabaseAnonKey.length > 20)
);

// Dev mock is turned OFF for real backend mode
export const isDevMockEnabled = false;

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl!, supabaseAnonKey!)
  : null;
