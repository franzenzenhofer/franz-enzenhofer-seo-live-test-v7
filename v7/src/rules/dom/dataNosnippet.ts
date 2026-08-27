import type { Rule } from '@/core/types'
import { extractHtmlFromList, extractSnippet } from '@/shared/html-utils'
import { getDomPaths } from '@/shared/dom-path'
import { sampleElements } from '@/shared/domEvidence'

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
    const { sample, total, shown, truncated } = sampleElements(page.doc.querySelectorAll('[data-nosnippet]'))
    if (total === 0) {
      return {
        label: LABEL,
        name: NAME,
        message: 'No data-nosnippet attributes found.',
        type: 'info',
        priority: 910,
        details: { reference: SPEC },
      }
    }

    const sourceHtml = extractHtmlFromList(sample)
    return {
      label: LABEL,
      name: NAME,
      message: `data-nosnippet used on ${total} element(s).`,
      type: 'warn',
      priority: 300,
      details: {
        sourceHtml,
        snippet: extractSnippet(sourceHtml),
        domPaths: getDomPaths(sample),
        count: total,
        shown,
        truncated,
        reference: SPEC,
      },
    }
  },
}
