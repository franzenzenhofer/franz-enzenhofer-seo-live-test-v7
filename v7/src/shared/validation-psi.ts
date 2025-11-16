import type { ValidationResult } from './validation-types'

/**
 * Validates a PageSpeed Insights API key by testing it with a real API call.
 *
 * @param key - The API key to validate (empty string = using default)
 * @returns Validation result with status and user-friendly message
 */
export const validatePSIKey = async (
  key: string
): Promise<ValidationResult> => {
  // Empty key means using default - that's valid
  if (!key || key.trim() === '') {
    return {
      valid: true,
      message: 'Using default API key (limited quota)',
      type: 'warning'
    }
  }

  // Basic format check
  if (!key.startsWith('AIza') || key.length < 30) {
    return {
      valid: false,
      message: 'Invalid format (should start with "AIza")',
      type: 'error'
    }
  }

  // Test with real API call (use google.com as test URL)
  try {
    const testUrl = 'https://google.com'
    const apiUrl = `https://pagespeedonline.googleapis.com/pagespeedonline/v5/runPagespeed?url=${testUrl}&key=${key.trim()}`

    const response = await fetch(apiUrl)

    if (response.ok) {
      return {
        valid: true,
        message: '✓ Valid API key',
        type: 'success'
      }
    } else if (response.status === 400) {
      return {
        valid: false,
        message: 'Invalid API key',
        type: 'error'
      }
    } else if (response.status === 429) {
      return {
        valid: false,
        message: 'Quota exceeded',
        type: 'error'
      }
    } else {
      return {
        valid: false,
        message: `API error: ${response.status}`,
        type: 'error'
      }
    }
  } catch {
    return {
      valid: false,
      message: 'Network error - could not validate',
      type: 'error'
    }
  }
}
