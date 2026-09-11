import type { Rule } from '@/core/types'
import { walkNodes } from '@/shared/domFacts.walk'
import { textField } from '@/shared/presentation/create'
import { presentResult } from '@/shared/presentation/result'

export const nodeCountRule: Rule = {
  id: 'dom:node-count',
  name: 'DOM node count',
  presentation: 1,
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
    const hasIdleCount = typeof page.idleFacts?.nodeCount === 'number'
    const n = hasIdleCount ? page.idleFacts!.nodeCount : walkNodes(page.doc.documentElement, () => {}).count
    return presentResult(nodeCountRule, page, {
      input: 'Idle DOM', type: 'info', priority: 800,
      values: [textField('DOM nodes', n)],
      detailValues: [textField('Count source', hasIdleCount ? 'Idle DOM facts' : 'Parsed document tree'),
        textField('Nodes included', 'Elements, text nodes, and comments')],
      checked: [textField('Root', 'document.documentElement'), textField('Traversal', 'All descendant nodes'),
        textField('Criterion', 'Descriptive count; no threshold')],
      noMarkup: 'None - this rule reports an aggregate document metric, not individual element markup',
    })
  },
}
