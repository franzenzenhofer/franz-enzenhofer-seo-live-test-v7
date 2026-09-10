import type { Rule } from '@/core/types'
import { walkNodes } from '@/shared/domFacts.walk'

export const nodeDepthRule: Rule = {
  id: 'dom:node-depth',
  name: 'DOM node depth',
  enabled: true,
  what: 'static',
  meta: {
    userGuide: {
      check: "Measures the deepest nesting of nodes in the page tree, counting the html root as level 1 and including text nodes. This is a structural observation; it does not identify a particular slow component or establish an SEO problem.",
      action: "When investigating rendering cost, inspect deeply nested components and simplify wrappers where practical. Keep the structure needed for meaning and accessibility, and measure performance before and after.",
    },
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
