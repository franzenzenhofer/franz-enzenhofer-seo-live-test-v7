import type { Rule } from '@/core/types'
import { parseLd, findType, get, docs } from '@/shared/structured'
import { extractHtml, extractSnippet, getDomPath } from '@/shared/html-utils'

export const schemaProductRule: Rule = {
  id: 'schema:product',
  name: 'Schema Product',
  enabled: true,
  what: 'static',
  async run(page) {
    const scripts = page.doc.querySelectorAll('script[type="application/ld+json"]')
    const n = findType(parseLd(page.doc), 'product')[0]
    if (!n) return { label: 'SCHEMA', message: 'No Product JSON‑LD', type: 'info', name: 'schemaProduct' }
    const miss: string[] = []
    if (!get(n, 'name')) miss.push('name')
    const price = get(n, 'offers.price')
    const curr = get(n, 'offers.priceCurrency')
    if (!price) miss.push('offers.price')
    if (!curr) miss.push('offers.priceCurrency')
    const script = Array.from(scripts).find((s) => s.textContent?.includes('Product')) || null
    const sourceHtml = extractHtml(script)
    return {
      label: 'SCHEMA',
      message: miss.length
        ? `Product missing: ${miss.join(', ')} · Docs: ${docs('product')}`
        : `Product OK · Docs: ${docs('product')}`,
      type: miss.length ? 'warn' : 'ok',
      name: 'schemaProduct',
      details: script
        ? {
            sourceHtml,
            snippet: extractSnippet(sourceHtml),
            domPath: getDomPath(script),
          }
        : undefined,
    }
  },
}

