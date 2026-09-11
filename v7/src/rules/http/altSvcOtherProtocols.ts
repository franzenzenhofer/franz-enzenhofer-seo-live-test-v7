import { headersNotCapturedResult } from '@/rules/http/headersNotCaptured'
import { hasHeaders } from '@/shared/http-utils'
import { textField } from '@/shared/presentation/create'
import { presentResult } from '@/shared/presentation/result'
import type { Rule } from '@/core/types'

const STANDARD_PROTOCOLS = ['h2', 'h3', 'h3-29', 'h3-32']

const parseProtocols = (header: string): string[] => {
  const protocols: string[] = []
  for (const entry of header.split(',').map((piece) => piece.trim())) {
    const match = entry.match(/^([a-zA-Z0-9._-]+)=/)
    if (match?.[1]) protocols.push(match[1])
  }
  return protocols
}

export const altSvcOtherProtocolsRule: Rule = {
  id: 'http:alt-svc-other', name: 'Alt-Svc Alternative Protocols', presentation: 1, enabled: true, what: 'http',
  meta: {
    userGuide: {
      check: "Reads alternative connection services advertised by the server. h2 means HTTP/2 and h3 means HTTP/3; clear tells clients to forget stored alternatives. Advertising a protocol does not prove the browser used it or that the endpoint works.",
      action: "Review the Alt-Svc header in the server or CDN configuration if its advertised services are unexpected. Use the negotiated protocol result to see the connection actually used.",
    },
    provenance: 'standard',
    references: ['https://www.rfc-editor.org/rfc/rfc7838.html#section-3'],
    description: "Parses the Alt-Svc header, splits advertised ALPN protocol-ids into standard (h2/h3/h3-drafts) vs 'other', and reports the full list (info-only).",
  },
  async run(page) {
    if (!hasHeaders(page.headers)) return headersNotCapturedResult(altSvcOtherProtocolsRule, page, 'Alt-Svc')
    const altSvcHeader = page.headers?.['alt-svc'] || ''
    const isPresent = altSvcHeader.length > 0
    const altSvcClear = altSvcHeader.trim() === 'clear'
    const protocols = isPresent ? parseProtocols(altSvcHeader) : []
    const otherProtocols = protocols.filter((protocol) => !STANDARD_PROTOCOLS.some((standard) => protocol.startsWith(standard)))
    const standardProtocols = protocols.filter((protocol) => STANDARD_PROTOCOLS.some((standard) => protocol.startsWith(standard)))

    const priority = !isPresent ? 900 : altSvcClear ? 820 : protocols.length === 0 ? 850 : otherProtocols.length ? 700 : 750

    return presentResult(altSvcOtherProtocolsRule, page, {
      input: 'HTTP response headers', type: 'info', priority,
      values: [textField('Alt-Svc header', altSvcHeader || 'Not present'),
        textField('Advertised protocols', protocols.length ? protocols.join(', ') : 'None parsed'),
        textField('Other (non-standard) protocols', otherProtocols.length ? otherProtocols.join(', ') : 'None')],
      detailValues: [textField('Standard protocols', standardProtocols.join(', ') || 'None'),
        textField('Alt-Svc: clear observed', altSvcClear ? 'Yes' : 'No')],
      checked: [textField('Header', 'Alt-Svc'), textField('Standard tokens', STANDARD_PROTOCOLS.join(', ')),
        textField('Criterion', 'Informational only; lists every advertised ALPN protocol id')],
      evidence: isPresent ? [{ name: 'Alt-Svc header', fields: [textField('Alt-Svc', altSvcHeader)] }] : [],
      noMarkup: 'None - this rule checks the HTTP response, not document markup',
    })
  },
}
