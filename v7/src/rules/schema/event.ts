import type { Rule } from '@/core/types'
import { parseLd, findType, docs } from '@/shared/structured'
import { extractHtml, extractSnippet, getDomPath } from '@/shared/html-utils'

export const schemaEventRule: Rule = {
  id: 'schema:event',
  name: 'Schema Event',
  enabled: true,
  what: 'static',
  async run(page) {
    const scripts = page.doc.querySelectorAll('script[type="application/ld+json"]')
    const n = findType(parseLd(page.doc), 'event')[0]
    if (!n) return { label: 'SCHEMA', message: 'No Event JSON‑LD', type: 'info', name: 'schemaEvent' }
    const ok = !!n['name'] && !!n['startDate'] && !!n['location']
    const script = Array.from(scripts).find((s) => s.textContent?.includes('Event')) || null
    const sourceHtml = extractHtml(script)
    return {
      label: 'SCHEMA',
      message: ok ? `Event OK · Docs: ${docs('event')}` : `Event missing fields · Docs: ${docs('event')}`,
      type: ok ? 'ok' : 'warn',
      name: 'schemaEvent',
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

