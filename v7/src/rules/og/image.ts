import type { Rule } from '@/core/types'

export const ogImageRule: Rule = {
  id: 'og:image',
  name: 'Open Graph Image',
  enabled: true,
  async run(page) {
    const m = page.doc.querySelector('meta[property="og:image"], meta[name="og:image"]')
    if (!m) return { label: 'OG', message: 'Missing og:image', type: 'warn' }
    const c = (m.getAttribute('content') || '').trim()
    const abs = /^https?:\/\//i.test(c)
    return abs ? { label: 'OG', message: `og:image: ${c}`, type: 'info' } : { label: 'OG', message: 'og:image not absolute', type: 'warn' }
  },
}
