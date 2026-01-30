<script>
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';
  import { supabaseClient } from '$lib/supabaseClient';

  let status = 'processing'; // 'processing', 'success', 'error'
  let message = '이메일 인증을 처리중입니다...';

  onMount(async () => {
    try {
      // URL에서 토큰 확인
      const { data, error } = await supabaseClient.auth.getSession();

      if (error || !data.session) {
        // 새로운 세션 생성 또는 기존 세션 확인
        await supabaseClient.auth.refreshSession();
        const { data: newData, error: newError } = await supabaseClient.auth.getSession();

        if (newError || !newData.session?.user?.email_confirmed_at) {
          throw new Error('이메일 인증에 실패했습니다.');
        }
      }

      // 인증 성공
      const { data: userData } = await supabaseClient.auth.getUser();
      if (userData?.user?.email_confirmed_at) {
        status = 'success';
        message = '이메일 인증이 완료되었습니다. 잠시 후 리다이렉트됩니다...';

        // 로컬스토리지 업데이트
        localStorage.removeItem('emailVerificationPending');
        localStorage.setItem('authUser', JSON.stringify(userData.user));

        // 2초 후 연습 페이지로 이동
        setTimeout(() => {
          goto('/practice', { replaceState: true });
        }, 2000);
      } else {
        throw new Error('이메일 확인이 필요합니다.');
      }
    } catch (err) {
      status = 'error';
      message = err?.message || '이메일 인증 중 오류가 발생했습니다.';
      console.error('Email verification error:', err);
    }
  });
</script>

<div class="min-h-screen flex items-center justify-center bg-gray-50">
  <div class="max-w-md w-full p-6 bg-white rounded-lg shadow-md text-center">
    {#if status === 'processing'}
      <div class="mb-4 flex justify-center">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
      <h1 class="text-xl font-semibold mb-2">인증 처리중</h1>
      <p class="text-gray-600">{message}</p>
    {:else if status === 'success'}
      <div class="mb-4">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 mx-auto text-green-600" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
        </svg>
      </div>
      <h1 class="text-xl font-semibold text-green-600 mb-2">인증 완료!</h1>
      <p class="text-gray-600">{message}</p>
    {:else}
      <div class="mb-4">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 mx-auto text-red-600" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4v.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
        </svg>
      </div>
      <h1 class="text-xl font-semibold text-red-600 mb-2">인증 실패</h1>
      <p class="text-gray-600 mb-4">{message}</p>
      <a href="/signup" class="inline-block px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
        다시 회원가입하기
      </a>
    {/if}
  </div>
</div>

<style>
  :global(body) {
    margin: 0;
    padding: 0;
  }
</style>
