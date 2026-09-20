const stableMain = '/assets/v20260908e/index-CQVVn--2-oh20260903.js';

// Refresh the canonical application bundle before importing it. Lazy-loaded
// chunks also reference this exact URL, so this preserves a single React and
// authentication context while recovering browsers with a stale cached copy.
await fetch(stableMain, {
  cache: 'reload',
  credentials: 'same-origin',
});

await import(stableMain);
