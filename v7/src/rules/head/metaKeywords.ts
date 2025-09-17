import type { Rule } from '@/core/types'

export const metaKeywordsRule: Rule = {
  id: 'head:meta-keywords',
  name: 'Meta Keywords',
  enabled: true,
  async run(page) {
    const m = page.doc.querySelector('meta[name="keywords"]')
    return m ? { label: 'HEAD', message: 'Meta keywords present (deprecated)', type: 'info' } : { label: 'HEAD', message: 'No meta keywords', type: 'ok' }
  },
}

