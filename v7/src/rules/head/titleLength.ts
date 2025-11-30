import type { Rule } from '@/core/types'
import { extractHtml, extractSnippet, getDomPath } from '@/shared/html-utils'

const LABEL = 'HEAD'
const NAME = 'SEO Title Length'
const RULE_ID = 'head:title'
const SELECTOR = 'head > title'
const SPEC = 'https://developers.google.com/search/docs/appearance/title-link'

export const titleLengthRule: Rule = {
  id: RULE_ID,
  name: NAME,
  enabled: true,
  what: 'static',
  run: async (page) => {
    const element = page.doc.querySelector(SELECTOR)
    const title = (element?.textContent ?? '').trim()
    const len = title.length

    if (!element) {
      return {
        label: LABEL,
        name: NAME,
        message: 'No <title> tag found; cannot measure length.',
        type: 'error',
        priority: 0,
        details: { reference: SPEC },
      }
    }

    let type: 'info' | 'warn' | 'error' = 'info'
    let suffix = ''
    if (len === 0) {
      type = 'error'
      suffix = ' (blank title)'
    } else if (len < 40) {
      type = 'warn'
      suffix = ' (short title)'
    } else if (len > 240) {
      type = 'warn'
      suffix = ' (very long title)'
    } else if (len > 120) {
      type = 'warn'
      suffix = ' (long title)'
    }

    const sourceHtml = extractHtml(element)

    return {
      label: LABEL,
      name: NAME,
      message: `Meta-Title length: ${len}${suffix}`,
      type,
      priority: type === 'info' ? 760 : type === 'warn' ? 200 : 0,
      details: {
        sourceHtml,
        snippet: extractSnippet(title),
        domPath: getDomPath(element),
        length: len,
        reference: SPEC,
      },
    }
  },
}
