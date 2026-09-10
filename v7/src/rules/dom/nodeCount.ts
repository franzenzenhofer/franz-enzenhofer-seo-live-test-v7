import type { Rule } from '@/core/types'
import { walkNodes } from '@/shared/domFacts.walk'

export const nodeCountRule: Rule = {
  id: 'dom:node-count',
  name: 'DOM node count',
  enabled: true,
  what: 'static',
  meta: {
    userGuide: {
      check: "Counts nodes in the inspected page tree, including elements, text and comments. This differs from tools that count only HTML elements. A large count can add rendering work, but this result is descriptive and has no pass/fail SEO limit.",
      action: "If rendering is slow, inspect which repeated components create most nodes and simplify unnecessary markup. Confirm the impact with a performance trace rather than optimizing only for this count.",
    },
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
