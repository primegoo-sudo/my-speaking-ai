import { createClient } from '@supabase/supabase-js';
import { PUBLIC_SUPABASE_DB_URL, PUBLIC_SUPABASE_DB_SERVICE_ROLE } from '$env/static/public';
import bcrypt from 'bcryptjs';

const supabase = createClient(PUBLIC_SUPABASE_DB_URL, PUBLIC_SUPABASE_DB_SERVICE_ROLE);

export async function POST({ request }) {
  const contentType = (request.headers.get('content-type') || '').toLowerCase();
  let body = {};

  if (contentType.includes('application/json')) {
    body = await request.json();
  } else if (contentType.includes('application/x-www-form-urlencoded') || contentType.includes('multipart/form-data')) {
    const form = await request.formData();
    body = Object.fromEntries(form.entries());
  } else {
    try {
      body = await request.json();
    } catch {
      try {
        const text = await request.text();
        body = text ? JSON.parse(text) : {};
      } catch {
        body = {};
      }
    }
  }

  const name = (body.username ?? body.name ?? '').toString().trim();
  const email = (body.email ?? '').toString().trim();
  const rawPassword = body.password ?? body.password_hash ?? null;
  let metadata = body.metadata ?? {};

  if (typeof metadata === 'string') {
    try { metadata = JSON.parse(metadata); } catch { metadata = {}; }
  }

  if (!name) return new Response(JSON.stringify({ error: 'name (or username) is required' }), { status: 400 });
  if (!email) return new Response(JSON.stringify({ error: 'email is required' }), { status: 400 });
  if (!rawPassword) return new Response(JSON.stringify({ error: 'password is required' }), { status: 400 });

  // 비밀번호 해싱
  const SALT_ROUNDS = 10;
  let password_hash;
  try {
    password_hash = await bcrypt.hash(String(rawPassword), SALT_ROUNDS);
  } catch (err) {
    return new Response(JSON.stringify({ error: 'failed to hash password' }), { status: 500 });
  }

  const insertPayload = { name, email, password_hash, metadata };

  const { data, error } = await supabase
    .from('users')
    .insert([insertPayload])
    .select()
    .limit(1);

  if (error) return new Response(JSON.stringify({ error }), { status: 500 });

  return new Response(JSON.stringify(data?.[0] ?? null), { status: 201 });
}