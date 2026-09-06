export type ResourceFact = {
  url: string
  type?: string
  status?: number
  error?: string
  fromCache?: boolean
  headers?: Record<string, string>
}

export const RESOURCE_HEADER_NAMES = new Set([
  'content-type', 'content-encoding', 'content-length', 'cache-control',
  'etag', 'last-modified', 'age', 'vary', 'cache-status', 'cf-cache-status', 'x-cache',
])

export const resourceHeaders = (headers?: Record<string, string | undefined>): Record<string, string> => {
  const selected: Record<string, string> = {}
  for (const [name, value] of Object.entries(headers || {})) {
    if (RESOURCE_HEADER_NAMES.has(name.toLowerCase()) && value) selected[name.toLowerCase()] = value.slice(0, 512)
  }
  return selected
}
