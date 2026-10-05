import { robotsMetaPairs } from './robotsMarkup'
import { distinct, metaRecords, normalizeTokens, restrictiveFirst } from './robotsPresentation'

import type { Rule } from '@/core/types'
import { textField } from '@/shared/presentation/create'
import { presentResult } from '@/shared/presentation/result'
import { listRow } from '@/shared/presentation/listRow'

const NAME = 'Meta other robots'
const RULE_ID = 'head:meta-other-robots'
const checked = [
  textField('Query', 'meta[name] with robots vocabulary, excluding robots and googlebot'),
  textField('Selection', 'All matches'),
  textField('Source', 'HTML meta tag'),
  textField('Criterion', 'Warn only when a listed agent-specific instruction contains noindex or nofollow'),
]

export const robotsOtherMetaRule: Rule = {
  id: RULE_ID,
  name: NAME,
  presentation: 1,
  enabled: true,
  what: 'static',
  meta: {
    userGuide: {
      check: 'Lists instructions aimed at crawlers other than the generic robots group and Googlebot. A restriction for one named crawler does not automatically block Googlebot. Support for individual directives depends on that crawler.',
      action: 'Confirm which crawler each restriction targets. Change the relevant meta tag only if its noindex or nofollow instruction is unintended, and preserve the intended restrictions for other crawlers.',
    },
    provenance: 'google',
    references: ['https://developers.google.com/search/docs/crawling-indexing/robots-meta-tag'],
    description: 'Lists agent-specific robots meta tags whose name is neither robots nor googlebot, warning when any carries noindex/nofollow.',
  },
  async run(page) {
    const pairs = robotsMetaPairs(page.doc).filter(
      (pair) => pair.directive.ua !== 'robots' && pair.directive.ua !== 'googlebot',
    )
    if (!pairs.length) {
      return presentResult(robotsOtherMetaRule, page, {
        input: 'Static DOM', type: 'info', priority: 910,
        values: [textField('Agent robots meta', 'Not found')], checked, noMarkup: 'No agent-specific robots meta element found',
      })
    }
    const directives = pairs.map((pair) => pair.directive)
    const restricted = directives.some((directive) => directive.hasNoindex || directive.hasNofollow)
    const records = metaRecords(pairs, (pair) => [
      textField('Crawler', pair.directive.ua), textField('Instruction', pair.directive.value),
    ])
    const tokens = restrictiveFirst(normalizeTokens(directives.flatMap((directive) => directive.tokens)))
    return presentResult(robotsOtherMetaRule, page, {
      input: 'Static DOM',
      type: restricted ? 'warn' : 'info',
      priority: restricted ? 170 : 620,
      values: [
        ...(pairs.length > 1 ? [textField('Agent robots tags', pairs.length)] : []),
        textField(pairs.length > 1 ? 'Instructions' : 'Instruction', listRow(tokens)),
        textField('Crawlers listed', listRow(distinct(directives.map((directive) => directive.ua)))),
        ...records.overview,
      ],
      detailValues: records.counts,
      checked,
      evidence: records.evidence,
      markup: records.markup,
      noMarkup: 'Complete original agent-specific robots meta markup not retained',
    })
  },
}
