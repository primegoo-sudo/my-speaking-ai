import { createClient } from '@supabase/supabase-js';
import { SUPABASE_DB_URL, SUPABASE_DB_SERVICE_ROLE } from '$env/static/private';

if (!SUPABASE_DB_URL || !SUPABASE_DB_SERVICE_ROLE) {
  throw new Error('Missing SUPABASE_DB_URL or SUPABASE_DB_SERVICE_ROLE env vars');
}

export const supabaseAdmin = createClient(SUPABASE_DB_URL, SUPABASE_DB_SERVICE_ROLE, {
  auth: { persistSession: false }
});