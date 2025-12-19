import type { Rule } from '@/core/types'
import { extractHtml, extractHtmlFromList, extractSnippet, getDomPath } from '@/shared/html-utils'
import { parseRobotsDirectives } from '@/shared/robots'

const SPEC = 'https://developers.google.com/search/docs/crawling-indexing/robots-meta-tag'
const TESTED = 'Read <meta name="robots"> content and evaluated noindex/nofollow directives.'

export const robotsMetaRule: Rule = {
  id: 'head-robots-meta',
  name: 'Robots Meta',
  enabled: true,
  what: 'static',
  run: async (page) => {
    const directives = parseRobotsDirectives(page.doc)
    const elements = Array.from(page.doc.querySelectorAll('head > meta[name="robots"]')) as HTMLMetaElement[]
    if (elements.length === 0) {
      return {
        label: 'HEAD',
        message: 'No robots meta tag.',
        type: 'info',
        priority: 610,
        name: 'Robots Meta',
        details: { tested: TESTED, reference: SPEC },
      }
    }
    if (elements.length > 1) {
      const snippet = extractHtmlFromList(elements)
      return {
        label: 'HEAD',
        message: 'Multiple robots meta tags found.',
        type: 'warn',
        priority: 200,
        name: 'Robots Meta',
        details: { tested: TESTED, reference: SPEC, sourceHtml: snippet, snippet, domPaths: elements.map((_, i) => `head > meta[name="robots"]:nth-of-type(${i + 1})`) },
      }
    }

    const el = elements[0]!
    const content = (el.getAttribute('content') || '').trim()
    const robotsDirective = directives.find((d) => d.source === 'meta' && d.ua === 'robots')
    const tokens = robotsDirective?.tokens || content.toLowerCase().split(',').map((s) => s.trim()).filter(Boolean)
    const hasNoindex = robotsDirective?.hasNoindex || tokens.includes('noindex')
    const hasNofollow = robotsDirective?.hasNofollow || tokens.includes('nofollow')
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
        tokens,
        hasNoindex,
        hasNofollow,
      },
    }
  },
}
