// Retries chrome.storage.*.set() on transient quota or busy errors with a
// short exponential backoff. Anything not quota-shaped is rethrown immediately
// so genuine bugs still surface loudly.

const QUOTA_HINTS = ['QUOTA', 'quota', 'MAX_', 'WRITE_OPERATIONS_PER']
const BACKOFFS_MS = [100, 250, 500]

export const isQuotaLike = (err: unknown): boolean => {
  const msg = err instanceof Error ? err.message : String(err || '')
  return QUOTA_HINTS.some((h) => msg.includes(h))
}

const sleep = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms))

export const withQuotaRetry = async <T>(label: string, fn: () => Promise<T>): Promise<T> => {
  let lastErr: unknown
  for (let attempt = 0; attempt <= BACKOFFS_MS.length; attempt++) {
    try {
      return await fn()
    } catch (err) {
      lastErr = err
      if (!isQuotaLike(err) || attempt === BACKOFFS_MS.length) throw err
      const wait = BACKOFFS_MS[attempt]!
      console.warn(`[storage-retry] ${label} quota-like error, retrying in ${wait}ms (attempt ${attempt + 1}/${BACKOFFS_MS.length})`)
      await sleep(wait)
    }
  }
  throw lastErr
}

export const __retry = { BACKOFFS_MS, isQuotaLike }
