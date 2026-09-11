import { robotsMetaPairs } from './robotsMarkup'

import type { Rule } from '@/core/types'
import { sampleElements } from '@/shared/domEvidence'
import { resolveEffectiveRobots } from '@/shared/effectiveRobots'
import { textField } from '@/shared/presentation/create'
import { markupEvidence } from '@/shared/presentation/originalMarkup'
import { presentResult } from '@/shared/presentation/result'
import { groupByUa, parseRobotsDirectives } from '@/shared/robots'
import type { RobotsDirective } from '@/shared/robots'

const NAME = 'Robots agent conflicts'
const RULE_ID = 'head:robots-agent-conflicts'
const WELL_KNOWN = new Set([
  'robots', 'googlebot', 'googlebot-image', 'googlebot-news', 'googlebot-video',
  'googlebot-smartphone', 'bingbot', 'slurp', 'baiduspider', 'duckduckbot',
])

// A conflict needs an explicit positive token (index/follow/all) on one side
// against a negative on the other; a merely absent token is additive, since
// the spec applies the most restrictive rule (sum of the negative rules).
const hasExplicitToken = (list: RobotsDirective[], names: readonly string[]): boolean =>
  list.some((directive) => directive.tokens.some((token) => names.includes(token.trim().toLowerCase())))

const effectiveFields = (policy: ReturnType<typeof resolveEffectiveRobots>) => [
  textField('Noindex', policy.noindex ? 'Yes' : 'No'),
  textField('Nofollow', policy.nofollow ? 'Yes' : 'No'),
  textField('Nosnippet', policy.nosnippet ? 'Yes' : 'No'),
  textField('Noimageindex', policy.noimageindex ? 'Yes' : 'No'),
  textField('Max snippet', policy.maxSnippet === null ? 'Not set' : `${policy.maxSnippet} characters`),
  textField('Max video preview', policy.maxVideoPreview === null ? 'Not set' : `${policy.maxVideoPreview} seconds`),
  textField('Max image preview', policy.maxImagePreview ?? 'Not set'),
]

export const robotsAgentConflictsRule: Rule = {
  id: RULE_ID,
  name: NAME,
  presentation: 1,
  enabled: true,
  what: 'static',
  meta: {
    provenance: 'google',
    references: ['https://developers.google.com/search/docs/crawling-indexing/robots-meta-tag'],
    description: 'Compares robots directives (meta and X-Robots-Tag) across user agents, warning when an explicit index/follow/all token opposes a global noindex/nofollow (or vice versa) and noting nonstandard agent names.',
  },
  async run(page) {
    const headersCaptured = page.headers !== undefined || page.responseHeaderFields !== undefined
    const directives = parseRobotsDirectives(page.doc, page.headers, page.responseHeaderFields)
    const common = { input: headersCaptured ? 'Static DOM + HTTP response headers' : 'Static DOM' }
    if (!directives.length) {
      return presentResult(robotsAgentConflictsRule, page, {
        ...common, type: 'info', priority: 920,
        values: [textField('Robots directives found', 0)],
        checked: [textField('Comparison', 'Global robots directives vs each named crawler'),
          textField('Header', headersCaptured ? 'X-Robots-Tag' : 'Not captured')],
        noMarkup: 'No robots directive found',
      })
    }
    const byUa = groupByUa(directives)
    const robotsGlobal = byUa['robots'] || []
    const hasGlobal = robotsGlobal.length > 0
    const globalNoindex = robotsGlobal.some((d) => d.hasNoindex)
    const globalNofollow = robotsGlobal.some((d) => d.hasNofollow)
    const globalExplicitIndex = hasExplicitToken(robotsGlobal, ['index', 'all'])
    const globalExplicitFollow = hasExplicitToken(robotsGlobal, ['follow', 'all'])
    const conflicts: Array<{ ua: string; directive: string }> = []
    const effective: Record<string, ReturnType<typeof resolveEffectiveRobots>> = { googlebot: resolveEffectiveRobots(directives) }
    Object.entries(byUa).forEach(([ua, list]) => {
      if (ua === 'robots') return
      effective[ua] = resolveEffectiveRobots(directives, ua)
      if (!hasGlobal) return
      if (globalNoindex && hasExplicitToken(list, ['index', 'all'])) conflicts.push({ ua, directive: 'index vs global noindex' })
      if (globalExplicitIndex && list.some((d) => d.hasNoindex)) conflicts.push({ ua, directive: 'ua noindex vs global index' })
      if (globalNofollow && hasExplicitToken(list, ['follow', 'all'])) conflicts.push({ ua, directive: 'follow vs global nofollow' })
      if (globalExplicitFollow && list.some((d) => d.hasNofollow)) conflicts.push({ ua, directive: 'ua nofollow vs global follow' })
    })
    const unusualAgents = Object.keys(byUa).filter((ua) => ua !== 'robots' && !WELL_KNOWN.has(ua))
    const { sample, total } = sampleElements(robotsMetaPairs(page.doc).map((pair) => pair.element))
    const captured = markupEvidence(sample, 'Robots meta tag')
    return presentResult(robotsAgentConflictsRule, page, {
      ...common,
      type: conflicts.length ? 'warn' : unusualAgents.length ? 'info' : 'ok',
      priority: conflicts.length ? 180 : unusualAgents.length ? 800 : 850,
      values: [textField('Robots directives found', directives.length), textField('Conflicting directives', conflicts.length),
        textField('Nonstandard agents', unusualAgents.length)],
      detailValues: [textField('Meta elements retained', sample.length), textField('Meta elements omitted', total - sample.length)],
      checked: [textField('Comparison', 'Global robots directives vs each named crawler'),
        textField('Header', headersCaptured ? 'X-Robots-Tag' : 'Not captured'),
        textField('Known crawler agents', Array.from(WELL_KNOWN).join(', ')),
        textField('Criterion', 'An explicit positive token on one side against an explicit negative on the other is a conflict; absence is additive')],
      evidence: [
        ...directives.map((directive, index) => ({ name: `Instruction ${index + 1}`, fields: [
          textField('Source', directive.source === 'meta' ? 'HTML meta tag' : 'HTTP response header'),
          textField('Crawler', directive.ua === 'robots' ? 'All crawlers (including Googlebot)' : directive.ua),
          textField('Instruction', directive.value),
          ...(directive.headerKey ? [textField('Header name', directive.headerKey)] : []),
        ] })),
        ...conflicts.map((conflict, index) => ({ name: `Conflict ${index + 1}`, fields: [
          textField('Crawler', conflict.ua), textField('Conflict', conflict.directive),
        ] })),
        ...unusualAgents.map((ua, index) => ({ name: `Nonstandard agent ${index + 1}`, fields: [textField('Crawler', ua)] })),
        ...Object.entries(effective).map(([ua, policy]) => ({ name: `Effective policy: ${ua}`, fields: effectiveFields(policy) })),
      ],
      markup: captured.markup,
      noMarkup: total ? 'Complete original robots meta markup not retained' : 'No robots meta element found',
    })
  },
}
