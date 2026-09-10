import { headerValue, advertisedProtocol } from '@/shared/headerValue'
import type { Rule } from '@/core/types'
import { extractSnippet } from '@/shared/html-utils'
import { hasHeaders, noHeadersResult } from '@/shared/http-utils'

const LABEL = 'HTTP'
const NAME = 'HTTP/2 Advertised (Alt-Svc)'
const RULE_ID = 'http:h2-advertised'

export const http2AdvertisedRule: Rule = {
  id: RULE_ID,
  name: NAME,
  enabled: true,
  what: 'http',
  meta: {
    userGuide: {
      check: "Reports whether the server advertises HTTP/2 in Alt-Svc, an alternative-service response header. Advertisement does not establish which protocol this load actually used, and absence does not prove a lack of support.",
      action: "Use the negotiated-protocol result to see this load. If you intend to advertise HTTP/2, check the server or CDN configuration and verify that the advertised endpoint works.",
    },
    provenance: 'standard',
    references: [
      'https://www.rfc-editor.org/rfc/rfc7838.html#section-3',
      'https://httpwg.org/specs/rfc9110.html#field.vary',
    ],
    description: 'Reports (info-only) whether the Alt-Svc header advertises an h2 alternative service.',
  },
  async run(page) {
    if (!hasHeaders(page.headers)) return noHeadersResult(LABEL, NAME)
    const altSvcHeader = headerValue(page.headers, 'alt-svc')
    const advertisesHttp2 = advertisedProtocol(altSvcHeader, 'h2')
    const message = advertisesHttp2
      ? 'The server advertises HTTP/2 as an alternative service.'
      : altSvcHeader
        ? 'Alt-Svc is present without an HTTP/2 advertisement.'
        : 'No Alt-Svc advertisement captured. This does not determine HTTP/2 support; see the negotiated protocol.'
    return {
      label: LABEL,
      name: NAME,
      message,
      type: 'info',
      priority: advertisesHttp2 ? 750 : 850,
      details: {
        snippet: extractSnippet(altSvcHeader || '(not present)'),
        altSvcHeader,
        advertisesHttp2,
      },
    }
  },
}
