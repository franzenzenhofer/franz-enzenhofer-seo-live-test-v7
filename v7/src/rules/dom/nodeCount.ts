import type { Rule } from '@/core/types'

const count = (n: Node): number => {
  let c = 1
  const ch = (n as Element).childNodes || []
  for (let i = 0; i < ch.length; i++) c += count(ch[i]!)
  return c
}

export const nodeCountRule: Rule = {
  id: 'dom:node-count',
  name: 'DOM node count',
  enabled: true,
  async run(page) {
    const n = count(page.doc.documentElement)
    return {
      label: 'DOM',
      message: `Node count: ${n}`,
      type: 'info',
      name: 'nodeCount',
      details: { nodeCount: n },
    }
  },
}

