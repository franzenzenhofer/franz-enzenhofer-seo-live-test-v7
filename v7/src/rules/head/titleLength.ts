import type { Rule } from '@/core/types'
import { extractHtml, extractSnippet, getDomPath } from '@/shared/html-utils'

const LABEL = 'HEAD'
const NAME = 'SEO Title'
const RULE_ID = 'head:title'
const SELECTOR = 'head > title'
const SPEC = 'https://developers.google.com/search/docs/appearance/title-link'

export const titleLengthRule: Rule = {
  id: RULE_ID,
  name: NAME,
  enabled: true,
  what: 'static',
  run: async (page) => {
    // 1. Query
    const element = page.doc.querySelector(SELECTOR)
    const title = (element?.textContent ?? '').trim()
    const len = title.length

    // 2. Determine State (The Logic Layer)
    // Thresholds: 0 = Error, <50 = Warn, 50+ = OK
    const isMissing = len === 0
    const isShort = len < 50
    
    const type = isMissing ? 'error' : isShort ? 'warn' : 'ok'
    
    const message = isMissing
      ? 'Missing <title> tag or empty.'
      : isShort
        ? `Title too short (${len} chars). Recommend 50+.`
        : `Title length OK (${len} chars).`

    // 3. Build Evidence (The Data Layer)
    const sourceHtml = extractHtml(element)

    return {
      label: LABEL,
      name: NAME,
      message,
      type,
      priority: isMissing ? 100 : isShort ? 50 : 10,
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