import { json } from '@sveltejs/kit';
import { createClient } from '@supabase/supabase-js';
import { env } from '$env/dynamic/private';
import { env as publicEnv } from '$env/dynamic/public';

function getSupabaseClient(authToken) {
  const supabaseUrl = env.SUPABASE_DB_URL || publicEnv.PUBLIC_SUPABASE_URL || publicEnv.PUBLIC_SUPABASE_DB_URL;
  const supabaseKey = env.SUPABASE_DB_PUBLIC_KEY || publicEnv.PUBLIC_SUPABASE_ANON_KEY || publicEnv.PUBLIC_SUPABASE_DB_PUBLIC_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('SUPABASE_DB_URL and SUPABASE_DB_PUBLIC_KEY must be set');
  }

  return createClient(supabaseUrl, supabaseKey, {
    global: authToken ? { headers: { Authorization: `Bearer ${authToken}` } } : undefined
  });
}

export async function GET({ request, url }) {
  const authHeader = request.headers.get('authorization') || request.headers.get('Authorization') || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    return json({ error: 'Unauthorized' }, { status: 401 });
  }

  let supabase;
  try {
    supabase = getSupabaseClient(token);
  } catch (err) {
    return json({ error: err.message }, { status: 500 });
  }

  const limit = Math.min(Number(url.searchParams.get('limit') || 100), 300);

  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData?.user?.id) {
    return json({ error: 'Unauthorized' }, { status: 401 });
  }

  const from = url.searchParams.get('from');
  const to = url.searchParams.get('to');

  let query = supabase
    .from('conversations')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (from) query = query.gte('created_at', from);
  if (to) query = query.lte('created_at', to);

  const { data, error } = await query;

  if (error) {
    return json({ error: error.message }, { status: 500 });
  }

  return json({ data }, { status: 200 });
}

export async function POST({ request }) {
  const authHeader = request.headers.get('authorization') || request.headers.get('Authorization') || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    return json({ error: 'Unauthorized' }, { status: 401 });
  }

  let supabase;
  try {
    supabase = getSupabaseClient(token);
  } catch (err) {
    return json({ error: err.message }, { status: 500 });
  }

  const body = await request.json().catch(() => ({}));
  const user_message = (body.user_message || '').toString();
  const assistant_message = (body.assistant_message || '').toString();
  const title = body.title ? body.title.toString() : null;
  const duration = Number(body.duration || 0);

  if (!user_message || !assistant_message) {
    return json({ error: 'user_message and assistant_message are required' }, { status: 400 });
  }

  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData?.user?.id) {
    return json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data, error } = await supabase
    .from('conversations')
    .insert([
      {
        user_id: userData.user.id,
        title,
        user_message,
        assistant_message,
        duration: Number.isFinite(duration) ? duration : 0
      }
    ])
    .select();

  if (error) {
    return json({ error: error.message }, { status: 500 });
  }

  return json({ data }, { status: 201 });
}

export async function PATCH({ request }) {
  const authHeader = request.headers.get('authorization') || request.headers.get('Authorization') || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    return json({ error: 'Unauthorized' }, { status: 401 });
  }

  let supabase;
  try {
    supabase = getSupabaseClient(token);
  } catch (err) {
    return json({ error: err.message }, { status: 500 });
  }

  const body = await request.json().catch(() => ({}));
  const oldTitle = (body.oldTitle || '').toString();
  const newTitle = (body.newTitle || '').toString();

  if (!oldTitle || !newTitle) {
    return json({ error: 'oldTitle and newTitle are required' }, { status: 400 });
  }

  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData?.user?.id) {
    return json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data, error } = await supabase
    .from('conversations')
    .update({ title: newTitle })
    .eq('user_id', userData.user.id)
    .eq('title', oldTitle)
    .select();

  if (error) {
    return json({ error: error.message }, { status: 500 });
  }

  return json({ data }, { status: 200 });
}

export async function DELETE({ request, url }) {
  const authHeader = request.headers.get('authorization') || request.headers.get('Authorization') || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    return json({ error: 'Unauthorized' }, { status: 401 });
  }

  let supabase;
  try {
    supabase = getSupabaseClient(token);
  } catch (err) {
    return json({ error: err.message }, { status: 500 });
  }

  const title = url.searchParams.get('title');
  if (!title) {
    return json({ error: 'title is required' }, { status: 400 });
  }

  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData?.user?.id) {
    return json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { error } = await supabase
    .from('conversations')
    .delete()
    .eq('user_id', userData.user.id)
    .eq('title', title);

  if (error) {
    return json({ error: error.message }, { status: 500 });
  }

  return json({ success: true }, { status: 200 });
}
