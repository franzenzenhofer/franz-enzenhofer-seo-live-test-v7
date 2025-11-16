import type { RuleResult } from '@/background/rules/types'

/**
 * Sanitizes rule results for logging by truncating large fields
 * while preserving all important diagnostic information.
 *
 * Size limits:
 * - sourceHtml: first 200 chars (enough to identify the element)
 * - domPaths: first 5 paths (enough to see patterns)
 * - httpHeaders: first 500 chars (enough for key headers)
 * - All other fields: preserved as-is
 */
export const sanitizeForLogging = (result: RuleResult | undefined): unknown => {
  if (!result) return result

  const details = result['details']
  const rest = { ...result }
  delete rest['details']

  if (!details || typeof details !== 'object') {
    return result
  }

  const sanitized: Record<string, unknown> = { ...rest }
  const sanitizedDetails: Record<string, unknown> = {}

  for (const [key, value] of Object.entries(details)) {
    // Truncate sourceHtml to first 200 chars
    if (key === 'sourceHtml' && typeof value === 'string') {
      const truncated = value.slice(0, 200)
      sanitizedDetails[key] =
        value.length > 200 ? `${truncated}...[truncated ${value.length} chars]` : value
      continue
    }

    // Limit domPaths array to first 5 entries
    if (key === 'domPaths' && Array.isArray(value)) {
      sanitizedDetails[key] = value.length > 5 ? [...value.slice(0, 5), `...[+${value.length - 5} more]`] : value
      continue
    }

    // Truncate httpHeaders if too large
    if (key === 'httpHeaders' && typeof value === 'string') {
      const truncated = value.slice(0, 500)
      sanitizedDetails[key] =
        value.length > 500 ? `${truncated}...[truncated ${value.length} chars]` : value
      continue
    }

    // Keep all other fields as-is (snippet, reference, etc.)
    sanitizedDetails[key] = value
  }

  sanitized['details'] = sanitizedDetails
  return sanitized
}
