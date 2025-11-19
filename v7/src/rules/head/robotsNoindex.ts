import type { Rule } from '@/core/types'
import { extractHtml, extractSnippet, getDomPath } from '@/shared/html-utils'

// Constants
const LABEL = 'HEAD'
const NAME = 'Meta Robots Noindex'
const RULE_ID = 'head:robots-noindex'
const SELECTOR = 'head > meta[name="robots"]'
const SPEC = 'https://developers.google.com/search/docs/crawling-indexing/robots-meta-tag'

export const robotsNoindexRule: Rule = {
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

    // 4. Parse directives (case-insensitive per spec)
    const contentLower = content.toLowerCase()
    const directives = hasContent ? contentLower.split(',').map((d) => d.trim()).filter(Boolean) : []

    // 5. Check for specific directives
    const hasNoindex = /\bnoindex\b/.test(contentLower)
    const hasNofollow = /\bnofollow\b/.test(contentLower)
    const hasNone = /\bnone\b/.test(contentLower)

    // 6. Build message (Quantified, showing actual directives)
    let message = ''
    let type: 'ok' | 'warn' | 'info' = 'info'
    let priority = 500

    if (!isPresent) {
      message = 'No robots meta tag found. (Page is indexable)'
      type = 'info'
      priority = 900
    } else if (!hasContent) {
      message = 'robots meta tag present but content is empty. (Page is indexable)'
      type = 'info'
      priority = 850
    } else if (hasNone || (hasNoindex && hasNofollow)) {
      message = `robots: noindex, nofollow (Page will NOT be indexed)`
      type = 'warn'
      priority = 50
    } else if (hasNoindex) {
      message = `robots: noindex (Page will NOT be indexed)`
      type = 'warn'
      priority = 100
    } else if (directives.length === 1) {
      message = `robots: ${directives[0]} (Page is indexable)`
      type = 'ok'
      priority = 800
    } else {
      message = `robots: ${directives.join(', ')} (Page is indexable)`
      type = 'ok'
      priority = 800
    }

    // 7. Build evidence (Chain of Evidence)
    const details = isPresent
      ? {
          sourceHtml: extractHtml(element),
          snippet: extractSnippet(content || '(empty)'),
          domPath: getDomPath(element),
          content,
          directives,
          hasNoindex,
          hasNofollow,
          hasNone,
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

