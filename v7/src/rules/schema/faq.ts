import type { Rule } from '@/core/types'
import { parseLd, findType, docs } from '@/shared/structured'

export const schemaFaqRule: Rule = {
  id: 'schema:faq',
  name: 'Schema FAQPage',
  enabled: true,
  async run(page) {
    const n = findType(parseLd(page.doc), 'faqpage')[0]
    if (!n) return { label: 'SCHEMA', message: 'No FAQPage JSON‑LD', type: 'info' }
    const ents = (n['mainEntity'] as Array<Record<string, unknown>>) || []
    const ok = (ents || []).some((q) => q && String(q['@type']||'').toLowerCase().includes('question') && !!q['acceptedAnswer'])
    return ok ? { label: 'SCHEMA', message: `FAQPage OK · Docs: ${docs('faq')}`, type: 'ok' } : { label: 'SCHEMA', message: `FAQPage invalid (questions/answers) · Docs: ${docs('faq')}`, type: 'warn' }
  },
}
