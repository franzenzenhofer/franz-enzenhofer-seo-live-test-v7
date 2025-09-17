import type { Rule } from '@/core/types'

export const ogUrlRule: Rule = {
  id: 'og:url',
  name: 'Open Graph URL',
  enabled: true,
  async run(page) {
    const m = page.doc.querySelector('meta[property="og:url"], meta[name="og:url"]')
    if (!m) return { label: 'OG', message: 'Missing og:url', type: 'warn' }
    const c = m.getAttribute('content')?.trim() || ''
    return c ? { label: 'OG', message: `og:url: ${c}`, type: 'info' } : { label: 'OG', message: 'Empty og:url', type: 'warn' }
  },
}

