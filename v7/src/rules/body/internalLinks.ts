import { attrUrlField, countRow, excerpt, hostOf, INVENTORY_LIMIT, inventory, urlLabel } from './elementInventory'

import type { Rule } from '@/core/types'
import { sampleElements } from '@/shared/domEvidence'
import { textField } from '@/shared/presentation/create'
import { presentResult } from '@/shared/presentation/result'
import type { DisplayField } from '@/shared/presentation/schema'
import { listRow } from '@/shared/presentation/listRow'

const sameHost = (base: string, href: string) => {
  try {
    const b = new URL(base)
    const u = new URL(href, base)
    return b.host === u.host
  } catch {
    return false
  }
}
const hrefOf = (link: Element) => link.getAttribute('href') || ''

// Observed targets beside the counts (F12): internal paths and distinct external hosts.
const targetRows = (sample: Element[], base: string): DisplayField[] => {
  const internal = sample.filter((link) => sameHost(base, hrefOf(link))).map((link) => urlLabel(hrefOf(link), base))
  const external = [...new Set(sample.filter((link) => !sameHost(base, hrefOf(link))).map((link) => hostOf(hrefOf(link), base)))]
  return [...(internal.length ? [textField('Internal targets', listRow(internal))] : []),
    ...(external.length ? [textField('External hosts', listRow(external))] : [])]
}

export const internalLinksRule: Rule = {
  id: 'body:internal-links',
  name: 'Internal links count',
  presentation: 1,
  enabled: true,
  what: 'static',
  meta: {
    provenance: 'franz',
    references: [
      'https://developers.google.com/search/docs/fundamentals/seo-starter-guide',
    ],
    description: 'Counts anchors with href, split into same-host (internal) vs cross-host (external), always reported as info.',
  },
  async run(page) {
    const anchors = page.doc.querySelectorAll<HTMLAnchorElement>('a[href]')
    const internalCount = Array.from(anchors).filter((link) => sameHost(page.url, hrefOf(link))).length
    const externalCount = anchors.length - internalCount
    const all = sampleElements(anchors, INVENTORY_LIMIT)
    const records = inventory(all.sample, all.total, (link) => [
      textField('Text', excerpt(link.textContent || '') || 'Empty'),
      attrUrlField('href', hrefOf(link), page.url),
      textField('Category', sameHost(page.url, hrefOf(link)) ? 'Same host' : 'Cross host'),
    ])
    return presentResult(internalLinksRule, page, {
      input: 'Static DOM + Page URL', type: 'info', priority: 750,
      values: [...countRow('Internal links', internalCount, records.overviewMarkup), ...countRow('External links', externalCount, records.overviewMarkup),
        ...(records.overviewMarkup.length ? [] : targetRows(all.sample, page.url)), ...records.overviewMarkup],
      detailValues: all.total ? records.counts : [],
      checked: [textField('Selector', 'a[href]'), textField('Classification', 'Same URL host is internal; every other result is external'),
        textField('Resolution', 'Anchor href resolved against the page URL'), textField('Criterion', 'Reports observed internal and external link counts')],
      evidence: records.evidence, markup: records.markup,
      noMarkup: all.total ? 'Complete original link markup not retained' : 'No a[href] elements found',
    })
  },
}
