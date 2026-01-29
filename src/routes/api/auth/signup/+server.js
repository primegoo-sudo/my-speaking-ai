import { json } from '@sveltejs/kit';
import { createClient } from '@supabase/supabase-js';
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';

// Supabase Auth를 사용한 회원가입 엔드포인트
// 참고: 이 엔드포인트는 이제 클라이언트에서 직접 supabaseClient.auth.signUp()을 호출하므로 선택사항입니다.
export async function POST({ request }) {
  try {
    const contentType = (request.headers.get('content-type') || '').toLowerCase();
    let body = {};

    if (contentType.includes('application/json')) {
      body = await request.json();
    } else {
      try {
        body = await request.json();
      } catch {
        body = {};
      }
    }

    const name = (body.username ?? body.name ?? '').toString().trim();
    const email = (body.email ?? '').toString().trim();
    const password = body.password ?? null;

    if (!email) {
      return json({ error: '이메일을 입력해주세요.' }, { status: 400 });
    }
    if (!password) {
      return json({ error: '비밀번호를 입력해주세요.' }, { status: 400 });
    }
    if (password.length < 6) {
      return json({ error: '비밀번호는 최소 6자 이상이어야 합니다.' }, { status: 400 });
    }

    // Supabase Auth 클라이언트 생성
    const supabase = createClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY);

    // Supabase Auth로 회원가입
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: name || email.split('@')[0]
        }
      }
    });

    if (error) {
      console.error('[POST /api/auth/signup] Auth error:', error);
      return json({ error: error.message }, { status: 400 });
    }

    return json({ data }, { status: 201 });
  } catch (err) {
    console.error('[POST /api/auth/signup] Unexpected error:', err);
    return json({ error: '회원가입 중 오류가 발생했습니다.' }, { status: 500 });
  }
}