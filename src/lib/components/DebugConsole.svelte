<!-- src/lib/components/DebugConsole.svelte -->
<script>
  import { debugLogs, clearDebug } from '$lib/stores/debug.js';
  import { derived } from 'svelte/store';

  export let open = false;
  export let height = 220;
  export let filter = '';

  const filtered = derived([debugLogs], ([$logs]) => {
    if (!filter) return $logs;
    const q = filter.toLowerCase();
    return $logs.filter(
      (l) =>
        l.scope.toLowerCase().includes(q) ||
        l.message.toLowerCase().includes(q) ||
        JSON.stringify(l.meta).toLowerCase().includes(q)
    );
  });
</script>

<div class="fixed left-0 right-0 bottom-0 z-40">
  <div class="max-w-5xl mx-auto">
    <div class="bg-gray-900 text-gray-100 rounded-t-md shadow-lg overflow-hidden"
      style={`height: ${open ? height : 40}px; transition: height 160ms ease-in-out;`}>
      <div class="flex items-center justify-between px-3 h-10 border-b border-gray-700">
        <div class="flex items-center gap-2 text-sm">
          <button class="px-2 py-0.5 rounded bg-gray-700 hover:bg-gray-600" on:click={() => (open = !open)}>
            {open ? '▼' : '▲'}
          </button>
          <span class="opacity-80">Debug Console</span>
        </div>
        <div class="flex items-center gap-2">
          <input class="bg-gray-800 text-gray-100 text-xs px-2 py-1 rounded border border-gray-700"
            placeholder="filter..." bind:value={filter}>
          <button class="text-xs px-2 py-1 rounded bg-red-700 hover:bg-red-600" on:click={clearDebug}>
            Clear
          </button>
        </div>
      </div>

      {#if open}
        <div class="p-2 text-xs h-[calc(100%-40px)] overflow-auto font-mono">
          {#if $filtered.length === 0}
            <div class="opacity-60">No logs</div>
          {:else}
            {#each $filtered as l (l.ts + l.message)}
              <div class="py-0.5">
                <span class="text-gray-400">[{l.ts}]</span>
                <span class="ml-1 text-emerald-400">[{l.scope}]</span>
                <span class="ml-1">{l.message}</span>
                {#if Object.keys(l.meta || {}).length}
                  <pre class="bg-gray-800 mt-1 rounded p-1 whitespace-pre-wrap">{JSON.stringify(l.meta, null, 2)}</pre>
                {/if}
              </div>
            {/each}
          {/if}
        </div>
      {/if}
    </div>
  </div>
</div>

<style>
  .font-mono { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace; }
</style>
