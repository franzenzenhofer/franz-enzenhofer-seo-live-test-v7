
import { hasHeaders } from '@/shared/http-utils'
import { parseRobotsDirectives } from '@/shared/robots'
import type { RobotsDirective } from '@/shared/robots'
import { textField } from '@/shared/presentation/create'
import { presentResult } from '@/shared/presentation/result'
import type { Rule } from '@/core/types'
import { listRow } from '@/shared/presentation/listRow'

const NAME = 'X-Robots-Tag'
const RULE_ID = 'http:x-robots'
const NO_MARKUP = 'None - this rule checks the HTTP response, not document markup'

const crawlerOf = (directive: RobotsDirective): string => directive.ua === 'robots' ? 'all crawlers' : directive.ua
const blockingOf = (directive: RobotsDirective): string =>
  [...(directive.hasNoindex ? ['noindex'] : []), ...(directive.hasNofollow ? ['nofollow'] : [])].join(', ') || 'None'

export const xRobotsRule: Rule = {
  id: RULE_ID,
  name: NAME,
  presentation: 1,
  enabled: true,
  what: 'http',
  meta: {
    provenance: 'google',
    references: ['https://developers.google.com/search/docs/crawling-indexing/robots-meta-tag#xrobotstag'],
    description: 'Reports the X-Robots-Tag response header and its parsed per-agent directives, warning when they contain noindex/none/nofollow.',
  },
  async run(page) {
    if (!hasHeaders(page.headers)) {
      return presentResult(xRobotsRule, page, {
        input: 'Not captured', type: 'runtime_error', priority: 50,
        values: [textField('Header capture', 'Not captured')],
        checked: [textField('Header name', NAME), textField('Capture requirement', 'Response headers must be captured')],
        noMarkup: NO_MARKUP,
      })
    }
    const directives = parseRobotsDirectives(page.doc, page.headers)
    const headerDirectives = directives.filter((d) => d.source === 'header')
    const xRobotsTag = page.headers?.['x-robots-tag']?.trim() || ''
    const hasXRobots = headerDirectives.length > 0
    const hasNoindex = headerDirectives.some((d) => d.hasNoindex)
    const hasNofollow = headerDirectives.some((d) => d.hasNofollow)
    const crawlers = [...new Set(headerDirectives.map(crawlerOf))]
    // The header has the same effect as the robots meta tag, so an indexing-
    // blocking directive escalates to warn just like the head rules do.
    const type: 'info' | 'warn' = hasNoindex || hasNofollow ? 'warn' : 'info'
    return presentResult(xRobotsRule, page, {
      input: 'HTTP response headers', type, priority: type === 'warn' ? 150 : hasXRobots ? 750 : 900,
      // The raw header is the observed instruction; the crawlers it addresses complete the two-second read.
      values: hasXRobots ? [textField(NAME, xRobotsTag), textField('Applies to', listRow(crawlers))] : [textField(NAME, 'Absent')],
      checked: [textField('Header name', NAME), textField('Directive source', 'X-Robots-Tag header segments, by user-agent prefix'), textField('Criterion', 'No noindex, nofollow or none directive')],
      evidence: headerDirectives.map((directive, index) => ({
        name: headerDirectives.length > 1 ? `${NAME} ${index + 1}` : NAME,
        fields: [
          textField('Crawler', crawlerOf(directive)),
          textField('Instruction', directive.value),
          textField('Blocking', blockingOf(directive)),
          ...(directive.headerKey ? [textField('Header name', directive.headerKey)] : []),
        ],
      })),
      noMarkup: NO_MARKUP,
    })
  },
}
