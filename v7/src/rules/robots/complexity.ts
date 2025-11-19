import type { Rule } from '@/core/types'
import { fetchTextOnce } from '@/shared/fetchOnce'
import { extractSnippet } from '@/shared/html-utils'

const LABEL = 'ROBOTS'
const NAME = 'robots.txt Complexity'
const RULE_ID = 'robots:complexity'
const SPEC = 'https://developers.google.com/search/docs/crawling-indexing/robots/intro'

export const robotsComplexityRule: Rule = {
  id: RULE_ID,
  name: NAME,
  enabled: true,
  what: 'http',
  async run(page) {
    let origin = ''
    try {
      origin = new URL(page.url).origin
    } catch {
      return {
        label: LABEL,
        name: NAME,
        message: 'Invalid URL. Cannot fetch robots.txt.',
        type: 'info',
        priority: 900,
        details: { reference: SPEC },
      }
    }
    const robotsTxt = await fetchTextOnce(`${origin}/robots.txt`)
    if (!robotsTxt) {
      return {
        label: LABEL,
        name: NAME,
        message: 'robots.txt not reachable.',
        type: 'info',
        priority: 850,
        details: {
          snippet: extractSnippet('(not reachable)'),
          reference: SPEC,
        },
      }
    }
    const lines = robotsTxt.split(/\r?\n/)
    const disallowCount = lines.filter((l) => /^\s*disallow\s*:/i.test(l)).length
    const allowCount = lines.filter((l) => /^\s*allow\s*:/i.test(l)).length
    const sitemapCount = lines.filter((l) => /^\s*sitemap\s*:/i.test(l)).length
    const totalRules = disallowCount + allowCount
    const message = `robots.txt: ${disallowCount} Disallow, ${allowCount} Allow, ${sitemapCount} Sitemap${sitemapCount !== 1 ? 's' : ''} (${totalRules} total rules)`
    return {
      label: LABEL,
      name: NAME,
      message,
      type: 'info',
      priority: 800,
      details: {
        snippet: extractSnippet(robotsTxt, 150),
        robotsTxt,
        disallowCount,
        allowCount,
        sitemapCount,
        totalRules,
        reference: SPEC,
      },
    }
  },
}

