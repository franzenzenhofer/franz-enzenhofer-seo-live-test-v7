const escapeRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
const unreserved = /^[a-z0-9._~-]$/i

// Compare UTF-8 octets while preserving encoded reserved delimiters.
// https://www.rfc-editor.org/rfc/rfc9309.html#section-2.2.2
export const normalizeRobotsPath = (value: string): string =>
  Array.from(value).map((char) => char.codePointAt(0)! > 127 ? encodeURIComponent(char) : char).join('')
    .replace(/%([0-9a-f]{2})/gi, (_, hex: string) => {
      const char = String.fromCharCode(Number.parseInt(hex, 16))
      return unreserved.test(char) ? char : `%${hex.toUpperCase()}`
    })

export const robotsPathMatches = (path: string, rule: string): boolean => {
  if (!rule.startsWith('/')) return false
  const normalized = normalizeRobotsPath(rule)
  const anchored = normalized.endsWith('$')
  const body = anchored ? normalized.slice(0, -1) : normalized
  const expression = body.split('*').map(escapeRegex).join('.*')
  return new RegExp(`^${expression}${anchored ? '$' : ''}`).test(normalizeRobotsPath(path))
}
