import type { Rule } from '@/core/types'
import { extractHtml, extractSnippet, getDomPath } from '@/shared/html-utils'

export const ogDescriptionRule: Rule = {
  id: 'og:description',
  name: 'Open Graph Description',
  enabled: true,
  what: 'static',
  async run(page) {
    const m = page.doc.querySelector('meta[property="og:description"], meta[name="og:description"]')
    if (!m) return { label: 'OG', message: 'Missing og:description', type: 'warn', name: 'ogDescription' }
    const c = m.getAttribute('content')?.trim() || ''
    if (!c) return { label: 'OG', message: 'Empty og:description', type: 'warn', name: 'ogDescription' }
    const sourceHtml = extractHtml(m)
    return {
      label: 'OG',
      message: `og:description present (${c.length} chars)`,
      type: 'info',
      name: 'ogDescription',
      details: { sourceHtml, snippet: extractSnippet(sourceHtml), domPath: getDomPath(m), ogDescription: c },
    }
  },
}

