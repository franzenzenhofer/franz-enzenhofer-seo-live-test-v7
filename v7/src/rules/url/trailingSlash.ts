import type { Rule } from '@/core/types'

const pathHasSlash = (p: string) => p.length > 1 && p.endsWith('/')

export const trailingSlashRule: Rule = {
  id: 'url:trailing-slash',
  name: 'URL trailing slash consistency',
  enabled: true,
  what: 'static',
  async run(page) {
    let p = '/'
    try {
      p = new URL(page.url).pathname
    } catch {
      /* ignore */
    }
    const canon = page.doc.querySelector('link[rel="canonical"]')?.getAttribute('href') || ''
    if (!canon) return { label: 'URL', message: 'No canonical to compare', type: 'info', name: 'trailingSlash' }
    try {
      const cp = new URL(canon, page.url).pathname
      const ok = pathHasSlash(p) === pathHasSlash(cp)
      return {
        label: 'URL',
        message: ok ? 'Trailing slash consistent' : 'Trailing slash inconsistency with canonical',
        type: ok ? 'ok' : 'warn',
        name: 'URL trailing slash consistency',
      }
    } catch {
      return { label: 'URL', message: 'Invalid canonical URL', type: 'warn', name: 'trailingSlash' }
    }
  },
}

