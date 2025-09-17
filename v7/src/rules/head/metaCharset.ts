import type { Rule } from '@/core/types'

export const metaCharsetRule: Rule = {
  id: 'head:meta-charset',
  name: 'Meta charset',
  enabled: true,
  async run(page) {
    const m = page.doc.querySelector('meta[charset]')
    return m ? { label: 'HEAD', message: `charset=${m.getAttribute('charset') || ''}`, type: 'info' } : { label: 'HEAD', message: 'Missing meta[charset]', type: 'warn' }
  },
}

