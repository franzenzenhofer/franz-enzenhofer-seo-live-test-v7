import type { Rule } from '@/core/types'
import { parseLd, findType, docs } from '@/shared/structured'

export const schemaOrganizationRule: Rule = {
  id: 'schema:organization',
  name: 'Schema Organization/LocalBusiness',
  enabled: true,
  async run(page) {
    const nodes = parseLd(page.doc)
    const n = findType(nodes, 'organization')[0] || findType(nodes, 'localbusiness')[0]
    if (!n) return { label: 'SCHEMA', message: 'No Organization/LocalBusiness JSON‑LD', type: 'info' }
    const ok = !!n['name'] && (!!n['logo'] || !!n['image']) && !!n['url']
    const link = n['@type'] && String(n['@type']).toLowerCase().includes('localbusiness') ? docs('localbusiness') : docs('organization')
    return ok ? { label: 'SCHEMA', message: `Org OK · Docs: ${link}`, type: 'ok' } : { label: 'SCHEMA', message: `Org missing fields · Docs: ${link}`, type: 'warn' }
  },
}

