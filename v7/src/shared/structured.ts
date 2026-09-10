import { parseLdDetails, type SchemaNode as Node } from './structuredParse'

export { LD_LIMITS, parseLdDetails } from './structuredParse'
export const parseLd = (doc: Document): Node[] => parseLdDetails(doc).entries.map(({ node }) => node)

export const schemaTypes = (n: Node): string[] => {
  const t = n['@type']
  if (!t) return []
  return (Array.isArray(t) ? t : [t]).filter((x): x is string => typeof x === 'string')
    .map((x) => x.replace(/^https?:\/\/schema\.org\//i, '').trim()).filter(Boolean)
}

export const findType = (nodes: Node[], type: string) => nodes.filter((n) => schemaTypes(n).some((value) => value.toLowerCase() === type.toLowerCase()))

export const get = (o: unknown, path: string): unknown => {
  let cur: unknown = o
  for (const k of path.split('.')) {
    if (cur === null || typeof cur !== 'object') return undefined
    const obj = cur as Record<string, unknown>
    cur = obj[k]
  }
  return cur
}
