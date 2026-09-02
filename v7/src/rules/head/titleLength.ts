import type { Rule } from '@/core/types'
import { extractHtml, extractSnippet } from '@/shared/html-utils'
import { getDomPath } from '@/shared/dom-path'

const LABEL = 'HEAD'
const NAME = 'SEO Title Length'
const RULE_ID = 'head:title'
const SELECTOR = 'head > title'

export const titleLengthRule: Rule = {
  id: RULE_ID,
  name: NAME,
  enabled: true,
  what: 'static',
  meta: {
    provenance: 'general',
    references: ['https://developers.google.com/search/docs/appearance/title-link'],
    description: 'Measures <title> character length as informational evidence; Google documents no character limit (truncation is display-width based), so no length threshold is enforced.',
  },
  run: async (page) => {
    const element = page.doc.querySelector(SELECTOR)
    const title = (element?.textContent ?? '').trim()
    const len = title.length

    if (!element) {
      return {
        label: LABEL,
        name: NAME,
        message: 'No <title> tag found; length not measurable (see "SEO Title Present").',
        type: 'info',
        priority: 900,
        details: {},
      }
    }

    const suffix = len === 0 ? ' (blank title; flagged by "SEO Title Present")' : ''
    const sourceHtml = extractHtml(element)

    return {
      label: LABEL,
      name: NAME,
      message: `Meta-Title length: ${len}${suffix}`,
      type: 'info',
      priority: 760,
      details: {
        sourceHtml,
        snippet: extractSnippet(title),
        domPath: getDomPath(element),
        title,
        length: len,
      },
    }
  },
}
