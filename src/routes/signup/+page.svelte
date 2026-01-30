<script>
  import { goto } from '$app/navigation';
  import AuthForm from '$lib/components/AuthForm.svelte';
  import { authReady, isAuthenticated } from '$lib/stores/auth.js';
  import { supabaseClient } from '$lib/supabaseClient';
  import { onMount } from 'svelte';

  function handleSuccess() {
     // 회원가입 성공하면 AI 대화 화면으로 이동
     goto('/practice', { replaceState: true });
  }

  let redirected = false;
  onMount(
    async () => {
      try{
        const { data, error } = await supabaseClient.auth.getSession();
      }catch(err){
        console.error('Error getting session:', err);
      }finally{
        if (!redirected && $authReady && !$isAuthenticated) {
          redirected = true;    
          goto('/login', { replaceState: true });
        } else {
          goto('/practice', { replaceState: true });
        }
      }
    }    
  )
</script>

<section class="min-h-screen flex items-center justify-center bg-gray-50">
  <div class="max-w-6xl w-full grid grid-cols-1 md:grid-cols-2 gap-8 items-center p-8">
    <div class="px-6">
      <h1 class="text-4xl font-extrabold mb-4">시작하기 — My Speaking AI</h1>
      <p class="text-lg text-gray-700 mb-6">회원가입하고 음성 AI 서비스를 시작하세요.</p>
    </div>

    <div class="flex items-center justify-center">
      <div class="w-full max-w-md bg-white shadow-md rounded-lg p-6">
        <div class="flex items-center justify-center mb-4">
          <img src="/logo.svg" alt="logo" class="h-10 w-10 mr-3"/>
          <span class="text-xl font-semibold">My Speaking AI</span>
        </div>

        <h2 class="text-center text-2xl font-semibold mb-4">회원가입</h2>

        <AuthForm mode="signup" on:success={handleSuccess} />

        <div class="mt-4 text-center text-sm text-gray-600">
          이미 계정이 있으신가요?
          <a href="/login" class="text-blue-600 hover:underline ml-1">로그인</a>
        </div>
      </div>
    </div>
  </div>
</section>