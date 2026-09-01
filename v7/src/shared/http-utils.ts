import type { Result } from '@/core/types'

const SPEC = 'https://developer.chrome.com/docs/extensions/reference/webRequest/'

export const hasHeaders = (headers: Record<string, string> | undefined): boolean =>
  !!headers && Object.keys(headers).length > 0

// Abort an unread response body so the browser stops downloading it. fetch()
// resolves at headers; without this the full payload still crosses the wire.
export const discardBody = (res: Response): void => {
  res.body?.cancel().catch(() => {})
}

export const noHeadersResult = (label: string, name: string): Result => ({
  label,
  name,
  message: 'HTTP headers not captured. Press "Hard Reload" to capture headers.',
  type: 'runtime_error',
  priority: 50,
  details: {
    reason: 'Headers were not captured for this page load.',
    fix: 'Click the "Hard Reload" button to reload the page and capture HTTP headers.',
    reference: SPEC,
  },
})
