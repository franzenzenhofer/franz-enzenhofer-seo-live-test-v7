import type { Rule } from '@/core/types'
import { extractSnippet } from '@/shared/html-utils'

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
    const xRobotsTag = page.headers?.['x-robots-tag']?.trim() || ''
    const hasXRobots = Boolean(xRobotsTag)
    const message = hasXRobots
      ? `X-Robots-Tag: ${xRobotsTag}`
      : 'No X-Robots-Tag header found.'
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
        reference: SPEC,
      },
    }
  },
}

