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
    const elements = Array.from(page.doc.querySelectorAll(SELECTOR))
      .concat(Array.from(page.domIdleDoc?.querySelectorAll(SELECTOR) || []))
      .filter((el, idx, arr) => arr.findIndex((n) => n.getAttribute('content') === el.getAttribute('content')) === idx)
    if (elements.length === 0) {
      return {
        label: LABEL,
        name: NAME,
        message: 'No meta keywords tag (recommended).',
        type: 'info',
        priority: 980,
        details: { reference: SPEC },
      }
    }

    if (elements.length > 1) {
      const snippet = extractHtml(elements[0]!)
      return {
        label: LABEL,
        name: NAME,
        message: 'Multiple meta keywords tags found (deprecated, remove).',
        type: 'warn',
        priority: 300,
        details: { sourceHtml: snippet, snippet: extractSnippet(snippet), domPaths: elements.map((_, i) => `${SELECTOR}:nth-of-type(${i + 1})`), reference: SPEC },
      }
    }

    const element = elements[0]!
    const content = (element.getAttribute('content') || '').trim()
    const keywords = content.split(',').map((k) => k.trim()).filter(Boolean)
    const message = keywords.length === 0
      ? 'Meta keywords tag present but empty (deprecated, remove).'
      : `Unnecessary meta keywords tag: ${content}`

    return {
      label: LABEL,
      name: NAME,
      message,
      type: 'warn',
      priority: 650,
      details: {
        sourceHtml: extractHtml(element),
        snippet: extractSnippet(content || '(empty)'),
        domPath: getDomPath(element),
        content,
        keywords,
        count: keywords.length,
        reference: SPEC,
      },
    }
  },
}
