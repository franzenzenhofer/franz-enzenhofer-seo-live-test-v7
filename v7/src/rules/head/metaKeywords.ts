import type { Rule } from '@/core/types'
import { extractHtml, extractSnippet } from '@/shared/html-utils'
import { getDomPath, getDomPaths } from '@/shared/dom-path'
import { sampleElements } from '@/shared/domEvidence'
import { sampleDelimitedTokens } from '@/shared/boundedTokens'

// Constants
const LABEL = 'HEAD'
const NAME = 'Meta Keywords (Deprecated)'
const RULE_ID = 'head:meta-keywords'
const SELECTOR = 'head > meta[name="keywords"]'

export const metaKeywordsRule: Rule = {
  id: RULE_ID,
  name: NAME,
  enabled: true,
  what: 'static',
  meta: {
    provenance: 'google',
    references: [
      'https://developers.google.com/search/docs/crawling-indexing/special-tags',
      'https://developers.google.com/search/blog/2009/09/google-does-not-use-keywords-meta-tag',
    ],
    description: 'Flags any meta[name=keywords] tag as deprecated/unnecessary (warn) and confirms its absence (info).',
  },
  async run(page) {
    const elements = sampleElements(page.doc.querySelectorAll(SELECTOR))
    if (elements.total === 0) {
      return {
        label: LABEL,
        name: NAME,
        message: 'No meta keywords tag (recommended).',
        type: 'info',
        priority: 980,
        details: {},
      }
    }

    if (elements.total > 1) {
      const snippet = extractHtml(elements.sample[0]!)
      return {
        label: LABEL,
        name: NAME,
        message: 'Multiple meta keywords tags found (deprecated, remove).',
        type: 'warn',
        priority: 300,
        details: { sourceHtml: snippet, snippet: extractSnippet(snippet), domPaths: getDomPaths(elements.sample), count: elements.total, shown: elements.shown, truncated: elements.truncated },
      }
    }

    const element = elements.sample[0]!
    const content = (element.getAttribute('content') || '').trim()
    const keywords = sampleDelimitedTokens(content)
    const message = keywords.total === 0
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
        keywords: keywords.values,
        count: keywords.total,
        shown: keywords.shown,
        truncated: keywords.truncated,
      },
    }
  },
}
