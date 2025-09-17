import type { Rule } from '@/core/types'
import { parseLd, findType, get, docs } from '@/shared/structured'

export const schemaProductRule: Rule = {
  id: 'schema:product',
  name: 'Schema Product',
  enabled: true,
  async run(page) {
    const n = findType(parseLd(page.doc), 'product')[0]
    if (!n) return { label: 'SCHEMA', message: 'No Product JSON‑LD', type: 'info' }
    const miss: string[] = []
    if (!get(n, 'name')) miss.push('name')
    const price = get(n, 'offers.price')
    const curr = get(n, 'offers.priceCurrency')
    if (!price) miss.push('offers.price')
    if (!curr) miss.push('offers.priceCurrency')
    return miss.length ? { label: 'SCHEMA', message: `Product missing: ${miss.join(', ')} · Docs: ${docs('product')}`, type: 'warn' } : { label: 'SCHEMA', message: `Product OK · Docs: ${docs('product')}`, type: 'ok' }
  },
}

