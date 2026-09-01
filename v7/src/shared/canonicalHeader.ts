// Single source of truth for parsing rel="canonical" out of an HTTP Link
// header. Three canonical rules judge the same header; they must all see the
// exact same URLs.

export const parseHeaderCanonicals = (headerValue: string | undefined | null): string[] => {
  if (!headerValue) return []
  const matches = [...headerValue.matchAll(/<([^>]+)>\s*;\s*rel="?canonical"?/gi)]
  const urls = matches.map((m) => m[1]).filter((u): u is string => !!u)
  return Array.from(new Set(urls))
}

export const linkHeaderOf = (headers?: Record<string, string>): string =>
  headers?.['link'] || headers?.['Link'] || ''
