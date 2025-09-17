import type { Rule } from '@/core/types'

export const commonMobileSetupRule: Rule = {
  id: 'http:common-mobile-setup',
  name: 'Common mobile setup',
  enabled: true,
  async run(page) {
    const viewport = !!page.doc.querySelector('meta[name="viewport"]')
    const touch = !!page.doc.querySelector('link[rel~="apple-touch-icon"]')
    const ok = viewport
    return ok ? { label: 'HEAD', message: `Viewport present${touch ? ', apple-touch-icon present' : ''}`, type: 'info' } : { label: 'HEAD', message: 'Missing meta viewport', type: 'warn' }
  },
}

