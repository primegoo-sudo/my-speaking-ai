import { json } from '@sveltejs/kit';
import { supabaseAdmin } from '$lib/server/supabaseAdmin';
import { getEmailRedirectUrl } from '$lib/utils/env.js';

export async function POST({ request }) {
  try {
    const { name, email, password } = await request.json();
    
    // 입력값 검증
    if (!email || !password) {
      return json({ error: 'Email and password are required' }, { status: 400 });
    }
    
    if (!name || name.trim().length < 3) {
      return json({ error: 'Name must be at least 3 characters' }, { status: 400 });
    }

    // Supabase Auth로 회원가입 (관리자 권한으로)
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: false, // 이메일 인증 필수
      user_metadata: {
        name: name || email.split('@')[0]
      }
    });

    if (error) {
      console.error('Auth creation error:', error);
      return json({ error: error.message }, { status: 400 });
    }

    // 사용자 프로필을 public.users 테이블에 저장
    if (data?.user) {
      try {
        const { error: insertError } = await supabaseAdmin
          .from('users')
          .insert({
            id: data.user.id,
            email: data.user.email,
            name: name || email.split('@')[0],
            metadata: data.user.user_metadata || {}
          });

        if (insertError) {
          console.error('User profile insert error:', insertError);
          // 사용자는 생성되었으므로 에러는 로그만 남김
        }
      } catch (dbError) {
        console.error('Database error:', dbError);
        // 데이터베이스 저장 실패해도 회원가입은 진행
      }

      // 이메일 인증 링크 전송
      try {
        await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
          redirectTo: getEmailRedirectUrl()
        });
      } catch (emailError) {
        console.error('Email send error:', emailError);
        // 이메일 발송 실패해도 일단 계속 진행
      }
    }

    return json({ 
      data: {
        user: data?.user,
        message: 'Signup successful. Please check your email to verify your account.'
      }
    }, { status: 201 });
  } catch (err) {
    console.error('Signup server error:', err);
    return json({ error: String(err) }, { status: 500 });
  }
}