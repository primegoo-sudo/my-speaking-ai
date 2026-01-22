import { writable, derived} from 'svelte/store'; //, derived 
import { browser } from '$app/environment';

const initialUser = browser && localStorage.getItem('authUser')
  ? JSON.parse(localStorage.getItem('authUser'))
  : null;

export const user = writable(initialUser);

if (browser) {
  user.subscribe((val) => {
    if (val) localStorage.setItem('authUser', JSON.stringify(val));
    else localStorage.removeItem('authUser');
  });
}

export const isAuthenticated = derived(user, ($user) => !!$user);