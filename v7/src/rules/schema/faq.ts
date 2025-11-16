import type { Rule } from '@/core/types'
import { parseLd, findType, docs } from '@/shared/structured'
import { extractHtml, extractSnippet, getDomPath } from '@/shared/html-utils'

export const schemaFaqRule: Rule = {
  id: 'schema:faq',
  name: 'Schema FAQPage',
  enabled: true,
  what: 'static',
  async run(page) {
    const scripts = page.doc.querySelectorAll('script[type="application/ld+json"]')
    const n = findType(parseLd(page.doc), 'faqpage')[0]
    if (!n) return { label: 'SCHEMA', message: 'No FAQPage JSON‑LD', type: 'info', name: 'schemaFaq' }
    const ents = (n['mainEntity'] as Array<Record<string, unknown>>) || []
    const ok = (ents || []).some((q) => q && String(q['@type'] || '').toLowerCase().includes('question') && !!q['acceptedAnswer'])
    const script = Array.from(scripts).find((s) => s.textContent?.includes('FAQPage')) || null
    const sourceHtml = extractHtml(script)
    return {
      label: 'SCHEMA',
      message: ok ? `FAQPage OK · Docs: ${docs('faq')}` : `FAQPage invalid (questions/answers) · Docs: ${docs('faq')}`,
      type: ok ? 'ok' : 'warn',
      name: 'Schema FAQPage',
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
