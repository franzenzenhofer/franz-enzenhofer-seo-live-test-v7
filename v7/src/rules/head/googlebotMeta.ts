import type { Rule } from '@/core/types'
import { extractHtml, extractSnippet } from '@/shared/html-utils'
import { getDomPath, getDomPaths } from '@/shared/dom-path'
import { sampleElements } from '@/shared/domEvidence'
import { sampleDelimitedTokens } from '@/shared/boundedTokens'

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
    const elements = sampleElements(page.doc.querySelectorAll(SELECTOR))
    if (elements.total === 0) {
      return {
        label: LABEL,
        name: NAME,
        message: 'No Googlebot meta tag found.',
        type: 'info',
        priority: 900,
        details: { reference: SPEC },
      }
    }

    if (elements.total > 1) {
      const snippet = extractHtml(elements.sample[0]!)
      return {
        label: LABEL,
        name: NAME,
        message: 'Multiple Googlebot meta tags found.',
        type: 'warn',
        priority: 200,
        details: { sourceHtml: snippet, snippet: extractSnippet(snippet), domPaths: getDomPaths(elements.sample), count: elements.total, shown: elements.shown, truncated: elements.truncated, reference: SPEC },
      }
    }

    const element = elements.sample[0]!
    const content = (element.getAttribute('content') || '').trim()
    const directives = sampleDelimitedTokens(content, ',', ['noindex', 'none', 'nofollow'])
    const hasNoindex = directives.matches.includes('noindex') || directives.matches.includes('none')
    const hasNofollow = directives.matches.includes('nofollow') || directives.matches.includes('none')
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
        directives: directives.values,
        directiveCount: directives.total,
        directivesTruncated: directives.truncated,
        hasNoindex,
        hasNofollow,
        reference: SPEC,
      },
    }
  },
}
