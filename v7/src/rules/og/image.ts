import type { Rule } from '@/core/types'
import { extractHtml, extractSnippet, getDomPath } from '@/shared/html-utils'

export const ogImageRule: Rule = {
  id: 'og:image',
  name: 'Open Graph Image',
  enabled: true,
  async run(page) {
    const m = page.doc.querySelector('meta[property="og:image"], meta[name="og:image"]')
    if (!m) return { label: 'OG', message: 'Missing og:image', type: 'warn', name: 'ogImage' }
    const c = (m.getAttribute('content') || '').trim()
    const abs = /^https?:\/\//i.test(c)
    const sourceHtml = extractHtml(m)
    return abs
      ? { label: 'OG', message: `og:image: ${c}`, type: 'info', name: 'ogImage', details: { sourceHtml, snippet: extractSnippet(sourceHtml), domPath: getDomPath(m) } }
      : { label: 'OG', message: 'og:image not absolute', type: 'warn', name: 'ogImage', details: { sourceHtml, snippet: extractSnippet(sourceHtml), domPath: getDomPath(m) } }
  },
}
