import { collectDirectiveHits, directiveEvidence } from './metaUnavailableAfter.evidence'

import type { Rule } from '@/core/types'
import { textField } from '@/shared/presentation/create'
import { presentResult } from '@/shared/presentation/result'

const NAME = 'Meta Unavailable After'
const RULE_ID = 'head:unavailable-after'

const checked = [
  textField('Directive', 'unavailable_after in a robots-crawler <meta name> content attribute'),
  textField('Sources', 'Static DOM facts and idle DOM facts, deduplicated by declared value'),
  textField('Criterion', 'A parsed date already in the past is an error; an unparseable date is ignored by Google and is a warning'),
]

export const metaUnavailableAfterRule: Rule = {
  id: RULE_ID,
  name: NAME,
  presentation: 1,
  enabled: true,
  what: 'static',
  meta: {
    provenance: 'google',
    references: ['https://developers.google.com/search/docs/crawling-indexing/robots-meta-tag#unavailable_after'],
    description: 'Detects unavailable_after directives in robots meta tags and errors when the specified removal date is already in the past.',
  },
  async run(page) {
    // Only head meta facts are read below, and those are collected as critical,
    // so a capped anchor/resource sample must not block the comparison.
    const staticOk = !!page.staticFacts && !page.staticFacts.criticalTruncated
    const idleOk = !!page.idleFacts && !page.idleFacts.criticalTruncated
    if (!staticOk || !idleOk) return presentResult(metaUnavailableAfterRule, page, {
      input: 'Not captured', type: 'runtime_error', priority: 900,
      values: [textField('Unavailable-after check', 'Not performed - required facts incomplete')],
      detailValues: [textField('Static facts', staticOk ? 'Available' : page.staticFacts ? 'Truncated' : 'Not captured'),
        textField('Idle facts', idleOk ? 'Available' : page.idleFacts ? 'Truncated' : 'Not captured')],
      checked, noMarkup: 'None - required static/idle facts were not available to compare',
    })

    const hits = collectDirectiveHits(page.staticFacts, page.idleFacts)
    if (!hits.length) return presentResult(metaUnavailableAfterRule, page, {
      input: 'Static DOM + Idle DOM', type: 'info', priority: 900,
      values: [textField('unavailable_after directives', 0)], checked,
      noMarkup: 'No unavailable_after directive found in robots meta tags',
    })

    const past = hits.some((hit) => hit.timestamp !== null && hit.timestamp < Date.now())
    const allUnparseable = hits.every((hit) => hit.timestamp === null)
    const first = hits[0]!
    const state = past ? 'Past' : allUnparseable ? 'Unparseable' : 'Not in the past'
    const { evidence, markup } = directiveEvidence(hits)

    return presentResult(metaUnavailableAfterRule, page, {
      input: 'Static DOM + Idle DOM', type: past ? 'error' : 'warn', priority: past ? 80 : 300,
      values: [textField('unavailable_after directives', hits.length), textField('First declared date', first.date), textField('Date state', state)],
      checked, evidence, markup,
      noMarkup: markup.length ? 'Complete original markup not retained for all directives' : 'Complete original directive markup not retained',
    })
  },
}
