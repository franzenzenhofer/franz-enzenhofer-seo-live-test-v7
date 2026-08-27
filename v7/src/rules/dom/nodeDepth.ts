import type { Rule } from '@/core/types'
import { walkNodes } from '@/shared/domFacts.walk'

const SPEC = 'https://developer.chrome.com/docs/lighthouse/performance/dom-size'

export const nodeDepthRule: Rule = {
  id: 'dom:node-depth',
  name: 'DOM node depth',
  enabled: true,
  what: 'static',
  async run(page) {
    const d = page.idleFacts?.maxDepth ?? walkNodes(page.doc.documentElement, () => {}).maxDepth
    return {
      label: 'DOM',
      message: `Max depth: ${d}`,
      type: 'info',
      name: 'DOM node depth',
      details: { maxDepth: d, reference: SPEC },
    }
  },
}
