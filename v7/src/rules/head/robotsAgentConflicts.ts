import { robotsMetaPairs } from './robotsMarkup'
import { crawlerLabel, distinct, headerRows, metaRecords } from './robotsPresentation'

import type { Rule } from '@/core/types'
import { resolveEffectiveRobots } from '@/shared/effectiveRobots'
import { textField } from '@/shared/presentation/create'
import { presentResult } from '@/shared/presentation/result'
import type { DisplayField } from '@/shared/presentation/schema'
import { groupByUa, parseRobotsDirectives } from '@/shared/robots'
import type { RobotsDirective } from '@/shared/robots'
import { listRow } from '@/shared/presentation/listRow'

const NAME = 'Robots agent conflicts'
const RULE_ID = 'head:robots-agent-conflicts'
const WELL_KNOWN = new Set([
  'robots', 'googlebot', 'googlebot-image', 'googlebot-news', 'googlebot-video',
  'googlebot-smartphone', 'bingbot', 'slurp', 'baiduspider', 'duckduckbot',
])
const INVENTORY_LIMIT = 3
type Conflict = { ua: string; directive: string }
type Policy = ReturnType<typeof resolveEffectiveRobots>

// A conflict needs an explicit positive token (index/follow/all) on one side
// against a negative on the other; a merely absent token is additive, since
// the spec applies the most restrictive rule (sum of the negative rules).
const hasExplicitToken = (list: RobotsDirective[], names: readonly string[]): boolean =>
  list.some((directive) => directive.tokens.some((token) => names.includes(token.trim().toLowerCase())))

/** The restrictions in force for one crawler, as one fact row. */
const policyRow = (ua: string, policy: Policy): DisplayField => textField(`Policy: ${ua}`, [
  ...(policy.noindex ? ['noindex'] : []), ...(policy.nofollow ? ['nofollow'] : []),
  ...(policy.nosnippet ? ['nosnippet'] : []), ...(policy.noimageindex ? ['noimageindex'] : []),
  ...(policy.maxSnippet === null ? [] : [`max-snippet:${policy.maxSnippet}`]),
  ...(policy.maxVideoPreview === null ? [] : [`max-video-preview:${policy.maxVideoPreview}`]),
  ...(policy.maxImagePreview ? [`max-image-preview:${policy.maxImagePreview}`] : []),
].join(', ') || 'None')

const conflictText = (conflict: Conflict) => `${conflict.ua}: ${conflict.directive}`
const conflictsRow = (conflicts: Conflict[]): DisplayField => textField('Conflicts',
  conflicts.length === 0 ? 'None' : conflicts.length === 1 ? conflictText(conflicts[0]!) : conflicts.length)
const conflictRows = (conflicts: Conflict[]): DisplayField[] =>
  conflicts.length > 1 ? conflicts.map((conflict, index) => textField(`Conflict ${index + 1}`, conflictText(conflict))) : []

const findConflicts = (byUa: Record<string, RobotsDirective[]>): Conflict[] => {
  const robotsGlobal = byUa['robots'] || []
  if (!robotsGlobal.length) return []
  const globalNoindex = robotsGlobal.some((d) => d.hasNoindex)
  const globalNofollow = robotsGlobal.some((d) => d.hasNofollow)
  const globalExplicitIndex = hasExplicitToken(robotsGlobal, ['index', 'all'])
  const globalExplicitFollow = hasExplicitToken(robotsGlobal, ['follow', 'all'])
  const conflicts: Conflict[] = []
  Object.entries(byUa).forEach(([ua, list]) => {
    if (ua === 'robots') return
    if (globalNoindex && hasExplicitToken(list, ['index', 'all'])) conflicts.push({ ua, directive: 'index vs global noindex' })
    if (globalExplicitIndex && list.some((d) => d.hasNoindex)) conflicts.push({ ua, directive: 'ua noindex vs global index' })
    if (globalNofollow && hasExplicitToken(list, ['follow', 'all'])) conflicts.push({ ua, directive: 'follow vs global nofollow' })
    if (globalExplicitFollow && list.some((d) => d.hasNofollow)) conflicts.push({ ua, directive: 'ua nofollow vs global follow' })
  })
  return conflicts
}

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
    const common = {
      input: headersCaptured ? 'Static DOM + HTTP response headers' : 'Static DOM',
      checked: [textField('Comparison', 'Global robots directives vs each named crawler'),
        textField('Header', headersCaptured ? 'X-Robots-Tag' : 'Not captured'),
        textField('Known crawler agents', Array.from(WELL_KNOWN).join(', ')),
        textField('Criterion', 'An explicit positive token on one side against an explicit negative on the other is a conflict; absence is additive')],
    }
    if (!directives.length) {
      return presentResult(robotsAgentConflictsRule, page, {
        ...common, type: 'info', priority: 920,
        values: [textField('Robots directives', 'Not found')], noMarkup: 'No robots directive found',
      })
    }
    const byUa = groupByUa(directives)
    const conflicts = findConflicts(byUa)
    const policies = Object.keys(byUa).filter((ua) => ua !== 'robots' && ua !== 'googlebot')
    const effective = ['googlebot', ...policies].map((ua) => policyRow(ua, resolveEffectiveRobots(directives, ua)))
    const unusualAgents = Object.keys(byUa).filter((ua) => ua !== 'robots' && !WELL_KNOWN.has(ua))
    const pairs = robotsMetaPairs(page.doc)
    const records = metaRecords(pairs, (pair) => [
      textField('Crawler', crawlerLabel(pair.directive.ua)), textField('Instruction', pair.directive.value),
    ])
    return presentResult(robotsAgentConflictsRule, page, {
      ...common,
      type: conflicts.length ? 'warn' : unusualAgents.length ? 'info' : 'ok',
      priority: conflicts.length ? 180 : unusualAgents.length ? 800 : 850,
      values: [
        ...(directives.length > INVENTORY_LIMIT ? [textField('Robots directives', directives.length)] : []),
        textField('Crawlers', listRow(distinct(directives.map((directive) => crawlerLabel(directive.ua))))),
        conflictsRow(conflicts),
        textField('Nonstandard agents', listRow(unusualAgents)),
        ...records.overview,
      ],
      detailValues: [...(pairs.length ? records.counts : []), ...headerRows(directives), ...conflictRows(conflicts), ...effective],
      evidence: records.evidence,
      markup: records.markup,
      noMarkup: pairs.length ? 'Complete original robots meta markup not retained' : 'No robots meta element found',
    })
  },
}
