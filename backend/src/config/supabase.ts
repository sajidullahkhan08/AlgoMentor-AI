/**
 * Supabase client configuration.
 *
 * Two clients:
 * - supabase: uses the service role key for backend operations (bypasses RLS)
 * - supabaseAuth: uses the anon key, primarily for verifying user JWTs
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { env } from './env';

// Service role client — full access, used for backend data operations
let _supabase: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (!_supabase) {
    _supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }
  return _supabase;
}
