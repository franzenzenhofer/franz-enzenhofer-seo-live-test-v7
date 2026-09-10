import type { Rule } from '@/core/types'
import { parseRobotsDirectives } from '@/shared/robots'
import { robotsEvidence } from '@/shared/robotsEvidence'

const LABEL = 'HEAD'
const NAME = 'Robots meta list'
const RULE_ID = 'head:robots-meta-list'

export const robotsMetaListRule: Rule = {
  id: RULE_ID,
  name: NAME,
  enabled: true,
  what: 'static',
  meta: {
    userGuide: {
      check: "Lists recognized robots meta instructions by crawler and their original HTML. This is an inventory, not a judgment of actual indexing. Missing meta tags do not imply that robots.txt or HTTP-header restrictions are absent.",
      action: "Review each crawler’s instructions in the page template or CMS robots settings. Use the indexing and preview rules to assess the combined effect before changing anything.",
    },
    provenance: 'google',
    references: ['https://developers.google.com/search/docs/crawling-indexing/robots-meta-tag'],
    description: 'Info-only inventory listing every meta-source robots directive (all user agents) found in the document.',
  },
  async run(page) {
    const directives = parseRobotsDirectives(page.doc).filter((d) => d.source === 'meta')
    if (!directives.length) {
      return {
        label: LABEL,
        name: NAME,
        message: 'No robots meta tags present.',
        type: 'info',
        priority: 915,
      }
    }

    const summary = directives.map((d) => d.ua).join('; ')
    const domPaths = directives.map((d) => d.domPath).filter((path): path is string => Boolean(path))
    return {
      label: LABEL,
      name: NAME,
      message: `${directives.length} robots meta tag${directives.length > 1 ? 's' : ''} found: ${summary}`,
      type: 'info',
      priority: 640,
      details: {
        directives: robotsEvidence(directives),
        domPaths,
      },
    }
  },
}
