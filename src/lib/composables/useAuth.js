export function useAuth() {
  async function request(path, body) {
    const res = await fetch(`/api/auth/${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    if (res.ok) {
      return await res.json();
    } else {
      console.error(`Error: ${res.status} ${res.statusText}`);
      return { error: `Error: ${res.status} ${res.statusText}` };
    }
  }

  async function signup(name, email, password) {
    const res = await request('signup', { name, email, password });
    if (!res?.error && res.data?.user) {
      try { localStorage.setItem('authUser', JSON.stringify(res.data.user)); } catch {}
    }
    return res;
  }

  async function login(email, password) {
    const res = await request('login', { email, password });
    // Expecting server returns { data: { session, user } } on success
    if (!res?.error && res.data?.user) {
      try {
        localStorage.setItem('authUser', JSON.stringify(res.data.user));
        if (res.data.session?.access_token) localStorage.setItem('authToken', res.data.session.access_token);
      } catch {}
    }
    return res;
  }

  function logout() {
    try {
      localStorage.removeItem('authUser');
      localStorage.removeItem('authToken');
    } catch {}
    // trigger a reload so stores and UI update
    location.href = '/login';
  }

  return { signup, login, logout };
}