import type { Rule } from '@/core/types'

export const discoverOgImageLargeRule: Rule = {
  id: 'discover:og-image-large',
  name: 'Discover: Large OG image (metadata)',
  enabled: true,
  async run(page) {
    const w = parseInt((page.doc.querySelector('meta[property="og:image:width"]')?.getAttribute('content') || '').trim(), 10)
    const h = parseInt((page.doc.querySelector('meta[property="og:image:height"]')?.getAttribute('content') || '').trim(), 10)
    const has = !!page.doc.querySelector('meta[property="og:image"]')
    if (!has) return { label: 'DISCOVER', message: 'Missing og:image', type: 'warn' }
    const ok = (w >= 1200) || (h >= 1200)
    return ok ? { label: 'DISCOVER', message: 'OG image metadata suggests large image', type: 'ok' } : { label: 'DISCOVER', message: 'Consider large OG image (>=1200px)', type: 'info' }
  },
}

