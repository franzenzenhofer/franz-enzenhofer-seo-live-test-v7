import type { Rule } from '@/core/types'

const SPEC = 'https://developer.chrome.com/docs/lighthouse/performance/dom-size'

const depth = (root: Element): number => {
  if (!root) return 0
  let max = 1
  const stack: { node: Element; d: number }[] = [{ node: root, d: 1 }]

  while (stack.length > 0) {
    const { node, d } = stack.pop()!
    if (d > max) max = d

    for (let i = node.children.length - 1; i >= 0; i--) {
      stack.push({ node: node.children[i]!, d: d + 1 })
    }
  }
  return max
}

export const nodeDepthRule: Rule = {
  id: 'dom:node-depth',
  name: 'DOM node depth',
  enabled: true,
  what: 'static',
  async run(page) {
    const d = depth(page.doc.documentElement)
    return {
      label: 'DOM',
      message: `Max depth: ${d}`,
      type: 'info',
      name: 'DOM node depth',
      details: { maxDepth: d, reference: SPEC },
    }
  },
}
