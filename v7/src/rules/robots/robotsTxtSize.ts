import type { Rule } from '@/core/types'
import { fetchTextOnce } from '@/shared/fetchOnce'
import { extractSnippet } from '@/shared/html-utils'

const LABEL = 'ROBOTS'
const NAME = 'robots.txt size'
const RULE_ID = 'robots:size'
const SPEC = 'https://developers.google.com/search/docs/crawling-indexing/robots/intro'
const MAX_BYTES = 512000
const BYTES_PER_KIB = 1024

const toKiB = (bytes: number) => Number((bytes / BYTES_PER_KIB).toFixed(1))

export const robotsTxtSizeRule: Rule = {
  id: RULE_ID,
  name: NAME,
  enabled: true,
  what: 'http',
  async run(page) {
    let origin = ''
    try {
      const url = new URL(page.url)
      if (url.protocol !== 'http:' && url.protocol !== 'https:') {
        return { label: LABEL, name: NAME, message: `Skipped: ${url.protocol} URL`, type: 'info', priority: 900, details: { protocol: url.protocol, reference: SPEC } }
      }
      origin = url.origin
    } catch {
      return { label: LABEL, name: NAME, message: 'Invalid URL. Cannot fetch robots.txt.', type: 'info', priority: 900, details: { reference: SPEC } }
    }

    const robotsTxtUrl = `${origin}/robots.txt`
    const robotsTxt = await fetchTextOnce(robotsTxtUrl)
    if (robotsTxt === null) {
      return { label: LABEL, name: NAME, message: 'robots.txt not reachable.', type: 'info', priority: 850, details: { robotsTxtUrl, reference: SPEC } }
    }

    const bytes = new TextEncoder().encode(robotsTxt).length
    const sizeKiB = toKiB(bytes)
    const limitKiB = toKiB(MAX_BYTES)
    const exceeds = bytes > MAX_BYTES
    const message = exceeds
      ? `robots.txt is ${sizeKiB} KiB (exceeds ${limitKiB} KiB limit).`
      : `robots.txt size ${sizeKiB} KiB within ${limitKiB} KiB limit.`

    return {
      label: LABEL,
      name: NAME,
      message,
      type: exceeds ? 'warn' : 'info',
      priority: exceeds ? 220 : 820,
      details: {
        bytes,
        sizeKiB,
        limitBytes: MAX_BYTES,
        limitKiB,
        robotsTxtUrl,
        snippet: extractSnippet(robotsTxt, 150),
        reference: SPEC,
      },
    }
  },
}
