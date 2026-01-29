import { json } from '@sveltejs/kit';
import { createClient } from '@supabase/supabase-js';
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';

// Supabase Auth를 사용한 로그인 엔드포인트
// 참고: 이 엔드포인트는 이제 클라이언트에서 직접 supabaseClient.auth.signInWithPassword()를 호출하므로 선택사항입니다.
export async function POST({ request }) {
  try {
    const body = await request.json();
    const { email, password } = body ?? {};

    if (!email || !password) {
      return json({ error: '이메일과 비밀번호를 입력해주세요.' }, { status: 400 });
    }

    // Supabase Auth 클라이언트 생성
    const supabase = createClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY);

    // Supabase Auth로 로그인
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      console.error('[POST /api/auth/login] Auth error:', error);
      return json({ error: error.message }, { status: 401 });
    }

    return json({ data }, { status: 200 });
  } catch (err) {
    console.error('[POST /api/auth/login] Unexpected error:', err);
    return json({ error: '로그인 중 오류가 발생했습니다.' }, { status: 500 });
  }
}