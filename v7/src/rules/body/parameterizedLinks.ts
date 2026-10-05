import { attrUrlField, countRow, excerpt, INVENTORY_LIMIT, inventory } from './elementInventory'

import type { Rule } from '@/core/types'
import { sampleElements } from '@/shared/domEvidence'
import { textField, urlField } from '@/shared/presentation/create'
import { presentResult } from '@/shared/presentation/result'
import { listRow } from '@/shared/presentation/listRow'

const resolvedQuery = (href: string, base: string) => {
  try {
    let url: URL
    try { url = new URL(href, base) } catch { url = new URL(href) }
    return /^https?:$/.test(url.protocol) && url.search ? url : null
  } catch { return null }
}
export const parameterizedLinksRule: Rule = {
  id: 'body:parameterized-links', name: 'Links with URL parameters', presentation: 1, enabled: true, what: 'static',
  meta: {
    provenance: 'google',
    references: ['https://developers.google.com/search/docs/crawling-indexing/crawling-managing-faceted-navigation', 'https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls'],
    description: 'Counts links resolving to HTTP(S) URLs with a non-empty query string and retains attributed evidence.',
  },
  async run(page) {
    const anchors = page.doc.querySelectorAll('a[href]')
    let base = page.baseUri || page.staticFacts?.baseUri || page.url
    try { base = new URL(page.doc.querySelector('base[href]')?.getAttribute('href') || base, page.url).href } catch { /* absolute links can still resolve */ }
    let count = 0
    const retained: Array<{ element: Element; url: URL }> = []
    anchors.forEach((element) => {
      const url = resolvedQuery(element.getAttribute('href') || '', base)
      if (!url) return
      count++
      if (retained.length < INVENTORY_LIMIT) retained.push({ element, url })
    })
    // Matching links are the evidence; without a match the inspected anchors are shown instead (F5).
    const records = count
      ? inventory(retained.map(({ element }) => element), count, (element, index) => [
        textField('Text', excerpt(element.textContent || '') || 'Empty'), urlField('href', retained[index]!.url.href),
        textField('Query', retained[index]!.url.search),
      ])
      : inventory(sampleElements(anchors).sample, anchors.length, (element) => [attrUrlField('href', element.getAttribute('href'), base)])
    return presentResult(parameterizedLinksRule, page, {
      input: 'Static DOM + page URL', type: 'info', priority: count ? 700 : 900,
      values: [...countRow('Parameter links', count, records.overviewMarkup), ...countRow('Links checked', anchors.length, records.overviewMarkup),
        ...(count && !records.overviewMarkup.length ? [textField('Queries', listRow(retained.map(({ url }) => url.search)))] : []),
        ...records.overviewMarkup],
      checked: [textField('Selector', 'a[href]'), textField('Match', 'Resolved HTTP(S) URL has a non-empty query string'), textField('Document base', base)],
      detailValues: anchors.length ? records.counts : [], evidence: records.evidence,
      markup: records.markup, noMarkup: count ? 'Complete original link markup not retained' : 'No matching links found',
    })
  },
}
