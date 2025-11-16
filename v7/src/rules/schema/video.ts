import type { Rule } from '@/core/types'
import { parseLd, findType, docs } from '@/shared/structured'
import { extractHtml, extractSnippet, getDomPath } from '@/shared/html-utils'

export const schemaVideoRule: Rule = {
  id: 'schema:video',
  name: 'Schema VideoObject',
  enabled: true,
  what: 'static',
  async run(page) {
    const scripts = page.doc.querySelectorAll('script[type="application/ld+json"]')
    const n = findType(parseLd(page.doc), 'videoobject')[0]
    if (!n) return { label: 'SCHEMA', message: 'No VideoObject JSON‑LD', type: 'info', name: 'schemaVideo' }
    const ok = !!n['name'] && !!n['description'] && !!n['thumbnailUrl'] && !!n['uploadDate']
    const script = Array.from(scripts).find((s) => s.textContent?.includes('Video')) || null
    const sourceHtml = extractHtml(script)
    return {
      label: 'SCHEMA',
      message: ok ? `VideoObject OK · Docs: ${docs('video')}` : `VideoObject missing fields · Docs: ${docs('video')}`,
      type: ok ? 'ok' : 'warn',
      name: 'Schema VideoObject',
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

