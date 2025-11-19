import type { Rule } from '@/core/types'
import { extractHtml, extractSnippet, getDomPath } from '@/shared/html-utils'

// Constants
const LABEL = 'HEAD'
const NAME = 'Meta Googlebot'
const RULE_ID = 'head:meta-googlebot'
const SELECTOR = 'head > meta[name="googlebot"]'
const SPEC = 'https://developers.google.com/search/docs/crawling-indexing/robots-meta-tag'

export const googlebotMetaRule: Rule = {
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

    // 4. Parse directives if present
    const directives = hasContent ? content.split(',').map((d) => d.trim()).filter(Boolean) : []

    // 5. Build message (Quantified, showing the value)
    let message = ''
    if (!isPresent) {
      message = 'No Googlebot-specific meta tag found.'
    } else if (!hasContent) {
      message = 'Googlebot meta tag present but content is empty.'
    } else if (directives.length === 1) {
      message = `Googlebot directive: ${directives[0]}`
    } else {
      message = `Googlebot: ${directives.length} directives (${extractSnippet(directives.join(', '), 50)})`
    }

    // 6. Determine type (informational - presence indicates specific Googlebot instructions)
    const type = 'info'

    // 7. Build evidence (Chain of Evidence)
    const details = isPresent
      ? {
          sourceHtml: extractHtml(element),
          snippet: extractSnippet(content || '(empty)'),
          domPath: getDomPath(element),
          content,
          directives,
          reference: SPEC,
        }
      : { reference: SPEC }

    return {
      label: LABEL,
      name: NAME,
      message,
      type,
      priority: isPresent ? 600 : 900,
      details,
    }
  },
}

