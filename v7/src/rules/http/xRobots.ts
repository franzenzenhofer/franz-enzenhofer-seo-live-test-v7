import type { Rule } from '@/core/types'
import { extractSnippet } from '@/shared/html-utils'
import { hasHeaders, noHeadersResult } from '@/shared/http-utils'
import { parseRobotsDirectives } from '@/shared/robots'

const LABEL = 'HTTP'
const NAME = 'X-Robots-Tag'
const RULE_ID = 'http:x-robots'

export const xRobotsRule: Rule = {
  id: RULE_ID,
  name: NAME,
  enabled: true,
  what: 'http',
  meta: {
    provenance: 'google',
    references: ['https://developers.google.com/search/docs/crawling-indexing/robots-meta-tag#xrobotstag'],
    description: 'Reports the X-Robots-Tag response header and its parsed per-agent directives, warning when they contain noindex/none/nofollow.',
  },
  async run(page) {
    if (!hasHeaders(page.headers)) return noHeadersResult(LABEL, NAME)
    const directives = parseRobotsDirectives(page.doc, page.headers)
    const headerDirectives = directives.filter((d) => d.source === 'header')
    const xRobotsTag = page.headers?.['x-robots-tag']?.trim() || ''
    const hasXRobots = headerDirectives.length > 0
    const hasNoindex = headerDirectives.some((d) => d.hasNoindex)
    const hasNofollow = headerDirectives.some((d) => d.hasNofollow)
    // The header has the same effect as the robots meta tag, so an indexing-
    // blocking directive escalates to warn just like the head rules do.
    const type: 'info' | 'warn' = hasNoindex || hasNofollow ? 'warn' : 'info'
    const summary = headerDirectives.map((d) => `${d.ua}:${d.value}`).join('; ')
    const message = hasXRobots
      ? `X-Robots-Tag: ${summary}${type === 'warn' ? ' (contains noindex/nofollow)' : ''}`
      : 'No X-Robots-Tag header found.'
    return {
      label: LABEL,
      name: NAME,
      message,
      type,
      priority: type === 'warn' ? 150 : hasXRobots ? 750 : 900,
      details: {
        httpHeaders: page.headers || {},
        snippet: extractSnippet(xRobotsTag || '(not present)'),
        xRobotsTag,
        hasXRobots,
        hasNoindex,
        hasNofollow,
        directives: headerDirectives,
      },
    }
  },
}
