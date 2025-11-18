/**
 * Storage Helper Functions
 */

export function getDataSize(data: unknown): number {
  try {
    return JSON.stringify(data).length
  } catch {
    return 0
  }
}

/**
 * Executes a function within a named exclusive lock using the native Web Locks API.
 * This guarantees atomic access across tabs and service workers.
 * NO POLL. NO RACE. PURE KERNEL LOCKING.
 * Fallback: If Web Locks API is not available (tests/old browsers), runs directly.
 */
export const withLock = async <T>(name: string, fn: () => Promise<T>): Promise<T> => {
  if (typeof navigator !== 'undefined' && navigator.locks) {
    return navigator.locks.request(name, async () => {
      return await fn()
    })
  }
  // Fallback for test environments or browsers without Web Locks API
  return await fn()
}
