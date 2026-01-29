import { createClient } from '@supabase/supabase-js';
import { PUBLIC_SUPABASE_DB_URL, PUBLIC_SUPABASE_DB_SERVICE_ROLE } from '$env/static/public';

if (!PUBLIC_SUPABASE_DB_URL || !PUBLIC_SUPABASE_DB_SERVICE_ROLE) {
  throw new Error('Missing PUBLIC_SUPABASE_DB_URL or PUBLIC_SUPABASE_DB_SERVICE_ROLE env vars');
}

export const supabaseAdmin = createClient(PUBLIC_SUPABASE_DB_URL, PUBLIC_SUPABASE_DB_SERVICE_ROLE, {
  auth: { persistSession: false }
});