import type { Rule } from '@/core/types'
import { parseLd, findType, docs } from '@/shared/structured'

export const schemaBreadcrumbRule: Rule = {
  id: 'schema:breadcrumb',
  name: 'Schema BreadcrumbList',
  enabled: true,
  async run(page) {
    const n = findType(parseLd(page.doc), 'breadcrumblist')[0]
    if (!n) return { label: 'SCHEMA', message: 'No BreadcrumbList JSON‑LD', type: 'info' }
    const els = (n['itemListElement'] as unknown[]) || []
    const ok = els.length >= 2
    return ok ? { label: 'SCHEMA', message: `Breadcrumb OK · Docs: ${docs('breadcrumb')}`, type: 'ok' } : { label: 'SCHEMA', message: `Breadcrumb needs ≥2 items · Docs: ${docs('breadcrumb')}`, type: 'warn' }
  },
}

