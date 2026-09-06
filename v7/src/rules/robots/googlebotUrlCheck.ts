import parse from '@/vendor/robots'
import type { Rule } from '@/core/types'
import { fetchStatusTextOnce } from '@/shared/fetchOnce'
import { robotsPolicyState } from '@/shared/robotsPolicy'

const LABEL = 'ROBOTS'
const NAME = 'Googlebot URL allowed'
const USER_AGENT = 'Googlebot'

export const googlebotUrlCheckRule: Rule = {
  id: 'robots:googlebot-url-check',
  name: NAME,
  enabled: true,
  what: 'http',
  meta: {
    provenance: 'google',
    references: [
      'https://developers.google.com/search/docs/crawling-indexing/robots/robots_txt',
      'https://www.rfc-editor.org/rfc/rfc9309.html#section-2.2.1',
    ],
    description: 'Parses robots.txt and reports whether Googlebot may crawl the current URL (ok when allowed, error when disallowed).',
  },
  async run(page, ctx) {
    let origin = ''
    try {
      origin = new URL(page.url).origin
    } catch {
      return { label: LABEL, message: 'Invalid URL', type: 'info', priority: 900, name: NAME, details: { url: page.url } }
    }
    const response = await fetchStatusTextOnce(`${origin}/robots.txt`, 1500, ctx.signal)
    const state = robotsPolicyState(response)
    if (state === 'unknown')
      return {
        label: LABEL,
        message: 'robots.txt unavailable; current crawl permission cannot be determined.',
        type: 'info',
        priority: 850,
        name: NAME,
        details: { origin, robotsTxt: '' },
      }
    const txt = state === 'allow' ? '' : response?.text || ''
    const res = parse(txt, page.url, USER_AGENT) as Record<string, unknown>
    const allowed = Boolean(res['allowed'])
    return {
      label: LABEL,
      message: allowed
        ? `${USER_AGENT} is allowed to crawl this URL.`
        : `${USER_AGENT} is disallowed from crawling this URL by robots.txt.`,
      type: allowed ? 'ok' : 'error',
      priority: allowed ? 800 : 60,
      name: NAME,
      details: { url: page.url, userAgent: USER_AGENT, allowed, robotsTxt: txt, status: response?.status,
        agents: Object.fromEntries(['Googlebot', 'Googlebot-News', 'Googlebot-Image'].map((agent) => [agent, parse(txt, page.url, agent).allowed])) },
    }
  },
}
