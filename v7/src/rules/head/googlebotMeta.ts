import type { Rule } from '@/core/types'

export const googlebotMetaRule: Rule = {
  id: 'head:meta-googlebot',
  name: 'Meta Googlebot',
  enabled: true,
  async run(page) {
    const m = page.doc.querySelector('meta[name="googlebot"]')
    return m ? { label: 'HEAD', message: `googlebot: ${m.getAttribute('content') || ''}`, type: 'info' } : { label: 'HEAD', message: 'No googlebot meta', type: 'info' }
  },
}

