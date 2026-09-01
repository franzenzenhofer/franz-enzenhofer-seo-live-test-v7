/**
 * A Search Console query the user is waiting on. The rule-level timeout is 60 s,
 * which is far too long to leave a row showing "Running..." for; bound the call
 * itself so a slow or unresponsive Google fails fast and loud instead.
 */
export const GSC_QUERY_TIMEOUT_MS = 15_000

export const gscFetch = async (url: string, init: RequestInit): Promise<Response> => {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), GSC_QUERY_TIMEOUT_MS)
  try {
    return await fetch(url, { ...init, signal: controller.signal })
  } catch (error) {
    if (controller.signal.aborted) {
      throw new Error(`Search Console did not respond within ${GSC_QUERY_TIMEOUT_MS / 1000}s`)
    }
    throw error
  } finally {
    clearTimeout(timer)
  }
}
