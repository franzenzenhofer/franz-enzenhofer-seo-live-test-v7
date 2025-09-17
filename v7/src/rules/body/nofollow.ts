import type { Rule } from '@/core/types'

export const nofollowRule: Rule = {
  id: 'body:nofollow',
  name: 'Nofollow Links',
  enabled: true,
  async run(page) {
    const a = Array.from(page.doc.querySelectorAll('a[rel~="nofollow"]'))
    const n = a.length
    return n ? { label: 'BODY', message: `${n} nofollow links`, type: 'info' } : { label: 'BODY', message: 'No rel=nofollow links', type: 'ok' }
  },
}
