import { parseLdDetails, type SchemaNode as Node } from './structuredParse'

export { LD_LIMITS, parseLdDetails } from './structuredParse'
export const parseLd = (doc: Document): Node[] => parseLdDetails(doc).entries.map(({ node }) => node)

const typeList = (n: Node): string[] => {
  const t = n['@type']
  if (!t) return []
  return (Array.isArray(t) ? t : [t]).map((x) => String(x).replace(/^https?:\/\/schema\.org\//i, '').toLowerCase())
}

export const findType = (nodes: Node[], type: string) => nodes.filter((n) => typeList(n).includes(type.toLowerCase()))

export const get = (o: unknown, path: string): unknown => {
  let cur: unknown = o
  for (const k of path.split('.')) {
    if (cur === null || typeof cur !== 'object') return undefined
    const obj = cur as Record<string, unknown>
    cur = obj[k]
  }
  return cur
}
