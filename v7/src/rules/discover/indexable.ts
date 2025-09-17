import type { Rule } from '@/core/types'

const hasNoindex = (doc: Document, headers?: Record<string,string>) => {
  const robots = (doc.querySelector('meta[name="robots"]')?.getAttribute('content') || '').toLowerCase()
  const xr = (headers?.['x-robots-tag'] || '').toLowerCase()
  return /\bnoindex\b/.test(robots) || /\bnoindex\b/.test(xr)
}

export const discoverIndexableRule: Rule = {
  id: 'discover:indexable',
  name: 'Discover: Indexable',
  enabled: true,
  async run(page) {
    return hasNoindex(page.doc, page.headers)
      ? { label: 'DISCOVER', message: 'Noindex detected', type: 'warn' }
      : { label: 'DISCOVER', message: 'Indexable', type: 'ok' }
  },
}

