import type { Rule } from '@/core/types'
import { textField } from '@/shared/presentation/create'
import { elementRecords } from '@/shared/presentation/records'
import { presentResult } from '@/shared/presentation/result'

const SELECTOR = 'head > title'
const checked = [textField('Selector', SELECTOR), textField('Selected element', 'First match'),
  textField('Match', 'Case-insensitive substring'), textField('Run condition', 'Brand text and non-empty title available')]

const inferBrand = (url: string) => {
  try {
    const host = new URL(url).hostname.replace(/^www\./, '')
    return { host, brand: host.split('.').reduce((a, b) => b.length > a.length ? b : a, '') }
  } catch { return { host: '', brand: '' } }
}
// Overview: the brand searched for (comparison target), the match verdict, then the complete <title> it was searched in.
export const brandInTitleRule: Rule = {
  id: 'head:brand-in-title', name: 'Brand in page title', presentation: 1, enabled: true, what: 'static',
  meta: {
    provenance: 'franz', references: ['https://developers.google.com/search/docs/appearance/title-link'],
    description: 'Matches configured brand text, or an estimate from the longest hostname label, against the first title.',
  },
  async run(page, ctx) {
    const variables = ctx.globals['variables']
    const raw = variables && typeof variables === 'object' ? (variables as Record<string, unknown>)['brand'] : undefined
    const invalid = raw !== undefined && typeof raw !== 'string'
    const configured = typeof raw === 'string' ? raw.trim() : ''
    const inferred = inferBrand(page.url)
    const brand = invalid ? '' : configured || inferred.brand
    const element = page.doc.querySelector(SELECTOR)
    const title = element?.textContent || ''
    const applicable = !!brand && !!title.trim()
    const match = applicable && title.toLowerCase().includes(brand.toLowerCase())
    const records = elementRecords(element ? [element] : [], element ? 1 : 0)
    return presentResult(brandInTitleRule, page, {
      input: `Static DOM + ${configured || invalid ? 'brand configuration' : 'page hostname'}`,
      type: invalid ? 'runtime_error' : !brand || match ? 'info' : 'warn', priority: match ? 700 : 300,
      values: [textField('Searched brand', brand || (invalid ? 'Invalid configuration' : 'None')),
        textField('Brand match', applicable ? match ? 'Found' : 'Not found' : 'Not checked'), ...records.markup],
      detailValues: [...(element ? [textField('Title', title)] : []),
        textField('Brand source', configured ? 'Configured text' : invalid ? 'Configured value' : 'Hostname estimate'),
        ...(inferred.host ? [textField('Hostname', inferred.host)] : []), ...(element ? records.counts : [])],
      checked, evidence: records.evidence, markup: records.markup,
      noMarkup: element ? 'Complete original title markup not retained' : 'No title element found in head',
    })
  },
}
