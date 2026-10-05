import { robotsMetaPairs } from './robotsMarkup'
import { crawlerLabel, distinct, metaRecords } from './robotsPresentation'

import type { Rule } from '@/core/types'
import { textField } from '@/shared/presentation/create'
import { presentResult } from '@/shared/presentation/result'
import { listRow } from '@/shared/presentation/listRow'

const NAME = 'Robots meta list'
const RULE_ID = 'head:robots-meta-list'
const checked = [
  textField('Query', 'meta[name] with robots vocabulary'),
  textField('Selection', 'All matches'),
  textField('Source', 'HTML meta tag'),
  textField('Criterion', 'Informational inventory - no pass or fail verdict'),
]

export const robotsMetaListRule: Rule = {
  id: RULE_ID,
  name: NAME,
  presentation: 1,
  enabled: true,
  what: 'static',
  meta: {
    userGuide: {
      check: 'Lists recognized robots meta instructions by crawler and their original HTML. This is an inventory, not a judgment of actual indexing. Missing meta tags do not imply that robots.txt or HTTP-header restrictions are absent.',
      action: 'Review each crawler\'s instructions in the page template or CMS robots settings. Use the indexing and preview rules to assess the combined effect before changing anything.',
    },
    provenance: 'google',
    references: ['https://developers.google.com/search/docs/crawling-indexing/robots-meta-tag'],
    description: 'Info-only inventory listing every meta-source robots directive (all user agents) found in the document.',
  },
  async run(page) {
    const pairs = robotsMetaPairs(page.doc)
    if (!pairs.length) {
      return presentResult(robotsMetaListRule, page, {
        input: 'Static DOM', type: 'info', priority: 915,
        values: [textField('Robots meta', 'Not found')], checked, noMarkup: 'No robots meta element found',
      })
    }
    const records = metaRecords(pairs, (pair) => [
      textField('Crawler', crawlerLabel(pair.directive.ua)), textField('Instruction', pair.directive.value),
    ])
    return presentResult(robotsMetaListRule, page, {
      input: 'Static DOM',
      type: 'info',
      priority: 640,
      values: [
        ...(pairs.length > 1 ? [textField('Robots meta tags', pairs.length)] : []),
        textField('Crawlers listed', listRow(distinct(pairs.map((pair) => pair.directive.ua)))),
        ...records.overview,
      ],
      detailValues: records.counts,
      checked,
      evidence: records.evidence,
      markup: records.markup,
      noMarkup: 'Complete original robots meta markup not retained',
    })
  },
}
