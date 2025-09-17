import type { Rule } from '@/core/types'
import { parseLd, findType, docs } from '@/shared/structured'

export const schemaEventRule: Rule = {
  id: 'schema:event',
  name: 'Schema Event',
  enabled: true,
  async run(page) {
    const n = findType(parseLd(page.doc), 'event')[0]
    if (!n) return { label: 'SCHEMA', message: 'No Event JSON‑LD', type: 'info' }
    const ok = !!n['name'] && !!n['startDate'] && !!n['location']
    return ok ? { label: 'SCHEMA', message: `Event OK · Docs: ${docs('event')}`, type: 'ok' } : { label: 'SCHEMA', message: `Event missing fields · Docs: ${docs('event')}`, type: 'warn' }
  },
}

