import { textField } from '@/shared/presentation/create'
import { presentResult } from '@/shared/presentation/result'
import type { Rule } from '@/core/types'

const isHttp3 = (proto: string) => /^h3\b|^hq\b|quic/i.test(proto)
const isHttp2 = (proto: string) => /^h2\b/i.test(proto)
const isLegacy = (proto: string) => /^http\/1/i.test(proto)
const schemeOf = (url: string): string => { try { return new URL(url).protocol } catch { return 'Invalid URL' } }

export const negotiatedProtocolRule: Rule = {
  id: 'http:negotiated-protocol', name: 'Negotiated Network Protocol', presentation: 1, enabled: true, what: 'http',
  meta: {
    provenance: 'google',
    references: [
      'https://developer.chrome.com/docs/lighthouse/best-practices/uses-http2',
      'https://developer.mozilla.org/en-US/docs/Web/API/PerformanceResourceTiming/nextHopProtocol',
    ],
    description: 'Reports the actually negotiated network protocol from navigationTiming.nextHopProtocol: ok for h3/h2, error for HTTPS pages still on HTTP/1.x, info otherwise.',
  },
  async run(page) {
    const proto = page.navigationTiming?.nextHopProtocol || ''
    const checked = [textField('Signal', 'Navigation Timing API nextHopProtocol'),
      textField('Criterion', 'ok for HTTP/2 or HTTP/3; error when an HTTPS page negotiates HTTP/1.x; info otherwise')]
    const evidence = proto ? [{ name: 'Navigation timing', fields: [textField('nextHopProtocol', proto)] }] : []
    const noMarkup = 'None - this rule checks navigation timing, not document markup'
    if (!proto) return presentResult(negotiatedProtocolRule, page, {
      input: 'Not captured', type: 'info', priority: 900,
      values: [textField('Negotiated protocol', 'Not captured')],
      checked, evidence, noMarkup,
    })
    const isHttps = page.url.startsWith('https:')
    const type = isHttp3(proto) || isHttp2(proto) ? 'ok' : isLegacy(proto) && isHttps ? 'error' : 'info'
    const priority = isHttp3(proto) ? 800 : isHttp2(proto) ? 780 : isLegacy(proto) && isHttps ? 200 : 800
    return presentResult(negotiatedProtocolRule, page, {
      input: 'Navigation events + Page URL', type, priority,
      values: [textField('Negotiated protocol', proto)],
      detailValues: [textField('Scheme', schemeOf(page.url))],
      checked, evidence, noMarkup,
    })
  },
}
