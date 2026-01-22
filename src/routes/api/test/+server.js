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
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { 'content-type': 'application/json' } });
  }

  const { data, error } = await supabase
    .from('test_messages')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(10);

  return new Response(JSON.stringify({ data, error }), {
    status: error ? 500 : 200,
    headers: { 'content-type': 'application/json' }
  });
}

export async function POST({ request }) {
  let supabase;
  try {
    supabase = getSupabaseClient();
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { 'content-type': 'application/json' } });
  }

  const body = await request.json().catch(() => ({}));
  const content = body.content || '테스트 메시지 from server';
  const metadata = body.metadata || { env: 'dev' };

  const { data, error } = await supabase
    .from('test_messages')
    .insert([{ content, metadata }])
    .select();

  return new Response(JSON.stringify({ data, error }), {
    status: error ? 500 : 200,
    headers: { 'content-type': 'application/json' }
  });
}
