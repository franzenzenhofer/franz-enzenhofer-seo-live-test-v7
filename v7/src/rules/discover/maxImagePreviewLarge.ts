import { overviewMarkup } from './discoverPresentation'
import { ROBOTS_META_SELECTOR, headersCaptured, instructionsRow, robotsMetaFields, xRobotsTagRow } from './discoverRobots'

import type { Rule } from '@/core/types'
import { sampleElements } from '@/shared/domEvidence'
import { pageEffectiveRobots } from '@/shared/effectiveRobots'
import { textField } from '@/shared/presentation/create'
import { elementRecords } from '@/shared/presentation/records'
import { presentResult } from '@/shared/presentation/result'

export const discoverMaxImagePreviewLargeRule: Rule = {
  id: 'discover:max-image-preview-large', name: 'Large image preview permission', presentation: 1, enabled: true, what: 'static',
  meta: {
    provenance: 'google',
    references: ['https://developers.google.com/search/docs/appearance/google-discover', 'https://developers.google.com/search/docs/crawling-indexing/robots-meta-tag'],
    description: 'Reports the effective Googlebot image-preview directive and noimageindex across applicable meta tags and captured headers.',
  },
  async run(page) {
    const effective = pageEffectiveRobots(page)
    const captured = headersCaptured(page)
    const ok = effective.maxImagePreview === 'large' && !effective.noimageindex
    const { sample, total } = sampleElements(page.doc.querySelectorAll(ROBOTS_META_SELECTOR))
    // One record per robots/googlebot meta tag; header instructions are shown as the raw X-Robots-Tag row.
    const records = elementRecords(sample, total, robotsMetaFields)
    return presentResult(discoverMaxImagePreviewLargeRule, page, {
      input: captured ? 'Static DOM + HTTP response headers' : 'Static DOM',
      type: !captured ? 'runtime_error' : ok ? 'ok' : 'warn', priority: ok && captured ? 800 : 400,
      values: [textField('max-image-preview', effective.maxImagePreview || 'Not declared'),
        textField('noimageindex', effective.noimageindex ? 'Found' : 'Not found'),
        ...(captured ? [] : [textField('Response headers', 'Not checked')]),
        instructionsRow(effective.directives), ...overviewMarkup(records.markup)],
      detailValues: [...xRobotsTagRow(page), ...records.counts],
      checked: [textField('Selector', ROBOTS_META_SELECTOR), textField('Header', captured ? 'X-Robots-Tag' : 'Not captured'),
        textField('Crawler', 'Googlebot'), textField('Resolution', 'Most restrictive applicable instruction'),
        textField('Criterion', 'max-image-preview:large with no noimageindex instruction')],
      evidence: records.evidence, markup: records.markup,
      noMarkup: total ? 'Complete original robots meta markup not retained' : 'No applicable robots meta element found',
    })
  },
}
