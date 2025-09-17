import type { Rule } from '@/core/types'

const depth = (e: Element): number => {
  let max = 1
  for (let i=0;i<e.children.length;i++) max = Math.max(max, 1 + depth(e.children[i]!))
  return max
}

export const nodeDepthRule: Rule = {
  id: 'dom:node-depth',
  name: 'DOM node depth',
  enabled: true,
  async run(page) {
    const d = depth(page.doc.documentElement)
    return { label: 'DOM', message: `Max depth: ${d}`, type: 'info' }
  },
}

