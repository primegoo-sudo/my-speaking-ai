import { json, error } from '@sveltejs/kit';
import { createClient } from '@supabase/supabase-js';
import { env } from '$env/dynamic/private';
import { env as publicEnv } from '$env/dynamic/public';

/**
 * GET /api/user-consent
 * 사용자의 동의 및 프로필 완성 여부 조회
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

		// 사용자 프로필 조회
		const { data: profile, error: profileError } = await supabase
			.from('users')
			.select('name, phone, profile_completed')
			.eq('id', userData.user.id)
			.single();

		// 동의 기록 조회
		const { data: consent, error: consentError } = await supabase
			.from('user_consents')
			.select('*')
			.eq('user_id', userData.user.id)
			.order('created_at', { ascending: false })
			.limit(1)
			.single();

		return json({
			success: true,
			data: {
				profile_completed: profile?.profile_completed || false,
				name: profile?.name || null,
				phone: profile?.phone || null,
				consent: consent || null
			}
		});
	} catch (err) {
		console.error('GET /api/user-consent error:', err);
		return error(500, { message: err?.message || 'Internal server error' });
	}
}

/**
 * POST /api/user-consent
 * 사용자 프로필 및 약관 동의 정보 저장
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
		const { name, phone, privacy_policy, terms_of_service } = body;

		if (!name || !phone) {
			return error(400, { message: 'name and phone are required' });
		}

		if (!privacy_policy || !terms_of_service) {
			return error(400, { message: 'All consents are required' });
		}

		// 트랜잭션: 프로필 업데이트 + 동의 기록 생성

		// 최신 정책 버전 조회
		let privacyPolicyVersion = 'v1.0';
		let termsOfServiceVersion = 'v1.0';
		try {
			const { data: policies } = await supabase
				.from('policies')
				.select('type, version, is_active, created_at')
				.eq('is_active', true)
				.order('created_at', { ascending: false });

			for (const policy of policies || []) {
				if (policy.type === 'privacy_policy' && privacyPolicyVersion === 'v1.0') {
					privacyPolicyVersion = policy.version || privacyPolicyVersion;
				}
				if (policy.type === 'terms_of_service' && termsOfServiceVersion === 'v1.0') {
					termsOfServiceVersion = policy.version || termsOfServiceVersion;
				}
			}
		} catch (policyErr) {
			console.warn('Failed to load policy versions, fallback to v1.0', policyErr);
		}
		
		// 1. 사용자 프로필 업데이트 (upsert)
		const { error: profileError } = await supabase
			.from('users')
			.upsert({
				id: userData.user.id,
				email: userData.user.email,
				name: name.trim(),
				phone: phone.trim(),
				profile_completed: true
			}, {
				onConflict: 'id'
			});

		if (profileError) {
			console.error('Failed to update profile:', profileError);
			return error(500, { message: 'Failed to update profile' });
		}

		// 2. 동의 기록 생성
		const { error: consentError } = await supabase
			.from('user_consents')
			.insert([{
				user_id: userData.user.id,
				privacy_policy,
				terms_of_service,
				privacy_policy_version: privacyPolicyVersion,
				terms_of_service_version: termsOfServiceVersion,
				consented_at: new Date().toISOString()
			}]);

		if (consentError) {
			console.error('Failed to save consent:', consentError);
			// 프로필은 저장되었지만 동의 기록 실패 - 경고하지만 진행
			console.warn('Consent record failed, but profile updated');
		}

		return json({
			success: true,
			message: 'Profile and consent saved successfully'
		});
	} catch (err) {
		console.error('POST /api/user-consent error:', err);
		return error(500, { message: err?.message || 'Internal server error' });
	}
}
