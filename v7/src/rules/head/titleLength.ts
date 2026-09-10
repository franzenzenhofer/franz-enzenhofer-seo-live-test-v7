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
    userGuide: {
      check: "Measures the first title element. Google has no fixed character limit: visible space depends on the device and text width. Use this count as editorial context, not a pass/fail SEO threshold.",
      action: "Write a concise title that accurately distinguishes this page; do not pad or cut useful wording just to reach a character count.",
    },
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
      message: `Title length: ${len} characters${suffix}`,
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
