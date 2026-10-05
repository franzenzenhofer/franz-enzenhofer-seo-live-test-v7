import { overviewMarkup } from './discoverPresentation'
import { ROBOTS_META_SELECTOR, headersCaptured, instructionsRow, metaHasNoindex, robotsMetaFields, xRobotsTagRow } from './discoverRobots'

import type { Rule } from '@/core/types'
import { sampleElements } from '@/shared/domEvidence'
import { pageEffectiveRobots } from '@/shared/effectiveRobots'
import { textField } from '@/shared/presentation/create'
import { elementRecords } from '@/shared/presentation/records'
import { presentResult } from '@/shared/presentation/result'

export const discoverIndexableRule: Rule = {
  id: 'discover:indexable', name: 'Google indexing permission', presentation: 1, enabled: true, what: 'static',
  meta: {
    provenance: 'google',
    references: [
      'https://developers.google.com/search/docs/crawling-indexing/robots-meta-tag',
      'https://developers.google.com/search/docs/appearance/google-discover',
    ],
    description: 'Checks the effective noindex restriction for Googlebot across applicable robots meta tags and X-Robots-Tag headers.',
  },
  async run(page) {
    const effective = pageEffectiveRobots(page)
    const blocking = effective.directives.filter((entry) => entry.hasNoindex)
    const captured = headersCaptured(page)
    const { sample, total } = sampleElements(page.doc.querySelectorAll(ROBOTS_META_SELECTOR))
    // One record per robots/googlebot meta tag; header instructions are shown as the raw X-Robots-Tag row.
    const records = elementRecords(sample, total, (element) => [
      ...robotsMetaFields(element), textField('noindex', metaHasNoindex(element, effective.directives) ? 'Found' : 'Not found'),
    ])
    return presentResult(discoverIndexableRule, page, {
      input: captured ? 'Static DOM + HTTP response headers' : 'Static DOM',
      type: effective.noindex ? 'warn' : 'ok', priority: effective.noindex ? 150 : 850,
      values: [textField('Googlebot noindex', effective.noindex ? 'Found' : 'Not found'),
        instructionsRow(effective.directives), ...overviewMarkup(records.markup)],
      detailValues: [textField('Actual Google index status', 'Not checked'), textField('Applicable instructions', effective.directives.length),
        textField('Blocking instructions', blocking.length), ...xRobotsTagRow(page), ...records.counts],
      checked: [textField('Selector', ROBOTS_META_SELECTOR), textField('Header', captured ? 'X-Robots-Tag' : 'Not captured'),
        textField('Crawler', 'Googlebot'), textField('Criterion', 'No applicable noindex or none instruction')],
      evidence: records.evidence, markup: records.markup,
      noMarkup: total ? 'Complete original robots meta markup not retained' : 'No applicable robots meta element found',
    })
  },
}
