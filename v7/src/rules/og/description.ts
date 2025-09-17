import type { Rule } from '@/core/types'

export const ogDescriptionRule: Rule = {
  id: 'og:description',
  name: 'Open Graph Description',
  enabled: true,
  async run(page) {
    const m = page.doc.querySelector('meta[property="og:description"], meta[name="og:description"]')
    if (!m) return { label: 'OG', message: 'Missing og:description', type: 'warn' }
    const c = m.getAttribute('content')?.trim() || ''
    if (!c) return { label: 'OG', message: 'Empty og:description', type: 'warn' }
    return { label: 'OG', message: `og:description: ${c}`, type: 'info' }
  },
}

