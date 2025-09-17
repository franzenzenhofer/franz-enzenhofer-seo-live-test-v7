import type { Rule } from '@/core/types'

export const metaViewportRule: Rule = {
  id: 'head:meta-viewport',
  name: 'Meta Viewport',
  enabled: true,
  async run(page) {
    const m = page.doc.querySelector('meta[name="viewport"]')
    if (!m) return { label: 'HEAD', message: 'Missing meta viewport', type: 'warn' }
    const c = (m.getAttribute('content') || '').toLowerCase()
    const ok = c.includes('width=device-width') && (c.includes('initial-scale=1') || c.includes('initial-scale=1.0'))
    return ok ? { label: 'HEAD', message: 'Viewport OK', type: 'ok' } : { label: 'HEAD', message: 'Viewport content may be suboptimal', type: 'warn' }
  },
}

