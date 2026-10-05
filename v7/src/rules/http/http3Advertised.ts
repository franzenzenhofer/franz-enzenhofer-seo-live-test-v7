import { headersNotCapturedResult } from '@/rules/http/headersNotCaptured'
import { HEADER_NO_MARKUP, headerEvidence, headerRow } from '@/rules/http/observedHeader'
import { advertisedProtocol, headerValue } from '@/shared/headerValue'
import { hasHeaders } from '@/shared/http-utils'
import { textField } from '@/shared/presentation/create'
import { presentResult } from '@/shared/presentation/result'
import type { Rule } from '@/core/types'

export const http3AdvertisedRule: Rule = {
  id: 'http:h3-advertised', name: 'HTTP/3 Advertised (Alt-Svc)', presentation: 1, enabled: true, what: 'http',
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
    if (!hasHeaders(page.headers)) return headersNotCapturedResult(http3AdvertisedRule, page, 'Alt-Svc')
    const altSvcHeader = headerValue(page.headers, 'alt-svc')
    const advertisesHttp3 = advertisedProtocol(altSvcHeader, 'h3')
    return presentResult(http3AdvertisedRule, page, {
      input: 'HTTP response headers', type: 'info', priority: advertisesHttp3 ? 750 : 850,
      values: [headerRow('Alt-Svc', altSvcHeader),
        ...(altSvcHeader ? [textField('HTTP/3 token', advertisesHttp3 ? 'Found' : 'Not found')] : [])],
      checked: [textField('Header', 'Alt-Svc'), textField('ALPN token', 'h3 (or h3-NN draft)'),
        textField('Criterion', 'Informational only; does not prove the connection used HTTP/3')],
      evidence: headerEvidence('Alt-Svc', altSvcHeader),
      noMarkup: HEADER_NO_MARKUP,
    })
  },
}
