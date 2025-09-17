import type { Rule } from '@/core/types'

const hasDirective = (s: string, dir: string) => new RegExp(`\\b${dir.replace(/[-]/g,'[-]')}\\b`, 'i').test(s)

export const discoverMaxImagePreviewLargeRule: Rule = {
  id: 'discover:max-image-preview-large',
  name: 'Discover: max-image-preview:large',
  enabled: true,
  async run(page) {
    const meta = (page.doc.querySelector('meta[name="robots"]')?.getAttribute('content') || '').toLowerCase()
    const xr = (page.headers?.['x-robots-tag'] || '').toLowerCase()
    const ok = hasDirective(meta, 'max-image-preview:large') || hasDirective(xr, 'max-image-preview:large')
    return ok ? { label: 'DISCOVER', message: 'max-image-preview:large present', type: 'ok' } : { label: 'DISCOVER', message: 'Consider max-image-preview:large', type: 'warn' }
  },
}

