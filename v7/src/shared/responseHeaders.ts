export type HeaderField = [string, string]

export const normalizeResponseHeaders = (fields: HeaderField[]): Record<string, string> => {
  const headers: Record<string, string> = {}
  for (const [name, value] of fields) {
    const key = name.toLowerCase()
    headers[key] = headers[key] === undefined ? value : `${headers[key]}, ${value}`
  }
  return headers
}

export const indexingHeaderFields = (fields: HeaderField[]): HeaderField[] =>
  fields.filter(([name]) => ['x-robots-tag', 'link'].includes(name.toLowerCase()))

export const fieldsFromRecord = (headers?: Record<string, string | undefined>): HeaderField[] =>
  Object.entries(headers || {}).flatMap(([name, value]) => typeof value === 'string' ? [[name, value] as HeaderField] : [])
