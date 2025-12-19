import type { Rule } from '@/core/types'
import { parseRobotsDirectives } from '@/shared/robots'

const LABEL = 'HEAD'
const NAME = 'Robots meta list'
const RULE_ID = 'head:robots-meta-list'
const SPEC = 'https://developers.google.com/search/docs/crawling-indexing/robots-meta-tag'

export const robotsMetaListRule: Rule = {
  id: RULE_ID,
  name: NAME,
  enabled: true,
  what: 'static',
  async run(page) {
    const directives = parseRobotsDirectives(page.doc).filter((d) => d.source === 'meta')
    if (!directives.length) {
      return {
        label: LABEL,
        name: NAME,
        message: 'No robots meta tags present.',
        type: 'info',
        priority: 915,
        details: { reference: SPEC },
      }
    }

    const summary = directives.map((d) => `${d.ua}: ${d.value || '(empty)'}`).join('; ')
    return {
      label: LABEL,
      name: NAME,
      message: `${directives.length} robots meta tags found: ${summary}`,
      type: 'info',
      priority: 640,
      details: {
        directives,
        reference: SPEC,
      },
    }
  },
}
