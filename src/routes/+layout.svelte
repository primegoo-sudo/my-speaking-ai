<script>
  import Header from '$lib/components/Header.svelte';
  import './layout.css'; // 프로젝트의 전역 CSS 경로에 맞게 조정하세요
  import { onMount } from 'svelte';
  import { isAuthenticated } from '$lib/stores/auth.js';
  import { page } from '$app/stores';

  let checked = false;
  let authed = false;
  let unsub;

  onMount(() => {
    unsub = isAuthenticated.subscribe((v) => (authed = v));
    checked = true;
    return () => unsub && unsub();
  });

  $: path = $page.url.pathname;
</script>

<Header />

{#if checked && !authed && path !== '/login' && path !== '/signup'}
  <div class="min-h-screen flex items-center justify-center bg-gray-50 px-4">
    <div class="bg-white shadow-md rounded-lg p-8 max-w-md text-center">
      <h2 class="text-xl font-semibold mb-4">로그인이 필요합니다</h2>
      <p class="text-gray-600 mb-6">이 기능에 접근하려면 로그인이 필요합니다.</p>
      <div class="flex justify-center gap-3">
        <a href="/login" class="px-4 py-2 bg-blue-600 text-white rounded">로그인</a>
        <a href="/signup" class="px-4 py-2 border rounded text-blue-600">회원가입</a>
      </div>
    </div>
  </div>
{:else}
  <main class="min-h-[calc(100vh-4rem)]">
    <slot />
  </main>
{/if}