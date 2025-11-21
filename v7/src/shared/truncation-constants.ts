export const TRUNCATION_LIMITS = {
  // 12KB cap keeps per-result payloads lean so two runs fit under storage quotas while still giving inspection context
  HTML_CONTENT: 12000,

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
