const stableMain = '/assets/v20260908e/index-CQVVn--2-oh20260903.js';

// The application bundle is versioned, so the browser can safely reuse it.
// Importing it directly avoids the previous forced network reload that left a
// blank page visible on every refresh.
await import(stableMain);
