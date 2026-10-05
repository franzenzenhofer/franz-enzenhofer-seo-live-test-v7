import type { RobotsMetaPair } from './robotsMarkup'
import { crawlerLabel, distinct, headerRows, matchedPairs, metaRecords } from './robotsPresentation'

import type { Rule } from '@/core/types'
import { textField } from '@/shared/presentation/create'
import { presentResult } from '@/shared/presentation/result'
import { parseRobotsDirectives } from '@/shared/robots'
import { findRobotsTokens, parseDirectiveNumber } from '@/shared/robots-tokens'
import { listRow } from '@/shared/presentation/listRow'

type Config = { directive: 'nosnippet' | 'noimageindex'; name: string; meaning: string; action: string }

export const createRobotsRestrictionRule = (config: Config): Rule => {
  const rule: Rule = {
    id: `head:robots-${config.directive}`,
    name: config.name,
    presentation: 1,
    enabled: true,
    what: 'static',
    meta: {
      provenance: 'google', references: [`https://developers.google.com/search/docs/crawling-indexing/robots-meta-tag#${config.directive}`],
      description: `Identifies ${config.directive} restrictions by crawler and exact tag or header, with conditional remediation.`,
      userGuide: {
        check: 'Lists the requested restriction for each named crawler. These meanings follow Google’s documented behavior; a directive aimed at a different crawler does not automatically apply to Googlebot.',
        action: config.action,
      },
    },
    async run(page) {
      const headersCaptured = page.headers !== undefined || page.responseHeaderFields !== undefined
      const directives = parseRobotsDirectives(page.doc, page.headers, page.responseHeaderFields)
      const matches = [...findRobotsTokens(directives, config.directive),
        ...(config.directive === 'nosnippet' ? findRobotsTokens(directives, 'max-snippet').filter(({ value }) => {
          const parsed = parseDirectiveNumber(value)
          return parsed.valid && parsed.value === 0
        }) : [])]
      const pairs = matchedPairs(page.doc, matches)
      const tokensOf = (pair: RobotsMetaPair) => matches.filter((match) => match.domPath === pair.directive.domPath).map((match) => match.token)
      const records = metaRecords(pairs, (pair) => [
        textField('Crawler', crawlerLabel(pair.directive.ua)), textField('Instruction', tokensOf(pair).join(', ')),
      ])
      const headers = headerRows(matches.map((match) => ({ ua: match.ua, value: match.token, source: match.source })))
      const common = {
        input: headersCaptured ? 'Static DOM + HTTP response headers' : 'Static DOM',
        detailValues: [...(pairs.length ? records.counts : []), ...headers],
        checked: [
          textField('Directive', config.directive),
          textField('Header', headersCaptured ? 'X-Robots-Tag' : 'Not captured'),
          textField('Selection', 'All matches'),
          textField('Criterion', config.directive === 'nosnippet' ? 'nosnippet or max-snippet:0 present' : 'noimageindex present'),
        ],
        evidence: records.evidence,
        markup: records.markup,
        noMarkup: pairs.length ? `Complete original ${config.directive} markup not retained` : `No matching ${config.directive} element found`,
      }
      if (!matches.length) {
        return presentResult(rule, page, { ...common, type: 'info', priority: 900, values: [textField(config.directive, 'Not found')] })
      }
      return presentResult(rule, page, {
        ...common, type: 'warn', priority: 220,
        values: [
          textField(matches.length > 1 ? 'Instructions' : 'Instruction', listRow(distinct(matches.map((match) => match.token)))),
          textField('Applies to', listRow(distinct(matches.map((match) => crawlerLabel(match.ua))))),
          ...records.overview,
        ],
      })
    },
  }
  return rule
}
