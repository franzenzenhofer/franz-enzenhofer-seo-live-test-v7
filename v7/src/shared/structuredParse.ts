export type SchemaNode = Record<string, unknown>
export type LdEntry = { node: SchemaNode; scriptIndex: number; script: Element }
export const LD_LIMITS = { bytes: 1_000_000, nodes: 1_000 } as const

const entriesOf = (value: unknown, script: Element, scriptIndex: number, output: LdEntry[]) => {
  const pending = [value]
  while (pending.length) {
    const item = pending.pop()
    if (!item || typeof item !== 'object') continue
    if (Array.isArray(item)) { for (let i = item.length - 1; i >= 0; i--) pending.push(item[i]); continue }
    const node = item as SchemaNode
    if (!Array.isArray(node['@graph']) || node['@type']) {
      output.push({ node, script, scriptIndex })
      if (output.length > LD_LIMITS.nodes) throw new Error('LD+JSON node count exceeds the bounded contract')
    }
    if (Array.isArray(node['@graph'])) pending.push(node['@graph'])
  }
}

export const parseLdDetails = (doc: Document) => {
  const entries: LdEntry[] = [], errors: Array<{ scriptIndex: number; message: string }> = []
  let bytes = 0, errorCount = 0
  const encoder = new TextEncoder()
  const scripts = doc.querySelectorAll('script[type="application/ld+json"]')
  scripts.forEach((script, scriptIndex) => {
    const source = script.textContent || ''
    bytes += encoder.encode(source).length
    if (bytes > LD_LIMITS.bytes) throw new Error('LD+JSON input exceeds the 1 MB bounded contract')
    try { entriesOf(JSON.parse(source), script, scriptIndex, entries) } catch (error) {
      if (!(error instanceof SyntaxError)) throw error
      errorCount++
      if (errors.length < 10) errors.push({ scriptIndex, message: error.message.slice(0, 180) })
    }
  })
  return { entries, errors, errorCount, scriptCount: scripts.length }
}
