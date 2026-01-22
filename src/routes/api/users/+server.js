/**
 * src/routes/api/users/+server.js
 */
import { createClient } from '@supabase/supabase-js';
import { env } from '$env/dynamic/private';

function getSupabaseClient() {
  const SUPABASE_URL = env.SUPABASE_DB_URL;
  const SUPABASE_KEY = env.SUPABASE_DB_PUBLIC_KEY;

  if (!SUPABASE_URL || !SUPABASE_KEY) {
    throw new Error('SUPABASE_DB_URL and SUPABASE_DB_PUBLIC_KEY must be set in environment');
  }

  return createClient(SUPABASE_URL, SUPABASE_KEY);
}

export async function GET() {
  let supabase;
  try {
    supabase = getSupabaseClient();
  } catch (err) {
    console.error('[GET /api/users] Supabase client error:', err.message);
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { 'content-type': 'application/json' } });
  }

  const { data, error } = await supabase
    .from('users')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) {
    console.error('[GET /api/users] Query error:', error.message, error.details);
  } else {
    console.log('[GET /api/users] Success, rows:', data?.length || 0);
  }

  return new Response(JSON.stringify({ data, error: error ? { message: error.message, details: error.details, code: error.code } : null }), {
    status: error ? 500 : 200,
    headers: { 'content-type': 'application/json' }
  });
}

export async function POST({ request }) {
  let supabase;
  try {
    supabase = getSupabaseClient();
  } catch (err) {
    console.error('[POST /api/users] Supabase client error:', err.message);
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { 'content-type': 'application/json' } });
  }

  const body = await request.json().catch(() => ({}));
  const name = (body.name || '').trim();
  const email = (body.email || '').trim();

  if (!name || !email) {
    console.warn('[POST /api/users] Missing name or email', { name, email });
    return new Response(JSON.stringify({ error: 'name and email are required' }), { status: 400, headers: { 'content-type': 'application/json' } });
  }

  console.log('[POST /api/users] Inserting user:', { name, email });
  const { data, error } = await supabase
    .from('users')
    .insert([{ name, email }])
    .select();

  if (error) {
    console.error('[POST /api/users] Insert error:', error.message, error.details, error.code);
  } else {
    console.log('[POST /api/users] Insert success:', data);
  }

  return new Response(JSON.stringify({ data, error: error ? { message: error.message, details: error.details, code: error.code } : null }), {
    status: error ? 500 : 200,
    headers: { 'content-type': 'application/json' }
  });
}
