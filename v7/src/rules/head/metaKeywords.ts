import type { Rule } from '@/core/types'
import { extractHtml, extractSnippet, getDomPath } from '@/shared/html-utils'

// Constants
const LABEL = 'HEAD'
const NAME = 'Meta Keywords (Deprecated)'
const RULE_ID = 'head:meta-keywords'
const SELECTOR = 'head > meta[name="keywords"]'
const SPEC = 'https://developers.google.com/search/blog/2009/09/google-does-not-use-keywords-meta-tag'

export const metaKeywordsRule: Rule = {
  id: RULE_ID,
  name: NAME,
  enabled: true,
  what: 'static',
  async run(page) {
    // 1. Query with precision selector
    const element = page.doc.querySelector(SELECTOR)

    // 2. Extract content and handle whitespace
    const content = (element?.getAttribute('content') || '').trim()

    // 3. Determine states (Binary Logic)
    const isPresent = Boolean(element)
    const hasContent = isPresent && content.length > 0

    // 4. Parse keywords if present
    const keywords = hasContent ? content.split(',').map((k) => k.trim()).filter(Boolean) : []

    // 5. Build message (Quantified, showing deprecation warning)
    let message = ''
    let type: 'ok' | 'warn' = 'ok'
    let priority = 900

    if (!isPresent) {
      message = 'No meta keywords tag. (Preferred: this tag is ignored since 2009)'
      type = 'ok'
      priority = 980
    } else if (!hasContent) {
      message = 'Meta keywords tag present but empty. (Deprecated/ignored; remove it)'
      type = 'warn'
      priority = 700
    } else if (keywords.length === 1) {
      message = `Meta keywords present with 1 keyword. (Deprecated/ignored; remove it)`
      type = 'warn'
      priority = 650
    } else {
      message = `Meta keywords present with ${keywords.length} keywords. (Deprecated/ignored; remove it)`
      type = 'warn'
      priority = 650
    }

    // 6. Build evidence (Chain of Evidence)
    const details = isPresent
      ? {
          sourceHtml: extractHtml(element),
          snippet: extractSnippet(content || '(empty)'),
          domPath: getDomPath(element),
          content,
          keywords,
          count: keywords.length,
          reference: SPEC,
        }
      : { reference: SPEC }

    return {
      label: LABEL,
      name: NAME,
      message,
      type,
      priority,
      details,
    }
  },
}
