<script>
  import { onDestroy, onMount } from 'svelte'; 
  import { supabase } from '$lib/supabaseClient';
  import { goto } from '$app/navigation';
  
  let current = '';

  let user = null;
  let loading = true;
  let subscription = null;

  async function loadUser() {
    const res = await supabase.auth.getUser();
    user = res?.data?.user ?? null;
    loading = false;
  }  

  // 안전한 클라이언트 전용 구독: 서버(SRR)에서는 실행되지 않음
  onMount(async () => {
    await loadUser();
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      user = session?.user ?? null;
      loading = false;
    });
    subscription = data?.subscription;
  });


  onDestroy(() => {
    if (subscription && subscription.unsubscribe) subscription.unsubscribe();
  });

  async function handleLogout() {
    await supabase.auth.signOut();
    user = null;
    goto('/');
  }  
</script>

<!--nav class="w-full bg-white/90 backdrop-blur sticky top-0 z-40 border-b">
  <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
    <div class="flex items-center justify-between h-16">
      <a href="/" class="flex items-center gap-3">
        <img src="/logo.svg" alt="logo" class="h-8 w-auto"/>
        <span class="font-semibold text-lg">My Speaking AI</span>
      </a>

      <div class="flex items-center space-x-3">
            {#if loading}
              <div>Loading…</div>
            {:else}
              {#if user}
                <div class="email">{user.email}</div>
                <button on:click={handleLogout}>Logout</button>
              {:else}
                <a href="/auth/login"><button>Login</button></a>
                <a href="/auth/register"><button>Sign up</button></a>
              {/if}
            {/if}
        <a href="/login" class="px-4 py-2 rounded-md text-sm font-medium"
           class:active={current === '/login'}>로그인</a>
        <a href="/signup" class="px-4 py-2 rounded-md text-sm font-medium border border-blue-600 text-blue-600 hover:bg-blue-50">회원가입</>
      </div>
    </div>
  </div>
</nav -->

<header>
  <div class="brand">My Speaking AI</div>
  <div class="controls">
    {#if loading}
      <div>Loading…</div>
    {:else}
      {#if user}
        <div class="email">{user.email}</div>
        <button on:click={handleLogout}>Logout</button>
      {:else}
        <a href="/auth/login"><button>Login</button></a>
        <a href="/auth/register"><button>Sign up</button></a>
      {/if}
    {/if}
  </div>
</header>

<style>
  .active { background-color: #2563eb; color: white; }
  header { display:flex; align-items:center; justify-content:space-between; padding:0.5rem 1rem; border-bottom:1px solid #e6e6e6; }
  .brand { font-weight:600; }
  .controls { display:flex; gap:0.5rem; align-items:center; }
  button { padding:0.4rem 0.6rem; border-radius:4px; border:1px solid #ccc; background:#fff; cursor:pointer; }
  .email { font-size:0.9rem; color:#333; }
  a { text-decoration:none; } 
</style>