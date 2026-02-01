<script>
  import { goto } from '$app/navigation';
  import { authReady, isAuthenticated } from '$lib/stores/auth.js';
  import AuthForm from '$lib/components/AuthForm.svelte';
  import { supabaseClient } from '$lib/supabaseClient';
  import { onMount } from 'svelte';

  function handleSuccess(e) {
     // 이메일 인증 대기 상태 확인
     const emailVerificationPending = localStorage.getItem('emailVerificationPending');
     console.log('Email verification pending:', emailVerificationPending);
     if (!emailVerificationPending) {
       // 이메일 인증 대기 중이면 회원가입 페이지로 이동하여 안내 표시
       goto('/signup', { replaceState: true });
     } else {
       // 로그인 성공하면 AI 대화 화면으로 이동
       goto('/practice', { replaceState: true });
     }
  }

  // 이미 로그인된 사용자는 practice 페이지로 리다이렉트
  onMount(async () => {
    if ($authReady && $isAuthenticated) {
      goto('/practice', { replaceState: true });
    }
  });

</script>

<section class="min-h-screen flex items-center justify-center bg-gray-50">
  <div class="max-w-6xl w-full grid grid-cols-1 md:grid-cols-2 gap-8 items-center p-8">
    <!-- Left: 소개 / 브랜드 -->
    <div class="px-6">
      <h1 class="text-4xl font-extrabold mb-4">환영합니다 — My Speaking AI</h1>
      <p class="text-lg text-gray-700 mb-6">
        음성 기반 AI 도우미를 통해 자연스럽게 대화하고 기록하세요. 빠르게 시작하려면 오른쪽에서 로그인하세요.
      </p>
      <ul class="space-y-3 text-gray-600">
        <li>• 음성 녹음 및 텍스트 변환</li>
        <li>• 대화 기록 관리</li>
        <li>• 개인화된 설정</li>
      </ul>
    </div>

    <!-- Right: 로그인 카드 -->
    <div class="flex items-center justify-center">
      <div class="w-full max-w-md bg-white shadow-md rounded-lg p-6 login-card">
        <div class="flex items-center justify-center mb-4">
          <img src="logo.svg" alt="logo" class="h-25 w-25 mr-3 logo"/>
          <span class="text-xl font-semibold">My Speaking AI</span>
        </div>

        <h2 class="text-center text-2xl font-semibold mb-4">로그인</h2>

        <AuthForm mode="login" on:success={handleSuccess} />

        <div class="mt-4 text-center text-sm text-gray-600">
          처음이신가요?
          <a href="/signup" class="text-blue-600 hover:underline ml-1">회원가입</a>
        </div>
      </div>
    </div>
  </div>
</section>

<style>
  /* 기본 폰트/스페이싱 보정(프로젝트 Tailwind를 사용중이면 대부분 무시됨) */
  @media (max-width: 640px) {
    .login-card {
      width: 100%;
      padding: 1.5rem;
    }
    .logo {
      width: 3rem;
      height: 3rem;
    }
    h1 {
      font-size: 1.75rem;
    }
  }
</style>