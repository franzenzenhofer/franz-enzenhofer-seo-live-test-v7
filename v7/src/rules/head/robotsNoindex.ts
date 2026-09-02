import type { Rule } from '@/core/types'
import { extractHtml, extractSnippet } from '@/shared/html-utils'
import { getDomPath, getDomPaths } from '@/shared/dom-path'
import { parseRobotsDirectives } from '@/shared/robots'
import { sampleElements } from '@/shared/domEvidence'
import { sampleDelimitedTokens } from '@/shared/boundedTokens'

// Constants
const LABEL = 'HEAD'
const NAME = 'Meta Robots Noindex'
const RULE_ID = 'head:robots-noindex'
const SELECTOR = 'head > meta[name="robots"]'

export const robotsNoindexRule: Rule = {
  id: RULE_ID,
  name: NAME,
  enabled: true,
  what: 'static',
  meta: {
    provenance: 'google',
    references: ['https://developers.google.com/search/docs/crawling-indexing/robots-meta-tag'],
    description: 'Reads the single head > meta[name=robots] tag and warns when noindex/none/nofollow is present.',
  },
  async run(page) {
    const directives = parseRobotsDirectives(page.doc)
    const elements = sampleElements(page.doc.querySelectorAll(SELECTOR))
    if (elements.total === 0) {
      return {
        label: LABEL,
        name: NAME,
        message: 'No robots meta tag found (page indexable).',
        type: 'info',
        priority: 900,
      }
    }

    if (elements.total > 1) {
      const snippet = extractHtml(elements.sample[0]!)
      return {
        label: LABEL,
        name: NAME,
        message: 'Multiple robots meta tags — check for conflicting noindex/nofollow directives.',
        type: 'warn',
        priority: 150,
        details: { sourceHtml: snippet, snippet: extractSnippet(snippet), domPaths: getDomPaths(elements.sample), count: elements.total, shown: elements.shown, truncated: elements.truncated },
      }
    }

    const element = elements.sample[0]!
    const content = (element.getAttribute('content') || '').trim()
    const robotsDirective = directives.find((d) => d.source === 'meta' && d.ua === 'robots')
    const fallback = sampleDelimitedTokens(content, ',;', ['noindex', 'none', 'nofollow'])
    const tokens = robotsDirective?.tokens || fallback.values
    const hasNoindex = robotsDirective?.hasNoindex || fallback.matches.includes('noindex') || fallback.matches.includes('none')
    const hasNofollow = robotsDirective?.hasNofollow || fallback.matches.includes('nofollow') || fallback.matches.includes('none')

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
        directives: tokens,
        hasNoindex,
        hasNofollow,
      },
    }
  },
}
