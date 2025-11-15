import type { Rule } from '@/core/types'
import { extractHtmlFromList, extractSnippet, getDomPath } from '@/shared/html-utils'

export const h1Rule: Rule = {
  id: 'body:h1',
  name: 'H1 Present',
  enabled: true,
  what: 'static',
  async run(page) {
    const h1Elements = page.doc.querySelectorAll('h1')
    const count = h1Elements.length

    if (count === 0) {
      return {
        label: 'BODY',
        message: 'No <h1> found',
        type: 'warn',
        name: 'h1',
      }
    }

    const sourceHtml = extractHtmlFromList(h1Elements)
    const firstH1 = h1Elements[0] || null

    if (count > 1) {
      return {
        label: 'BODY',
        message: `Multiple <h1> found (${count})`,
        type: 'warn',
        name: 'h1',
        details: {
          sourceHtml,
          snippet: extractSnippet(sourceHtml),
        },
      }
    }

    return {
      label: 'BODY',
      message: '<h1> OK',
      type: 'ok',
      name: 'h1',
      details: {
        sourceHtml,
        snippet: extractSnippet(sourceHtml),
        domPath: getDomPath(firstH1),
      },
    }
  },
}

