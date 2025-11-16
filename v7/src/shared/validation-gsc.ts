import type { ValidationResult } from './validation-types'

/**
 * Validates Google Search Console site URL format.
 *
 * @param url - The GSC property URL to validate
 * @returns Validation result with status and user-friendly message
 */
export const validateGSCUrl = (url: string): ValidationResult => {
  if (!url || url.trim() === '') {
    return {
      valid: false,
      message: 'Required for Search Console rules',
      type: 'warning'
    }
  }

  const httpsPattern = /^https:\/\/.+\/$/
  const scDomainPattern = /^sc-domain:.+$/

  if (httpsPattern.test(url) || scDomainPattern.test(url)) {
    return {
      valid: true,
      message: '✓ Valid format',
      type: 'success'
    }
  }

  return {
    valid: false,
    message: 'Must be "https://example.com/" or "sc-domain:example.com"',
    type: 'error'
  }
}
