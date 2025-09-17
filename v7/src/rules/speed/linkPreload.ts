import type { Rule } from '@/core/types'

export const linkPreloadRule: Rule = {
  id: 'speed:link-preload',
  name: 'rel=preload links',
  enabled: true,
  async run(page) {
    const n = page.doc.querySelectorAll('link[rel="preload"]').length
    return n ? { label: 'SPEED', message: `preload links: ${n}`, type: 'info' } : { label: 'SPEED', message: 'No preload links', type: 'info' }
  },
}

