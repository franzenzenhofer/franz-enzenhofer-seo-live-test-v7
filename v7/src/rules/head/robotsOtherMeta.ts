import type { Rule } from '@/core/types'
import { parseRobotsDirectives } from '@/shared/robots'

const LABEL = 'HEAD'
const NAME = 'Meta other robots'
const RULE_ID = 'head:meta-other-robots'
const SPEC = 'https://developers.google.com/search/docs/crawling-indexing/robots-meta-tag'

export const robotsOtherMetaRule: Rule = {
  id: RULE_ID,
  name: NAME,
  enabled: true,
  what: 'static',
  async run(page) {
    const directives = parseRobotsDirectives(page.doc, page.headers).filter(
      (d) => d.source === 'meta' && d.ua !== 'robots' && d.ua !== 'googlebot'
    )
    if (!directives.length) {
      return { label: LABEL, name: NAME, message: 'No agent-specific robots meta tags.', type: 'info', priority: 910, details: { reference: SPEC } }
    }

    const summary = directives
      .map((d) => `${d.ua}: ${d.value || '(empty)'}`)
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
        directives,
        hasNoindex,
        hasNofollow,
        domPaths,
        reference: SPEC,
      },
    }
  },
}
