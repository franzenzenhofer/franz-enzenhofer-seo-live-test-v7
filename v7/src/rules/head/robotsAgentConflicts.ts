import type { Rule } from '@/core/types'
import { parseRobotsDirectives, groupByUa } from '@/shared/robots'
import type { RobotsDirective } from '@/shared/robots'

const LABEL = 'HEAD'
const NAME = 'Robots agent conflicts'
const RULE_ID = 'head:robots-agent-conflicts'
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

// A conflict needs an explicit positive token (index/follow/all) on one side
// against a negative on the other; a merely absent token is additive, since
// the spec applies the most restrictive rule (sum of the negative rules).
const hasExplicitToken = (list: RobotsDirective[], names: readonly string[]): boolean =>
  list.some((d) => d.tokens.some((token) => names.includes(token.trim().toLowerCase())))

export const robotsAgentConflictsRule: Rule = {
  id: RULE_ID,
  name: NAME,
  enabled: true,
  what: 'static',
  meta: {
    provenance: 'google',
    references: ['https://developers.google.com/search/docs/crawling-indexing/robots-meta-tag'],
    description: 'Compares robots directives (meta and X-Robots-Tag) across user agents, warning when an explicit index/follow/all token opposes a global noindex/nofollow (or vice versa) and noting nonstandard agent names.',
  },
  async run(page) {
    const directives = parseRobotsDirectives(page.doc, page.headers)
    if (!directives.length) {
      return { label: LABEL, name: NAME, message: 'No robots directives found.', type: 'info', priority: 920 }
    }
    const byUa = groupByUa(directives)
    const domPaths = directives.map((d) => d.domPath).filter((path): path is string => Boolean(path))
    const robotsGlobal = byUa['robots'] || []
    const hasGlobal = robotsGlobal.length > 0
    const globalNoindex = robotsGlobal.some((d) => d.hasNoindex)
    const globalNofollow = robotsGlobal.some((d) => d.hasNofollow)
    const globalExplicitIndex = hasExplicitToken(robotsGlobal, ['index', 'all'])
    const globalExplicitFollow = hasExplicitToken(robotsGlobal, ['follow', 'all'])

    const conflicts: Array<{ ua: string; directive: string }> = []
    const effective: Record<string, { noindex: boolean; nofollow: boolean }> = {}
    Object.entries(byUa).forEach(([ua, list]) => {
      if (ua === 'robots') return
      const uaNoindex = list.some((d) => d.hasNoindex)
      const uaNofollow = list.some((d) => d.hasNofollow)
      effective[ua] = { noindex: globalNoindex || uaNoindex, nofollow: globalNofollow || uaNofollow }
      if (!hasGlobal) return
      if (globalNoindex && hasExplicitToken(list, ['index', 'all'])) conflicts.push({ ua, directive: 'index vs global noindex' })
      if (globalExplicitIndex && uaNoindex) conflicts.push({ ua, directive: 'ua noindex vs global index' })
      if (globalNofollow && hasExplicitToken(list, ['follow', 'all'])) conflicts.push({ ua, directive: 'follow vs global nofollow' })
      if (globalExplicitFollow && uaNofollow) conflicts.push({ ua, directive: 'ua nofollow vs global follow' })
    })

    const unusualAgents = Object.keys(byUa).filter((ua) => ua !== 'robots' && !WELL_KNOWN.has(ua))

    if (conflicts.length || unusualAgents.length) {
      const conflictText = conflicts.length
        ? `${conflicts.length} conflicting agent-specific robots directive${conflicts.length > 1 ? 's' : ''}`
        : ''
      const agentText = unusualAgents.length
        ? `${unusualAgents.length} nonstandard robots agent${unusualAgents.length > 1 ? 's' : ''}`
        : ''
      return {
        label: LABEL,
        name: NAME,
        message: `${[conflictText, agentText].filter(Boolean).join(' and ')} detected.`,
        type: conflicts.length ? 'warn' : 'info',
        priority: conflicts.length ? 180 : 800,
        details: {
          conflicts,
          unusualAgents,
          effective,
          directives,
          domPaths,
        },
      }
    }

    return {
      label: LABEL,
      name: NAME,
      message: 'Robots directives consistent across agents (most restrictive rule per agent applies).',
      type: 'ok',
      priority: 850,
      details: { effective, domPaths },
    }
  },
}
