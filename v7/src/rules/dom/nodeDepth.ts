import type { Rule } from '@/core/types'
import { walkNodes } from '@/shared/domFacts.walk'

export const nodeDepthRule: Rule = {
  id: 'dom:node-depth',
  name: 'DOM node depth',
  enabled: true,
  what: 'static',
  meta: {
    provenance: 'franz',
    references: ['https://developer.chrome.com/docs/lighthouse/performance/dom-size'],
    description: 'Reports the maximum DOM tree depth of the rendered (idle) or parsed document (info-only, no threshold).',
  },
  async run(page) {
    const d = page.idleFacts?.maxDepth ?? walkNodes(page.doc.documentElement, () => {}).maxDepth
    return {
      label: 'DOM',
      message: `Max depth: ${d}`,
      type: 'info',
      priority: 800,
      name: 'DOM node depth',
      details: { maxDepth: d },
    }
  },
}
