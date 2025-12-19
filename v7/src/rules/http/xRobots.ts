import type { Rule } from '@/core/types'
import { extractSnippet } from '@/shared/html-utils'
import { hasHeaders, noHeadersResult } from '@/shared/http-utils'
import { parseRobotsDirectives } from '@/shared/robots'

const LABEL = 'HTTP'
const NAME = 'X-Robots-Tag'
const RULE_ID = 'http:x-robots'
const SPEC = 'https://developers.google.com/search/docs/crawling-indexing/robots-meta-tag#xrobotstag'

export const xRobotsRule: Rule = {
  id: RULE_ID,
  name: NAME,
  enabled: true,
  what: 'http',
  async run(page) {
    if (!hasHeaders(page.headers)) return noHeadersResult(LABEL, NAME)
    const directives = parseRobotsDirectives(page.doc, page.headers)
    const headerDirectives = directives.filter((d) => d.source === 'header')
    const xRobotsTag = page.headers?.['x-robots-tag']?.trim() || ''
    const hasXRobots = headerDirectives.length > 0
    const message = hasXRobots ? `X-Robots-Tag: ${headerDirectives.map((d) => `${d.ua}:${d.value}`).join('; ')}` : 'No X-Robots-Tag header found.'
    return {
      label: LABEL,
      name: NAME,
      message,
      type: 'info',
      priority: hasXRobots ? 750 : 900,
      details: {
        httpHeaders: page.headers || {},
        snippet: extractSnippet(xRobotsTag || '(not present)'),
        xRobotsTag,
        hasXRobots,
        directives: headerDirectives,
        reference: SPEC,
      },
    }
  },
}
