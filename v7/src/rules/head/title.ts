import type { Rule } from '@/core/types'

export const titleRule: Rule = {
  id: 'head-title',
  name: 'Title Present',
  enabled: true,
  run: async (page) => {
    const title = page.doc.querySelector('head > title')?.textContent?.trim() || ''
    const ok = title.length > 0
    return { label: 'HEAD', message: ok ? `SEO-<title>: ${title}` : 'No title-tag found in head.', type: ok ? 'ok' : 'error', what: 'static', priority: ok ? 1000 : 0 }
  },
}
