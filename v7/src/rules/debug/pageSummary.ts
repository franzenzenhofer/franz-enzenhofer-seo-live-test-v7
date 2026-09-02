import type { Rule } from '@/core/types'
import { extractHtml, extractSnippet } from '@/shared/html-utils'
import { getDomPath } from '@/shared/dom-path'

export const pageSummaryRule: Rule = {
  id: 'debug:page-summary',
  name: 'Page summary (debug)',
  enabled: true,
  what: 'static',
  meta: {
    provenance: 'franz',
    references: [],
    description: 'Info-only one-line debug summary: title text, header count, resource count.',
  },
  async run(page) {
    const titleEl = page.doc.querySelector('title')
    const t = (titleEl?.textContent || '').trim()
    const l = (page.headers && Object.keys(page.headers).length) || 0
    const res = (page.resources || []).length
    const sourceHtml = extractHtml(titleEl)

    return {
      label: 'DEBUG',
      message: `Title: ${t} · headers: ${l} · resources: ${res}`,
      type: 'info',
      priority: 950,
      name: 'Page summary (debug)',
      details: {
        title: t,
        sourceHtml,
        snippet: extractSnippet(sourceHtml),
        domPath: getDomPath(titleEl),
        headers: page.headers,
        resourceCount: res,
      },
    }
  },
}
