import type { Rule } from '@/core/types'
import { parseLd, findType, docs } from '@/shared/structured'

export const schemaHowToRule: Rule = {
  id: 'schema:howto',
  name: 'Schema HowTo',
  enabled: true,
  async run(page) {
    const n = findType(parseLd(page.doc), 'howto')[0]
    if (!n) return { label: 'SCHEMA', message: 'No HowTo JSON‑LD', type: 'info' }
    const ok = !!n['name'] && Array.isArray(n['step'])
    return ok ? { label: 'SCHEMA', message: `HowTo OK · Docs: ${docs('howto')}`, type: 'ok' } : { label: 'SCHEMA', message: `HowTo missing name/step · Docs: ${docs('howto')}`, type: 'warn' }
  },
}

