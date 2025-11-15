/**
 * Truncation limits for various text content types
 * Eliminates magic numbers for substring/slice operations
 */

export const TRUNCATION_LIMITS = {
  HTML_CONTENT: 500,
  LOG_MESSAGE: 120,
  SNIPPET: 100,
  EVENT_VALUE: 50,
  RESULTS_SAMPLE: 50,
  TITLE_MIN: 10,
  TITLE_MAX: 70,
  META_DESC_MIN: 50,
  META_DESC_MAX: 160,
} as const
