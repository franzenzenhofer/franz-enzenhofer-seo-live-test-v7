import type { Rule } from '@/core/types'
import { extractHtml, extractSnippet } from '@/shared/html-utils'
import { getDomPath } from '@/shared/dom-path'

const SPEC = 'https://html.spec.whatwg.org/multipage/semantics.html#the-title-element'

export const pageSummaryRule: Rule = {
  id: 'debug:page-summary',
  name: 'Page summary (debug)',
  enabled: true,
  what: 'static',
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
      name: 'Page summary (debug)',
      details: {
        sourceHtml,
        snippet: extractSnippet(sourceHtml),
        domPath: getDomPath(titleEl),
        headers: page.headers,
        resourceCount: res,
        reference: SPEC,
      },
    }
  },
}
