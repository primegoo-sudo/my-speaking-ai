/**
 * 환경 설정 유틸리티
 * 클라이언트/서버 양쪽에서 안전하게 환경 변수에 접근
 */

import { browser } from '$app/environment';

/**
 * 사이트 URL 가져오기
 * 우선순위: PUBLIC_SITE_URL > window.location.origin > 기본값
 */
export function getSiteUrl() {
  // 1. 환경 변수에서 가져오기
  if (import.meta.env.PUBLIC_SITE_URL) {
    return import.meta.env.PUBLIC_SITE_URL;
  }

  // 2. 브라우저 환경에서 현재 origin 사용
  if (browser && typeof window !== 'undefined') {
    return window.location.origin;
  }

  // 3. 기본값 (로컬 개발)
  return 'http://localhost:5173';
}

/**
 * 이메일 인증 리다이렉트 URL 생성
 */
export function getEmailRedirectUrl() {
  return `${getSiteUrl()}/auth/callback`;
}

/**
 * Supabase URL 가져오기
 */
export function getSupabaseUrl() {
  return import.meta.env.PUBLIC_SUPABASE_URL || import.meta.env.PUBLIC_SUPABASE_DB_URL;
}

/**
 * Supabase Anon Key 가져오기
 */
export function getSupabaseAnonKey() {
  return import.meta.env.PUBLIC_SUPABASE_ANON_KEY || import.meta.env.PUBLIC_SUPABASE_DB_PUBLIC_KEY;
}
