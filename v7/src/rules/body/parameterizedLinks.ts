import type { Rule } from '@/core/types'

export const parameterizedLinksRule: Rule = {
  id: 'body:parameterized-links',
  name: 'Links with query params',
  enabled: true,
  async run(page) {
    const a = Array.from(page.doc.querySelectorAll('a[href]')) as HTMLAnchorElement[]
    let n = 0
    for (const x of a) if ((x.getAttribute('href') || '').includes('?')) n++
    return { label: 'BODY', message: `Links with parameters: ${n}`, type: 'info' }
  },
}

