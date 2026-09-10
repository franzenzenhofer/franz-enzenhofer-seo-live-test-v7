import { headerValue, advertisedProtocol } from '@/shared/headerValue'
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
    userGuide: {
      check: "Reports whether the server advertises HTTP/3 in Alt-Svc, an alternative-service response header. Advertisement does not establish which protocol this load actually used, and absence does not prove a lack of support.",
      action: "Use the negotiated-protocol result to see this load. If you intend to advertise HTTP/3, check the server or CDN configuration and verify that the advertised endpoint works.",
    },
    provenance: 'standard',
    references: [
      'https://www.rfc-editor.org/rfc/rfc9114.html#section-3.1.1',
      'https://www.rfc-editor.org/rfc/rfc7838.html#section-3',
    ],
    description: 'Reports (info-only) whether the Alt-Svc header advertises HTTP/3 via the h3 (or h3-draft) ALPN token.',
  },
  async run(page) {
    if (!hasHeaders(page.headers)) return noHeadersResult(LABEL, NAME)
    const altSvcHeader = headerValue(page.headers, 'alt-svc')
    const advertisesHttp3 = advertisedProtocol(altSvcHeader, 'h3')
    const message = advertisesHttp3
      ? 'The server advertises HTTP/3 as an alternative service.'
      : altSvcHeader
        ? 'Alt-Svc is present without an HTTP/3 advertisement.'
        : 'No Alt-Svc advertisement captured. HTTP/3 capability is undetermined; see the negotiated protocol.'
    return {
      label: LABEL,
      name: NAME,
      message,
      type: 'info',
      priority: advertisesHttp3 ? 750 : 850,
      details: {
        snippet: extractSnippet(altSvcHeader || '(not present)'),
        altSvcHeader,
        advertisesHttp3,
      },
    }
  },
}
