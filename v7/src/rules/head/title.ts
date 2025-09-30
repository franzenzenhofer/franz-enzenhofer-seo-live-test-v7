import type { Rule } from '@/core/types'
import { extractHtml, extractSnippet, getDomPath } from '@/shared/html-utils'

export const titleRule: Rule = {
  id: 'head-title',
  name: 'Title Present',
  enabled: true,
  run: async (page) => {
    const titleEl = page.doc.querySelector('head > title')
    const title = titleEl?.textContent?.trim() || ''
    const ok = title.length > 0

    const sourceHtml = extractHtml(titleEl)
    const snippet = extractSnippet(sourceHtml)
    const domPath = getDomPath(titleEl)

    return {
      label: 'HEAD',
      message: ok ? `SEO-<title>: ${title}` : 'No title-tag found in head.',
      type: ok ? 'ok' : 'error',
      what: 'static',
      priority: ok ? 1000 : 0,
      name: 'title',
      details: {
        sourceHtml,
        snippet,
        domPath,
      },
    }
  },
}
