import { hrefField, markupReason, OVERVIEW_MARKUP_LIMIT, overviewMarkup, webUrlField } from './canonicalHreflangPresentation'

import type { Rule } from '@/core/types'
import { sampleElements } from '@/shared/domEvidence'
import { textField } from '@/shared/presentation/create'
import { elementRecords } from '@/shared/presentation/records'
import { presentResult } from '@/shared/presentation/result'
import { listRow } from '@/shared/presentation/listRow'

const NAME = 'Rel Alternate Media'
const RULE_ID = 'head:rel-alternate-media'
const SELECTOR = 'head > link[rel~="alternate" i][media][href]'
const checked = [textField('Selector', SELECTOR), textField('Selection', 'All matches'), textField('Required attributes', 'rel, media, and href'),
  textField('Scope', 'Link elements directly under <head> with an alternate rel token')]
const mediaOf = (link: Element) => link.getAttribute('media')?.trim() || ''

export const relAlternateMediaRule: Rule = {
  id: RULE_ID,
  name: NAME,
  presentation: 1,
  enabled: true,
  what: 'static',
  meta: {
    provenance: 'google',
    references: [
      'https://developers.google.com/search/docs/crawling-indexing/mobile/mobile-sites-mobile-first-indexing',
      'https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes/rel',
    ],
    description: 'Detects link[rel=alternate][media][href] annotations (separate mobile URL configuration) and warns when present.',
  },
  async run(page) {
    const all = page.doc.querySelectorAll(SELECTOR)
    const elements = sampleElements(all)
    const count = elements.total
    if (!count) {
      return presentResult(relAlternateMediaRule, page, {
        input: 'Idle DOM', type: 'info', priority: 900,
        values: [textField('Alternate media link', 'Not found')], checked,
        noMarkup: 'No matching alternate media link found',
      })
    }
    const records = elementRecords(elements.sample, count, (link) => [textField('media', mediaOf(link) || 'Empty'), hrefField(link, page.url)])
    // One link: its URL plus the complete element; several: the count, then the markup or a media-query summary (F4, F12).
    const firstHref = elements.sample[0]!.getAttribute('href')?.trim() || ''
    const observed = count === 1
      ? [firstHref ? webUrlField('Alternate URL', firstHref, page.url) : textField('Alternate URL', 'Empty')]
      : [textField('Media links', count), ...(count > OVERVIEW_MARKUP_LIMIT ? [textField('Media queries', listRow(Array.from(all, mediaOf).filter(Boolean)))] : [])]
    return presentResult(relAlternateMediaRule, page, {
      input: 'Idle DOM', type: 'warn', priority: 600,
      values: [...observed, ...overviewMarkup(records.markup)],
      detailValues: records.counts, checked, evidence: records.evidence, markup: records.markup,
      noMarkup: markupReason(records, 'Complete original alternate media markup not retained for all sampled links', 'No matching alternate media link found'),
    })
  },
}
