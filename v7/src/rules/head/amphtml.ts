import type { Rule } from '@/core/types'
import { extractHtml, extractSnippet, getDomPath } from '@/shared/html-utils'

// Constants
const LABEL = 'HEAD'
const NAME = 'AMP HTML Link'
const RULE_ID = 'head:amphtml'
const SELECTOR = 'head > link[rel="amphtml"]'
const SPEC = 'https://developers.google.com/search/docs/appearance/amp'

export const amphtmlRule: Rule = {
  id: RULE_ID,
  name: NAME,
  enabled: true,
  what: 'static',
  async run(page) {
    // 1. Query with precision selector
    const element = page.doc.querySelector(SELECTOR)

    // 2. Extract href and handle whitespace
    const href = element?.getAttribute('href')?.trim() || ''

    // 3. Determine states (Binary Logic)
    const isPresent = Boolean(element)
    const hasHref = isPresent && href.length > 0

    // 4. Build message (Quantified, showing the value)
    const message = !isPresent
      ? 'No AMP HTML link found.'
      : !hasHref
        ? 'AMP HTML link present but href is empty.'
        : `AMP HTML link: "${extractSnippet(href, 50)}"`

    // 5. Determine type (AMP is informational - Google no longer requires it)
    const type = 'info'

    // 6. Build evidence (Chain of Evidence)
    const details = isPresent
      ? {
          sourceHtml: extractHtml(element),
          snippet: extractSnippet(href || '(empty href)'),
          domPath: getDomPath(element),
          href: href || '(empty)',
          reference: SPEC,
        }
      : { reference: SPEC }

    return {
      label: LABEL,
      name: NAME,
      message,
      type,
      priority: isPresent ? 500 : 800, // Lower priority if present (informational)
      details,
    }
  },
}

