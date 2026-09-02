import type { Rule } from '@/core/types'
import { extractHtml, stripAttributesDeep } from '@/shared/html-utils'
import { getDomPath, getDomPaths } from '@/shared/dom-path'
import { sampleElements } from '@/shared/domEvidence'

const LABEL = 'BODY', NAME = 'H1 Present', RULE_ID = 'body:h1'

export const h1Rule: Rule = {
  id: RULE_ID,
  name: NAME,
  enabled: true,
  what: 'static',
  meta: {
    provenance: 'general',
    references: [
      'https://html.spec.whatwg.org/multipage/sections.html#headings-and-outlines-2',
      'https://developers.google.com/search/docs/fundamentals/seo-starter-guide',
    ],
    description: 'Warns on a missing or empty h1; reports multiple h1 elements as info (HTML permits several top-level headings); ok on exactly one with text.',
  },
  async run(page) {
    const { sample: nodes, total: count, shown, truncated } = sampleElements(page.doc.querySelectorAll('h1'))
    const header = { ruleId: RULE_ID, label: LABEL, name: NAME, what: 'static' } as const
    if (count === 0) {
      return { ...header, message: 'No <h1> found.', type: 'warn', priority: 0 }
    }
    if (count > 1) {
      // WHATWG explicitly permits multiple top-level headings, so this is a fact, not a fault.
      return {
        ...header,
        message: `${count} <h1> elements found.`,
        type: 'info',
        priority: 700,
        details: { domPaths: getDomPaths(nodes), count, shown, truncated },
      }
    }
    const node = nodes[0]!
    const text = (node.textContent || '').replace(/\s+/g, ' ').trim()
    if (!text) {
      return {
        ...header,
        message: '<h1> is empty.',
        type: 'warn',
        priority: 200,
        details: { snippet: stripAttributesDeep(node), sourceHtml: extractHtml(node), domPath: getDomPath(node) },
      }
    }
    return {
      ...header,
      message: '1 <h1> found.',
      type: 'ok',
      priority: 1000,
      details: { h1: text, snippet: stripAttributesDeep(node), sourceHtml: extractHtml(node), domPath: getDomPath(node) },
    }
  },
}
