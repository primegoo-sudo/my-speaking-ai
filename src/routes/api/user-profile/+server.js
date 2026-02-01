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

	const { data: userData, error: userError } = await supabase.auth.getUser();
	if (userError || !userData?.user?.id) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const body = await request.json().catch(() => ({}));
	const name = (body.name || '').toString().trim();
	const phone = (body.phone || '').toString().trim();

	if (!name || !phone) {
		return json({ error: 'name and phone are required' }, { status: 400 });
	}

	const { data, error } = await supabase
		.from('users')
		.update({ name, phone })
		.eq('id', userData.user.id)
		.select('name, phone')
		.single();

	if (error) {
		return json({ error: error.message }, { status: 500 });
	}

	return json({ data }, { status: 200 });
}
