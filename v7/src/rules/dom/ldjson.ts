import type { Rule } from '@/core/types'
import { extractHtmlFromList, extractSnippet } from '@/shared/html-utils'
import { getDomPaths } from '@/shared/dom-path'
import { sampleElements } from '@/shared/domEvidence'
import { parseLdDetails } from '@/shared/structured'

const TESTED = 'Searched for <script type="application/ld+json"> nodes and counted all instances.'

export const ldjsonRule: Rule = {
  id: 'dom:ldjson',
  name: 'LD+JSON presence',
  enabled: true,
  what: 'static',
  meta: {
    provenance: 'standard',
    references: [
      'https://www.w3.org/TR/json-ld/',
      'https://developers.google.com/search/docs/appearance/structured-data/intro-structured-data',
    ],
    description: 'Counts script[type="application/ld+json"] blocks and lists the distinct @type values (info-only).',
  },
  async run(page) {
    const { sample, total, shown, truncated } = sampleElements(page.doc.querySelectorAll('script[type="application/ld+json"]'))
    const sourceHtml = extractHtmlFromList(sample)
    const domPaths = getDomPaths(sample)
    const parsed = parseLdDetails(page.doc)
    const types = [...new Set(parsed.entries.map(({ node }) => String(node['@type'] || '')).filter(Boolean))]

    return total
      ? {
          label: 'DOM',
          message: `ld+json blocks: ${total}${parsed.errorCount ? `; ${parsed.errorCount} JSON parse errors` : ''}`,
          type: parsed.errorCount ? 'warn' : 'info',
          priority: 750,
          name: 'LD+JSON presence',
          details: { types, sourceHtml, snippet: extractSnippet(sourceHtml), count: total, shown, truncated, domPaths, tested: TESTED, parseErrors: parsed.errors, parseErrorCount: parsed.errorCount },
        }
      : { label: 'DOM', message: 'No ld+json', type: 'info', priority: 900, name: 'LD+JSON presence', details: { tested: TESTED } }
  },
}
