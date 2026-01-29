import { writable } from 'svelte/store';

const MAX_LOGS = 500;

export const debugLogs = writable([]);

export function logDebug(scope, message, meta = {}) {
  const entry = {
    ts: new Date().toISOString(),
    scope,
    message,
    meta
  };
  debugLogs.update((logs) => {
    const next = [...logs, entry];
    if (next.length > MAX_LOGS) next.shift();
    return next;
  });
  // Mirror to console for devtools
  // eslint-disable-next-line no-console
  console.debug(`[${scope}] ${message}`, meta);
}

export function clearDebug() {
  debugLogs.set([]);
}
