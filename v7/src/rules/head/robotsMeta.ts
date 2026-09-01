import type { Rule } from '@/core/types'
import { extractHtml, extractHtmlFromList, extractSnippet } from '@/shared/html-utils'
import { getDomPath, getDomPaths } from '@/shared/dom-path'
import { parseRobotsDirectives } from '@/shared/robots'
import { sampleElements } from '@/shared/domEvidence'
import { sampleDelimitedTokens } from '@/shared/boundedTokens'

const SPEC = 'https://developers.google.com/search/docs/crawling-indexing/robots-meta-tag'
const TESTED = 'Read <meta name="robots"> content and evaluated noindex/nofollow directives.'

export const robotsMetaRule: Rule = {
  id: 'head-robots-meta',
  name: 'Robots Meta',
  enabled: true,
  what: 'static',
  run: async (page) => {
    const directives = parseRobotsDirectives(page.doc)
    const elements = sampleElements(page.doc.querySelectorAll<HTMLMetaElement>('head > meta[name="robots"]'))
    if (elements.total === 0) {
      return {
        label: 'HEAD',
        message: 'No robots meta tag.',
        type: 'info',
        priority: 610,
        name: 'Robots Meta',
        details: { tested: TESTED, reference: SPEC },
      }
    }
    if (elements.total > 1) {
      const snippet = extractHtmlFromList(elements.sample)
      return {
        label: 'HEAD',
        message: 'Multiple robots meta tags found.',
        type: 'warn',
        priority: 200,
        name: 'Robots Meta',
        details: { tested: TESTED, reference: SPEC, sourceHtml: snippet, snippet, domPaths: getDomPaths(elements.sample), count: elements.total, shown: elements.shown, truncated: elements.truncated },
      }
    }

    const el = elements.sample[0]!
    const content = (el.getAttribute('content') || '').trim()
    const robotsDirective = directives.find((d) => d.source === 'meta' && d.ua === 'robots')
    const fallback = sampleDelimitedTokens(content, ',;', ['noindex', 'none', 'nofollow'])
    const tokens = robotsDirective?.tokens || fallback.values
    const hasNoindex = robotsDirective?.hasNoindex || fallback.matches.includes('noindex') || fallback.matches.includes('none')
    const hasNofollow = robotsDirective?.hasNofollow || fallback.matches.includes('nofollow') || fallback.matches.includes('none')
    const type: 'info' | 'warn' = hasNoindex || hasNofollow ? 'warn' : 'info'
    const sourceHtml = extractHtml(el)
    const snippet = extractSnippet(sourceHtml)
    return {
      label: 'HEAD',
      message: `Meta Robots: ${content || '(empty)'}`,
      type,
      priority: 610,
      name: 'Robots Meta',
      details: {
        sourceHtml,
        snippet,
        domPath: getDomPath(el),
        tested: TESTED,
        reference: SPEC,
        content,
        tokens,
        hasNoindex,
        hasNofollow,
      },
    }
  },
}
