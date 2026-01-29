import { createClient } from '@supabase/supabase-js';
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';

function getSupabaseClient() {
  if (!PUBLIC_SUPABASE_URL || !PUBLIC_SUPABASE_ANON_KEY) {
    throw new Error('PUBLIC_SUPABASE_URL and PUBLIC_SUPABASE_ANON_KEY must be set in environment');
  }

  return createClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY);
}

export async function GET() {
  let supabase;
  try {
    supabase = getSupabaseClient();
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { 'content-type': 'application/json' } });
  }

  const { data, error } = await supabase
    .from('test_items')
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
  const name = body.name || 'test-item';
  const description = body.description || 'Test from /api/test';
  const metadata = body.metadata || { from: 'api-test' };

  const { data, error } = await supabase
    .from('test_items')
    .insert([{ name, description, metadata }])
    .select();

  return new Response(JSON.stringify({ data, error }), {
    status: error ? 500 : 200,
    headers: { 'content-type': 'application/json' }
  });
}
