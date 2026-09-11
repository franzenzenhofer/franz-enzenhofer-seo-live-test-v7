import type { Rule } from '@/core/types'
import { walkNodes } from '@/shared/domFacts.walk'
import { textField } from '@/shared/presentation/create'
import { presentResult } from '@/shared/presentation/result'

export const nodeDepthRule: Rule = {
  id: 'dom:node-depth',
  name: 'DOM node depth',
  presentation: 1,
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
    const hasIdleDepth = typeof page.idleFacts?.maxDepth === 'number'
    const d = hasIdleDepth ? page.idleFacts!.maxDepth : walkNodes(page.doc.documentElement, () => {}).maxDepth
    return presentResult(nodeDepthRule, page, {
      input: 'Idle DOM', type: 'info', priority: 800,
      values: [textField('Maximum node depth', d)],
      detailValues: [textField('Depth source', hasIdleDepth ? 'Idle DOM facts' : 'Parsed document tree'),
        textField('Depth unit', 'Node levels')],
      checked: [textField('Root level', 'document.documentElement is level 1'),
        textField('Nodes included', 'Elements, text nodes, and comments'), textField('Criterion', 'Descriptive depth; no threshold')],
      noMarkup: 'None - this rule reports an aggregate document metric, not individual element markup',
    })
  },
}
