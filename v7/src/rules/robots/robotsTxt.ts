import type { Rule } from '@/core/types'
import { fetchStatusTextOnce } from '@/shared/fetchOnce'
import { extractSnippet } from '@/shared/html-utils'

const LABEL = 'ROBOTS'
const NAME = 'robots.txt Exists'
const RULE_ID = 'robots-exists'

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

// Google treats all 4xx errors except 429 as if no robots.txt exists (allow-all);
// 429 and 5xx count as unreachable: crawling pauses and complete disallow may be assumed.
const isNoRobotsStatus = (status: number) => status >= 400 && status < 500 && status !== 429

export const robotsTxtRule: Rule = {
  id: RULE_ID,
  name: NAME,
  enabled: true,
  what: 'http',
  meta: {
    provenance: 'google',
    references: [
      'https://developers.google.com/search/docs/crawling-indexing/robots/robots_txt',
      'https://developers.google.com/search/docs/crawling-indexing/robots/intro',
      'https://www.rfc-editor.org/rfc/rfc9309.html#section-2.3.1',
    ],
    description: 'Fetches origin/robots.txt and branches on status class: 2xx exists (info), 4xx except 429 counts as no robots.txt - all crawling allowed (info), 429/5xx/network failure counts as unreachable - Googlebot pauses crawling and may assume complete disallow (warn).',
  },
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
        },
      }
    }
    // Six robots rules run concurrently against the same robots.txt; the shared
    // single-flight fetch collapses them onto one request per run.
    const response = await fetchStatusTextOnce(robotsTxtUrl)
    if (response === null) {
      return {
        label: LABEL,
        name: NAME,
        message: 'robots.txt unreachable (network error or timeout) - Googlebot pauses crawling and may assume complete disallow.',
        type: 'warn',
        priority: 350,
        details: {
          snippet: extractSnippet('(fetch failed)'),
          robotsTxtUrl,
        },
      }
    }
    const status = response.status
    if (!response.ok) {
      if (isNoRobotsStatus(status)) {
        return {
          label: LABEL,
          name: NAME,
          message: `No robots.txt (HTTP ${status}) - all crawling allowed.`,
          type: 'info',
          priority: 800,
          details: {
            snippet: extractSnippet(`HTTP ${status}`),
            robotsTxtUrl,
            status,
            robotsExists: false,
          },
        }
      }
      return {
        label: LABEL,
        name: NAME,
        message: `robots.txt unreachable (HTTP ${status}) - Googlebot pauses crawling and may assume complete disallow.`,
        type: 'warn',
        priority: 300,
        details: {
          snippet: extractSnippet(`HTTP ${status}`),
          robotsTxtUrl,
          status,
          robotsExists: false,
        },
      }
    }
    const robotsTxt = response.text
    return {
      label: LABEL,
      name: NAME,
      message: 'robots.txt exists.',
      type: 'info',
      priority: 800,
      details: {
        snippet: extractSnippet(robotsTxt, 150),
        robotsTxt,
        robotsTxtUrl,
        status,
        robotsExists: true,
      },
    }
  },
}
