import type { Rule } from '@/core/types'
import { textField } from '@/shared/presentation/create'
import { markupEvidence } from '@/shared/presentation/originalMarkup'
import { presentResult } from '@/shared/presentation/result'

const inferBrand = (url: string) => {
  try {
    const host = new URL(url).hostname.replace(/^www\./, '')
    return { host, brand: host.split('.').reduce((a, b) => b.length > a.length ? b : a, '') }
  } catch { return { host: '', brand: '' } }
}
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
    const element = page.doc.querySelector('head > title')
    const title = element?.textContent || ''
    const applicable = !!brand && !!title.trim()
    const match = applicable && title.toLowerCase().includes(brand.toLowerCase())
    const captured = markupEvidence(element ? [element] : [], '<title>')
    return presentResult(brandInTitleRule, page, {
      input: `Static DOM + ${configured || invalid ? 'brand configuration' : 'page hostname'}`,
      type: invalid ? 'runtime_error' : !brand || match ? 'info' : 'warn', priority: match ? 700 : 300,
      values: [textField('Brand match', applicable ? match ? 'Found' : 'Not found' : 'Not evaluated'),
        textField('Searched brand', brand || (invalid ? 'Invalid configuration' : 'Not determined')),
        ...(captured.markup[0] ? [{ ...captured.markup[0], key: '<title>' }] : [])],
      detailValues: [textField('Title', element ? title : 'Not present'), textField('Brand source', configured ? 'Configured text' : invalid ? 'Invalid configuration' : 'Hostname estimate'),
        textField('Hostname', inferred.host || 'Not available')],
      checked: [textField('Selector', 'head > title'), textField('Selected element', 'First match'),
        textField('Match', 'Case-insensitive substring'), textField('Run condition', 'Brand text and non-empty title available')],
      evidence: captured.fields.length ? [{ name: 'Source', fields: captured.fields }] : [],
      markup: captured.markup, noMarkup: element ? 'Complete original title markup not retained' : 'No title element found in head',
    })
  },
}
