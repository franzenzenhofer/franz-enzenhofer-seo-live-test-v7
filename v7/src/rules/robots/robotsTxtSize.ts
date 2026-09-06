import type { Rule } from '@/core/types'
import { fetchStatusTextOnce } from '@/shared/fetchOnce'
import { extractSnippet } from '@/shared/html-utils'

const LABEL = 'ROBOTS'
const NAME = 'robots.txt size'
const RULE_ID = 'robots:size'
const MAX_BYTES = 512000
const BYTES_PER_KIB = 1024

const toKiB = (bytes: number) => Number((bytes / BYTES_PER_KIB).toFixed(1))

export const robotsTxtSizeRule: Rule = {
  id: RULE_ID,
  name: NAME,
  enabled: true,
  what: 'http',
  meta: {
    provenance: 'google',
    references: [
      'https://developers.google.com/search/docs/crawling-indexing/robots/robots_txt',
      'https://www.rfc-editor.org/rfc/rfc9309.html#section-2.5',
    ],
    description: 'Measures robots.txt byte size and warns when it reaches the 512000 byte (500 KiB) limit Google reads; content past the limit is ignored by Google and not fetched here.',
  },
  async run(page, ctx) {
    let origin = ''
    try {
      const url = new URL(page.url)
      if (url.protocol !== 'http:' && url.protocol !== 'https:') {
        return { label: LABEL, name: NAME, message: `Skipped: ${url.protocol} URL`, type: 'info', priority: 900, details: { protocol: url.protocol } }
      }
      origin = url.origin
    } catch {
      return { label: LABEL, name: NAME, message: 'Invalid URL. Cannot fetch robots.txt.', type: 'info', priority: 900, details: {} }
    }

    const robotsTxtUrl = `${origin}/robots.txt`
    const fetched = await fetchStatusTextOnce(robotsTxtUrl, 1500, ctx.signal)
    if (!fetched?.ok) {
      return { label: LABEL, name: NAME, message: 'robots.txt not reachable.', type: 'info', priority: 850, details: { robotsTxtUrl, status: fetched?.status } }
    }

    // The shared probe stops at exactly the limit Google reads, so an oversize
    // file is known to be "at least" that big - its real size is not measured.
    const bytes = fetched.bytes
    const exceeds = fetched.truncated
    const sizeKiB = toKiB(bytes)
    const limitKiB = toKiB(MAX_BYTES)
    const message = exceeds
      ? `robots.txt is larger than the ${limitKiB} KiB limit; Google ignores everything after the first ${limitKiB} KiB.`
      : `robots.txt size ${sizeKiB} KiB within ${limitKiB} KiB limit.`

    return {
      label: LABEL,
      name: NAME,
      message,
      type: exceeds ? 'warn' : 'info',
      priority: exceeds ? 220 : 820,
      details: {
        bytes,
        bytesRead: bytes,
        truncatedAtLimit: exceeds,
        sizeKiB,
        limitBytes: MAX_BYTES,
        limitKiB,
        robotsTxtUrl,
        snippet: extractSnippet(fetched.text, 150),
      },
    }
  },
}
