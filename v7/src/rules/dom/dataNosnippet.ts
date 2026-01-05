import type { Rule } from '@/core/types'
import { extractHtmlFromList, extractSnippet } from '@/shared/html-utils'
import { getDomPaths } from '@/shared/dom-path'

const LABEL = 'DOM'
const NAME = 'Data-nosnippet usage'
const RULE_ID = 'dom:data-nosnippet'
const SPEC = 'https://developers.google.com/search/docs/crawling-indexing/robots-meta-tag#data-nosnippet-attr'

export const dataNosnippetRule: Rule = {
  id: RULE_ID,
  name: NAME,
  enabled: true,
  what: 'static',
  async run(page) {
    const elements = Array.from(page.doc.querySelectorAll('[data-nosnippet]'))
    if (elements.length === 0) {
      return {
        label: LABEL,
        name: NAME,
        message: 'No data-nosnippet attributes found.',
        type: 'info',
        priority: 910,
        details: { reference: SPEC },
      }
    }

    const sourceHtml = extractHtmlFromList(elements)
    return {
      label: LABEL,
      name: NAME,
      message: `data-nosnippet used on ${elements.length} element(s).`,
      type: 'warn',
      priority: 300,
      details: {
        sourceHtml,
        snippet: extractSnippet(sourceHtml),
        domPaths: getDomPaths(elements),
        count: elements.length,
        reference: SPEC,
      },
    }
  },
}
