<!-- src/lib/components/AuthForm.svelte -->
<script>
  import { createEventDispatcher } from 'svelte';
  import { useAuth } from '$lib/composables/useAuth.js';

  export let mode = 'login'; // 'login' | 'signup'
  const dispatch = createEventDispatcher();
  const { signup, login } = useAuth();

  let name = '';
  let email = '';
  let password = '';
  let confirmPassword = '';
  let error = '';
  let loading = false;

  // password visibility
  let showPassword = false;
  let showConfirm = false;

  function validate() {
    if (mode === 'signup') {
      if (!name || name.trim().length < 3) {
        error = '사용자 이름은 최소 3자 이상이어야 합니다.';
        return false;
      }
    }

    if (!email || !password) {
      error = '이메일과 비밀번호를 입력하세요.';
      return false;
    }
    if (mode === 'signup') {
      if (password !== confirmPassword) {
        error = '비밀번호가 일치하지 않습니다.';
        return false;
      }
      if (password.length < 8) {
        error = '비밀번호는 최소 8자 이상이어야 합니다.';
        return false;
      }
    }
    error = '';
    return true;
  }

  async function submit() {
    if (!validate()) return;
    loading = true;
    error = '';
    
    try {
      const res = mode === 'signup'
        ? await signup(name, email, password)
        : await login(email, password);

      if (res?.error) {
        // Supabase 에러 메시지를 한글로 변환
        const errorMsg = translateError(res.error);
        error = errorMsg;
      } else {
        // 성공 시 이벤트 디스패치
        dispatch('success', res.data ?? res);
      }
    } catch (e) {
      error = e?.message ?? '알 수 없는 오류가 발생했습니다.';
    } finally {
      loading = false;
    }
  }

  function translateError(err) {
    const errorStr = typeof err === 'string' ? err : err?.message || '';
    
    // 일반적인 Supabase 에러 메시지 번역
    if (errorStr.includes('Invalid login credentials') || errorStr.includes('invalid_credentials')) {
      return '이메일 또는 비밀번호가 올바르지 않습니다.';
    }
    if (errorStr.includes('Email not confirmed')) {
      return '이메일 인증이 필요합니다. 이메일을 확인해주세요.';
    }
    if (errorStr.includes('User already registered')) {
      return '이미 등록된 이메일입니다.';
    }
    if (errorStr.includes('Password should be at least')) {
      return '비밀번호는 최소 6자 이상이어야 합니다.';
    }
    if (errorStr.includes('Unable to validate email address')) {
      return '유효하지 않은 이메일 주소입니다.';
    }
    if (errorStr.includes('Signup requires a valid password')) {
      return '유효한 비밀번호를 입력해주세요.';
    }
    
    return errorStr || '오류가 발생했습니다.';
  }

  function toggleShow(p) {
    if (p === 'password') showPassword = !showPassword;
    else showConfirm = !showConfirm;
  }
</script>

<form on:submit|preventDefault={submit} class="space-y-4">
  {#if mode === 'signup'}
    <div>
      <label for="name" class="block text-sm font-medium text-gray-700 mb-1">사용자 이름</label>
      <input
        type="text"
        id="name"
        name="name"
        bind:value={name}
        required
        placeholder="예: honggildong"
        class="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
      />
    </div>
  {/if}

  <div>
    <label for="email" class="block text-sm font-medium text-gray-700 mb-1">이메일</label>
    <input type="email" id="email" bind:value={email} required placeholder="you@example.com"
      name="email"
      class="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400" />
  </div>

  <div class="relative">
    <label for="password" class="block text-sm font-medium text-gray-700 mb-1">비밀번호</label>
    <div class="flex items-center">
      <input
        type={showPassword ? 'text' : 'password'}
        id="password"
        name="password"
        bind:value={password}
        required
        placeholder="••••••••"
        class="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
      />
      <button type="button" on:click={() => toggleShow('password')} aria-label="Toggle password visibility"
        class="ml-2 p-2 text-gray-600 hover:text-gray-800">
        {#if showPassword}
          <!-- eye-off -->
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19C7 19 3.27 16.11 1.5 12c.92-1.88 2.36-3.5 4.2-4.73M6.1 6.1A9.956 9.956 0 0112 5c5 0 8.73 2.89 10.5 7-1.02 2.09-2.67 3.85-4.64 4.96M3 3l18 18"/>
          </svg>
        {:else}
          <!-- eye -->
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5s8.268 2.943 9.542 7c-1.274 4.057-5.065 7-9.542 7S3.732 16.057 2.458 12z"/>
          </svg>
        {/if}
      </button>
    </div>
  </div>

  {#if mode === 'signup'}
    <div class="relative">
      <label for="confirmPassword" class="block text-sm font-medium text-gray-700 mb-1">비밀번호 확인</label>
      <div class="flex items-center">
        <input
          type={showConfirm ? 'text' : 'password'}
          id="confirmPassword"
          name="confirmPassword"
          bind:value={confirmPassword}
          required
          placeholder="비밀번호 재입력"
          class="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
        <button type="button" on:click={() => toggleShow('confirm')} aria-label="Toggle confirm password visibility"
          class="ml-2 p-2 text-gray-600 hover:text-gray-800">
          {#if showConfirm}
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19C7 19 3.27 16.11 1.5 12c.92-1.88 2.36-3.5 4.2-4.73M6.1 6.1A9.956 9.956 0 0112 5c5 0 8.73 2.89 10.5 7-1.02 2.09-2.67 3.85-4.64 4.96M3 3l18 18"/>
            </svg>
          {:else}
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5s8.268 2.943 9.542 7c-1.274 4.057-5.065 7-9.542 7S3.732 16.057 2.458 12z"/>
            </svg>
          {/if}
        </button>
      </div>
    </div>
  {/if}

  {#if error}
    <div class="text-sm text-red-600">{error}</div>
  {/if}

  <button type="submit"
    class="w-full bg-blue-600 text-white py-2 rounded-md font-medium disabled:opacity-60"
    disabled={loading}>
    {#if loading}처리중...{:else}{mode === 'signup' ? '회원가입' : '로그인'}{/if}
  </button>
</form>