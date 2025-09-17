import type { Rule } from '@/core/types'

export const pageSummaryRule: Rule = {
  id: 'debug:page-summary',
  name: 'Page summary (debug)',
  enabled: false,
  async run(page) {
    const t = (page.doc.querySelector('title')?.textContent || '').trim()
    const l = (page.headers && Object.keys(page.headers).length) || 0
    const res = (page.resources || []).length
    return { label: 'DEBUG', message: `Title: ${t} · headers: ${l} · resources: ${res}`, type: 'info' }
  },
}

