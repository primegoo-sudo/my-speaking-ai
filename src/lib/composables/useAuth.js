import { supabaseClient } from '$lib/supabaseClient';

export function useAuth() {
  async function signup(name, email, password) {
    try {
      // 서버 API를 통해 회원가입 (데이터베이스 저장 + 이메일 발송)
      const response = await fetch('/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password })
      });

      const result = await response.json();

      if (!response.ok) {
        return { error: result.error || '회원가입 중 오류가 발생했습니다.' };
      }

      // 로컬스토리지에 사용자 정보 저장 (이메일 미확인 상태)
      if (result?.data?.user) {
        try {
          localStorage.setItem('authUser', JSON.stringify(result.data.user));
          // 이메일 인증 대기 상태 저장
          localStorage.setItem('emailVerificationPending', 'true');
        } catch (storageError) {
          console.error('localStorage error:', storageError);
        }
      }

      return { data: result.data };
    } catch (err) {
      console.error('Signup error:', err);
      return { error: err.message || '회원가입 중 오류가 발생했습니다.' };
    }
  }

  async function login(email, password) {
    try {
      // Supabase Auth로 로그인
      const { data, error } = await supabaseClient.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        return { error: error.message };
      }

      // 로컬스토리지에 사용자 정보 저장
      if (data?.user) {
        try {
          localStorage.setItem('authUser', JSON.stringify(data.user));
          if (data.session?.access_token) {
            localStorage.setItem('authToken', data.session.access_token);
          }
        } catch (storageError) {
          console.error('localStorage error:', storageError);
        }
      }

      return { data };
    } catch (err) {
      console.error('Login error:', err);
      return { error: err.message || '로그인 중 오류가 발생했습니다.' };
    }
  }

  async function logout() {
    try {
      // Supabase Auth 로그아웃
      await supabaseClient.auth.signOut();
      
      // 로컬스토리지 정리
      localStorage.removeItem('authUser');
      localStorage.removeItem('authToken');
    } catch (err) {
      console.error('Logout error:', err);
    }
    
    // 로그인 페이지로 이동
    location.href = '/login';
  }

  async function getSession() {
    try {
      const { data, error } = await supabaseClient.auth.getSession();
      if (error) {
        console.error('Get session error:', error);
        return null;
      }
      return data.session;
    } catch (err) {
      console.error('Get session error:', err);
      return null;
    }
  }

  async function getUser() {
    try {
      const { data, error } = await supabaseClient.auth.getUser();
      if (error) {
        console.error('Get user error:', error);
        return null;
      }
      return data.user;
    } catch (err) {
      console.error('Get user error:', err);
      return null;
    }
  }

  return { signup, login, logout, getSession, getUser };
}