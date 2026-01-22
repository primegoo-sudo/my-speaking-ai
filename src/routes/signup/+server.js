import { json } from '@sveltejs/kit';
import { supabaseServer } from '$lib/supabaseClient';

export async function POST({ request }) {
  try {
    const { email, password } = await request.json();
    if (!email || !password) {
      return json({ error: 'Email and password required' }, { status: 400 });
    }

    const { data, error } = await supabaseServer.auth.signUp({
      email,
      password
    });

    if (error) return json({ error: error.message }, { status: 400 });

    return json({ data }, { status: 201 });
  } catch (err) {
    return json({ error: String(err) }, { status: 500 });
  }
}