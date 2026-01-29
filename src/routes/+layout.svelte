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

<main class="min-h-[calc(100vh-4rem)]">
  <slot />
</main>