<script>
  import { goto } from '$app/navigation';
  import { authReady, isAuthenticated } from '$lib/stores/auth.js';

  let redirected = false;

  $: if (!redirected && $authReady) {
    redirected = true;
    goto($isAuthenticated ? '/practice' : '/login', { replaceState: true });
  }
</script>

<div class="min-h-screen flex items-center justify-center bg-gray-50">
  <p class="text-gray-600">로그인 상태 확인 중...</p>
</div>
