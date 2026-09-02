import type { Rule } from '@/core/types'
import { extractHtml, extractHtmlFromList, extractSnippet } from '@/shared/html-utils'
import { getDomPath, getDomPaths } from '@/shared/dom-path'
import { parseRobotsDirectives } from '@/shared/robots'
import { sampleElements } from '@/shared/domEvidence'
import { sampleDelimitedTokens } from '@/shared/boundedTokens'

const TESTED = 'Read all <meta name="robots"> tags and evaluated the combined noindex/nofollow directives (most restrictive rule applies).'

export const robotsMetaRule: Rule = {
  id: 'head-robots-meta',
  name: 'Robots Meta',
  enabled: true,
  what: 'static',
  meta: {
    provenance: 'google',
    references: ['https://developers.google.com/search/docs/crawling-indexing/robots-meta-tag'],
    description: 'Reports the head > meta[name=robots] tag content and warns when the combined directives contain noindex/none/nofollow.',
  },
  run: async (page) => {
    const directives = parseRobotsDirectives(page.doc).filter((d) => d.source === 'meta' && d.ua === 'robots')
    const elements = sampleElements(page.doc.querySelectorAll<HTMLMetaElement>('head > meta[name="robots"]'))
    if (elements.total === 0) {
      return {
        label: 'HEAD',
        message: 'No robots meta tag.',
        type: 'info',
        priority: 610,
        name: 'Robots Meta',
        details: { tested: TESTED },
      }
    }

    // Multiple robots meta tags are spec-legal; their rules combine and the
    // most restrictive rule applies, so directives are aggregated across tags.
    const contents = elements.sample.map((el) => (el.getAttribute('content') || '').trim())
    const fallbacks = contents.map((content) => sampleDelimitedTokens(content, ',;', ['noindex', 'none', 'nofollow']))
    const fallbackMatches = fallbacks.flatMap((f) => f.matches)
    const tokens = directives.length ? directives.flatMap((d) => d.tokens) : fallbacks.flatMap((f) => f.values)
    const hasNoindex = directives.some((d) => d.hasNoindex) || fallbackMatches.includes('noindex') || fallbackMatches.includes('none')
    const hasNofollow = directives.some((d) => d.hasNofollow) || fallbackMatches.includes('nofollow') || fallbackMatches.includes('none')
    const type: 'info' | 'warn' = hasNoindex || hasNofollow ? 'warn' : 'info'
    const content = contents.map((c) => c || '(empty)').join('; ')
    const sourceHtml = elements.total > 1 ? extractHtmlFromList(elements.sample) : extractHtml(elements.sample[0]!)
    const snippet = extractSnippet(sourceHtml)
    const message = elements.total > 1
      ? `Meta Robots (${elements.total} tags, combined): ${content}`
      : `Meta Robots: ${content}`
    return {
      label: 'HEAD',
      message,
      type,
      priority: type === 'warn' ? 200 : 610,
      name: 'Robots Meta',
      details: {
        sourceHtml,
        snippet,
        ...(elements.total > 1
          ? { domPaths: getDomPaths(elements.sample) }
          : { domPath: getDomPath(elements.sample[0]!) }),
        tested: TESTED,
        content,
        tokens,
        hasNoindex,
        hasNofollow,
        count: elements.total,
        shown: elements.shown,
        truncated: elements.truncated,
      },
    }
  },
}
