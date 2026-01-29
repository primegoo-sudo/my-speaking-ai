import { writable, derived } from 'svelte/store';
import { browser } from '$app/environment';
import { supabaseClient } from '$lib/supabaseClient.js';

export const user = writable(null);
export const authReady = writable(false);

if (browser) {
  supabaseClient.auth.getSession().then(({ data, error }) => {
    if (error) {
      console.error('[auth] getSession error:', error);
    }
    user.set(data?.session?.user ?? null);
    authReady.set(true);
  });

  supabaseClient.auth.onAuthStateChange((_event, session) => {
    user.set(session?.user ?? null);
    authReady.set(true);
  });

  user.subscribe((val) => {
    if (val) localStorage.setItem('authUser', JSON.stringify(val));
    else localStorage.removeItem('authUser');
  });
}

export const isAuthenticated = derived(user, ($user) => !!$user);