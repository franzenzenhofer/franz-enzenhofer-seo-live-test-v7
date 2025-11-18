import type { Rule } from '@/core/types'

const count = (root: Node): number => {
  let c = 0
  const stack: Node[] = [root]

  while (stack.length > 0) {
    const node = stack.pop()!
    c++
    const ch = (node as Element).childNodes
    for (let i = ch.length - 1; i >= 0; i--) {
      stack.push(ch[i]!)
    }
  }
  return c
}

export const nodeCountRule: Rule = {
  id: 'dom:node-count',
  name: 'DOM node count',
  enabled: true,
  what: 'static',
  async run(page) {
    const n = count(page.doc.documentElement)
    return {
      label: 'DOM',
      message: `Node count: ${n}`,
      type: 'info',
      name: 'DOM node count',
      details: { nodeCount: n },
    }
  },
}

