import { headersNotCapturedResult } from '@/rules/http/headersNotCaptured'
import { HEADER_NO_MARKUP, headerEvidence, headerRow } from '@/rules/http/observedHeader'
import { advertisedProtocol, headerValue } from '@/shared/headerValue'
import { hasHeaders } from '@/shared/http-utils'
import { textField } from '@/shared/presentation/create'
import { presentResult } from '@/shared/presentation/result'
import type { Rule } from '@/core/types'

export const http2AdvertisedRule: Rule = {
  id: 'http:h2-advertised', name: 'HTTP/2 Advertised (Alt-Svc)', presentation: 1, enabled: true, what: 'http',
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
    if (!hasHeaders(page.headers)) return headersNotCapturedResult(http2AdvertisedRule, page, 'Alt-Svc')
    const altSvcHeader = headerValue(page.headers, 'alt-svc')
    const advertisesHttp2 = advertisedProtocol(altSvcHeader, 'h2')
    return presentResult(http2AdvertisedRule, page, {
      input: 'HTTP response headers', type: 'info', priority: advertisesHttp2 ? 750 : 850,
      values: [headerRow('Alt-Svc', altSvcHeader),
        ...(altSvcHeader ? [textField('HTTP/2 token', advertisesHttp2 ? 'Found' : 'Not found')] : [])],
      checked: [textField('Header', 'Alt-Svc'), textField('ALPN token', 'h2'),
        textField('Criterion', 'Informational only; does not prove the connection used HTTP/2')],
      evidence: headerEvidence('Alt-Svc', altSvcHeader),
      noMarkup: HEADER_NO_MARKUP,
    })
  },
}
