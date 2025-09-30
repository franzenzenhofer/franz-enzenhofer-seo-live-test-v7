import type { Rule } from '@/core/types'
import { parseLd, findType, docs } from '@/shared/structured'
import { extractHtml, extractSnippet, getDomPath } from '@/shared/html-utils'

export const schemaOrganizationRule: Rule = {
  id: 'schema:organization',
  name: 'Schema Organization/LocalBusiness',
  enabled: true,
  async run(page) {
    const scripts = page.doc.querySelectorAll('script[type="application/ld+json"]')
    const nodes = parseLd(page.doc)
    const n = findType(nodes, 'organization')[0] || findType(nodes, 'localbusiness')[0]
    if (!n)
      return { label: 'SCHEMA', message: 'No Organization/LocalBusiness JSON‑LD', type: 'info', name: 'schemaOrganization' }
    const ok = !!n['name'] && (!!n['logo'] || !!n['image']) && !!n['url']
    const link =
      n['@type'] && String(n['@type']).toLowerCase().includes('localbusiness') ? docs('localbusiness') : docs('organization')
    const script =
      Array.from(scripts).find((s) => s.textContent?.includes('Organization') || s.textContent?.includes('LocalBusiness')) || null
    const sourceHtml = extractHtml(script)
    return {
      label: 'SCHEMA',
      message: ok ? `Org OK · Docs: ${link}` : `Org missing fields · Docs: ${link}`,
      type: ok ? 'ok' : 'warn',
      name: 'schemaOrganization',
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

