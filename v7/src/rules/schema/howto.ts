import type { Rule } from '@/core/types'
import { parseLd, findType, docs } from '@/shared/structured'
import { extractHtml, extractSnippet, getDomPath } from '@/shared/html-utils'

export const schemaHowToRule: Rule = {
  id: 'schema:howto',
  name: 'Schema HowTo',
  enabled: true,
  async run(page) {
    const scripts = page.doc.querySelectorAll('script[type="application/ld+json"]')
    const n = findType(parseLd(page.doc), 'howto')[0]
    if (!n) return { label: 'SCHEMA', message: 'No HowTo JSON‑LD', type: 'info', name: 'schemaHowTo' }
    const ok = !!n['name'] && Array.isArray(n['step'])
    const script = Array.from(scripts).find((s) => s.textContent?.includes('HowTo')) || null
    const sourceHtml = extractHtml(script)
    return {
      label: 'SCHEMA',
      message: ok ? `HowTo OK · Docs: ${docs('howto')}` : `HowTo missing name/step · Docs: ${docs('howto')}`,
      type: ok ? 'ok' : 'warn',
      name: 'schemaHowTo',
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

