import type { Rule } from '@/core/types'
import { fetchTextOnce } from '@/shared/fetchOnce'

const SPEC = 'https://developers.google.com/search/docs/crawling-indexing/robots/robots_txt'
const TESTED = 'Fetched robots.txt for the origin and scanned for Sitemap directives.'

export const robotsSitemapReferenceRule: Rule = {
  id: 'robots:sitemap-reference',
  name: 'robots.txt Sitemap reference',
  enabled: true,
  what: 'http',
  async run(page) {
    let origin = ''
    try {
      const url = new URL(page.url)
      if (url.protocol !== 'http:' && url.protocol !== 'https:') {
        return {
          label: 'ROBOTS',
          message: `Skipped: ${url.protocol} URL`,
          type: 'info',
          name: 'robots.txt Sitemap reference',
          details: { tested: TESTED, reference: SPEC },
        }
      }
      origin = url.origin
    } catch {
      return {
        label: 'ROBOTS',
        message: 'Invalid URL',
        type: 'info',
        name: 'robotsSitemapReference',
        details: { tested: TESTED, reference: SPEC },
      }
    }
    const txt = await fetchTextOnce(`${origin}/robots.txt`)
    if (!txt)
      return {
        label: 'ROBOTS',
        message: 'robots.txt not reachable',
        type: 'info',
        name: 'robots.txt Sitemap reference',
        details: { tested: TESTED, reference: SPEC },
      }
    const has = /\n\s*sitemap\s*:\s*\S+/i.test(`\n${txt}`)
    return {
      label: 'ROBOTS',
      message: has ? 'Sitemap reference present' : 'No Sitemap reference',
      type: has ? 'ok' : 'warn',
      name: 'robots.txt Sitemap reference',
      details: { robotsTxt: txt, tested: TESTED, reference: SPEC },
    }
  },
}
