/**
 * Truncation limits calculated to prevent Chrome Storage Quota Exceeded errors.
 * Hard limit per item in local storage is ~10MB.
 * 10MB / 100 rules = ~100KB safe limit per rule.
 * We set strict bounds to 64KB to be safe.
 */
export const TRUNCATION_LIMITS = {
  // 64KB - Enough for massive JSON-LD or huge HTML blocks, but stops binary blobs
  HTML_CONTENT: 64000,

  // 2KB - Plenty for debug logs, prevents log flooding attacks
  LOG_MESSAGE: 2000,

  // 1KB - UI snippets don't need more than this
  SNIPPET: 1000,

  EVENT_VALUE: 200,
  RESULTS_SAMPLE: 50,
  TITLE_MIN: 10,
  TITLE_MAX: 70,
  META_DESC_MIN: 50,
  META_DESC_MAX: 160,
} as const
