import type { Rule } from '@/core/types'
import { parseLd, findType, docs } from '@/shared/structured'
import { extractHtml, extractSnippet, getDomPath } from '@/shared/html-utils'

export const schemaBreadcrumbRule: Rule = {
  id: 'schema:breadcrumb',
  name: 'Schema BreadcrumbList',
  enabled: true,
  async run(page) {
    const scripts = page.doc.querySelectorAll('script[type="application/ld+json"]')
    const n = findType(parseLd(page.doc), 'breadcrumblist')[0]
    if (!n) return { label: 'SCHEMA', message: 'No BreadcrumbList JSON‑LD', type: 'info', name: 'schemaBreadcrumb' }
    const els = (n['itemListElement'] as unknown[]) || []
    const ok = els.length >= 2
    const script = Array.from(scripts).find((s) => s.textContent?.includes('BreadcrumbList')) || null
    const sourceHtml = extractHtml(script)
    return {
      label: 'SCHEMA',
      message: ok ? `Breadcrumb OK · Docs: ${docs('breadcrumb')}` : `Breadcrumb needs ≥2 items · Docs: ${docs('breadcrumb')}`,
      type: ok ? 'ok' : 'warn',
      name: 'schemaBreadcrumb',
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

