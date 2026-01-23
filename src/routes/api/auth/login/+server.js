import { json } from '@sveltejs/kit';
import { supabaseServer } from '$lib/server/supabaseServer';
import bcrypt from 'bcryptjs';

// 로그인 전용 엔드포인트
// 클라이언트(`useAuth.login`)에서는 { data: { session, user } } 형태를 기대하고 있음
export async function POST({ request }) {
  try {
    const body = await request.json();
    const { email, password } = body ?? {};

    if (!email || !password) {
      return json({ error: 'Email and password required' }, { status: 400 });
    }

    // 이메일로 사용자 조회
    const { data: users, error: fetchError } = await supabaseServer
      .from('users')
      .select('*')
      .eq('email', email)
      .limit(1);

    if (fetchError) {
      console.error('[POST /api/auth/login] Database error:', fetchError);
      return json({ error: 'Database error' }, { status: 500 });
    }

    if (!users || users.length === 0) {
      return json({ error: 'Invalid email or password' }, { status: 401 });
    }

    const user = users[0];

    // 비밀번호 검증
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      return json({ error: 'Invalid email or password' }, { status: 401 });
    }

    // 민감한 정보 제거
    const { password_hash, ...safeUser } = user;

    // 세션 토큰 생성 (간단한 구현)
    const session = {
      access_token: `user_${user.id}_${Date.now()}`,
      user: safeUser
    };

    return json({ data: { user: safeUser, session } }, { status: 200 });
  } catch (err) {
    console.error('[POST /api/auth/login] Unexpected error:', err);
    return json({ error: String(err) }, { status: 500 });
  }
}