import type { Rule } from '@/core/types'
import { parseRobotsDirectives, groupByUa } from '@/shared/robots'

const LABEL = 'HEAD'
const NAME = 'Robots agent conflicts'
const RULE_ID = 'head:robots-agent-conflicts'
const SPEC = 'https://developers.google.com/search/docs/crawling-indexing/robots-meta-tag'
const WELL_KNOWN = new Set([
  'robots',
  'googlebot',
  'googlebot-image',
  'googlebot-news',
  'googlebot-video',
  'googlebot-smartphone',
  'bingbot',
  'slurp',
  'baiduspider',
  'duckduckbot',
])

export const robotsAgentConflictsRule: Rule = {
  id: RULE_ID,
  name: NAME,
  enabled: true,
  what: 'static',
  async run(page) {
    const directives = parseRobotsDirectives(page.doc, page.headers)
    if (!directives.length) {
      return { label: LABEL, name: NAME, message: 'No robots directives found.', type: 'info', priority: 920, details: { reference: SPEC } }
    }
    const byUa = groupByUa(directives)
    const domPaths = directives.map((d) => d.domPath).filter((path): path is string => Boolean(path))
    const robotsGlobal = byUa['robots'] || []
    const hasGlobal = robotsGlobal.length > 0
    const globalNoindex = robotsGlobal.some((d) => d.hasNoindex)
    const globalNofollow = robotsGlobal.some((d) => d.hasNofollow)

    const conflicts: Array<{ ua: string; directive: string }> = []
    Object.entries(byUa).forEach(([ua, list]) => {
      const uaNoindex = list.some((d) => d.hasNoindex)
      const uaNofollow = list.some((d) => d.hasNofollow)
      if (ua === 'robots') return
      if (!hasGlobal) return
      if (globalNoindex && !uaNoindex) conflicts.push({ ua, directive: 'index vs global noindex' })
      if (!globalNoindex && uaNoindex) conflicts.push({ ua, directive: 'ua noindex vs global index' })
      if (globalNofollow && !uaNofollow) conflicts.push({ ua, directive: 'follow vs global nofollow' })
    })

    const unusualAgents = Object.keys(byUa).filter((ua) => ua !== 'robots' && !WELL_KNOWN.has(ua))

    if (conflicts.length || unusualAgents.length) {
      return {
        label: LABEL,
        name: NAME,
        message: 'Agent-specific robots directives detected; review conflicts and nonstandard agents.',
        type: conflicts.length ? 'warn' : 'info',
        priority: conflicts.length ? 180 : 800,
        details: {
          conflicts,
          unusualAgents,
          reference: SPEC,
          directives,
          domPaths,
        },
      }
    }

    return { label: LABEL, name: NAME, message: 'Robots directives consistent across agents.', type: 'ok', priority: 850, details: { reference: SPEC, domPaths } }
  },
}
