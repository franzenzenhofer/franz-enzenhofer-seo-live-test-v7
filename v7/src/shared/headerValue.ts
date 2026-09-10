/** HTTP field names are case-insensitive, including in imported report fixtures. */
export const headerValue = (headers: Record<string, string> | undefined, name: string): string =>
  Object.entries(headers || {}).find(([key]) => key.toLowerCase() === name.toLowerCase())?.[1]?.trim() || ''

/** Ignore quoted authorities and parameters before reading ALPN identifiers. */
export const advertisedProtocol = (header: string, protocol: 'h2' | 'h3'): boolean => {
  const declarations = header.replace(/"(?:\\.|[^"\\])*"/g, '""')
  const pattern = protocol === 'h2' ? /(?:^|,)\s*h2\s*=/ : /(?:^|,)\s*h3(?:-\d+)?\s*=/
  return pattern.test(declarations)
}
