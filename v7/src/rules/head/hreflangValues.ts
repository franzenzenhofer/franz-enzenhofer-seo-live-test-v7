import type { Rule } from '@/core/types'
import { extractHtmlFromList, extractSnippet } from '@/shared/html-utils'
import { getDomPaths } from '@/shared/dom-path'
import { sampleMatchingElements } from '@/shared/domEvidence'

const LABEL = 'HEAD'
const NAME = 'Hreflang values'
const RULE_ID = 'head:hreflang-values'
const SELECTOR = 'head > link[rel~="alternate" i][hreflang]'
const SPEC = 'https://developers.google.com/search/docs/specialty/international/localized-versions'

const isValidHreflang = (value: string) =>
  /^(x-default|[a-z]{2,3}(-[a-z]{4})?(-([a-z]{2}|\d{3}))?)$/i.test(value)

export const hreflangValuesRule: Rule = {
  id: RULE_ID,
  name: NAME,
  enabled: true,
  what: 'static',
  async run(page) {
    const elements = page.doc.querySelectorAll<HTMLLinkElement>(SELECTOR)
    if (!elements.length) {
      return { label: LABEL, name: NAME, message: 'No hreflang links found.', type: 'info', priority: 900, details: { reference: SPEC } }
    }

    const invalid = sampleMatchingElements(elements, (el) => !isValidHreflang((el.getAttribute('hreflang') || '').trim()))
    if (!invalid.total) {
      return { label: LABEL, name: NAME, message: `All ${elements.length} hreflang values look valid.`, type: 'ok', priority: 820, details: { count: elements.length, reference: SPEC } }
    }

    const invalidValues = invalid.sample.map((el) => (el.getAttribute('hreflang') || '').trim()).filter(Boolean)
    const sourceHtml = extractHtmlFromList(invalid.sample)

    return {
      label: LABEL,
      name: NAME,
      message: `Invalid hreflang values: ${invalidValues.join(', ')}.`,
      type: 'warn',
      priority: 220,
      details: {
        sourceHtml,
        snippet: extractSnippet(sourceHtml, 150),
        domPaths: getDomPaths(invalid.sample),
        invalidValues,
        invalidCount: invalid.total,
        totalCount: elements.length,
        shown: invalid.shown,
        truncated: invalid.truncated,
        reference: SPEC,
      },
    }
  },
}
