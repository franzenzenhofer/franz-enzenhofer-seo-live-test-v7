const cache = new Map<string, Promise<string | null>>()

const isValidHttpUrl = (url: string): boolean => {
  try {
    const u = new URL(url)
    return u.protocol === 'http:' || u.protocol === 'https:'
  } catch {
    return false
  }
}

export const fetchTextOnce = (url: string): Promise<string | null> => {
  if (!isValidHttpUrl(url)) {
    console.error(`[fetchTextOnce] Invalid URL blocked: ${url}`)
    return Promise.resolve(null)
  }

  if (!cache.has(url)) {
    cache.set(url, fetch(url).then(r => (r.ok ? r.text() : null)).catch(() => null))
  }
  return cache.get(url)!
}

