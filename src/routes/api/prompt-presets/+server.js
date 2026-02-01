import { json, error } from '@sveltejs/kit';
import { createClient } from '@supabase/supabase-js';
import { env } from '$env/dynamic/private';
import { env as publicEnv } from '$env/dynamic/public';

/**
 * GET /api/prompt-presets
 * 사용자의 프롬프트 프리셋 목록 조회
 */
export async function GET({ request }) {
	try {
		const authHeader = request.headers.get('authorization') || request.headers.get('Authorization');
		if (!authHeader || !authHeader.startsWith('Bearer ')) {
			return error(401, { message: 'Unauthorized' });
		}

		const token = authHeader.slice(7);
		const supabaseUrl = env.SUPABASE_DB_URL || publicEnv.PUBLIC_SUPABASE_URL || publicEnv.PUBLIC_SUPABASE_DB_URL;
		const supabaseKey = env.SUPABASE_DB_PUBLIC_KEY || publicEnv.PUBLIC_SUPABASE_ANON_KEY || publicEnv.PUBLIC_SUPABASE_DB_PUBLIC_KEY;

		if (!supabaseUrl || !supabaseKey) {
			return error(500, { message: 'Supabase configuration missing' });
		}

		const supabase = createClient(supabaseUrl, supabaseKey, {
			global: { headers: { Authorization: `Bearer ${token}` } }
		});

		const { data: userData, error: userError } = await supabase.auth.getUser();
		if (userError || !userData?.user) {
			return error(401, { message: 'Invalid token' });
		}

		// 프리셋 목록 조회 (최신순)
		const { data, error: selectError } = await supabase
			.from('user_prompt_presets')
			.select('*')
			.eq('user_id', userData.user.id)
			.order('is_default', { ascending: false })
			.order('updated_at', { ascending: false });

		if (selectError) {
			console.error('Failed to fetch presets:', selectError);
			return error(500, { message: 'Failed to fetch presets' });
		}

		return json({ success: true, data: data || [] });
	} catch (err) {
		console.error('GET /api/prompt-presets error:', err);
		return error(500, { message: err?.message || 'Internal server error' });
	}
}

/**
 * POST /api/prompt-presets
 * 새 프롬프트 프리셋 생성
 */
export async function POST({ request }) {
	try {
		const authHeader = request.headers.get('authorization') || request.headers.get('Authorization');
		if (!authHeader || !authHeader.startsWith('Bearer ')) {
			return error(401, { message: 'Unauthorized' });
		}

		const token = authHeader.slice(7);
		const supabaseUrl = env.SUPABASE_DB_URL || publicEnv.PUBLIC_SUPABASE_URL || publicEnv.PUBLIC_SUPABASE_DB_URL;
		const supabaseKey = env.SUPABASE_DB_PUBLIC_KEY || publicEnv.PUBLIC_SUPABASE_ANON_KEY || publicEnv.PUBLIC_SUPABASE_DB_PUBLIC_KEY;

		if (!supabaseUrl || !supabaseKey) {
			return error(500, { message: 'Supabase configuration missing' });
		}

		const supabase = createClient(supabaseUrl, supabaseKey, {
			global: { headers: { Authorization: `Bearer ${token}` } }
		});

		const { data: userData, error: userError } = await supabase.auth.getUser();
		if (userError || !userData?.user) {
			return error(401, { message: 'Invalid token' });
		}

		const body = await request.json();
		const { preset_name, prompt_settings, is_default = false } = body;

		if (!preset_name || !prompt_settings) {
			return error(400, { message: 'preset_name and prompt_settings are required' });
		}

		// 프리셋 생성
		const { data, error: insertError } = await supabase
			.from('user_prompt_presets')
			.insert([
				{
					user_id: userData.user.id,
					preset_name,
					prompt_settings,
					is_default
				}
			])
			.select()
			.single();

		if (insertError) {
			console.error('Failed to create preset:', insertError);
			if (insertError.code === '23505') {
				return error(409, { message: '같은 이름의 프리셋이 이미 존재합니다.' });
			}
			return error(500, { message: 'Failed to create preset' });
		}

		return json({ success: true, data });
	} catch (err) {
		console.error('POST /api/prompt-presets error:', err);
		return error(500, { message: err?.message || 'Internal server error' });
	}
}

/**
 * PATCH /api/prompt-presets
 * 프롬프트 프리셋 수정
 */
export async function PATCH({ request }) {
	try {
		const authHeader = request.headers.get('authorization') || request.headers.get('Authorization');
		if (!authHeader || !authHeader.startsWith('Bearer ')) {
			return error(401, { message: 'Unauthorized' });
		}

		const token = authHeader.slice(7);
		const supabaseUrl = env.SUPABASE_DB_URL || publicEnv.PUBLIC_SUPABASE_URL || publicEnv.PUBLIC_SUPABASE_DB_URL;
		const supabaseKey = env.SUPABASE_DB_PUBLIC_KEY || publicEnv.PUBLIC_SUPABASE_ANON_KEY || publicEnv.PUBLIC_SUPABASE_DB_PUBLIC_KEY;

		if (!supabaseUrl || !supabaseKey) {
			return error(500, { message: 'Supabase configuration missing' });
		}

		const supabase = createClient(supabaseUrl, supabaseKey, {
			global: { headers: { Authorization: `Bearer ${token}` } }
		});

		const { data: userData, error: userError } = await supabase.auth.getUser();
		if (userError || !userData?.user) {
			return error(401, { message: 'Invalid token' });
		}

		const body = await request.json();
		const { id, preset_name, prompt_settings, is_default } = body;

		if (!id) {
			return error(400, { message: 'id is required' });
		}

		const updateData = {};
		if (preset_name !== undefined) updateData.preset_name = preset_name;
		if (prompt_settings !== undefined) updateData.prompt_settings = prompt_settings;
		if (is_default !== undefined) updateData.is_default = is_default;

		// 프리셋 수정
		const { data, error: updateError } = await supabase
			.from('user_prompt_presets')
			.update(updateData)
			.eq('id', id)
			.eq('user_id', userData.user.id)
			.select()
			.single();

		if (updateError) {
			console.error('Failed to update preset:', updateError);
			return error(500, { message: 'Failed to update preset' });
		}

		return json({ success: true, data });
	} catch (err) {
		console.error('PATCH /api/prompt-presets error:', err);
		return error(500, { message: err?.message || 'Internal server error' });
	}
}

/**
 * DELETE /api/prompt-presets
 * 프롬프트 프리셋 삭제
 */
export async function DELETE({ url, request }) {
	try {
		const authHeader = request.headers.get('authorization') || request.headers.get('Authorization');
		if (!authHeader || !authHeader.startsWith('Bearer ')) {
			return error(401, { message: 'Unauthorized' });
		}

		const token = authHeader.slice(7);
		const supabaseUrl = env.SUPABASE_DB_URL || publicEnv.PUBLIC_SUPABASE_URL || publicEnv.PUBLIC_SUPABASE_DB_URL;
		const supabaseKey = env.SUPABASE_DB_PUBLIC_KEY || publicEnv.PUBLIC_SUPABASE_ANON_KEY || publicEnv.PUBLIC_SUPABASE_DB_PUBLIC_KEY;

		if (!supabaseUrl || !supabaseKey) {
			return error(500, { message: 'Supabase configuration missing' });
		}

		const supabase = createClient(supabaseUrl, supabaseKey, {
			global: { headers: { Authorization: `Bearer ${token}` } }
		});

		const { data: userData, error: userError } = await supabase.auth.getUser();
		if (userError || !userData?.user) {
			return error(401, { message: 'Invalid token' });
		}

		const id = url.searchParams.get('id');
		if (!id) {
			return error(400, { message: 'id parameter is required' });
		}

		// 프리셋 삭제
		const { error: deleteError } = await supabase
			.from('user_prompt_presets')
			.delete()
			.eq('id', id)
			.eq('user_id', userData.user.id);

		if (deleteError) {
			console.error('Failed to delete preset:', deleteError);
			return error(500, { message: 'Failed to delete preset' });
		}

		return json({ success: true, message: 'Preset deleted' });
	} catch (err) {
		console.error('DELETE /api/prompt-presets error:', err);
		return error(500, { message: err?.message || 'Internal server error' });
	}
}
