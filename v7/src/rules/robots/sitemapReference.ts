import type { Rule } from '@/core/types'
import { fetchTextOnce } from '@/shared/fetchOnce'

const LABEL = 'ROBOTS'
const NAME = 'robots.txt Sitemap reference'

const isAbsoluteHttpUrl = (value: string): boolean => {
  try {
    const u = new URL(value)
    return u.protocol === 'http:' || u.protocol === 'https:'
  } catch {
    return false
  }
}

const sitemapValuesOf = (txt: string): string[] => {
  const matches = txt.match(/^\s*sitemap\s*:\s*\S+.*$/gim) || []
  return matches
    .map((line) => line.replace(/^\s*sitemap\s*:\s*/i, '').trim())
    .filter(Boolean)
}

export const robotsSitemapReferenceRule: Rule = {
  id: 'robots:sitemap-reference',
  name: NAME,
  enabled: true,
  what: 'http',
  meta: {
    provenance: 'google',
    references: [
      'https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap',
      'https://developers.google.com/search/docs/crawling-indexing/robots/robots_txt',
    ],
    description: 'Lists Sitemap: URLs declared in robots.txt; ok when fully qualified URLs are declared, warn on relative or malformed values, info when none are declared (other submission methods exist).',
  },
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
          details: { protocol: url.protocol, origin: url.origin || '' },
        }
      }
      origin = url.origin
    } catch {
      return { label: LABEL, message: 'Invalid URL', type: 'info', priority: 900, name: NAME, details: { url: page.url } }
    }
    const txt = await fetchTextOnce(`${origin}/robots.txt`)
    if (!txt)
      return {
        label: LABEL,
        message: 'robots.txt not reachable',
        type: 'info',
        priority: 850,
        name: NAME,
        details: { origin, robotsTxt: '' },
      }
    const values = sitemapValuesOf(txt)
    if (!values.length) {
      // A robots.txt Sitemap line is only one of Google's documented submission
      // methods (Search Console report/API, robots.txt, WebSub) - absence is not a defect.
      return {
        label: LABEL,
        message: 'No Sitemap reference in robots.txt. Sitemaps may still be submitted via Search Console or its API.',
        type: 'info',
        priority: 820,
        name: NAME,
        details: { sitemapCount: 0, robotsTxt: txt },
      }
    }
    const urls = values.filter(isAbsoluteHttpUrl)
    const invalid = values.filter((v) => !isAbsoluteHttpUrl(v))
    if (invalid.length) {
      return {
        label: LABEL,
        message: `${invalid.length} invalid Sitemap value${invalid.length > 1 ? 's' : ''} in robots.txt (must be a fully qualified URL): ${invalid.join(', ')}`,
        type: 'warn',
        priority: 400,
        name: NAME,
        details: { sitemapCount: values.length, sitemapUrls: urls, invalidSitemapUrls: invalid, robotsTxt: txt },
      }
    }
    return {
      label: LABEL,
      message: `${urls.length} Sitemap${urls.length > 1 ? 's' : ''} referenced in robots.txt.`,
      type: 'ok',
      priority: 820,
      name: NAME,
      details: { sitemapCount: urls.length, sitemapUrls: urls, robotsTxt: txt },
    }
  },
}
