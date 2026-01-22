import { json } from '@sveltejs/kit';
import { supabaseServer } from '$lib/supabaseClient'; // 기존 auth.signUp 사용
import { supabaseAdmin } from '$lib/server/supabaseAdmin.js'; // 서버/관리용 클라이언트
import bcrypt from 'bcryptjs';

export async function POST({ request }) {
  try {
    // 전체 바디를 한 번만 읽음 (이 안에 name이 있을 수 있음)
    const body = await request.json();
    const { email, password, name } = body;

    if (!email || !password) {
      return json({ error: 'Email and password required' }, { status: 400 });
    }

    // 1) Supabase Auth로 사용자 생성 (이메일/비밀번호 기반)
    const { data: signUpData, error: signUpError } = await supabaseServer.auth.signUp({
      email,
      password
    });

    if (signUpError) {
      return json({ error: signUpError.message }, { status: 400 });
    }

    const user = signUpData?.user;
    if (!user || !user.id) {
      return json({ error: 'Failed to create auth user' }, { status: 500 });
    }

    // 2) 비밀번호 해시화 (bcrypt)
    const saltRounds = 12;
    const password_hash = await bcrypt.hash(password, saltRounds);

    // 3) users 테이블에 추가 기록 (service-role 클라이언트 사용)
    // name이 제공되지 않으면 '(unknown)'으로 대체하여 NOT NULL 제약 회피
    const nameValue = (name ?? '(unknown)').toString().trim() || '(unknown)';

    // 중복 이메일 방지: INSERT 전에 같은 이메일이 이미 있는지 확인
    const { data: existingUser, error: existingError } = await supabaseAdmin
      .from('users')
      .select('id, email')
      .eq('email', email)
      .maybeSingle();

    if (existingError) {
      return json({ error: existingError.message }, { status: 500 });
    }

    if (!existingUser) {
      const { data: insertData, error: insertError } = await supabaseAdmin
        .from('users')
        .insert([{ id: user.id, email, password_hash, name: nameValue }]);

      if (insertError) {
        return json({ error: insertError.message }, { status: 500 });
      }
    } else {
      // 이미 users 레코드가 존재하는 경우: 삽입 생략.
      // 필요시 여기서 기존 레코드 업데이트(예: name/password_hash 동기화) 로직 추가 가능.
    }

    return json({ data: { user: signUpData.user } }, { status: 201 });
  } catch (err) {
    return json({ error: String(err) }, { status: 500 });
  }
}