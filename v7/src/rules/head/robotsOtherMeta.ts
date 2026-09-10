import type { Rule } from '@/core/types'
import { parseRobotsDirectives } from '@/shared/robots'
import { robotsEvidence } from '@/shared/robotsEvidence'

const LABEL = 'HEAD'
const NAME = 'Meta other robots'
const RULE_ID = 'head:meta-other-robots'

export const robotsOtherMetaRule: Rule = {
  id: RULE_ID,
  name: NAME,
  enabled: true,
  what: 'static',
  meta: {
    userGuide: {
      check: "Lists instructions aimed at crawlers other than the generic robots group and Googlebot. A restriction for one named crawler does not automatically block Googlebot. Support for individual directives depends on that crawler.",
      action: "Confirm which crawler each restriction targets. Change the relevant meta tag only if its noindex or nofollow instruction is unintended, and preserve the intended restrictions for other crawlers.",
    },
    provenance: 'google',
    references: ['https://developers.google.com/search/docs/crawling-indexing/robots-meta-tag'],
    description: 'Lists agent-specific robots meta tags whose name is neither robots nor googlebot, warning when any carries noindex/nofollow.',
  },
  async run(page) {
    const directives = parseRobotsDirectives(page.doc, page.headers, page.responseHeaderFields).filter(
      (d) => d.source === 'meta' && d.ua !== 'robots' && d.ua !== 'googlebot'
    )
    if (!directives.length) {
      return { label: LABEL, name: NAME, message: 'No agent-specific robots meta tags.', type: 'info', priority: 910 }
    }

    const summary = directives
      .map((d) => d.ua)
      .join('; ')
    const domPaths = directives.map((d) => d.domPath).filter((path): path is string => Boolean(path))
    const hasNoindex = directives.some((d) => d.hasNoindex)
    const hasNofollow = directives.some((d) => d.hasNofollow)
    return {
      label: LABEL,
      name: NAME,
      message: `${directives.length} agent-specific robots directives: ${summary}`,
      type: hasNoindex || hasNofollow ? 'warn' : 'info',
      priority: hasNoindex || hasNofollow ? 170 : 620,
      details: {
        directives: robotsEvidence(directives),
        hasNoindex,
        hasNofollow,
        domPaths,
      },
    }
  },
}
