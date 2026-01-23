import { createClient } from '@supabase/supabase-js';
import { SUPABASE_DB_URL, SUPABASE_DB_SERVICE_ROLE } from '$env/static/private';

if (!SUPABASE_DB_URL || !SUPABASE_DB_SERVICE_ROLE) {
  console.warn('[supabaseServer] SUPABASE_DB_URL or SUPABASE_DB_SERVICE_ROLE is not set');
}

export const supabaseServer = createClient(SUPABASE_DB_URL, SUPABASE_DB_SERVICE_ROLE);