import { createClient } from '@supabase/supabase-js';
import { PUBLIC_SUPABASE_DB_URL, PUBLIC_SUPABASE_DB_SERVICE_ROLE } from '$env/static/public';

if (!PUBLIC_SUPABASE_DB_URL || !PUBLIC_SUPABASE_DB_SERVICE_ROLE) {
  const missingVars = [];
  if (!PUBLIC_SUPABASE_DB_URL) missingVars.push('PUBLIC_SUPABASE_DB_URL');
  if (!PUBLIC_SUPABASE_DB_SERVICE_ROLE) missingVars.push('PUBLIC_SUPABASE_DB_SERVICE_ROLE');
  
  console.error(
    `[supabaseAdmin] Missing environment variables: ${missingVars.join(', ')}\n` +
    'Make sure your .env file has PUBLIC_SUPABASE_DB_URL and PUBLIC_SUPABASE_DB_SERVICE_ROLE set.\n' +
    'The service role key must be from Supabase Dashboard > Settings > API > Service role key'
  );
  throw new Error(`Missing Supabase server environment variables: ${missingVars.join(', ')}`);
}

export const supabaseAdmin = createClient(PUBLIC_SUPABASE_DB_URL, PUBLIC_SUPABASE_DB_SERVICE_ROLE, {
  auth: { persistSession: false }
});