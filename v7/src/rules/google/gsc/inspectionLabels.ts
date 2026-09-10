const MEANINGS: Record<string, string> = {
  PASS: 'Valid', FAIL: 'Error or invalid', NEUTRAL: 'Excluded', PARTIAL: 'Reserved verdict',
  ALLOWED: 'Crawling permitted', DISALLOWED: 'Crawling blocked',
  INDEXING_ALLOWED: 'Indexing permitted', BLOCKED_BY_META_TAG: 'Indexing blocked by a noindex meta tag',
  BLOCKED_BY_HTTP_HEADER: 'Indexing blocked by an X-Robots-Tag header',
  SUCCESSFUL: 'Page retrieved', SOFT_404: 'Page resembles a missing page despite its HTTP response',
  BLOCKED_ROBOTS_TXT: 'Crawl blocked by robots.txt', NOT_FOUND: 'Page not found (HTTP 404 Not Found)',
  ACCESS_DENIED: 'Authentication required (HTTP 401 Unauthorized)', SERVER_ERROR: 'Server failed (HTTP 5xx)',
  REDIRECT_ERROR: 'Google could not complete the redirect', ACCESS_FORBIDDEN: 'Access refused (HTTP 403 Forbidden)',
  BLOCKED_4XX: 'Request failed with another HTTP 4xx response', INTERNAL_CRAWL_ERROR: 'Google crawl failed internally',
  INVALID_URL: 'URL is invalid', DESKTOP: 'Desktop crawler', MOBILE: 'Mobile crawler',
}
export const inspectionLabel = (value?: string): string => !value || value.endsWith('_UNSPECIFIED')
  ? 'Not reported by Google' : `${MEANINGS[value] || 'Unrecognized reported state'} (${value})`
