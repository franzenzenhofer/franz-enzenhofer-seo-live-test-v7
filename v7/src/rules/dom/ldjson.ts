import type { Rule } from '@/core/types'
import { extractHtmlFromList, extractSnippet } from '@/shared/html-utils'
import { getDomPaths } from '@/shared/dom-path'
import { sampleElements } from '@/shared/domEvidence'

const SPEC = 'https://json-ld.org/spec/latest/json-ld/'
const TESTED = 'Searched for <script type="application/ld+json"> nodes and counted all instances.'

export const ldjsonRule: Rule = {
  id: 'dom:ldjson',
  name: 'LD+JSON presence',
  enabled: true,
  what: 'static',
  async run(page) {
    const { sample, total, shown, truncated } = sampleElements(page.doc.querySelectorAll('script[type="application/ld+json"]'))
    const sourceHtml = extractHtmlFromList(sample)
    const domPaths = getDomPaths(sample)

    return total
      ? {
          label: 'DOM',
          message: `ld+json blocks: ${total}`,
          type: 'info',
          name: 'LD+JSON presence',
          details: { sourceHtml, snippet: extractSnippet(sourceHtml), count: total, shown, truncated, domPaths, tested: TESTED, reference: SPEC },
        }
      : { label: 'DOM', message: 'No ld+json', type: 'info', name: 'ldjson', details: { tested: TESTED, reference: SPEC } }
  },
}
