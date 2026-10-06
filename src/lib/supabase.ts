import { createClient, SupabaseClient } from '@supabase/supabase-js';

const envUrl = import.meta.env.VITE_SUPABASE_URL;
const envAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Check if legitimate Supabase environment variables are provided
export const isSupabaseConfigured: boolean = Boolean(
  envUrl &&
  envAnonKey &&
  envUrl.trim() !== '' &&
  envAnonKey.trim() !== '' &&
  !envUrl.includes('mock-acadeemia-db') &&
  !envUrl.includes('your-project.supabase.co')
);

export const supabaseConfigError: string | null = isSupabaseConfigured
  ? null
  : 'Missing Supabase environment variables. Please provide VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.';

// Only initialize the real Supabase client when real credentials exist.
// Do not use fake or hardcoded JWT tokens.
export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(envUrl as string, envAnonKey as string, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null;
