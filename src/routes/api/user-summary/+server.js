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

export async function GET({ request }) {
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

	try {
		const { data: userData, error: userError } = await supabase.auth.getUser();
		if (userError || !userData?.user?.id) {
			return json({ error: 'Unauthorized' }, { status: 401 });
		}

		const userId = userData.user.id;

		// 기본 정보 조회 (에러 핸들링)
		let profile = null;
		let totalConversations = 0;
		let recentConversations = [];
		let latestConsent = null;

		try {
			const profileResult = await supabase
				.from('users')
				.select('name, phone, profile_completed')
				.eq('id', userId)
				.single();
			
			profile = profileResult.data;
			if (profileResult.error && profileResult.error.code !== 'PGRST116') {
				console.warn('Profile query error:', profileResult.error);
			}
		} catch (err) {
			console.warn('Users table may not exist:', err);
		}

		try {
			const totalResult = await supabase
				.from('conversations')
				.select('id', { count: 'exact', head: true })
				.eq('user_id', userId);
			totalConversations = totalResult.count || 0;
		} catch (err) {
			console.warn('Conversations count error:', err);
		}

		try {
			const recentResult = await supabase
				.from('conversations')
				.select('id, title, user_message, assistant_message, created_at, duration')
				.eq('user_id', userId)
				.order('created_at', { ascending: false })
				.limit(10);
			recentConversations = recentResult.data || [];
		} catch (err) {
			console.warn('Recent conversations error:', err);
		}

		try {
			const consentResult = await supabase
				.from('user_consents')
				.select('privacy_policy_version, terms_of_service_version, consented_at')
				.eq('user_id', userId)
				.order('consented_at', { ascending: false })
				.limit(1)
				.single();
			latestConsent = consentResult.data;
			if (consentResult.error && consentResult.error.code !== 'PGRST116') {
				console.warn('Consent query error:', consentResult.error);
			}
		} catch (err) {
			console.warn('User consents error:', err);
		}

		// 사용량 통계 조회 (새 컬럼이 있을 경우에만)
		let usageTotals = {
			total_duration: 0,
			total_audio_input_seconds: 0,
			total_prompt_tokens: 0,
			total_completion_tokens: 0,
			total_tokens: 0,
			total_cost_usd: 0
		};

		try {
			const usageResult = await supabase
				.from('conversations')
				.select('duration, audio_input_seconds, prompt_tokens, completion_tokens, total_tokens, estimated_cost_usd')
				.eq('user_id', userId);

			if (!usageResult.error && usageResult.data) {
				usageTotals = usageResult.data.reduce(
					(acc, row) => {
						acc.total_duration += Number(row.duration || 0);
						acc.total_audio_input_seconds += Number(row.audio_input_seconds || 0);
						acc.total_prompt_tokens += Number(row.prompt_tokens || 0);
						acc.total_completion_tokens += Number(row.completion_tokens || 0);
						acc.total_tokens += Number(row.total_tokens || 0);
						acc.total_cost_usd += Number(row.estimated_cost_usd || 0);
						return acc;
					},
					usageTotals
				);

				// 최근 대화에도 사용량 필드 추가
				const recentWithUsageResult = await supabase
					.from('conversations')
					.select('id, title, user_message, assistant_message, created_at, duration, audio_input_seconds, prompt_tokens, completion_tokens, total_tokens, estimated_cost_usd')
					.eq('user_id', userId)
					.order('created_at', { ascending: false })
					.limit(10);

				if (!recentWithUsageResult.error && recentWithUsageResult.data) {
					recentConversations.splice(0, recentConversations.length, ...recentWithUsageResult.data);
				}
			}
		} catch (usageErr) {
			console.warn('Usage columns not available yet:', usageErr);
		}

		const lastConversationAt = recentConversations?.[0]?.created_at || null;

		return json({
			success: true,
			data: {
				user: {
					email: userData.user.email,
					name: profile?.name || null,
					phone: profile?.phone || null,
					profile_completed: profile?.profile_completed || false
				},
				usage: {
					total_conversations: totalConversations || 0,
					last_conversation_at: lastConversationAt,
					...usageTotals
				},
				consent: latestConsent || null,
				recent_conversations: recentConversations || []
			}
		});
	} catch (err) {
		console.error('GET /api/user-summary error:', err);
		return json({ error: err?.message || 'Internal server error' }, { status: 500 });
	}
}
