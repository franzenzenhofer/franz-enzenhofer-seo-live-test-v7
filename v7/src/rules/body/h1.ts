import type { Rule } from '@/core/types'

export const h1Rule: Rule = {
  id: 'body:h1',
  name: 'H1 Present',
  enabled: true,
  async run(page) {
    const n = page.doc.querySelectorAll('h1').length
    if (!n) return { label: 'BODY', message: 'No <h1> found', type: 'warn' }
    if (n > 1) return { label: 'BODY', message: 'Multiple <h1> found', type: 'warn' }
    return { label: 'BODY', message: '<h1> OK', type: 'ok' }
  },
}

