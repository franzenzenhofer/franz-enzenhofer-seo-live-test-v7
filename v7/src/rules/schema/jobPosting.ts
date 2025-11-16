import type { Rule } from '@/core/types'
import { parseLd, findType, docs } from '@/shared/structured'
import { extractHtml, extractSnippet, getDomPath } from '@/shared/html-utils'

export const schemaJobPostingRule: Rule = {
  id: 'schema:jobposting',
  name: 'Schema JobPosting',
  enabled: true,
  what: 'static',
  async run(page) {
    const scripts = page.doc.querySelectorAll('script[type="application/ld+json"]')
    const n = findType(parseLd(page.doc), 'jobposting')[0]
    if (!n) return { label: 'SCHEMA', message: 'No JobPosting JSON‑LD', type: 'info', name: 'Schema JobPosting' }
    const ok = !!n['title'] && !!n['datePosted'] && !!(n as Record<string, unknown>)['hiringOrganization']
    const script = Array.from(scripts).find((s) => s.textContent?.includes('JobPosting')) || null
    const sourceHtml = extractHtml(script)
    return {
      label: 'SCHEMA',
      message: ok ? `JobPosting OK · Docs: ${docs('jobposting')}` : `JobPosting missing fields · Docs: ${docs('jobposting')}`,
      type: ok ? 'ok' : 'warn',
      name: 'Schema JobPosting',
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
