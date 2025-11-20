import type { Rule } from '@/core/types'

const LABEL = 'URL'
const NAME = 'URL trailing slash consistency'
const SPEC = 'https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls'
const TESTED = 'Compared the current pathname trailing slash against the canonical pathname to ensure deduplication consistency.'

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
    if (!canon)
      return {
        label: LABEL,
        message: 'No canonical to compare',
        type: 'info',
        name: NAME,
        details: { tested: TESTED, canonicalHref: null, pagePath: p, reference: SPEC },
      }
    try {
      const cp = new URL(canon, page.url).pathname
      const ok = pathHasSlash(p) === pathHasSlash(cp)
      return {
        label: LABEL,
        message: ok ? 'Trailing slash consistent' : 'Trailing slash inconsistency with canonical',
        type: ok ? 'ok' : 'warn',
        name: NAME,
        details: { tested: TESTED, canonicalHref: canon, pagePath: p, canonicalPath: cp, consistent: ok, reference: SPEC },
      }
    } catch {
      return {
        label: LABEL,
        message: 'Invalid canonical URL',
        type: 'warn',
        name: NAME,
        details: { tested: TESTED, canonicalHref: canon, pagePath: p, consistent: null, reference: SPEC },
      }
    }
  },
}
