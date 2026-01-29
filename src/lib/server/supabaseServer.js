import { createClient } from '@supabase/supabase-js';
import { PUBLIC_SUPABASE_DB_URL, PUBLIC_SUPABASE_DB_SERVICE_ROLE } from '$env/static/public';

if (!PUBLIC_SUPABASE_DB_URL || !PUBLIC_SUPABASE_DB_SERVICE_ROLE) {
  console.warn('[supabaseServer] SUPABASE_DB_URL or SUPABASE_DB_SERVICE_ROLE is not set');
}

export const supabaseServer = createClient(PUBLIC_SUPABASE_DB_URL, PUBLIC_SUPABASE_DB_SERVICE_ROLE);