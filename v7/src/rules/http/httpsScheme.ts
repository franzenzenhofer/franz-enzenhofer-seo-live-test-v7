import type { Rule } from '@/core/types'
import { extractSnippet } from '@/shared/html-utils'
import { hasHeaders, noHeadersResult } from '@/shared/http-utils'

const LABEL = 'HTTP'
const NAME = 'HTTPS Scheme'
const RULE_ID = 'http:https-scheme'
const SPEC = 'https://developers.google.com/search/docs/crawling-indexing/https'

export const httpsSchemeRule: Rule = {
  id: RULE_ID,
  name: NAME,
  enabled: true,
  what: 'http',
  async run(page) {
    if (!hasHeaders(page.headers)) return noHeadersResult(LABEL, NAME)
    let protocol = ''
    let isHttps = false
    try {
      protocol = new URL(page.url).protocol
      isHttps = protocol === 'https:'
    } catch {
      protocol = 'invalid-url'
      isHttps = false
    }
    const message = isHttps
      ? `HTTPS in use: ${page.url}`
      : `Not using HTTPS (${protocol}): ${page.url}`
    return {
      label: LABEL,
      name: NAME,
      message,
      type: isHttps ? 'ok' : 'warn',
      priority: isHttps ? 800 : 100,
      details: {
        httpHeaders: page.headers || {},
        snippet: extractSnippet(page.url),
        url: page.url,
        protocol,
        isHttps,
        reference: SPEC,
      },
    }
  },
}
