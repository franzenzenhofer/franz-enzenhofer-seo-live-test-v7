const cache = new Map<string, Promise<string | null>>()

export const fetchTextOnce = (url: string): Promise<string | null> => {
  if (!cache.has(url)) {
    cache.set(url, fetch(url).then(r => (r.ok ? r.text() : null)).catch(() => null))
  }
  return cache.get(url)!
}

