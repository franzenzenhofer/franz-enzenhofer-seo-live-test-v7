import type { Rule } from '@/core/types'
import { extractSnippet } from '@/shared/html-utils'

const LABEL = 'ROBOTS'
const NAME = 'robots.txt Exists'
const RULE_ID = 'robots-exists'
const SPEC = 'https://developers.google.com/search/docs/crawling-indexing/robots/intro'

const getRobotsTxtUrl = (pageUrl: string): string => {
  try {
    const parsed = new URL(pageUrl)
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      console.error(`[robotsTxt] Invalid protocol blocked: ${parsed.protocol} from ${pageUrl}`)
      return ''
    }
    return `${parsed.origin}/robots.txt`
  } catch (e) {
    console.error(`[robotsTxt] Invalid URL: ${pageUrl}`, e)
    return ''
  }
}

export const robotsTxtRule: Rule = {
  id: RULE_ID,
  name: NAME,
  enabled: true,
  what: 'http',
  run: async (page) => {
    const robotsTxtUrl = getRobotsTxtUrl(page.url)
    if (!robotsTxtUrl) {
      return {
        label: LABEL,
        name: NAME,
        message: 'Invalid or unsupported URL. Cannot fetch robots.txt.',
        type: 'info',
        priority: 900,
        details: {
          snippet: extractSnippet('(invalid URL)'),
          reference: SPEC,
        },
      }
    }
    try {
      const response = await fetch(robotsTxtUrl, { method: 'GET' })
      const status = response.status
      const robotsExists = response.ok
      if (!robotsExists) {
        return {
          label: LABEL,
          name: NAME,
          message: `robots.txt not reachable (HTTP ${status})`,
          type: 'warn',
          priority: 300,
          details: {
            snippet: extractSnippet(`HTTP ${status}`),
            robotsTxtUrl,
            status,
            robotsExists: false,
            reference: SPEC,
          },
        }
      }
      const robotsTxt = await response.text()
      const hasSitemap = /\n\s*sitemap\s*:/i.test(`\n${robotsTxt}`)
      const sitemapCount = (robotsTxt.match(/\n\s*sitemap\s*:/gi) || []).length
      const message = hasSitemap
        ? `robots.txt exists with ${sitemapCount} Sitemap${sitemapCount > 1 ? 's' : ''}.`
        : 'robots.txt exists (no Sitemaps declared).'
      return {
        label: LABEL,
        name: NAME,
        message,
        type: 'info',
        priority: 800,
        details: {
          snippet: extractSnippet(robotsTxt, 150),
          robotsTxt,
          robotsTxtUrl,
          status,
          robotsExists: true,
          hasSitemap,
          sitemapCount,
          reference: SPEC,
        },
      }
    } catch (e) {
      return {
        label: LABEL,
        name: NAME,
        message: `robots.txt fetch failed: ${String(e)}`,
        type: 'warn',
        priority: 350,
        details: {
          snippet: extractSnippet(String(e)),
          robotsTxtUrl,
          error: String(e),
          reference: SPEC,
        },
      }
    }
  },
}
