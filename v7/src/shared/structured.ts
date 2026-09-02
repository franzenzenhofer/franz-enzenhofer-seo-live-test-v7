type Node = Record<string, unknown>
export const LD_LIMITS = { bytes: 1_000_000, nodes: 1_000 } as const

const appendNodes = (value: unknown, output: Node[]): void => {
  const pending = [value]
  while (pending.length) {
    const item = pending.pop()
    if (!item) continue
    if (Array.isArray(item)) {
      for (let index = item.length - 1; index >= 0; index--) pending.push(item[index])
      continue
    }
    if (typeof item !== 'object') continue
    const node = item as Node
    const graph = node['@graph']
    if (Array.isArray(graph)) {
      for (let index = graph.length - 1; index >= 0; index--) pending.push(graph[index])
      continue
    }
    output.push(node)
    if (output.length > LD_LIMITS.nodes) throw new Error('LD+JSON node count exceeds the bounded contract')
  }
}

export const parseLd = (doc: Document): Node[] => {
  const out: Node[] = []
  let bytes = 0
  const encoder = new TextEncoder()
  doc.querySelectorAll('script[type="application/ld+json"]').forEach((s) => {
    const source = s.textContent || ''
    bytes += encoder.encode(source).length
    if (bytes > LD_LIMITS.bytes) throw new Error('LD+JSON input exceeds the 1 MB bounded contract')
    try { appendNodes(JSON.parse(source || 'null'), out) } catch (error) {
      if (error instanceof SyntaxError) return
      throw error
    }
  })
  return out
}

const typeList = (n: Node): string[] => {
  const t = n['@type']
  if (!t) return []
  return (Array.isArray(t) ? t : [t]).map((x) => String(x).toLowerCase())
}

export const findType = (nodes: Node[], type: string) => nodes.filter((n) => typeList(n).some((t) => t.includes(type.toLowerCase())))

export const get = (o: unknown, path: string): unknown => {
  let cur: unknown = o
  for (const k of path.split('.')) {
    if (cur === null || typeof cur !== 'object') return undefined
    const obj = cur as Record<string, unknown>
    cur = obj[k]
  }
  return cur
}

