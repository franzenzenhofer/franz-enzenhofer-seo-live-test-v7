import type { Rule } from '@/core/types'
import { parseLd, findType, docs } from '@/shared/structured'

export const schemaJobPostingRule: Rule = {
  id: 'schema:jobposting',
  name: 'Schema JobPosting',
  enabled: true,
  async run(page) {
    const n = findType(parseLd(page.doc), 'jobposting')[0]
    if (!n) return { label: 'SCHEMA', message: 'No JobPosting JSON‑LD', type: 'info' }
    const ok = !!n['title'] && !!n['datePosted'] && !!(n as Record<string, unknown>)['hiringOrganization']
    return ok ? { label: 'SCHEMA', message: `JobPosting OK · Docs: ${docs('jobposting')}`, type: 'ok' } : { label: 'SCHEMA', message: `JobPosting missing fields · Docs: ${docs('jobposting')}`, type: 'warn' }
  },
}
