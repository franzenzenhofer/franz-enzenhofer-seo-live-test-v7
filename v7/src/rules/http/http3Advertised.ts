import type { Rule } from '@/core/types'
import { extractSnippet } from '@/shared/html-utils'
import { hasHeaders, noHeadersResult } from '@/shared/http-utils'

const LABEL = 'HTTP'
const NAME = 'HTTP/3 Advertised (Alt-Svc)'
const RULE_ID = 'http:h3-advertised'

export const http3AdvertisedRule: Rule = {
  id: RULE_ID,
  name: NAME,
  enabled: true,
  what: 'http',
  meta: {
    provenance: 'standard',
    references: [
      'https://www.rfc-editor.org/rfc/rfc9114.html#section-3.1.1',
      'https://www.rfc-editor.org/rfc/rfc7838.html#section-3',
    ],
    description: 'Reports (info-only) whether the Alt-Svc header advertises HTTP/3 via the h3 (or h3-draft) ALPN token.',
  },
  async run(page) {
    if (!hasHeaders(page.headers)) return noHeadersResult(LABEL, NAME)
    const altSvcHeader = page.headers?.['alt-svc']?.trim() || ''
    const altSvcLower = altSvcHeader.toLowerCase()
    const advertisesHttp3 = /\bh3\b|h3-/.test(altSvcLower)
    const message = advertisesHttp3
      ? `Alt-Svc advertises HTTP/3: ${altSvcHeader}`
      : altSvcHeader
        ? `Alt-Svc present but no HTTP/3: ${altSvcHeader}`
        : 'No Alt-Svc header. HTTP/3 not advertised.'
    return {
      label: LABEL,
      name: NAME,
      message,
      type: 'info',
      priority: advertisesHttp3 ? 750 : 850,
      details: {
        httpHeaders: page.headers || {},
        snippet: extractSnippet(altSvcHeader || '(not present)'),
        altSvcHeader,
        advertisesHttp3,
      },
    }
  },
}

