import type { Rule } from '@/core/types'
import { parseLd, findType, docs } from '@/shared/structured'

export const schemaVideoRule: Rule = {
  id: 'schema:video',
  name: 'Schema VideoObject',
  enabled: true,
  async run(page) {
    const n = findType(parseLd(page.doc), 'videoobject')[0]
    if (!n) return { label: 'SCHEMA', message: 'No VideoObject JSON‑LD', type: 'info' }
    const ok = !!n['name'] && !!n['description'] && !!n['thumbnailUrl'] && !!n['uploadDate']
    return ok ? { label: 'SCHEMA', message: `VideoObject OK · Docs: ${docs('video')}`, type: 'ok' } : { label: 'SCHEMA', message: `VideoObject missing fields · Docs: ${docs('video')}`, type: 'warn' }
  },
}

