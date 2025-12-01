import type { Rule } from '@/core/types'
import { extractSnippet } from '@/shared/html-utils'
import { hasHeaders, noHeadersResult } from '@/shared/http-utils'

const LABEL = 'HTTP'
const NAME = 'HTTP/2 Advertised (Alt-Svc)'
const RULE_ID = 'http:h2-advertised'
const SPEC = 'https://datatracker.ietf.org/doc/html/rfc7838'

export const http2AdvertisedRule: Rule = {
  id: RULE_ID,
  name: NAME,
  enabled: true,
  what: 'http',
  async run(page) {
    if (!hasHeaders(page.headers)) return noHeadersResult(LABEL, NAME)
    const altSvcHeader = page.headers?.['alt-svc']?.trim() || ''
    const altSvcLower = altSvcHeader.toLowerCase()
    const advertisesHttp2 = /\bh2\b|h2=/.test(altSvcLower)
    const message = advertisesHttp2
      ? `Alt-Svc advertises HTTP/2: ${altSvcHeader}`
      : altSvcHeader
        ? `Alt-Svc present but no HTTP/2: ${altSvcHeader}`
        : 'No Alt-Svc header. HTTP/2 not advertised.'
    return {
      label: LABEL,
      name: NAME,
      message,
      type: 'info',
      priority: advertisesHttp2 ? 750 : 850,
      details: {
        httpHeaders: page.headers || {},
        snippet: extractSnippet(altSvcHeader || '(not present)'),
        altSvcHeader,
        advertisesHttp2,
        reference: SPEC,
      },
    }
  },
}

