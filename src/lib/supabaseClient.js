import { createClient } from '@supabase/supabase-js';
import { SUPABASE_DB_URL, SUPABASE_DB_PUBLIC_KEY, VITE_SUPABASE_ANON_KEY, VITE_SUPABASE_URL} from '$env/static/private';

export const supabaseServer = createClient(
  SUPABASE_DB_URL, 
  SUPABASE_DB_PUBLIC_KEY, 
  {
    auth: { persistSession: false }
  });

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
  { auth: { persistSession: true, detectSessionInUrl: false } }
);