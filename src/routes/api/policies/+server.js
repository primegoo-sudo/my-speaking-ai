import { json, error } from '@sveltejs/kit';
import { createClient } from '@supabase/supabase-js';
import { env } from '$env/dynamic/private';
import { env as publicEnv } from '$env/dynamic/public';

/**
 * GET /api/policies
 * 활성화된 개인정보 처리방침 및 이용약관 조회
 */
export async function GET() {
	try {
		const supabaseUrl = env.SUPABASE_DB_URL || publicEnv.PUBLIC_SUPABASE_URL || publicEnv.PUBLIC_SUPABASE_DB_URL;
		const supabaseKey = env.SUPABASE_DB_PUBLIC_KEY || publicEnv.PUBLIC_SUPABASE_ANON_KEY || publicEnv.PUBLIC_SUPABASE_DB_PUBLIC_KEY;

		if (!supabaseUrl || !supabaseKey) {
			return error(500, { message: 'Supabase configuration missing' });
		}

		const supabase = createClient(supabaseUrl, supabaseKey);

		const { data, error: policiesError } = await supabase
			.from('policies')
			.select('type, version, content, is_active, created_at')
			.eq('is_active', true)
			.order('created_at', { ascending: false });

		if (policiesError) {
			console.error('Failed to load policies:', policiesError);
			return error(500, { message: 'Failed to load policies' });
		}

		const result = {
			privacy_policy: null,
			terms_of_service: null
		};

		for (const policy of data || []) {
			if (policy.type === 'privacy_policy' && !result.privacy_policy) {
				result.privacy_policy = policy;
			}
			if (policy.type === 'terms_of_service' && !result.terms_of_service) {
				result.terms_of_service = policy;
			}
		}

		return json({ success: true, data: result });
	} catch (err) {
		console.error('GET /api/policies error:', err);
		return error(500, { message: err?.message || 'Internal server error' });
	}
}
