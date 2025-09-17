import type { Rule } from '@/core/types'

export const ldjsonRule: Rule = {
  id: 'dom:ldjson',
  name: 'LD+JSON presence',
  enabled: true,
  async run(page) {
    const n = page.doc.querySelectorAll('script[type="application/ld+json"]').length
    return n ? { label: 'DOM', message: `ld+json blocks: ${n}`, type: 'info' } : { label: 'DOM', message: 'No ld+json', type: 'info' }
  },
}

