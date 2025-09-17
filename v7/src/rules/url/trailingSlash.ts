import type { Rule } from '@/core/types'

const pathHasSlash = (p: string) => p.length > 1 && p.endsWith('/')

export const trailingSlashRule: Rule = {
  id: 'url:trailing-slash',
  name: 'URL trailing slash consistency',
  enabled: true,
  async run(page) {
    let p = '/'
    try { p = new URL(page.url).pathname } catch {/* ignore */}
    const canon = page.doc.querySelector('link[rel="canonical"]')?.getAttribute('href') || ''
    if (!canon) return { label: 'URL', message: 'No canonical to compare', type: 'info' }
    try {
      const cp = new URL(canon, page.url).pathname
      const ok = pathHasSlash(p) === pathHasSlash(cp)
      return ok ? { label: 'URL', message: 'Trailing slash consistent', type: 'ok' } : { label: 'URL', message: 'Trailing slash inconsistency with canonical', type: 'warn' }
    } catch { return { label: 'URL', message: 'Invalid canonical URL', type: 'warn' } }
  },
}

