import type { Rule } from '@/core/types'

export const discoverHeadlineLengthRule: Rule = {
  id: 'discover:headline-length',
  name: 'Discover: Headline length',
  enabled: true,
  async run(page) {
    const h = (page.doc.querySelector('h1')?.textContent || '').trim()
    const n = h.length
    if (!n) return { label: 'DISCOVER', message: 'No H1 headline', type: 'warn' }
    return n >= 20 ? { label: 'DISCOVER', message: `Headline length OK (${n})`, type: 'ok' } : { label: 'DISCOVER', message: 'Headline may be too short', type: 'info' }
  },
}

