import { attrUrlField, countRow, excerpt, inventory, urlLabel } from './elementInventory'

import type { Rule } from '@/core/types'
import { sampleElements } from '@/shared/domEvidence'
import { textField } from '@/shared/presentation/create'
import { presentResult } from '@/shared/presentation/result'
import { listRow } from '@/shared/presentation/listRow'

const SELECTOR = 'a[rel~="nofollow"]'

export const nofollowRule: Rule = {
  id: 'body:nofollow',
  name: 'Nofollow Links',
  presentation: 1,
  enabled: true,
  what: 'static',
  meta: {
    provenance: 'google',
    references: [
      'https://developers.google.com/search/docs/crawling-indexing/qualify-outbound-links',
    ],
    description: 'Counts links whose rel token list contains nofollow and reports the count as info; ok when none exist.',
  },
  async run(page) {
    const { sample, total } = sampleElements(page.doc.querySelectorAll(SELECTOR))
    const records = inventory(sample, total, (link) => [
      textField('Text', excerpt(link.textContent || '') || 'Empty'),
      attrUrlField('href', link.getAttribute('href'), page.url),
      textField('rel', link.getAttribute('rel') || 'Not declared'),
    ])
    const targets = sample.map((link) => urlLabel(link.getAttribute('href') || '', page.url))
    return presentResult(nofollowRule, page, {
      input: 'Idle DOM', type: total ? 'info' : 'ok', priority: total ? 700 : 850,
      values: [...countRow('Nofollow links', total, records.overviewMarkup),
        ...(total && !records.overviewMarkup.length ? [textField('Targets', listRow(targets))] : []), ...records.overviewMarkup],
      detailValues: total ? records.counts : [],
      checked: [textField('Selector', SELECTOR), textField('Match', 'Rel token list contains nofollow'),
        textField('Criterion', 'Reports the observed nofollow link count')],
      evidence: records.evidence, markup: records.markup,
      noMarkup: total ? 'Complete original nofollow link markup not retained' : 'No rel=nofollow links found',
    })
  },
}
