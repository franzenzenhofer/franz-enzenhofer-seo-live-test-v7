import type { Rule } from '@/core/types'
import { fetchTextOnce } from '@/shared/fetchOnce'

const LABEL = 'ROBOTS'
const NAME = 'robots.txt Sitemap reference'
const SPEC = 'https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap'

const sitemapUrlsOf = (txt: string): { urls: string[]; total: number } => {
  const matches = txt.match(/^\s*sitemap\s*:\s*\S+.*$/gim) || []
  const urls = matches
    .map((line) => line.replace(/^\s*sitemap\s*:\s*/i, '').trim())
    .filter(Boolean)
  return { urls, total: urls.length }
}

export const robotsSitemapReferenceRule: Rule = {
  id: 'robots:sitemap-reference',
  name: NAME,
  enabled: true,
  what: 'http',
  async run(page) {
    let origin = ''
    try {
      const url = new URL(page.url)
      if (url.protocol !== 'http:' && url.protocol !== 'https:') {
        return {
          label: LABEL,
          message: `Skipped: ${url.protocol} URL`,
          type: 'info',
          priority: 900,
          name: NAME,
          details: { protocol: url.protocol, origin: url.origin || '', reference: SPEC },
        }
      }
      origin = url.origin
    } catch {
      return { label: LABEL, message: 'Invalid URL', type: 'info', priority: 900, name: NAME, details: { url: page.url, reference: SPEC } }
    }
    const txt = await fetchTextOnce(`${origin}/robots.txt`)
    if (!txt)
      return {
        label: LABEL,
        message: 'robots.txt not reachable',
        type: 'info',
        priority: 850,
        name: NAME,
        details: { origin, robotsTxt: '', reference: SPEC },
      }
    const { urls, total } = sitemapUrlsOf(txt)
    if (!total) {
      return {
        label: LABEL,
        message: 'No Sitemap reference in robots.txt.',
        type: 'warn',
        priority: 400,
        name: NAME,
        details: { sitemapCount: 0, robotsTxt: txt, reference: SPEC },
      }
    }
    return {
      label: LABEL,
      message: `${total} Sitemap${total > 1 ? 's' : ''} referenced in robots.txt.`,
      type: 'ok',
      priority: 820,
      name: NAME,
      details: { sitemapCount: total, sitemapUrls: urls, robotsTxt: txt, reference: SPEC },
    }
  },
}
