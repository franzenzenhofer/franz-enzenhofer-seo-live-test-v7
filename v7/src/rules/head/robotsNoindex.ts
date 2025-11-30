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
    const elements = Array.from(page.doc.querySelectorAll(SELECTOR))
    if (elements.length === 0) {
      return {
        label: LABEL,
        name: NAME,
        message: 'No robots meta tag found (page indexable).',
        type: 'info',
        priority: 900,
        details: { reference: SPEC },
      }
    }

    if (elements.length > 1) {
      const snippet = extractHtml(elements[0]!)
      return {
        label: LABEL,
        name: NAME,
        message: 'Multiple robots meta tags — check for conflicting noindex/nofollow directives.',
        type: 'warn',
        priority: 150,
        details: { sourceHtml: snippet, snippet: extractSnippet(snippet), domPaths: elements.map((_, i) => `${SELECTOR}:nth-of-type(${i + 1})`), reference: SPEC },
      }
    }

    const element = elements[0]!
    const content = (element.getAttribute('content') || '').trim()
    const directives = content.toLowerCase().split(',').map((d) => d.trim()).filter(Boolean)
    const hasNoindex = directives.includes('noindex') || directives.includes('none')
    const hasNofollow = directives.includes('nofollow') || directives.includes('none')

    let type: 'info' | 'warn' = 'info'
    let message = 'robots: ' + (content || '(empty)')
    if (hasNoindex || hasNofollow) {
      type = 'warn'
      message += ' (page will NOT be indexed)'
    }

    return {
      label: LABEL,
      name: NAME,
      message,
      type,
      priority: type === 'warn' ? 100 : 800,
      details: {
        sourceHtml: extractHtml(element),
        snippet: extractSnippet(content || '(empty)'),
        domPath: getDomPath(element),
        content,
        directives,
        hasNoindex,
        hasNofollow,
        reference: SPEC,
      },
    }
  },
}
