import type { Rule } from '@/core/types'
import { extractHtmlFromList, extractSnippet } from '@/shared/html-utils'
import { getDomPaths } from '@/shared/dom-path'

const SPEC = 'https://json-ld.org/spec/latest/json-ld/'
const TESTED = 'Searched for <script type="application/ld+json"> nodes and counted all instances.'

export const ldjsonRule: Rule = {
  id: 'dom:ldjson',
  name: 'LD+JSON presence',
  enabled: true,
  what: 'static',
  async run(page) {
    const scripts = Array.from(page.doc.querySelectorAll('script[type="application/ld+json"]'))
    const n = scripts.length
    const sourceHtml = extractHtmlFromList(scripts)
    const domPaths = getDomPaths(scripts)

    return n
      ? {
          label: 'DOM',
          message: `ld+json blocks: ${n}`,
          type: 'info',
          name: 'LD+JSON presence',
          details: { sourceHtml, snippet: extractSnippet(sourceHtml), count: n, domPaths, tested: TESTED, reference: SPEC },
        }
      : { label: 'DOM', message: 'No ld+json', type: 'info', name: 'ldjson', details: { tested: TESTED, reference: SPEC } }
  },
}
