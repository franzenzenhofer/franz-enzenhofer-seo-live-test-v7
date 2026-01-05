import type { Rule } from '@/core/types'
import { extractHtml, extractSnippet } from '@/shared/html-utils'
import { getDomPath } from '@/shared/dom-path'

// Constants
const LABEL = 'HEAD'
const NAME = 'Meta Charset'
const RULE_ID = 'head:meta-charset'
const SELECTOR = 'head > meta[charset]'
const SPEC = 'https://developer.mozilla.org/en-US/docs/Web/HTML/Element/meta#charset'

export const metaCharsetRule: Rule = {
  id: RULE_ID,
  name: NAME,
  enabled: true,
  what: 'static',
  async run(page) {
    // 1. Query with precision selector
    const element = page.doc.querySelector(SELECTOR)

    // 2. Extract charset value and handle whitespace
    const charset = (element?.getAttribute('charset') || '').trim().toUpperCase()

    // 3. Determine states (Binary Logic)
    const isPresent = Boolean(element)
    const hasValue = isPresent && charset.length > 0
    const isUTF8 = charset === 'UTF-8'

    // 4. Build message (Quantified, showing the value)
    let message = ''
    let type: 'ok' | 'warn' | 'info' = 'info'
    let priority = 500

    if (!isPresent) {
      message = 'Missing <meta charset> declaration.'
      type = 'warn'
      priority = 100
    } else if (!hasValue) {
      message = '<meta charset> present but value is empty.'
      type = 'warn'
      priority = 150
    } else if (isUTF8) {
      message = 'charset=UTF-8'
      type = 'ok'
      priority = 800
    } else {
      message = `charset=${charset} (Recommend UTF-8)`
      type = 'info'
      priority = 600
    }

    // 5. Build evidence (Chain of Evidence)
    const details = isPresent
      ? {
          sourceHtml: extractHtml(element),
          snippet: extractSnippet(charset || '(empty)'),
          domPath: getDomPath(element),
          charset,
          isUTF8,
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

