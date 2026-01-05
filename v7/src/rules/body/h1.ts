import type { Rule } from '@/core/types'
import { stripAttributesDeep } from '@/shared/html-utils'
import { getDomPath, getDomPaths } from '@/shared/dom-path'

const LABEL = 'BODY', NAME = 'H1 Present', RULE_ID = 'body:h1', SPEC = 'https://developers.google.com/style/headings?hl=en'

export const h1Rule: Rule = {
  id: RULE_ID,
  name: NAME,
  enabled: true,
  what: 'static',
  async run(page) {
    const nodes = Array.from(page.doc.querySelectorAll('h1'))
    const count = nodes.length
    const header = { ruleId: RULE_ID, label: LABEL, name: NAME, what: 'static' } as const
    if (count !== 1) {
      const message = count ? `${count} <h1> elements found.` : 'No <h1> found.'
      const priority = count ? 100 : 0
      const details = count
        ? { domPaths: getDomPaths(nodes), reference: SPEC }
        : { reference: SPEC }
      return { ...header, message, type: 'warn', priority, details }
    }
    const node = nodes[0]!
    const hasContent = Boolean(node.textContent && node.textContent.trim().length)
    if (!hasContent) {
      return {
        ...header,
        message: '<h1> is empty.',
        type: 'warn',
        priority: 200,
        details: { snippet: stripAttributesDeep(node), sourceHtml: node.outerHTML, domPath: getDomPath(node), reference: SPEC },
      }
    }
    return {
      ...header,
      message: '1 <h1> found.',
      type: 'ok',
      priority: 1000,
      details: { snippet: stripAttributesDeep(node), sourceHtml: node.outerHTML, domPath: getDomPath(node), reference: SPEC },
    }
  },
}
