<script>
  import { onMount } from 'svelte';
  import supabaseClient from '$lib/supabaseClient.js';

  let items = [];
  let loading = false;
  let name = '';
  let description = '';
  let error = null;
  let success = null;

  async function fetchItems() {
    loading = true;
    error = null;
    const { data, error: err } = await supabaseClient
      .from('test_items')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20);

    if (err) error = err;
    else items = data || [];
    loading = false;
  }

  async function addItem() {
    if (!name) return;
    loading = true;
    error = null;
    success = null;
    const payload = { name, description, metadata: { from: 'browser-client' } };
    const { data, error: err } = await supabaseClient.from('test_items').insert(payload).select();
    if (err) {
      error = err;
    } else {
      success = `✓ 항목 추가됨: ${name}`;
      items = [ ...(data || []), ...items ];
      name = '';
      description = '';
      setTimeout(() => success = null, 3000);
    }
    loading = false;
  }

  async function addItemViaAPI() {
    loading = true;
    error = null;
    success = null;
    const payload = { name: name || 'api-test', description: description || 'Test via API', metadata: { from: 'api-endpoint' } };
    try {
      const res = await fetch('/api/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const result = await res.json();
      if (!res.ok || result.error) {
        error = result.error || 'API 오류';
      } else {
        success = `✓ API를 통해 추가됨`;
        name = '';
        description = '';
        fetchItems();
        setTimeout(() => success = null, 3000);
      }
    } catch (err) {
      error = err.message;
    }
    loading = false;
  }

  async function fetchViaAPI() {
    loading = true;
    error = null;
    try {
      const res = await fetch('/api/test');
      const result = await res.json();
      if (!res.ok || result.error) {
        error = result.error || 'API 오류';
      } else {
        items = result.data || [];
      }
    } catch (err) {
      error = err.message;
    }
    loading = false;
  }

  onMount(() => {
    fetchItems();
  });
</script>

<style>
  .container {
    padding: 2rem;
    max-width: 800px;
    margin: 0 auto;
    font-family: system-ui, -apple-system, sans-serif;
  }

  h1 { color: #333; margin-bottom: 1.5rem; }

  .section {
    background: #f9f9f9;
    padding: 1rem;
    border-radius: 8px;
    margin-bottom: 2rem;
    border: 1px solid #e0e0e0;
  }

  .input-group {
    display: flex;
    gap: 0.5rem;
    margin-bottom: 1rem;
    flex-wrap: wrap;
  }

  input {
    flex: 1;
    min-width: 150px;
    padding: 0.5rem;
    border: 1px solid #ccc;
    border-radius: 4px;
    font-size: 0.95rem;
  }

  button {
    padding: 0.5rem 1rem;
    background: #0070f3;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-weight: 500;
    white-space: nowrap;
  }

  button:hover:not(:disabled) { background: #0051cc; }
  button:disabled { background: #ccc; cursor: not-allowed; }

  .error {
    background: #fee;
    color: #c33;
    padding: 0.75rem;
    border-radius: 4px;
    margin-bottom: 1rem;
    border: 1px solid #fcc;
  }

  .success {
    background: #efe;
    color: #3c3;
    padding: 0.75rem;
    border-radius: 4px;
    margin-bottom: 1rem;
    border: 1px solid #cfc;
  }

  .loading { color: #666; font-style: italic; }

  .items-list {
    list-style: none;
    padding: 0;
  }

  .items-list li {
    background: white;
    padding: 1rem;
    margin-bottom: 0.5rem;
    border-radius: 4px;
    border: 1px solid #ddd;
  }

  .items-list li strong { color: #0070f3; }
  .items-list li .meta { color: #888; font-size: 0.85rem; margin-top: 0.25rem; }

  .tab-buttons {
    display: flex;
    gap: 0.5rem;
    margin-bottom: 1rem;
  }

  .tab-buttons button {
    background: #e0e0e0;
    color: #333;
  }

  .tab-buttons button.active { background: #0070f3; color: white; }
</style>

<div class="container">
  <h1>🧪 Supabase Test — test_items</h1>

  {#if error}
    <div class="error">❌ {error.message || JSON.stringify(error)}</div>
  {/if}

  {#if success}
    <div class="success">{success}</div>
  {/if}

  <div class="section">
    <h3>항목 추가</h3>
    <div class="input-group">
      <input placeholder="이름 (name)" bind:value={name} />
      <input placeholder="설명 (description)" bind:value={description} />
    </div>
    <div class="input-group">
      <button on:click={addItem} disabled={loading}>클라이언트로 추가</button>
      <button on:click={addItemViaAPI} disabled={loading}>API로 추가</button>
      <button on:click={fetchItems} disabled={loading}>새로고침 (클라이언트)</button>
      <button on:click={fetchViaAPI} disabled={loading}>새로고침 (API)</button>
    </div>
  </div>

  {#if loading}
    <div class="loading">로딩 중…</div>
  {/if}

  <div class="section">
    <h3>저장된 항목 ({items.length}개)</h3>
    {#if items.length === 0}
      <p style="color: #888;">아직 항목이 없습니다.</p>
    {:else}
      <ul class="items-list">
        {#each items as it}
          <li>
            <strong>{it.name}</strong>
            {#if it.description}
              <div>{it.description}</div>
            {/if}
            <div class="meta">
              ID: {it.id.slice(0, 8)}… | 생성: {new Date(it.created_at).toLocaleString('ko-KR')}
            </div>
          </li>
        {/each}
      </ul>
    {/if}
  </div>
</div>
