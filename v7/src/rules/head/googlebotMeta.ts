import type { Rule } from '@/core/types'
import { extractHtml, extractSnippet } from '@/shared/html-utils'
import { getDomPath, getDomPaths } from '@/shared/dom-path'

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
    const elements = Array.from(page.doc.querySelectorAll(SELECTOR))
    if (elements.length === 0) {
      return {
        label: LABEL,
        name: NAME,
        message: 'No Googlebot meta tag found.',
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
        message: 'Multiple Googlebot meta tags found.',
        type: 'warn',
        priority: 200,
        details: { sourceHtml: snippet, snippet: extractSnippet(snippet), domPaths: getDomPaths(elements), reference: SPEC },
      }
    }

    const element = elements[0]!
    const content = (element.getAttribute('content') || '').trim()
    const directives = content.split(',').map((d) => d.trim()).filter(Boolean)
    const hasNoindex = directives.some((d) => d.toLowerCase() === 'noindex' || d.toLowerCase() === 'none')
    const hasNofollow = directives.some((d) => d.toLowerCase() === 'nofollow' || d.toLowerCase() === 'none')
    const type: 'info' | 'warn' = hasNoindex || hasNofollow ? 'warn' : 'info'

    return {
      label: LABEL,
      name: NAME,
      message: `Meta Googlebot: ${content || '(empty)'}`,
      type,
      priority: type === 'warn' ? 150 : 600,
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
