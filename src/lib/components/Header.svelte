<!-- src/lib/components/Header.svelte -->
<script>
  import { onMount } from 'svelte'
  import { browser } from '$app/environment'
  import { goto } from '$app/navigation'
  import supabase from '$lib/supabaseClient'

  let user = null
  let loading = true
  let subscription = null

  async function initAuth() {
    if (!browser) {
      loading = false
      return
    }

    try {
      const { data } = await supabase.auth.getUser()
      console.log('Auth User Data:', data);
      user = data?.user ?? null
    } catch (err) {
      user = null
    } finally {
      loading = false
    }

    const result = supabase.auth.onAuthStateChange((_event, session) => {
      user = session?.user ?? null
      loading = false
    })
    subscription = result?.data?.subscription ?? null
  }

  onMount(() => {
    initAuth()
    return () => {
      if (subscription && typeof subscription.unsubscribe === 'function') {
        subscription.unsubscribe()
      }
    }
  })

  function goLogin() { goto('/login') }
  function goSignup() { goto('/signup') }
  function goProfile() { goto('/profile') }

  async function signOut() {
    await supabase.auth.signOut()
    user = null
    goto('/')
  }
</script>

<nav class="flex items-center justify-end gap-3 px-4 py-3">
  {#if loading}
    <span class="text-sm text-gray-500">Loading..</span>
  {:else}
    {#if user}
      <div class="flex items-center gap-3">
        <button
          on:click={goProfile}
          class="text-sm text-gray-700 hover:text-indigo-600 underline-offset-2 hover:underline transition"
        >
          안녕하세요, {user.email}
        </button>
        <button
          on:click={signOut}
          class="px-3 py-1.5 rounded-md bg-gray-100 text-gray-800 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-gray-300 transition"
        >
          Logout
        </button>
      </div>
    {:else}
      <div class="flex items-center gap-2">
        <button
          on:click={goLogin}
          class="px-3 py-1.5 rounded-md border border-indigo-600 text-indigo-600 bg-white hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-indigo-300 transition text-sm"
        >
          Login
        </button>
        <button
          on:click={goSignup}
          class="px-3 py-1.5 rounded-md bg-indigo-600 text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-indigo-400 transition text-sm"
        >
          Sign Up
        </button>
      </div>
    {/if}
  {/if}
</nav>