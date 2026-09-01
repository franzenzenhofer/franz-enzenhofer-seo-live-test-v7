import type { Rule } from '@/core/types'
import { walkNodes } from '@/shared/domFacts.walk'

const SPEC = 'https://developer.chrome.com/docs/lighthouse/performance/dom-size'

export const nodeCountRule: Rule = {
  id: 'dom:node-count',
  name: 'DOM node count',
  enabled: true,
  what: 'static',
  async run(page) {
    const n = page.idleFacts?.nodeCount ?? walkNodes(page.doc.documentElement, () => {}).count
    return {
      label: 'DOM',
      message: `Node count: ${n}`,
      type: 'info',
      priority: 800,
      name: 'DOM node count',
      details: { nodeCount: n, reference: SPEC },
    }
  },
}
