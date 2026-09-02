import type { Rule } from '@/core/types'
import { walkNodes } from '@/shared/domFacts.walk'

export const nodeCountRule: Rule = {
  id: 'dom:node-count',
  name: 'DOM node count',
  enabled: true,
  what: 'static',
  meta: {
    provenance: 'franz',
    references: ['https://developer.chrome.com/docs/lighthouse/performance/dom-size'],
    description: 'Reports the total DOM node count of the rendered (idle) or parsed document (info-only, no threshold).',
  },
  async run(page) {
    const n = page.idleFacts?.nodeCount ?? walkNodes(page.doc.documentElement, () => {}).count
    return {
      label: 'DOM',
      message: `Node count: ${n}`,
      type: 'info',
      priority: 800,
      name: 'DOM node count',
      details: { nodeCount: n },
    }
  },
}
