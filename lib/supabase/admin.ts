import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/types/database';

// Note: This client uses the service role key, which bypasses RLS policies.
// IT MUST ONLY BE USED ON THE SERVER SIDE (Server Actions, Route Handlers, etc.)
// AND ONLY AFTER VERIFYING THE USER IS A SUPER_ADMIN.
export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Missing Supabase URL or Service Role Key in environment variables.');
  }

  return createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
